# CleanRead - Chrome Extension for Dyslexia Accessibility

CleanRead is a Chrome extension designed to make webpages more readable for people with dyslexia. It provides fast, reversible, per-site customizations with sensible presets and deep custom overrides.

## Features

### Quick Controls (Popup)
- **Master Toggle**: Enable/disable dyslexia mode instantly
- **Font Selector**: Choose from Default, OpenDyslexic, Lexend, or Sans-Serif fonts
- **Theme Selector**: Light Cream, Dark, High Contrast, or Custom themes
- **Line Focus**: Reading ruler that follows your cursor or keyboard navigation
- **Reader View**: Clean, distraction-free reading mode
- **Text-to-Speech**: Click to read selected text with highlighting

### Detailed Settings (Options Page)
- **Typography**: Font family, size, line height, letter spacing, word spacing, paragraph spacing
- **Colors & Contrast**: Text color, background color, overlay tint, contrast boost
- **Layout**: Maximum column width, text alignment, margin tuning
- **Focus Tools**: Line focus ruler with customizable height, opacity, and color
- **Text-to-Speech**: Voice selection, rate, pitch, and follow-along highlighting
- **Presets**: High Readability, Calm Reading, High Contrast, Minimal
- **Profiles**: Save, load, delete, and export/import named configurations
- **Per-Site Settings**: Different settings for different websites

### Keyboard Shortcuts
- `Alt+Shift+D`: Toggle Dyslexia Mode
- `Alt+Shift+F`: Toggle Line Focus
- `Alt+Shift+S`: Speak Selected Text

## Installation

### Development Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd cleanread
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the extension**:
   ```bash
   npm run build
   ```

4. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` folder

### Production Installation

1. Download the latest release from the releases page
2. Extract the ZIP file
3. Follow steps 4-6 from the development installation

## Usage

### Basic Usage

1. **Enable the extension**: Click the CleanRead icon in your toolbar
2. **Toggle dyslexia mode**: Use the master toggle or press `Alt+Shift+D`
3. **Adjust settings**: Click "More Settings" to access detailed options
4. **Use line focus**: Toggle with the checkbox or press `Alt+Shift+F`
5. **Read text aloud**: Select text and press `Alt+Shift+S`

### Advanced Usage

#### Creating Custom Profiles
1. Open the options page
2. Go to the "Profiles" tab
3. Click "New Profile" and give it a name
4. Customize all settings as desired
5. Click "Save Profile"

#### Per-Site Settings
1. Navigate to a website where you want different settings
2. Open the popup and toggle "Use different settings on this site"
3. Customize settings for that specific site
4. Settings will automatically apply when you revisit the site

#### Export/Import Settings
1. Go to the "Profiles" tab in options
2. Click "Export" to download your settings as JSON
3. Click "Import" to load settings from a JSON file

## Technical Details

### Architecture
- **Manifest V3**: Uses the latest Chrome extension architecture
- **TypeScript**: Type-safe development with modern JavaScript features
- **Modular Design**: Separated concerns with shared modules
- **No Network Usage**: All processing happens locally for privacy

### File Structure
```
src/
├── background/          # Service worker
├── content/            # Content scripts
│   ├── styles/         # CSS stylesheets
│   └── fonts/          # Font files
├── popup/              # Popup interface
├── options/            # Options page
└── shared/             # Shared modules
    ├── settings.ts     # Type definitions
    ├── storage.ts      # Storage management
    ├── messaging.ts    # Inter-script communication
    └── dom.ts          # DOM utilities
```

### Permissions
- `storage`: Save user settings and profiles
- `scripting`: Inject content scripts
- `activeTab`: Access current tab information
- `tts`: Text-to-speech functionality
- `<all_urls>`: Apply to all websites

## Development

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Chrome browser

### Building
```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Watch for changes during development
npm run watch

# Clean build directory
npm run clean

# Create distribution package
npm run package
```

### Code Structure

#### Shared Modules
- **settings.ts**: Type definitions and default configurations
- **storage.ts**: Chrome storage API wrapper with profile management
- **messaging.ts**: Inter-script communication utilities
- **dom.ts**: DOM manipulation and utility functions

#### Content Scripts
- **content.ts**: Main content script with CSS injection
- **focusRuler.ts**: Line focus functionality
- **tts.ts**: Text-to-speech with highlighting
- **readability.ts**: Reader view implementation

#### UI Components
- **popup/**: Quick access interface
- **options/**: Detailed settings page

### Adding New Features

1. **Define types** in `src/shared/settings.ts`
2. **Add storage logic** in `src/shared/storage.ts`
3. **Implement messaging** in `src/shared/messaging.ts`
4. **Create UI components** in popup or options
5. **Add content script logic** if needed
6. **Update background script** for new commands

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Build the extension: `npm run build`
5. Test in Chrome with the built extension
6. Commit your changes: `git commit -m "Add feature"`
7. Push to your fork: `git push origin feature-name`
8. Create a Pull Request

### Testing Checklist
- [ ] Test on various websites (news, blogs, documentation)
- [ ] Verify all keyboard shortcuts work
- [ ] Test per-site settings functionality
- [ ] Check accessibility with screen readers
- [ ] Test on different screen sizes
- [ ] Verify font loading and display
- [ ] Test TTS functionality
- [ ] Check line focus behavior

## Privacy & Security

- **No Data Collection**: The extension doesn't collect any personal data
- **Local Processing**: All text processing happens in your browser
- **No Network Requests**: No external servers are contacted
- **Minimal Permissions**: Only requests necessary Chrome APIs
- **Reversible Changes**: All modifications can be easily undone

## Browser Support

- Chrome 88+ (Manifest V3 support required)
- Chromium-based browsers (Edge, Brave, etc.)

## License

MIT License - see LICENSE file for details

## Acknowledgments

- OpenDyslexic font by Abelardo Gonzalez
- Lexend font by Bonnie Shaver-Troup
- Chrome Extensions API documentation
- Accessibility guidelines and best practices

## Support

For issues, feature requests, or questions:
1. Check the [Issues](https://github.com/your-repo/cleanread/issues) page
2. Create a new issue with detailed information
3. Include browser version and extension version
4. Describe steps to reproduce any problems

## Changelog

### v1.0.0
- Initial release
- Basic dyslexia-friendly styling
- Font selection (OpenDyslexic, Lexend)
- Theme support (Light, Dark, High Contrast)
- Line focus ruler
- Text-to-speech functionality
- Reader view
- Per-site settings
- Profile management
- Keyboard shortcuts
