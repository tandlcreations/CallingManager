// CallingManager Application
// Main application logic

class CallingManager {
    constructor() {
        this.callingsData = null;
        this.outOfUnitData = null;
        this.memberList = [];
        this.hiddenCallings = new Set();
        this.hiddenMembers = new Set();
        this.filteredData = null;
        this.currentOrg = null;
        this.pendingAssignment = null; // Store org/calling for member selection
        this.currentTab = 'callings';
        this.init();
    }

    init() {
        this.attachEventListeners();
        this.checkStoredData();
    }

    attachEventListeners() {
        // Home section buttons
        const launchDemoBtn = document.getElementById('launch-demo-btn');
        const submitDataBtn = document.getElementById('submit-data-btn');
        
        if (launchDemoBtn) {
            launchDemoBtn.addEventListener('click', () => this.loadDemoData());
        }
        
        if (submitDataBtn) {
            submitDataBtn.addEventListener('click', () => this.submitData());
        }

        // Manager section controls
        const backBtn = document.getElementById('back-btn');
        const exportBtn = document.getElementById('export-btn');
        const searchInput = document.getElementById('search-input');
        const toggleVisibilityBtn = document.getElementById('toggle-visibility-btn');
        
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showHome());
        }
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchCallings(e.target.value));
        }
        
        if (toggleVisibilityBtn) {
            toggleVisibilityBtn.addEventListener('click', () => this.showVisibilityModal());
        }

        // Member search
        const memberSearchInput = document.getElementById('member-search');
        if (memberSearchInput) {
            memberSearchInput.addEventListener('input', (e) => this.filterMembers(e.target.value));
        }

        // Callings data textarea - enable member list link when populated
        const callingsDataTextarea = document.getElementById('callings-data');
        if (callingsDataTextarea) {
            callingsDataTextarea.addEventListener('input', () => this.updateMemberListLink());
        }
    }

    checkStoredData() {
        const stored = localStorage.getItem('callingManagerData');
        if (stored) {
            try {
                this.callingsData = JSON.parse(stored);
            } catch (e) {
                console.error('Error loading stored data:', e);
            }
        }

        const storedMembers = localStorage.getItem('callingManagerMembers');
        if (storedMembers) {
            try {
                this.memberList = JSON.parse(storedMembers);
            } catch (e) {
                console.error('Error loading stored members:', e);
            }
        }

        const storedHidden = localStorage.getItem('callingManagerHidden');
        if (storedHidden) {
            try {
                this.hiddenCallings = new Set(JSON.parse(storedHidden));
            } catch (e) {
                console.error('Error loading hidden callings:', e);
            }
        }

        const storedHiddenMembers = localStorage.getItem('callingManagerHiddenMembers');
        if (storedHiddenMembers) {
            try {
                this.hiddenMembers = new Set(JSON.parse(storedHiddenMembers));
            } catch (e) {
                console.error('Error loading hidden members:', e);
            }
        }
    }

    loadDemoData() {
        // Demo data structure based on typical LDS ward organization
        this.callingsData = {
            subOrgs: [
                {
                    id: 1,
                    name: "Bishopric",
                    callings: [
                        { id: 101, name: "Bishop", member: { name: "John Smith", id: 1001 }, setSustainedDate: "2024-01-15" },
                        { id: 102, name: "First Counselor", member: { name: "David Johnson", id: 1002 }, setSustainedDate: "2024-01-15" },
                        { id: 103, name: "Second Counselor", member: { name: "Michael Williams", id: 1003 }, setSustainedDate: "2024-01-15" },
                        { id: 104, name: "Executive Secretary", member: { name: "Robert Brown", id: 1004 }, setSustainedDate: "2024-02-10" },
                        { id: 105, name: "Ward Clerk", member: { name: "James Davis", id: 1005 }, setSustainedDate: "2024-02-10" }
                    ]
                },
                {
                    id: 2,
                    name: "Elders Quorum",
                    callings: [
                        { id: 201, name: "Elders Quorum President", member: { name: "Thomas Anderson", id: 2001 }, setSustainedDate: "2024-03-15" },
                        { id: 202, name: "First Counselor", member: { name: "Christopher Martinez", id: 2002 }, setSustainedDate: "2024-03-15" },
                        { id: 203, name: "Second Counselor", member: { name: "Daniel Garcia", id: 2003 }, setSustainedDate: "2024-03-15" },
                        { id: 204, name: "Secretary", member: null, setSustainedDate: null }
                    ]
                },
                {
                    id: 3,
                    name: "Relief Society",
                    callings: [
                        { id: 301, name: "Relief Society President", member: { name: "Sarah Wilson", id: 3001 }, setSustainedDate: "2024-03-20" },
                        { id: 302, name: "First Counselor", member: { name: "Emily Thompson", id: 3002 }, setSustainedDate: "2024-03-20" },
                        { id: 303, name: "Second Counselor", member: { name: "Jessica Lee", id: 3003 }, setSustainedDate: "2024-03-20" },
                        { id: 304, name: "Secretary", member: { name: "Jennifer White", id: 3004 }, setSustainedDate: "2024-04-01" }
                    ]
                },
                {
                    id: 4,
                    name: "Sunday School",
                    callings: [
                        { id: 401, name: "Sunday School President", member: { name: "Matthew Harris", id: 4001 }, setSustainedDate: "2024-02-15" },
                        { id: 402, name: "First Counselor", member: null, setSustainedDate: null },
                        { id: 403, name: "Second Counselor", member: { name: "Andrew Clark", id: 4003 }, setSustainedDate: "2024-05-01" },
                        { id: 404, name: "Gospel Doctrine Teacher", member: { name: "Joshua Lewis", id: 4004 }, setSustainedDate: "2024-03-10" }
                    ]
                },
                {
                    id: 5,
                    name: "Primary",
                    callings: [
                        { id: 501, name: "Primary President", member: { name: "Amanda Robinson", id: 5001 }, setSustainedDate: "2024-01-20" },
                        { id: 502, name: "First Counselor", member: { name: "Rachel Walker", id: 5002 }, setSustainedDate: "2024-01-20" },
                        { id: 503, name: "Second Counselor", member: { name: "Michelle Young", id: 5003 }, setSustainedDate: "2024-01-20" },
                        { id: 504, name: "Primary Secretary", member: { name: "Nicole Hall", id: 5004 }, setSustainedDate: "2024-02-05" }
                    ]
                },
                {
                    id: 6,
                    name: "Young Women",
                    callings: [
                        { id: 601, name: "Young Women President", member: { name: "Laura Allen", id: 6001 }, setSustainedDate: "2024-04-10" },
                        { id: 602, name: "First Counselor", member: { name: "Megan King", id: 6002 }, setSustainedDate: "2024-04-10" },
                        { id: 603, name: "Second Counselor", member: null, setSustainedDate: null },
                        { id: 604, name: "Secretary", member: { name: "Stephanie Wright", id: 6004 }, setSustainedDate: "2024-05-15" }
                    ]
                },
                {
                    id: 7,
                    name: "Young Men",
                    callings: [
                        { id: 701, name: "Young Men President", member: { name: "Kevin Scott", id: 7001 }, setSustainedDate: "2024-04-10" },
                        { id: 702, name: "First Counselor", member: { name: "Brian Green", id: 7002 }, setSustainedDate: "2024-04-10" },
                        { id: 703, name: "Second Counselor", member: { name: "Timothy Baker", id: 7003 }, setSustainedDate: "2024-04-10" },
                        { id: 704, name: "Secretary", member: null, setSustainedDate: null }
                    ]
                }
            ]
        };

        this.saveData();
        this.showManager();
    }

    updateMemberListLink() {
        const callingsInput = document.getElementById('callings-data').value.trim();
        const memberListLink = document.getElementById('member-list-link');
        
        if (!memberListLink) return;
        
        if (!callingsInput) {
            memberListLink.classList.add('disabled-link');
            memberListLink.href = '#';
            return;
        }
        
        try {
            const rawData = JSON.parse(callingsInput);
            
            // Extract unitNumber from the data
            let unitNumber = null;
            
            // Handle both array and object format
            const orgs = Array.isArray(rawData) ? rawData : [rawData];
            
            // Look for unitNumber in the first org
            if (orgs.length > 0 && orgs[0].unitNumber) {
                unitNumber = orgs[0].unitNumber;
            }
            
            if (unitNumber) {
                memberListLink.classList.remove('disabled-link');
                memberListLink.href = `https://lcr.churchofjesuschrist.org/api/umlu/report/member-list?lang=eng&unitNumber=${unitNumber}`;
            } else {
                memberListLink.classList.add('disabled-link');
                memberListLink.href = '#';
            }
        } catch (e) {
            // Invalid JSON, keep link disabled
            memberListLink.classList.add('disabled-link');
            memberListLink.href = '#';
        }
    }

    submitData() {
        const callingsInput = document.getElementById('callings-data').value.trim();
        const outOfUnitInput = document.getElementById('out-of-unit-data').value.trim();
        const memberListInput = document.getElementById('member-list-data').value.trim();

        if (!callingsInput) {
            alert('Please paste the calling data from LCR.');
            return;
        }

        if (!memberListInput) {
            alert('Please paste the member list data from LCR. This is required for member management.');
            return;
        }

        try {
            const rawData = JSON.parse(callingsInput);
            
            // Convert LCR format to internal format
            this.callingsData = this.convertLCRData(rawData);
            
            // Handle out of unit callings as a separate organization
            if (outOfUnitInput) {
                try {
                    const rawOutOfUnit = JSON.parse(outOfUnitInput);
                    
                    // Create "Out of Unit Callings" organization
                    const outOfUnitOrg = {
                        id: 'out-of-unit',
                        name: 'Out of Unit Callings',
                        callings: []
                    };
                    
                    // Handle the LIVING_INSIDE array structure
                    let outOfUnitCallings = [];
                    
                    if (rawOutOfUnit.LIVING_INSIDE && Array.isArray(rawOutOfUnit.LIVING_INSIDE)) {
                        outOfUnitCallings = rawOutOfUnit.LIVING_INSIDE;
                    } else if (Array.isArray(rawOutOfUnit)) {
                        outOfUnitCallings = rawOutOfUnit;
                    }
                    
                    // Process each out-of-unit calling
                    outOfUnitCallings.forEach((calling, index) => {
                        const convertedCalling = {
                            id: calling.positionId || `out-of-unit-${index}`,
                            name: calling.position || 'Unknown Position',
                            member: null,
                            activeDate: null,
                            setApartDate: null
                        };

                        // Add member info (already embedded in the calling)
                        if (calling.id && calling.name) {
                            convertedCalling.member = {
                                id: calling.id,
                                name: calling.name
                            };
                            
                            // Parse activeDate - format is ISO string like "2025-09-14T06:00:00.000+00:00"
                            if (calling.activeDate) {
                                const dateStr = calling.activeDate.split('T')[0];
                                convertedCalling.activeDate = dateStr;
                            }
                            
                            // Parse setApartDate
                            if (calling.setApartDate) {
                                const dateStr = calling.setApartDate.split('T')[0];
                                convertedCalling.setApartDate = dateStr;
                            }
                        }

                        outOfUnitOrg.callings.push(convertedCalling);
                    });
                    
                    // Add the org if it has callings
                    if (outOfUnitOrg.callings.length > 0) {
                        this.callingsData.subOrgs.push(outOfUnitOrg);
                    }
                } catch (e) {
                    console.error('Error parsing out of unit data:', e);
                    alert('Warning: Out of unit data could not be parsed. Continuing with main calling data only.');
                }
            }

            // Import member list (now required)
            try {
                const rawMembers = JSON.parse(memberListInput);
                this.importMemberList(rawMembers);
            } catch (e) {
                console.error('Error parsing member list:', e);
                alert('Error: Member list could not be parsed. Please check the data and try again.');
                return;
            }

            this.saveData();
            this.showManager();
        } catch (e) {
            console.error('Error parsing calling data:', e);
            alert('Error: The data you pasted does not appear to be valid JSON. Please make sure you copied all the text from the LCR page.');
        }
    }

    convertLCRData(rawData) {
    }

    convertLCRData(rawData) {
        // Check if data is already in our format
        if (rawData.subOrgs) {
            return rawData;
        }

        // Convert from LCR API format to internal format
        const subOrgs = [];
        
        // Handle both array and single object
        const orgs = Array.isArray(rawData) ? rawData : [rawData];
        
        // Recursive function to process org and its children
        const processOrg = (org, parentName = null) => {
            const results = [];
            
            // Process direct callings if they exist
            if (org.callings && org.callings.length > 0) {
                const orgName = org.name || org.defaultOrgName || 'Unknown Organization';
                
                // If this org has a parent and doesn't already include parent name, prepend it
                let displayName = orgName;
                if (parentName) {
                    // Extract the base parent name (e.g., "Elders Quorum" from "Elders Quorum Presidency")
                    const baseParentName = parentName.replace(/\s+(Presidency|Leadership|Organization)$/i, '').trim();
                    
                    // Check if child name doesn't already contain the parent name
                    if (!orgName.toLowerCase().includes(baseParentName.toLowerCase())) {
                        displayName = `${baseParentName} - ${orgName}`;
                    }
                }
                
                const convertedOrg = {
                    id: org.subOrgId,
                    name: displayName,
                    callings: []
                };

                org.callings.forEach((calling) => {
                    const convertedCalling = {
                        id: calling.positionId || `${org.subOrgId}-${calling.position}`,
                        name: calling.position || 'Unknown Position',
                        member: null,
                        activeDate: null,
                        setApartDate: null
                    };

                    // Add member if calling is filled
                    if (calling.memberId && calling.memberName) {
                        convertedCalling.member = {
                            id: calling.memberId,
                            name: calling.memberName
                        };
                        
                        // Store both activeDate and setApartDate
                        if (calling.activeDate) {
                            const year = calling.activeDate.substring(0, 4);
                            const month = calling.activeDate.substring(4, 6);
                            const day = calling.activeDate.substring(6, 8);
                            convertedCalling.activeDate = `${year}-${month}-${day}`;
                        }
                        
                        if (calling.setApartDate) {
                            const year = calling.setApartDate.substring(0, 4);
                            const month = calling.setApartDate.substring(4, 6);
                            const day = calling.setApartDate.substring(6, 8);
                            convertedCalling.setApartDate = `${year}-${month}-${day}`;
                        }
                    }

                    convertedOrg.callings.push(convertedCalling);
                });

                results.push(convertedOrg);
            }
            
            // Process children recursively, passing current org name as parent
            if (org.children && org.children.length > 0) {
                const currentOrgName = org.name || org.defaultOrgName || null;
                org.children.forEach(child => {
                    results.push(...processOrg(child, currentOrgName));
                });
            }
            
            return results;
        };
        
        orgs.forEach(org => {
            subOrgs.push(...processOrg(org));
        });

        return { subOrgs };
    }

    saveData() {
        try {
            localStorage.setItem('callingManagerData', JSON.stringify(this.callingsData));
            if (this.outOfUnitData) {
                localStorage.setItem('callingManagerOutOfUnitData', JSON.stringify(this.outOfUnitData));
            }
            if (this.memberList.length > 0) {
                localStorage.setItem('callingManagerMembers', JSON.stringify(this.memberList));
            }
            localStorage.setItem('callingManagerHidden', JSON.stringify(Array.from(this.hiddenCallings)));
            localStorage.setItem('callingManagerHiddenMembers', JSON.stringify(Array.from(this.hiddenMembers)));
        } catch (e) {
            console.error('Error saving data:', e);
        }
    }

    importMemberList(rawMembers) {
        // Handle different LCR member list formats
        let members = [];
        
        if (Array.isArray(rawMembers)) {
            members = rawMembers;
        } else if (rawMembers.members) {
            members = rawMembers.members;
        }

        this.memberList = members.map(member => {
            // Get name from various possible formats
            let name = '';
            if (member.nameFormats) {
                name = member.nameFormats.listPreferredLocal || 
                       member.nameFormats.listPreferred || 
                       member.nameFormats.spokenPreferredLocal ||
                       member.nameFormats.listOfficial;
            } else if (member.name) {
                name = member.name;
            } else if (member.preferredName) {
                name = member.preferredName;
            } else if (member.givenName1 && member.familyName) {
                name = `${member.familyName}, ${member.givenName1}`;
            }

            return {
                id: member.uuid || member.id || member.legacyCmisId,
                name: name || 'Unknown',
                age: member.age,
                gender: member.sex || member.gender,
                email: member.emails?.[0]?.email || member.email,
                phone: member.phoneNumber || member.phones?.[0]?.number || member.phone
            };
        }).filter(m => m.name !== 'Unknown')
          .sort((a, b) => a.name.localeCompare(b.name));
    }

    showHome() {
        document.getElementById('home-section').classList.add('active');
        document.getElementById('manager-section').classList.remove('active');
        document.getElementById('search-input').value = '';
    }

    showManager() {
        document.getElementById('home-section').classList.remove('active');
        document.getElementById('manager-section').classList.add('active');
        
        // Auto-hide members under 18 without callings on initial load
        this.autoHideYouthWithoutCallings();
        
        this.renderAllOrganizations();
    }

    autoHideYouthWithoutCallings() {
        if (this.memberList.length === 0 || !this.callingsData) return;
        
        const assignedMemberNames = new Set();
        
        // Collect all assigned member names
        this.callingsData.subOrgs.forEach(org => {
            org.callings.forEach(calling => {
                if (calling.member && calling.member.name) {
                    assignedMemberNames.add(calling.member.name.trim().toLowerCase());
                }
            });
        });
        
        // Add members under 18 without callings to hiddenMembers
        this.memberList.forEach(member => {
            const isNotAssigned = !assignedMemberNames.has(member.name.trim().toLowerCase());
            const isYouth = member.age && member.age < 18;
            
            if (isNotAssigned && isYouth && !this.hiddenMembers.has(member.id)) {
                this.hiddenMembers.add(member.id);
            }
        });
        
        this.saveData();
    }

    renderAllOrganizations() {
        const container = document.getElementById('callings-container');
        container.innerHTML = '';

        if (!this.callingsData || !this.callingsData.subOrgs) {
            container.innerHTML = '<div class="empty-state"><p>No organizations found</p></div>';
            return;
        }

        // Render all organizations on one page
        this.callingsData.subOrgs.forEach(org => {
            const orgSection = this.createOrganizationSection(org);
            container.appendChild(orgSection);
        });

        // Add Members Without Callings section
        if (this.memberList.length > 0) {
            const membersWithoutCallings = this.getMembersWithoutCallings();
            if (membersWithoutCallings.length > 0) {
                const membersSection = this.createMembersWithoutCallingsSection(membersWithoutCallings);
                container.appendChild(membersSection);
            }
        }
    }

    createOrganizationSection(org) {
        const section = document.createElement('div');
        section.className = 'org-section';
        section.dataset.orgId = org.id;

        const header = document.createElement('h2');
        header.className = 'org-header';
        header.textContent = org.name;
        section.appendChild(header);

        if (!org.callings || org.callings.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'empty-state';
            empty.textContent = 'No callings in this organization';
            section.appendChild(empty);
            return section;
        }

        const callingsGrid = document.createElement('div');
        callingsGrid.className = 'callings-grid';

        org.callings.forEach(calling => {
            const card = this.createCallingCard(calling, org);
            // Add hidden class if calling is in hiddenCallings set
            if (this.hiddenCallings.has(calling.id)) {
                card.classList.add('hidden');
            }
            callingsGrid.appendChild(card);
        });

        section.appendChild(callingsGrid);
        return section;
    }

    createMembersWithoutCallingsSection(members) {
        const section = document.createElement('div');
        section.className = 'org-section';
        section.dataset.orgId = 'members-without-callings';

        const header = document.createElement('h2');
        header.className = 'org-header';
        header.textContent = 'Members Without Callings';
        section.appendChild(header);

        const membersGrid = document.createElement('div');
        membersGrid.className = 'callings-grid';

        members.forEach(member => {
            const card = document.createElement('div');
            card.className = 'calling-card member-card';
            card.dataset.memberId = member.id;
            
            const memberName = document.createElement('h4');
            memberName.textContent = member.name;
            card.appendChild(memberName);

            membersGrid.appendChild(card);
        });

        section.appendChild(membersGrid);
        return section;
    }

    createCallingCard(calling, org) {
        const card = document.createElement('div');
        card.className = 'calling-card';
        card.dataset.callingId = calling.id;
        card.dataset.orgId = org.id;
        
        const title = document.createElement('h4');
        title.textContent = calling.name;
        card.appendChild(title);

        const memberDiv = document.createElement('div');
        memberDiv.className = 'member-select';
        
        if (calling.member && calling.member.name) {
            memberDiv.innerHTML = `
                <span class="member-name">${calling.member.name}</span>
                <div>
                    <button class="change-btn" onclick="window.callingManager.changeMember('${org.id}', '${calling.id}')">Change</button>
                    <button class="change-btn release-btn" onclick="window.callingManager.releaseMember('${org.id}', '${calling.id}')">Release</button>
                </div>
            `;
        } else {
            memberDiv.innerHTML = `
                <span class="member-name vacant">VACANT</span>
                <button class="change-btn" onclick="window.callingManager.assignMember('${org.id}', '${calling.id}')">Assign</button>
            `;
        }
        card.appendChild(memberDiv);

        // Show date information if member is assigned
        if (calling.member && calling.activeDate) {
            const details = document.createElement('div');
            details.className = 'details';
            
            const activeDate = new Date(calling.activeDate);
            const formattedDate = activeDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const daysSince = Math.floor((new Date() - activeDate) / (1000 * 60 * 60 * 24));
            
            const setApartStatus = calling.setApartDate ? '✓ Set Apart' : '⚠️ Not Set Apart';
            
            details.innerHTML = `
                <span>Sustained: ${formattedDate}</span>
                <span>Days: ${daysSince}</span>
                <span class="${calling.setApartDate ? 'set-apart' : 'not-set-apart'}">${setApartStatus}</span>
            `;
            card.appendChild(details);
        }

        return card;
    }

    releaseMember(orgId, callingId) {
        if (!confirm('Are you sure you want to release this member from their calling?')) {
            return;
        }

        const org = this.callingsData.subOrgs.find(o => o.id == orgId);
        if (!org) return;

        const calling = org.callings.find(c => c.id == callingId);
        if (!calling) return;

        // Get member info before clearing
        const releasedMemberName = calling.member ? calling.member.name : null;

        calling.member = null;
        calling.activeDate = null;
        calling.setApartDate = null;

        // If this member was in our member list, make sure they're not hidden
        if (releasedMemberName) {
            const member = this.memberList.find(m => 
                m.name.trim().toLowerCase() === releasedMemberName.trim().toLowerCase()
            );
            if (member && this.hiddenMembers.has(member.id)) {
                // Only remove from hidden if they're an adult (keep youth hidden by default)
                if (!member.age || member.age >= 18) {
                    this.hiddenMembers.delete(member.id);
                }
            }
        }

        this.saveData();
        this.renderAllOrganizations();
        
        // Update visibility lists if panel is open
        const panel = document.getElementById('visibility-panel');
        if (panel && panel.classList.contains('active')) {
            this.updateVisibilityLists();
        }
    }

    assignMember(orgId, callingId) {
        this.pendingAssignment = { orgId, callingId, isNew: true };
        this.showMemberModal();
    }

    changeMember(orgId, callingId) {
        this.pendingAssignment = { orgId, callingId, isNew: false };
        this.showMemberModal();
    }

    showMemberModal() {
        const modal = document.getElementById('member-modal');
        const memberList = document.getElementById('member-list');
        
        memberList.innerHTML = '';
        
        // Filter out hidden members
        const visibleMembers = this.memberList.filter(member => !this.hiddenMembers.has(member.id));
        
        if (visibleMembers.length === 0) {
            memberList.innerHTML = '<p class="empty-state">No members available. Click "Add New Member" to add manually.</p>';
        } else {
            visibleMembers.forEach(member => {
                const item = document.createElement('div');
                item.className = 'member-item';
                item.textContent = member.name;
                item.onclick = () => this.selectMember(member);
                memberList.appendChild(item);
            });
        }
        
        document.getElementById('member-search').value = '';
        modal.classList.add('active');
    }

    closeMemberModal() {
        document.getElementById('member-modal').classList.remove('active');
        this.pendingAssignment = null;
    }

    filterMembers(query) {
        const items = document.querySelectorAll('.member-item');
        const lowerQuery = query.toLowerCase();
        
        items.forEach(item => {
            if (item.textContent.toLowerCase().includes(lowerQuery)) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    }

    selectMember(member) {
        if (!this.pendingAssignment) return;
        
        const { orgId, callingId } = this.pendingAssignment;
        const org = this.callingsData.subOrgs.find(o => o.id == orgId);
        if (!org) return;

        const calling = org.callings.find(c => c.id == callingId);
        if (!calling) return;

        calling.member = {
            id: member.id,
            name: member.name
        };
        calling.activeDate = new Date().toISOString().split('T')[0];
        calling.setApartDate = null;

        this.saveData();
        this.renderAllOrganizations();
        this.closeMemberModal();
    }

    showAddNewMember() {
        const memberName = prompt('Enter member name:');
        if (!memberName) return;

        const newMember = {
            id: Date.now(),
            name: memberName
        };

        this.memberList.push(newMember);
        this.memberList.sort((a, b) => a.name.localeCompare(b.name));
        
        this.selectMember(newMember);
    }

    showVisibilityModal() {
        const panel = document.getElementById('visibility-panel');
        const main = document.querySelector('main');
        
        this.updateVisibilityLists();
        
        panel.classList.add('active');
        main.classList.add('panel-open');
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab-content`).classList.add('active');
    }

    updateVisibilityLists() {
        // Update callings list
        const visibilityList = document.getElementById('visibility-list');
        visibilityList.innerHTML = '';
        
        this.callingsData.subOrgs.forEach(org => {
            org.callings.forEach(calling => {
                const item = document.createElement('div');
                item.className = 'visibility-item';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `vis-${calling.id}`;
                checkbox.checked = !this.hiddenCallings.has(calling.id);
                checkbox.onchange = (e) => this.toggleCalling(calling.id, e.target.checked);
                
                const label = document.createElement('label');
                label.htmlFor = `vis-${calling.id}`;
                label.innerHTML = `
                    <span>${calling.name}</span>
                    <span class="org-label">${org.name}</span>
                `;
                
                item.appendChild(checkbox);
                item.appendChild(label);
                visibilityList.appendChild(item);
            });
        });

        // Update members list - show ALL members
        const membersVisibilityList = document.getElementById('members-visibility-list');
        membersVisibilityList.innerHTML = '';
        
        // Get set of assigned member names
        const assignedMemberNames = new Set();
        this.callingsData.subOrgs.forEach(org => {
            org.callings.forEach(calling => {
                if (calling.member && calling.member.name) {
                    assignedMemberNames.add(calling.member.name.trim().toLowerCase());
                }
            });
        });
        
        // Show ALL members
        this.memberList.forEach(member => {
            const item = document.createElement('div');
            item.className = 'visibility-item';
            
            const hasCalling = assignedMemberNames.has(member.name.trim().toLowerCase());
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `vis-member-${member.id}`;
            checkbox.checked = hasCalling || !this.hiddenMembers.has(member.id);
            checkbox.disabled = hasCalling; // Disable checkbox if member has a calling
            checkbox.onchange = (e) => this.toggleMember(member.id, e.target.checked);
            
            const label = document.createElement('label');
            label.htmlFor = `vis-member-${member.id}`;
            const ageLabel = member.age ? ` (${member.age})` : '';
            const callingLabel = hasCalling ? ' [Has Calling]' : '';
            label.innerHTML = `<span>${member.name}${ageLabel}${callingLabel}</span>`;
            if (hasCalling) {
                label.style.opacity = '0.6';
            }
            
            item.appendChild(checkbox);
            item.appendChild(label);
            membersVisibilityList.appendChild(item);
        });
    }

    getAllMembersWithoutCallings() {
        const assignedMemberNames = new Set();
        
        // Collect all assigned member names
        this.callingsData.subOrgs.forEach(org => {
            org.callings.forEach(calling => {
                if (calling.member && calling.member.name) {
                    assignedMemberNames.add(calling.member.name.trim().toLowerCase());
                }
            });
        });
        
        // Return ALL members not assigned (all ages for visibility menu)
        return this.memberList.filter(member => 
            !assignedMemberNames.has(member.name.trim().toLowerCase())
        );
    }

    getMembersWithoutCallings() {
        const assignedMemberNames = new Set();
        
        // Collect all assigned member names
        this.callingsData.subOrgs.forEach(org => {
            org.callings.forEach(calling => {
                if (calling.member && calling.member.name) {
                    assignedMemberNames.add(calling.member.name.trim().toLowerCase());
                }
            });
        });
        
        // Return members not assigned (all ages) but only those that are visible (not hidden)
        return this.memberList.filter(member => {
            const isNotAssigned = !assignedMemberNames.has(member.name.trim().toLowerCase());
            const isVisible = !this.hiddenMembers.has(member.id);
            return isNotAssigned && isVisible;
        });
    }

    toggleMember(memberId, show) {
        if (show) {
            this.hiddenMembers.delete(memberId);
        } else {
            this.hiddenMembers.add(memberId);
        }
        
        this.saveData();
        this.renderAllOrganizations();
    }

    closeVisibilityModal() {
        document.getElementById('visibility-panel').classList.remove('active');
        document.querySelector('main').classList.remove('panel-open');
    }

    toggleCalling(callingId, show) {
        if (show) {
            this.hiddenCallings.delete(callingId);
        } else {
            this.hiddenCallings.add(callingId);
        }
        
        this.saveData();
        this.renderAllOrganizations();
    }

    toggleAllItems(show) {
        if (this.currentTab === 'callings') {
            if (show) {
                this.hiddenCallings.clear();
            } else {
                this.callingsData.subOrgs.forEach(org => {
                    org.callings.forEach(calling => {
                        this.hiddenCallings.add(calling.id);
                    });
                });
            }
        } else if (this.currentTab === 'members') {
            // Only toggle members without callings
            const membersWithoutCallings = this.getAllMembersWithoutCallings();
            if (show) {
                // Show all members without callings
                membersWithoutCallings.forEach(member => {
                    this.hiddenMembers.delete(member.id);
                });
            } else {
                // Hide all members without callings
                membersWithoutCallings.forEach(member => {
                    this.hiddenMembers.add(member.id);
                });
            }
        }
        
        this.saveData();
        this.renderAllOrganizations();
        this.updateVisibilityLists();
    }

    searchCallings(query) {
        if (!query) {
            this.renderAllOrganizations();
            return;
        }

        const lowerQuery = query.toLowerCase();
        const container = document.getElementById('callings-container');
        container.innerHTML = '';

        let found = false;

        this.callingsData.subOrgs.forEach(org => {
            const matchingCallings = [];
            
            org.callings.forEach(calling => {
                const callingName = calling.name.toLowerCase();
                const memberName = calling.member ? calling.member.name.toLowerCase() : '';
                
                if (callingName.includes(lowerQuery) || memberName.includes(lowerQuery)) {
                    matchingCallings.push(calling);
                }
            });

            if (matchingCallings.length > 0) {
                const section = document.createElement('div');
                section.className = 'org-section';
                
                const header = document.createElement('h2');
                header.className = 'org-header';
                header.textContent = org.name;
                section.appendChild(header);
                
                const grid = document.createElement('div');
                grid.className = 'callings-grid';
                
                matchingCallings.forEach(calling => {
                    const card = this.createCallingCard(calling, org);
                    grid.appendChild(card);
                });
                
                section.appendChild(grid);
                container.appendChild(section);
                found = true;
            }
        });

        if (!found) {
            container.innerHTML = `<div class="empty-state"><p>No results found for "${query}"</p></div>`;
        }
    }

    exportData() {
        if (!this.callingsData) {
            alert('No data to export');
            return;
        }

        const dataStr = JSON.stringify(this.callingsData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `calling-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.callingManager = new CallingManager();
});
