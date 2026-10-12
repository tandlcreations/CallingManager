// Three-way merge of fresh LCR data into existing scenarios.
//   O = baseline the scenarios were created from (originalData)
//   S = a scenario's current data (baseline + the user's planned changes)
//   N = newly imported LCR data
(function (root) {
    const clone = (v) => JSON.parse(JSON.stringify(v));
    const norm = (s) => String(s || '').trim().toLowerCase();

    function sameMember(a, b) {
        if (!a && !b) return true;
        if (!a || !b) return false;
        return String(a.id) === String(b.id) || norm(a.name) === norm(b.name);
    }

    // Pair each new calling with an original calling: same position + same holder first, then by order.
    function matchCallings(oCallings, nCallings) {
        const result = new Array(nCallings.length).fill(-1);
        const used = new Set();
        const pair = (ni, test) => {
            const oi = oCallings.findIndex((o, i) => !used.has(i) && test(o));
            if (oi !== -1) { result[ni] = oi; used.add(oi); }
        };
        nCallings.forEach((n, ni) => {
            if (n.member) pair(ni, o => String(o.id) === String(n.id) && sameMember(o.member, n.member));
        });
        nCallings.forEach((n, ni) => {
            if (result[ni] === -1) pair(ni, o => String(o.id) === String(n.id));
        });
        return result;
    }

    // kind: same | lcr | done | plan | partial | conflict
    function resolve(oMember, sMember, nMember, touched) {
        const os = sameMember(oMember, sMember);
        const on = sameMember(oMember, nMember);
        const sn = sameMember(sMember, nMember);

        if (sn) return { kind: !os ? 'done' : 'same', use: 'n' };
        if (os && !touched) return { kind: 'lcr', use: 'n' };
        if (!os && on) return { kind: 'plan', use: 's' };
        if (!nMember) return { kind: 'partial', use: 's' };
        // Baseline can't prove LCR changed when the scenario still equals it but was edited (e.g. imported file).
        return { kind: 'conflict', use: os ? 's' : 'n', ambiguous: os };
    }

    function analyzeScenario(oData, scenario, nData) {
        const sData = scenario.data;
        const touched = new Set(scenario.changedCallings || []);
        const byId = (data) => new Map(data.subOrgs.map(o => [String(o.id), o]));
        const sOrgs = byId(sData);
        const oOrgs = byId(oData);
        const nOrgIds = new Set(nData.subOrgs.map(o => String(o.id)));

        const items = [];
        const extras = [];
        const warnings = [];

        const planChanged = (sc, oc, si, sOrg) =>
            !sameMember(sc.member, oc ? oc.member : null) || touched.has(`${sOrg.id}-${sc.id}-${si}`);

        nData.subOrgs.forEach(nOrg => {
            const sOrg = sOrgs.get(String(nOrg.id));
            if (!sOrg) return;
            const oOrg = oOrgs.get(String(nOrg.id)) || sOrg;
            const match = matchCallings(oOrg.callings, nOrg.callings);
            const matchedO = new Set(match.filter(i => i !== -1));

            nOrg.callings.forEach((nc, ni) => {
                const oi = match[ni];
                if (oi === -1) return; // new in LCR
                const oc = oOrg.callings[oi];
                let si = oi;
                if (!sOrg.callings[si] || String(sOrg.callings[si].id) !== String(oc.id)) si = -1;
                const sc = si === -1 ? oc : sOrg.callings[si];
                const isTouched = si !== -1 && touched.has(`${sOrg.id}-${sc.id}-${si}`);
                const r = resolve(oc.member, sc.member, nc.member, isTouched);
                items.push({
                    key: `${nOrg.id}::${ni}`,
                    orgId: nOrg.id,
                    orgName: nOrg.name,
                    callingName: nc.name,
                    nIndex: ni,
                    kind: r.kind,
                    use: r.use,
                    ambiguous: !!r.ambiguous,
                    oMember: oc.member || null,
                    sMember: sc.member || null,
                    nMember: nc.member || null,
                    sCalling: clone(sc)
                });
            });

            // Callings removed from LCR: keep only if the user had plans on them
            oOrg.callings.forEach((oc, oi) => {
                if (matchedO.has(oi)) return;
                const sc = sOrg.callings[oi];
                if (!sc || String(sc.id) !== String(oc.id)) return;
                if (planChanged(sc, oc, oi, sOrg)) {
                    extras.push({ orgId: nOrg.id, calling: clone(sc) });
                    warnings.push(`"${sc.name}" in ${nOrg.name} no longer exists in LCR, but your plan for it was kept.`);
                }
            });

            // Custom callings the user added
            sOrg.callings.forEach(sc => {
                if (sc.isCustom) extras.push({ orgId: nOrg.id, calling: clone(sc) });
            });
        });

        sData.subOrgs.forEach(sOrg => {
            if (nOrgIds.has(String(sOrg.id))) return;
            const oOrg = oOrgs.get(String(sOrg.id)) || sOrg;
            const hasPlan = sOrg.callings.some((sc, si) => planChanged(sc, oOrg.callings[si], si, sOrg));
            if (hasPlan) warnings.push(`${sOrg.name} no longer exists in LCR; your planned changes there were dropped.`);
        });

        const counts = { same: 0, lcr: 0, done: 0, plan: 0, partial: 0, conflict: 0 };
        items.forEach(i => counts[i.kind]++);
        return { items, extras, warnings, counts };
    }

    // choices: { [item.key]: 'n' | 's' } for conflicts
    function buildScenario(nData, analysis, choices) {
        const merged = clone(nData);
        const orgById = new Map(merged.subOrgs.map(o => [String(o.id), o]));

        analysis.items.forEach(item => {
            const org = orgById.get(String(item.orgId));
            const calling = org && org.callings[item.nIndex];
            if (!calling) return;
            const use = item.kind === 'conflict' ? (choices[item.key] || item.use) : item.use;
            if (use === 's') {
                calling.member = item.sCalling.member ? clone(item.sCalling.member) : null;
                calling.activeDate = item.sCalling.activeDate || null;
                calling.setApartDate = item.sCalling.setApartDate || null;
            }
            const considering = (item.sCalling.considering || [])
                .filter(c => !(calling.member && String(calling.member.id) === String(c.id)));
            if (considering.length) calling.considering = clone(considering);
        });

        analysis.extras.forEach(({ orgId, calling }) => {
            const org = orgById.get(String(orgId));
            if (org) org.callings.push(clone(calling));
        });

        const changeHistory = [];
        const changedCallings = new Set();
        const stamp = new Date().toISOString();
        const nOrgs = new Map(nData.subOrgs.map(o => [String(o.id), o]));

        merged.subOrgs.forEach(org => {
            const nOrg = nOrgs.get(String(org.id));
            org.callings.forEach((calling, idx) => {
                const id = `${org.id}-${calling.id}-${idx}`;
                const nc = nOrg && nOrg.callings[idx] && !calling.isCustom ? nOrg.callings[idx] : null;
                if (calling.isCustom || !nc) {
                    if (calling.isCustom) {
                        changeHistory.push({ description: `Add custom calling "${calling.name}" in ${org.name}`, callingId: calling.id, timestamp: stamp });
                    }
                    if (calling.member) {
                        changeHistory.push({ description: `Call ${calling.member.name} to ${calling.name} in ${org.name}`, callingId: id, timestamp: stamp });
                        changedCallings.add(id);
                    }
                    return;
                }
                if (sameMember(calling.member, nc.member)) return;
                if (nc.member) {
                    changeHistory.push({ description: `Release ${nc.member.name} from ${calling.name} in ${org.name}`, callingId: id, timestamp: stamp });
                }
                if (calling.member) {
                    changeHistory.push({ description: `Call ${calling.member.name} to ${calling.name} in ${org.name}`, callingId: id, timestamp: stamp });
                }
                changedCallings.add(id);
            });
        });

        return { data: merged, changeHistory, changedCallings };
    }

    const api = { sameMember, resolve, matchCallings, analyzeScenario, buildScenario };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.LCRMerge = api;
})(typeof window !== 'undefined' ? window : globalThis);
