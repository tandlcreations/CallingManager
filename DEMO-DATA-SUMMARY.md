# Expanded Demo Data Summary

## Overview
The demo data has been significantly expanded to provide a more comprehensive and realistic demonstration of the Ward Calling Manager application.

## Expanded Organizations (13 total, up from 7)

### Ward Callings:
1. **Bishopric** (7 callings)
   - Bishop, First/Second Counselors
   - Executive Secretary
   - Ward Clerk
   - Assistant Ward Clerks (Finance, Membership)

2. **Elders Quorum Presidency** (4 callings + 4 child organizations)
   - President, First/Second Counselors, Secretary
   - **Child Orgs:**
     - Teachers (2 Gospel Doctrine Teachers)
     - Ministering (1 Secretary)
     - Activities (2 Committee Members)
     - Service (1 Coordinator)

3. **Relief Society** (4 callings + 3 child organizations)
   - President, First/Second Counselors, Secretary
   - **Child Orgs:**
     - Activities (2 Committee Members)
     - Ministering (1 Secretary)
     - Teachers (1 Gospel Doctrine Teacher)

4. **Sunday School** (4 callings + 1 child organization)
   - President, First/Second Counselors, Secretary
   - **Child Org:**
     - Teachers (2 Gospel Doctrine Teachers)

5. **Primary** (4 callings + 1 child organization)
   - President, First/Second Counselors, Secretary
   - **Child Org:**
     - Music (Music Leader, Pianist)

6. **Young Women** (4 callings + 1 child organization)
   - President, First/Second Counselors, Secretary
   - **Child Org:**
     - Additional Callings (Activity Committee Member)

7. **Young Men** (4 callings)
   - President, First/Second Counselors, Secretary

8. **Aaronic Priesthood Quorums** (2 child organizations)
   - **Child Orgs:**
     - Presidency of the Aaronic Priesthood → Priests Quorum Presidency (3 youth callings)
     - Deacons Quorum (1 Adviser)

9. **Temple and Family History** (2 consultants)

10. **Ward Missionaries** (3 callings)
    - Ward Mission Leader, 2 Ward Missionaries

### Other Callings (under "Other Callings" parent):
11. **Music** (3 callings)
    - Ward Choir Director, Organist, Chorister

12. **Technology** (1 calling)
    - Ward Technology Specialist

13. **Welfare and Self-Reliance** (1 calling)
    - Ward Employment Specialist

### Out of Unit Callings:
14. **Out of Unit Callings** (3 stake callings)
    - Stake Presidency Second Counselor (Matt Anderson)
    - Stake Building Specialist (Joe Hanson)
    - Stake High Councilor (Robert Peterson)

## Total Callings: ~80 positions
- **Filled callings**: ~65
- **Vacant callings**: ~15
- Includes nested organizations up to 3 levels deep (e.g., Aaronic Priesthood Quorums → Presidency → Priests Quorum Presidency)

## Expanded Member List (62 total, up from 26)

### Categories of Members:

1. **Early Church Leaders** (14 members)
   - Joseph Smith, Brigham Young, Oliver Cowdery, Heber C. Kimball
   - Willard Richards, Heber J. Grant, John Taylor, Wilford Woodruff
   - Lorenzo Snow, etc.

2. **Modern Church Leaders** (14 members)
   - Boyd K. Packer, Jeffrey R. Holland, David A. Bednar
   - Quentin L. Cook, M. Russell Ballard, Thomas S. Monson
   - Henry B. Eyring, Dieter F. Uchtdorf, D. Todd Christofferson
   - Ezra Taft Benson, Gordon B. Hinckley, Howard W. Hunter
   - Spencer W. Kimball, Harold B. Lee

3. **Relief Society Leaders** (14 members)
   - Emma Smith, Eliza R. Snow, Emmeline B. Wells
   - Zina D. Young, Martha Hughes Cannon, Ardeth G. Kapp
   - Mary Ellen Smoot, Elaine L. Jack, etc.

4. **Book of Mormon Figures** (10 members)
   - Alma, Nephi, Ammon, Moroni, Mormon
   - Helaman, Lehi, Abish, Sariah

5. **Youth Members** (2 members under 18)
   - Ether (age 16)
   - Samuel the Lamanite (age 17)
   - These demonstrate the auto-hide feature for youth without callings

6. **Additional Members Without Callings** (8 members)
   - Provides realistic "Members Without Callings" demonstration
   - Includes: Parley P. Pratt, Elizabeth Young, etc.

## Demo Features Demonstrated

1. **Nested Organizations**: Up to 3 levels deep showing real ward complexity
2. **Vacant Callings**: ~15 vacant positions showing realistic ward needs
3. **Child Organizations**: Multiple examples (Elders Quorum, Relief Society, etc.)
4. **Out of Unit Callings**: 3 stake calling examples with proper date formatting
5. **Members Without Callings**: 8+ members available for calling assignments
6. **Youth Auto-Hide**: 2 youth members under 18 automatically hidden from "Members Without Callings"
7. **Diverse Names**: Mix of historical, modern, and scriptural names
8. **Parent Org Name Prefixing**: Child orgs properly show parent context (e.g., "Elders Quorum - Teachers")

## Technical Implementation

- All data embedded directly in `app.js` to avoid CORS issues
- Proper LCR data format with nested children arrays
- ISO date handling for out-of-unit callings
- Realistic member data with proper nameFormats structure
- Ages range from 16 to 55 years old

## File Structure

- `app.js`: Contains embedded demo data in `loadDemoData()` function
- `demo-callings.json`: Reference file (not loaded, for documentation)
- `demo-members.json`: Reference file (not loaded, for documentation)
- `build-demo-data.js`: Script that generated the structured demo data
- `generate-demo-data.py`: Python script to output minified JSON
- `expanded-demo-data.txt`: Generated minified JSON for embedding

## Usage

To load demo data:
1. Open the application
2. Click "Load Demo Data" button
3. Explore 13 organizations with ~80 callings
4. Test member assignment with 62 members
5. View "Out of Unit Callings" organization
6. Check "Members Without Callings" to see available members (18+ only)

The expanded demo provides a comprehensive, realistic demonstration of all application features with enough complexity to showcase nested organizations, vacant callings, and member management.
