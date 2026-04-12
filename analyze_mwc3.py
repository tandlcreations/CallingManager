#!/usr/bin/env python3
"""Verify unique member count and analyze class data from MWC."""
import re
import json

with open('inpriration/lcr_mwc.html', 'r') as f:
    mwc = f.read()

# ── 1. UNIQUE MEMBER COUNT ──
mwoc_idx = mwc.index('membersWithoutCallings')
mwc_idx = mwc.index('membersWithCallings')

# Members WITHOUT callings section
woc_section = mwc[mwoc_idx:mwc_idx]
woc_names = set()
for match in re.finditer(r'\\"name\\":\\"([^\\]+)\\"', woc_section):
    woc_names.add(match.group(1))

# Members WITH callings section (goes to end of data)
# Find end marker - BaseUnitOrgs comes after
buo_idx = mwc.index('BaseUnitOrgs')
wc_section = mwc[mwc_idx:buo_idx]
wc_names = set()
for match in re.finditer(r'\\"name\\":\\"([^\\]+)\\"', wc_section):
    wc_names.add(match.group(1))

all_names = woc_names | wc_names
overlap = woc_names & wc_names

print("=== UNIQUE MEMBER COUNTS ===")
print(f"Members WITHOUT callings: {len(woc_names)} unique names")
print(f"Members WITH callings: {len(wc_names)} unique names  (from 371 entries)")
print(f"Overlap (in both lists): {len(overlap)}")
print(f"TOTAL UNIQUE MEMBERS: {len(all_names)}")
print()

# Show who appears in BOTH lists (shouldn't happen if lists are clean)
if overlap:
    print(f"Members appearing in BOTH lists ({len(overlap)}):")
    for n in sorted(overlap)[:10]:
        print(f"  {n}")
    if len(overlap) > 10:
        print(f"  ... and {len(overlap)-10} more")

# ── 2. CLASS DATA STRUCTURE ──
print("\n\n=== CLASS DATA IN membersWithoutCallings ===")
# Extract all class names and their parent orgs
classes_map = {}  # className -> { parentOrg, orgId, members: [name, ...] }
for match in re.finditer(r'\\"name\\":\\"([^\\]+)\\"[^}]*?\\"classes\\":\{([^}]*(?:\{[^}]*\}[^}]*)*)\}', woc_section):
    member_name = match.group(1)
    classes_str = match.group(2)
    
    # Parse individual class entries
    for cls_match in re.finditer(r'\\"([^\\]+)\\":\{\\"ParentOrg\\":\\"([^\\]+)\\",\\"orgId\\":(\d+)\}', classes_str):
        cls_name = cls_match.group(1)
        parent_org = cls_match.group(2)
        org_id = int(cls_match.group(3))
        
        key = cls_name
        if key not in classes_map:
            classes_map[key] = {'parentOrg': parent_org, 'orgId': org_id, 'members': []}
        classes_map[key]['members'].append(member_name)

print(f"Total class types: {len(classes_map)}")
for cls_name in sorted(classes_map.keys()):
    info = classes_map[cls_name]
    print(f"  {cls_name} (parent: {info['parentOrg']}, orgId: {info['orgId']}): {len(info['members'])} members")

# ── 3. CHECK: Do membersWithCallings entries also have a 'classes' field? ──
print("\n\n=== CLASS DATA IN membersWithCallings ===")
wc_classes = mwc[mwc_idx:buo_idx].count('\\"classes\\"')
print(f"'classes' field occurrences in membersWithCallings section: {wc_classes}")

# Check a sample with-callings entry for classes
sample_idx = wc_section.find('Hone, Justin')
if sample_idx >= 0:
    sample = wc_section[sample_idx:sample_idx+700].replace('\\"', '"')
    print(f"\nSample entry (Hone, Justin):")
    print(f"  {sample[:600]}")

# ── 4. VERIFY: BaseUnitOrgs to match classes to orgs ──
print("\n\n=== BASEUNITORGS vs CLASS PARENT ORGS ===")
buo_end = mwc.index('unitNumber', buo_idx)
buo_section = mwc[buo_idx:buo_end+50].replace('\\"', '"')
print(f"BaseUnitOrgs: {buo_section[:800]}")

# Match org names to class parent orgs
print("\n\nOrg mapping (class parentOrg → BaseUnitOrg):")
base_orgs = ['Bishopric', 'Elders Quorum', 'Relief Society', 'Aaronic Priesthood Quorums',
             'Young Women', 'Sunday School', 'Primary', 'Ward Missionaries', 
             'Temple and Family History', 'Other Callings']
for cls_name, info in sorted(classes_map.items()):
    parent = info['parentOrg']
    matched = parent in base_orgs
    print(f"  {cls_name}: parentOrg='{parent}' {'✓' if matched else '✗ NOT IN BaseUnitOrgs'}")
