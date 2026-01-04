# LCR API Endpoints Guide

This guide documents the LCR (Leader and Clerk Resources) API endpoints useful for the CallingManager application.

## Authentication Required

All endpoints require you to be logged into https://lcr.churchofjesuschrist.org/ first.

## Available Endpoints

### 1. Callings by Organization
**URL:** `https://lcr.churchofjesuschrist.org/api/orgs/sub-orgs-with-callings?ip=true&lang=eng`

**Purpose:** Get all ward callings organized by organization (Bishopric, Relief Society, Elders Quorum, etc.)

**Usage:** This is the primary data source for the CallingManager application.

---

### 2. Out of Unit Callings
**URL:** `https://lcr.churchofjesuschrist.org/api/orgs/out-of-unit-callings?includeTypes=LIVING_INSIDE&lang=eng`

**Purpose:** Get callings for members who serve outside the ward

**Note:** Currently not fully functional due to recent LDS.org changes

---

### 3. Member List (Multiple Options)

#### Option A: Unit Member List (VERIFIED - WORKING ✅)
**URL:** `https://lcr.churchofjesuschrist.org/api/umlu/report/member-list?lang=eng&unitNumber=YOUR_UNIT_NUMBER`

**Replace:** `YOUR_UNIT_NUMBER` with your ward number (you can find this in your calling data)

**Example:** `https://lcr.churchofjesuschrist.org/api/umlu/report/member-list?lang=eng&unitNumber=152226`

**Purpose:** Get complete list of all ward members

**Data Includes:**
- Member names (multiple formats)
- Ages
- Addresses
- Phone numbers
- Email addresses
- UUIDs and legacy IDs

#### Option B: Household List
**URL:** `https://lcr.churchofjesuschrist.org/api/umlu/v1/households/unit/YOUR_UNIT_NUMBER`

**Purpose:** Get member data organized by household

#### Option C: Birthday List
**URL:** `https://lcr.churchofjesuschrist.org/api/report/birthday-list?lang=eng&month=1`

**Purpose:** Get member names and birthdays (change month=1 to get different months, or remove to get all)

---

### 4. Ministering Data
**URL:** `https://lcr.churchofjesuschrist.org/api/umlu/v1/ministering/data?unitNumber=YOUR_UNIT_NUMBER&months=3`

**Purpose:** Get ministering assignments and could be used to extract member names

---

## How to Use

1. **Log into LCR:** Go to https://lcr.churchofjesuschrist.org/ and sign in
2. **Open the API URL:** Visit one of the URLs above in a new tab
3. **Copy the JSON:** Select all (Ctrl/Cmd+A) and copy (Ctrl/Cmd+C)
4. **Paste into CallingManager:** Paste the data into the appropriate textarea

## Finding Your Unit Number

Your unit number appears in the calling data JSON. Look for `"unitNumber"` - it will be a 6-digit number like `152226`.

## Common Issues

**403 Forbidden:** You're not logged into LCR
**404 Not Found:** The URL might have changed or you need to replace placeholders
**Empty Data:** You might not have permissions to view this data

## Data Privacy Note

All this data is already accessible to ward leaders through LCR. The CallingManager application stores it locally in your browser only - no external servers are involved.

## Example: Getting Member List

1. Copy your unit number from the calling data (e.g., `152226`)
2. Visit: `https://lcr.churchofjesuschrist.org/services/umlu/report/member-list?lang=eng&unitNumber=152226`
3. Copy all the JSON that appears
4. Paste into the "Member List" textarea in CallingManager

## Tips

- The member list API gives you the most complete data
- If one endpoint doesn't work, try another
- Keep your data updated by re-importing periodically
- The household list might be easier to work with for some purposes

## Troubleshooting

If an endpoint doesn't work:
1. Make sure you're logged into LCR
2. Try accessing the data through the normal LCR interface first
3. Some endpoints may require specific permissions
4. LDS.org occasionally changes their API structure

---

**Last Updated:** January 2026
**Not an official Church resource**
