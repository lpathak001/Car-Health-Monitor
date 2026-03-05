# 📤 Slides Export Guide

## How to Convert Markdown Slides to Presentation Formats

The slides in `CUSTOMER_DEMO_SLIDES.md` can be converted to various presentation formats.

---

## Option 1: Marp (Recommended)

### What is Marp?
Marp is a Markdown presentation ecosystem that converts Markdown to beautiful slides.

### Installation
```bash
# Using npm
npm install -g @marp-team/marp-cli

# Using Homebrew (Mac)
brew install marp-cli
```

### Convert to PowerPoint
```bash
marp CUSTOMER_DEMO_SLIDES.md --pptx -o customer-demo.pptx
```

### Convert to PDF
```bash
marp CUSTOMER_DEMO_SLIDES.md --pdf -o customer-demo.pdf
```

### Convert to HTML
```bash
marp CUSTOMER_DEMO_SLIDES.md --html -o customer-demo.html
```

### With Theme
```bash
# Create a custom theme file (theme.css)
marp CUSTOMER_DEMO_SLIDES.md --theme theme.css --pptx -o customer-demo.pptx
```

---

## Option 2: Pandoc

### Installation
```bash
# Ubuntu/Debian
sudo apt-get install pandoc

# Mac
brew install pandoc

# Windows
# Download from https://pandoc.org/installing.html
```

### Convert to PowerPoint
```bash
pandoc CUSTOMER_DEMO_SLIDES.md -o customer-demo.pptx
```

### Convert to PDF (requires LaTeX)
```bash
pandoc CUSTOMER_DEMO_SLIDES.md -o customer-demo.pdf
```

### With Custom Template
```bash
pandoc CUSTOMER_DEMO_SLIDES.md --reference-doc=template.pptx -o customer-demo.pptx
```

---

## Option 3: reveal.js (Web Presentation)

### Installation
```bash
npm install -g reveal-md
```

### Run Live Presentation
```bash
reveal-md CUSTOMER_DEMO_SLIDES.md
```

### Export to PDF
```bash
reveal-md CUSTOMER_DEMO_SLIDES.md --print customer-demo.pdf
```

### Export to Static HTML
```bash
reveal-md CUSTOMER_DEMO_SLIDES.md --static customer-demo-site
```

---

## Option 4: Google Slides (Manual)

### Steps
1. Open Google Slides
2. Create new presentation
3. Copy content from each slide section
4. Format manually
5. Add images and charts
6. Apply theme

### Tips
- Use "Insert > Text box" for ASCII art
- Use "Insert > Table" for data tables
- Use "Insert > Shape" for diagrams
- Apply consistent fonts and colors

---

## Option 5: PowerPoint (Manual)

### Steps
1. Open PowerPoint
2. Create new presentation
3. Copy content from each slide section
4. Format manually
5. Add animations and transitions
6. Apply design theme

### Tips
- Use Courier New or Consolas for ASCII art
- Use tables for data
- Use SmartArt for diagrams
- Keep it simple and clean

---

## Recommended Workflow

### For Quick Export
```bash
# Install Marp
npm install -g @marp-team/marp-cli

# Convert to PowerPoint
marp CUSTOMER_DEMO_SLIDES.md --pptx -o customer-demo.pptx

# Convert to PDF
marp CUSTOMER_DEMO_SLIDES.md --pdf -o customer-demo.pdf
```

### For Web Presentation
```bash
# Install reveal-md
npm install -g reveal-md

# Run live
reveal-md CUSTOMER_DEMO_SLIDES.md

# Open browser to http://localhost:1948
```

### For Custom Design
1. Export to PowerPoint using Marp
2. Open in PowerPoint
3. Apply custom theme
4. Adjust layouts
5. Add company branding
6. Save final version

---

## Marp Theme Example

Create `theme.css`:

