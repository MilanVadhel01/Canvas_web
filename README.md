# 🎨 AI Air Canvas - Web Version

Draw in the air using hand gestures! A browser-based virtual drawing application powered by MediaPipe hand tracking.

![AI Air Canvas](https://img.shields.io/badge/AI-Air%20Canvas-purple?style=for-the-badge)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)

## ✨ Features

- **Real-time hand tracking** - Powered by MediaPipe Hands
- **Gesture-based drawing** - Use your index finger to draw
- **Color palette** - Select colors with gestures
- **Brush size control** - Adjust with keyboard or UI buttons
- **Eraser mode** - Fist gesture or 'E' key
- **Save drawings** - Download as PNG

## ✋ Gesture Controls

| Gesture | Action |
|---------|--------|
| ☝️ Index finger up | Draw on canvas |
| ✌️ Two fingers (peace) | Selection mode / Move cursor |
| 🖐️ Open palm (5 fingers) | Clear canvas |
| ✊ Fist (0 fingers) | Eraser mode |

## ⌨️ Keyboard Controls

| Key | Action |
|-----|--------|
| `+` / `-` | Increase / Decrease brush size |
| `E` | Toggle eraser mode |
| `C` | Clear canvas |
| `S` | Save drawing as PNG |

## 🚀 Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Click **Deploy** - that's it!

Vercel will automatically detect it as a static site and deploy it.

## 💻 Run Locally

```bash
# Clone the repo
git clone https://github.com/MilanVadhel01/Canvas_web.git
cd Canvas_web

# Option 1: Use npm serve
npm run dev

# Option 2: Use Python's built-in server
python -m http.server 3000

# Option 3: Use VS Code Live Server extension
```

Then open http://localhost:3000 in your browser.

> ⚠️ **Note**: Camera access requires HTTPS or localhost. The app won't work if you open the HTML file directly.

## 📁 Project Structure

```
Canvas_web/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Styles (dark glassmorphism theme)
├── js/
│   ├── app.js          # Main application logic
│   ├── handDetector.js # Hand detection wrapper
│   └── colorPalette.js # Color palette component
├── package.json        # For Vercel/npm
└── README.md
```

## 🛠️ Technologies

- **MediaPipe Hands** - Hand landmark detection
- **HTML5 Canvas** - Drawing surface
- **Vanilla JavaScript** - No frameworks needed
- **CSS3** - Modern styling with glassmorphism

## 📄 License

MIT License - Feel free to use and modify!

---

Made with ❤️ by [MilanVadhel01](https://github.com/MilanVadhel01)
