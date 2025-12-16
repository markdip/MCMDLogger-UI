# Contributing to MCmdLogger GUI

First off, thank you for considering contributing to MCmdLogger GUI! 🎉

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

When creating a bug report, include:
- **Clear title** describing the problem
- **Step-by-step reproduction** instructions
- **Expected behavior** vs **actual behavior**
- **Screenshots** if applicable
- **Environment details:**
  - OS (Windows/Linux/macOS)
  - Node.js version
  - MCmdLogger version
  - Electron version

### 💡 Suggesting Features

Feature requests are welcome! Please include:
- Clear description of the feature
- Use case / problem it solves
- Any mockups or examples if applicable

### 📝 Pull Requests

1. **Fork** the repository
2. **Create a branch** for your feature/fix:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test** your changes thoroughly
5. **Commit** with a descriptive message:
   ```bash
   git commit -m "Add amazing feature that does X"
   ```
6. **Push** to your branch:
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

## 📋 Development Setup

```bash
# Clone your fork
git clone https://github.com/ArabKustam/mcmdgui.git
cd mcmdgui

# Install dependencies
npm install

# Run in development mode
npm run dev
```

## 📁 Project Structure

```
mcmdgui/
├── main.js              # Electron main process
├── index.html           # Main application window
├── renderer.js          # UI logic and event handlers
├── styles.css           # All styles
├── integrations.js      # Discord/Telegram integration
├── scripts-templates/   # Pre-made script templates
└── scripts-catalog.json # Script store catalog
```

## 🎨 Code Style

- Use **2 spaces** for indentation
- Use **camelCase** for variables and functions
- Use **UPPER_CASE** for constants
- Add comments for complex logic
- Keep functions small and focused

## 📜 Adding New Scripts to Store

1. Create script in `scripts-templates/` folder
2. Add entry to `scripts-catalog.json`:
   ```json
   {
     "id": "your_script",
     "name": "Your Script",
     "nameRu": "Ваш Скрипт",
     "description": "What it does",
     "descriptionRu": "Описание на русском",
     "version": "1.0.0",
     "author": "Your Name",
     "category": "logging|bypass|integrations",
     "filename": "your_script.js",
     "downloads": 0
   }
   ```

## 🌐 Adding Translations

Translations are in `renderer.js` in the `translations` object. Add both English (`en`) and Russian (`ru`) keys for any new text.

```javascript
const translations = {
  en: {
    'your.key': 'English text',
    // ...
  },
  ru: {
    'your.key': 'Русский текст',
    // ...
  }
};
```

## ✅ Checklist Before Submitting

- [ ] Code follows the style guidelines
- [ ] Self-review of code completed
- [ ] Comments added where necessary
- [ ] Changes work on Windows (and Linux/macOS if possible)
- [ ] No new warnings or errors in console
- [ ] README updated if needed

## 📫 Questions?

Feel free to open an issue with your question or reach out to the maintainers.

Thank you for contributing! 🙏

