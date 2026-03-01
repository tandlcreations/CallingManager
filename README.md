# CallingManager - Local Development

A local version of the CallingManager application for managing LDS ward callings.

## Features

- **Demo Mode**: Load sample calling data to explore the application
- **LCR Integration**: Import real calling data from Leader and Clerk Resources
- **Member List Import**: Import ward member list for easy assignment selection
- **Organization View**: View all callings organized by ward organizations on one page
- **Show/Hide Callings**: Customize which callings display (hide irrelevant ones)
- **Member Selection**: Choose from a list of members when assigning callings
- **Search**: Find specific callings or members quickly
- **Edit Callings**: Assign, change, or release members from callings
- **Data Export**: Export your calling data as JSON
- **Local Storage**: Data persists in your browser

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- No additional installations required!

### Running Locally

1. Open `index.html` in your web browser:
   - Double-click the file, or
   - Right-click and select "Open With" → your browser, or
   - Use a local server (see below for VS Code method)

2. Choose one of two options:
   - **Try Demo**: Click "LAUNCH DEMO" to load sample data
   - **Import Real Data**: Follow the instructions to copy and paste data from LCR

### Using with VS Code Live Server (Recommended)

If you have VS Code with the Live Server extension:

1. Right-click on `index.html`
2. Select "Open with Live Server"
3. The application will open in your browser with auto-reload on changes

Alternatively, use Python's built-in server:
```bash
# Python 3
python3 -m http.server 8000

# Then open http://localhost:8000 in your browser
```

## Project Structure

```
CallingManager/
├── index.html          # Main HTML file
├── styles.css          # All styling
├── app.js             # Application logic
└── README.md          # This file
```

## Usage

### Loading Demo Data
Click "LAUNCH DEMO" to load sample ward data and explore the interface.

### Importing from LCR
1. Log into https://lcr.churchofjesuschrist.org/
2. Visit the API endpoints as described on the home page
3. Copy all the JSON text
4. Paste into the textarea and click SUBMIT

**Optional - Import Member List:**
1. Find your unit number in the calling data (6-digit number)
2. Visit: `https://lcr.churchofjesuschrist.org/services/umlu/report/member-list?lang=eng&unitNumber=YOUR_UNIT_NUMBER`
3. Copy the JSON and paste into the "Member List" textarea
4. See [LCR-API-GUIDE.md](LCR-API-GUIDE.md) for more API endpoints

### Managing Callings
- View all organizations and callings on one scrollable page
- Click **"Assign"** on vacant callings to select a member from your list
- Click **"Change"** to reassign a calling to a different member
- Click **"Release"** to release a member from their calling
- Click **👁️ Show/Hide Callings** to customize which callings display
- Use the search bar to find specific callings or members
- Export data for backup or external use

### Customizing Display
1. Click the **👁️ Show/Hide Callings** button
2. Uncheck callings that don't apply to your ward
3. Click **Hide All** or **Show All** to toggle everything
4. Changes are saved automatically

## Data Privacy

- All data is stored locally in your browser
- No data is sent to external servers
- Clear browser data to remove stored calling information

## Customization

Feel free to modify:
- `styles.css` for visual customization
- `app.js` to add features or change behavior
- `index.html` to adjust layout or content

## Browser Compatibility

Works with all modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

**Data won't load from LCR:**
- Ensure you copied ALL the text from the API page
- The data should start with `{` and end with `}`
- Check browser console (F12) for error messages

**Changes not saving:**
- Check that cookies/local storage is enabled
- Try clearing browser cache and reloading

**Styling issues:**
- Clear browser cache
- Ensure all three files are in the same directory

## Future Enhancements

Ideas for improvement:
- PDF/Excel export options
- Calling history tracking
- Member contact information
- Calendar integration for sustainings
- Mobile app version
- Multiple ward support

## License

This is an unofficial tool not affiliated with The Church of Jesus Christ of Latter-day Saints.

## Contributing

To make changes:
1. Edit the relevant files
2. Test in your browser
3. Document your changes

---

Built with vanilla HTML, CSS, and JavaScript - no frameworks required!
