# QuickEdit: Nexus Builder
Open to try(https://kthacking.github.io/QuickEdi/)
**Nexus Builder** is a powerful, lightweight, visual site builder designed for **QuickEdi**. It transforms a standard coding environment into a "Progress over Perfection" drag-and-drop workbench, bridging the gap between design and code with an industrial, precise, and efficient workflow.

## 🚀 Features

### Core Workbench
- **Drag & Drop Interface**: Seamlessly drag components from the "The Depot" (Library) to the canvas.
- **Live Canvas**: An interactive workspace with grid backgrounds and smart selection handling.
- **Smart Selection**: Click to select, resize, and move elements (supports absolute positioning).
- **Responsive Viewport Controls**: Toggle between Desktop (100%), Tablet (768px), and Mobile (375px) views.

### Component Library ("The Depot")
- **Basic Elements**: Text Blocks, Primary Buttons, Image Placeholders, Input Fields.
- **Layout Blocks**: Flex-ready Containers, Hero Sections, Navbars.
- **Composites**: Pre-styled Cards.
- **Templates**: Admin Dashboard, Auth Page, Landing Page, Portfolio Grid, Pricing Table.

### Inspector Panel ("The Properties")
A comprehensive, real-time property editor:
- **Typography Suite**: Full control over Font (Inter, JetBrains Mono, Serif), Weight, Styling, Formatting, and color.
- **Layout & Positioning**: Static/Relative/Absolute/Fixed positioning, Z-Index, and detailed Flexbox controls (Direction, Wrap, Justify, Align, Gap).
- **Appearance & Theming**: Background colors, Borders, Corner Radius, and Box Shadows.
- **Theme Presets**: 20+ curated themes (Glassmorphism, Sunset, Cyberpunk, etc.) with intensity/opacity controls.
- **Animation & Effects**: Entrance animations (Fade, Slide, Zoom, Bounce) and Hover effects (Opacity, Scale, Lift, Glow).

### Tools & Utilities
- **Preview Mode**: Toggle between "Edit Mode" and "View Only" to test interactions.
- **Export To Code**: Generates clean HTML of the current canvas and automatically copies it to the clipboard.
- **Auto-Save**: Canvas state is automatically persisted to LocalStorage.
- **AI Command Bar**: (Beta) Floating command bar for quick actions.

## 🛠️ Tech Stack

- **Core**: Vanilla HTML5, CSS3, and JavaScript (Zero framework dependencies).
- **Icons**: [Ionicons](https://ionic.io/ionicons) (ESM).
- **Fonts**: [Google Fonts](https://fonts.google.com/) (Inter, JetBrains Mono).

## 📂 Project Structure

```
QuickEdi/
├── css/
│   ├── style.css           # Main application styles (layout, theming, UI)
│   └── animations.css      # Keyframe animations and transitions
├── js/
│   └── builder.js          # Core logic (Drag&drop, state management, properties)
├── index.html              # Main application entry point
├── DESIGN_CONCEPT.md       # Original design philosophy and roadmap
└── README.md               # This file
```

## 📖 Getting Started

1. **Clone or Download** the repository.
2. **Open** `index.html` in any modern web browser.
   - *Recommendation*: Use a local development server (e.g., Live Server in VS Code) for the best experience, although it works directly from the file system.
3. **Start Building**:
   - Drag elements from the Left Sidebar.
   - Select them on the Canvas.
   - Tweak properties in the Right Sidebar.

## 🔮 Roadmap

- [ ] **Publish Functionality**: Save builds to server/file.
- [ ] **Advanced AI Integration**: Text-to-Layout generation.
- [ ] **Multi-Page Support**: Create and manage multiple views.
- [ ] **Custom Component Saving**: Save composites as new library items.

---
*QuickEdit is built for speed and precision.*