```css
/* @theme custom */

@import 'default';

section {
  background-color: #f5f5f5;
  font-family: 'Arial', sans-serif;
}

h1 {
  color: #2c3e50;
  border-bottom: 3px solid #3498db;
  padding-bottom: 10px;
}

h2 {
  color: #3498db;
}

code {
  background-color: #ecf0f1;
  padding: 2px 5px;
  border-radius: 3px;
}

pre {
  background-color: #2c3e50;
  color: #ecf0f1;
  padding: 20px;
  border-radius: 5px;
}

table {
  border-collapse: collapse;
  width: 100%;
}

th {
  background-color: #3498db;
  color: white;
  padding: 10px;
}

td {
  padding: 8px;
  border-bottom: 1px solid #ddd;
}
```

Then use it:
```bash
marp CUSTOMER_DEMO_SLIDES.md --theme theme.css --pptx -o customer-demo.pptx
```

---

## Adding Images

### In Markdown
```markdown
![Description](path/to/image.png)
```

### For Charts
1. Generate charts using Python/matplotlib
2. Save as PNG
3. Reference in markdown
4. Or add manually in PowerPoint

---

## Presentation Tips

### File Formats
- **PPTX**: Best for editing and presenting
- **PDF**: Best for sharing (read-only)
- **HTML**: Best for web/remote presentations
- **Markdown**: Best for version control

### Best Practices
1. ✅ Test on presentation computer
2. ✅ Have backup PDF version
3. ✅ Include presenter notes
4. ✅ Check all links work
5. ✅ Verify fonts display correctly
6. ✅ Test animations/transitions
7. ✅ Have offline version ready

---

## Quick Commands Reference

```bash
# Marp - PowerPoint
marp CUSTOMER_DEMO_SLIDES.md --pptx -o customer-demo.pptx

# Marp - PDF
marp CUSTOMER_DEMO_SLIDES.md --pdf -o customer-demo.pdf

# Marp - HTML
marp CUSTOMER_DEMO_SLIDES.md --html -o customer-demo.html

# Pandoc - PowerPoint
pandoc CUSTOMER_DEMO_SLIDES.md -o customer-demo.pptx

# Pandoc - PDF
pandoc CUSTOMER_DEMO_SLIDES.md -o customer-demo.pdf

# reveal.js - Live
reveal-md CUSTOMER_DEMO_SLIDES.md

# reveal.js - PDF
reveal-md CUSTOMER_DEMO_SLIDES.md --print customer-demo.pdf
```

---

## Troubleshooting

### Marp not found
```bash
# Check installation
npm list -g @marp-team/marp-cli

# Reinstall
npm install -g @marp-team/marp-cli
```

### Pandoc errors
```bash
# Check version
pandoc --version

# Update
brew upgrade pandoc  # Mac
sudo apt-get update && sudo apt-get upgrade pandoc  # Linux
```

### Fonts not displaying
- Install required fonts on system
- Or use web-safe fonts (Arial, Times New Roman, Courier)
- Or embed fonts in PDF

### ASCII art broken
- Use monospace font (Courier New, Consolas)
- Adjust font size
- Or replace with images

---

## Files Included

1. **CUSTOMER_DEMO_SLIDES.md** - Main presentation (25 slides)
2. **SLIDES_PRESENTER_NOTES.md** - Detailed presenter notes
3. **SLIDES_EXPORT_GUIDE.md** - This file
4. **DEMO_QUICK_REFERENCE.md** - One-page cheat sheet

---

## Recommended Setup

### For Live Demo
```bash
# Terminal 1: Run reveal.js presentation
reveal-md CUSTOMER_DEMO_SLIDES.md

# Terminal 2: Have demo script ready
./customer-demo.sh

# Browser: Open presentation
# http://localhost:1948
```

### For Client Meeting
1. Export to PowerPoint
2. Add company branding
3. Test on meeting room computer
4. Have PDF backup on USB drive
5. Print DEMO_QUICK_REFERENCE.md
6. Bring SLIDES_PRESENTER_NOTES.md

---

## Next Steps

1. Choose export method (Marp recommended)
2. Convert slides to desired format
3. Review and customize
4. Add company branding
5. Test presentation
6. Practice with presenter notes
7. Prepare for demo

---

**Ready to present!** 🎤

For questions or issues, refer to:
- Marp documentation: https://marp.app/
- Pandoc documentation: https://pandoc.org/
- reveal.js documentation: https://revealjs.com/
