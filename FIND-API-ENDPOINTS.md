# How to Find LCR API Endpoints

## Using Browser Developer Tools

### Step-by-Step Guide

1. **Open the page you want to inspect:**
   - Go to https://lcr.churchofjesuschrist.org/records/member-list?lang=eng
   - Make sure you're logged in

2. **Open Developer Tools:**
   - **Chrome/Edge:** Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - **Firefox:** Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - **Safari:** Enable Developer menu first (Preferences → Advanced → Show Develop menu), then press `Cmd+Option+I`

3. **Go to the Network tab:**
   - Click on the "Network" tab in the Developer Tools panel
   - If you don't see any requests, refresh the page (`F5` or `Cmd+R`)

4. **Filter for API calls:**
   - Look for a filter box at the top of the Network tab
   - Type `api` or `json` to filter results
   - Or click "XHR" or "Fetch/XHR" to show only API requests

5. **Find the member list request:**
   - Look through the requests for ones that contain "member" or "household"
   - Common patterns to look for:
     - `/api/umlu/...`
     - `/services/...`
     - `/report/...`
   - Click on each request to see its details

6. **View the request details:**
   - Click on a request to see:
     - **Headers tab:** Shows the full URL
     - **Preview tab:** Shows the response data
     - **Response tab:** Shows raw JSON

7. **Copy the URL:**
   - Right-click on the request → Copy → Copy URL
   - Or find the "Request URL" in the Headers tab

## Common Member List Endpoints to Try

Based on typical LCR patterns, try these (replace YOUR_UNIT_NUMBER):

```
# Member List Reports
https://lcr.churchofjesuschrist.org/services/report/members-with-callings?lang=eng&unitNumber=YOUR_UNIT_NUMBER

https://lcr.churchofjesuschrist.org/api/umlu/report/member-list?unitNumber=YOUR_UNIT_NUMBER&lang=eng

# Household endpoints
https://lcr.churchofjesuschrist.org/api/umlu/v1/households?unitNumber=YOUR_UNIT_NUMBER

https://lcr.churchofjesuschrist.org/services/umlu/households?unitNumber=YOUR_UNIT_NUMBER

# Direct member list
https://lcr.churchofjesuschrist.org/api/report/member-list?lang=eng
```

## Tips for Finding the Right Endpoint

1. **Look for requests that return lots of data** - Member lists will be large responses
2. **Check the Preview tab** - If you see member names, you found it!
3. **Some endpoints might not work directly** - They may require specific headers or cookies
4. **Try variations** - Replace `/api/` with `/services/` or vice versa

## What to Look For in the Response

Good member list data should include:
- Names (full name, preferred name, or given/family name)
- Member IDs (uuid, legacyId, mrn, etc.)
- Optional: age, gender, phone, email, address

## Example: Finding the Endpoint

Here's what you'll see in the Network tab:

```
Name: member-list
Status: 200
Type: json
Size: 500 KB

Request URL: https://lcr.churchofjesuschrist.org/api/umlu/report/member-list?unitNumber=152226&lang=eng
```

## Once You Find the Endpoint

1. Copy the full URL
2. Open it in a new browser tab (while logged into LCR)
3. Copy all the JSON text
4. Paste it into the CallingManager "Member List" textarea

## Alternative: Extract from Page Source

If the API doesn't work directly:

1. Right-click on the member list table → Inspect
2. Look for a `<script>` tag containing member data
3. Sometimes data is embedded as JSON in the page HTML
4. Look for variables like `window.__INITIAL_STATE__` or similar

## Need Help?

If you find the endpoint and it has a different format than expected, paste a small sample of the JSON (remove any personal info first) and I can help update the import function to handle it.

---

**Pro Tip:** The Network tab will stay open between page loads, so you can see all requests as you navigate through LCR!
