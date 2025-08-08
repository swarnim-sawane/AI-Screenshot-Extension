
# Visual AI Screenshot Analyzer 📷🤖

> Instantly analyze any part of a webpage with AI-powered insights. Capture, crop, and understand web content in seconds.


## ✨ Features

- **🎯 Drag & Drop Selection**: Click and drag to select any area of a webpage
- **🤖 AI-Powered Analysis**: Get instant insights using Groq's advanced LLaMA models
- **💬 Interactive Chat**: Ask follow-up questions about captured content
- **📝 Markdown Rendering**: Beautiful formatted responses with lists, headers, and styling
- **⚡ Lightning Fast**: Powered by Groq's ultra-fast inference
- **🔒 Privacy First**: Screenshots processed securely, no data stored
- **⌨️ Keyboard Shortcuts**: Quick capture with `Ctrl+Shift+S`
- **🌐 Universal**: Works on any website

## 📦 Installation

### Chrome/Edge (Manual Installation)

1. **Download the Extension**
   ```
   git clone https://github.com/swarnim-sawane/AI-Screenshot-Extension.git
   cd AI-Screenshot-Extension
   ```

2. **Load in Browser**
   - Open `chrome://extensions/` (Chrome) or `edge://extensions/` (Edge)
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension folder

3. **Setup API Key**
   - Get a free API key from [Groq Console](https://console.groq.com/)
   - Click the extension icon
   - Enter your Groq API key
   - Start analyzing!

### Firefox

Compatible with Firefox - follow similar manual installation process using `about:debugging`.

## 🎯 How to Use

1. **Activate**: Click extension icon or press `Ctrl+Shift+S`
2. **Select**: Drag to select any area on the webpage
3. **Analyze**: AI analysis appears instantly in a chat window
4. **Explore**: Ask follow-up questions about the content

## 🛠️ Technical Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **AI Model**: Groq LLaMA 4 Scout (meta-llama/llama-4-scout-17b-16e-instruct)
- **Architecture**: Chrome Extension Manifest V3
- **Markdown**: Marked.js for beautiful formatting
- **APIs**: Chrome Extensions API, Groq AI API

## 📁 Project Structure

```
AI-Screenshot-Extension/
├── manifest.json          # Extension configuration
├── background.js           # Service worker & AI processing
├── content.js             # Screenshot selection UI
├── popup.html & popup.js  # Extension popup interface
├── chat.html & chat.js    # AI chat window
├── styles/                # CSS styling
├── icons/                 # Extension icons
├── utils/                 # Helper utilities
└── screenshots/           # Demo images
```

## ⚙️ Development

### Prerequisites

- Chrome/Edge browser
- Groq API key (free at [console.groq.com](https://console.groq.com/))
- Basic knowledge of JavaScript

### Local Development

1. **Clone & Setup**
   ```
   git clone https://github.com/swarnim-sawane/AI-Screenshot-Extension.git
   cd AI-Screenshot-Extension
   ```

2. **Load Extension**
   - Follow installation steps above for manual loading
   - Make changes to code
   - Click refresh icon in `chrome://extensions/`

3. **Debug**
   - Right-click extension popup → "Inspect"
   - Check browser console for errors
   - Use `console.log()` for debugging

### Key Components

- **`content.js`**: Handles screenshot selection overlay
- **`background.js`**: Manages AI API calls and image processing
- **`chat.js`**: Interactive chat interface with markdown rendering

## 🔧 Configuration

### API Setup

The extension uses Groq's API for AI analysis:

1. Visit [Groq Console](https://console.groq.com/)
2. Create free account
3. Generate API key
4. Enter in extension popup

### Supported Models

- `meta-llama/llama-4-scout-17b-16e-instruct` (default)
- Easily configurable for other Groq vision models

## 🎨 Use Cases

- **🐛 Debugging**: Analyze error messages and console outputs
- **🎨 Design Review**: Get insights on UI/UX patterns
- **📊 Data Analysis**: Understand charts, graphs, and dashboards
- **📚 Learning**: Explain complex diagrams and interfaces
- **🔍 Research**: Quick analysis of web content
- **🌐 Translation**: Understand foreign language interfaces

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** changes (`git commit -m 'Add AmazingFeature'`)
4. **Push** to branch (`git push origin feature/AmazingFeature`)
5. **Open** Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Test on both Chrome and Edge
- Update README for new features

## 📈 Roadmap

- [ ] 🏪 **Store Publication**: Chrome Web Store & Edge Add-ons
- [ ] 🔤 **OCR Integration**: Extract text from screenshots
- [ ] 🌍 **Multi-language**: Translate analyzed content
- [ ] 📱 **Mobile Support**: Companion mobile app
- [ ] 🔗 **Integrations**: Slack, Notion, Discord webhooks
- [ ] 📊 **Analytics**: Usage insights and optimization
- [ ] 🎨 **Themes**: Dark mode and custom styling
- [ ] 🤖 **More AI Models**: Support for additional providers

## 🐛 Known Issues

- High-DPI displays may have slight coordinate offset (working on fix)
- Some websites with strict CSP may block overlay (rare)
- Large screenshots may take longer to process

## 📊 Performance

- **Screenshot Capture**: ~200ms average
- **AI Analysis**: ~2-5 seconds (depends on content complexity)
- **Memory Usage**: <10MB typical
- **Network**: Only sends cropped image data to Groq API

## 🔐 Privacy & Security

- **Local Processing**: Screenshots cropped locally before AI analysis
- **No Storage**: Images not saved unless explicitly requested
- **API Security**: Direct connection to Groq's secure endpoints
- **Permissions**: Minimal required permissions (`activeTab`, `storage`, `scripting`)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq** for providing fast and powerful AI inference
- **Chrome Extensions Team** for comprehensive APIs
- **Open Source Community** for inspiration and tools

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/swarnim-sawane/AI-Screenshot-Extension/issues)
- **Discussions**: [GitHub Discussions](https://github.com/swarnim-sawane/AI-Screenshot-Extension/discussions)
- **Email**: swarnim.sawane@gmail.com

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=swarnim-sawane/AI-Screenshot-Extension&type=Date)](https://star-history.com/#swarnim-sawane/AI-Screenshot-Extension&Date)

---

**Built with ❤️ by [Swarnim Sawane](https://github.com/swarnim-sawane)**

*If this extension helps you, consider ⭐ starring the repo and sharing with others!*
