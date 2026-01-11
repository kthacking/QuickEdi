# QuickEdit: Smart Live Components Builder ("Nexus")

## 1. Project Overview
**Nexus Builder** is a lightweight, visual site builder designed for "QuickEdi". It transforms a standard coding environment into a drag-and-drop workbench, bridging the gap between design and code.
**Philosophy**: "Progress over Perfection." Industrial, precise, and efficient.

## 2. Features Implemented

### Core Workbench
- **Drag & Drop Interface**: Seamlessly drag components from the library to the canvas.
- **Live Canvas**: An interactive workspace with grid backgrounds and smart selection handling.
- **Smart Selection**: Click to select, resize, and move elements (absolute positioning support).

### Component Library ("The Depot")
- **Container**: Flex-ready box containers.
- **Card Basic**: Pre-styled cards with editable title and text.
- **Hero Section**: Full-width header blocks.
- **Text Block**: Editable paragraphs.
- **Button Primary**: Pill-shaped call-to-action buttons.
- **Image**: Placeholder blocks for media.
- **Input Field**: Form elements for UI mocking.

### Inspector Panel ("The Properties")
A comprehensive property editor that updates in real-time.

**Typography Suite**
- **Font**: Inter, JetBrains Mono, Serif, Arial.
- **Weight**: 400 (Reg) to 800 (Extra Bold).
- **Styling**: Italic, Underline, Text Align (Left, Center, Right).
- **Format**: Uppercase, Lowercase, Capitalize.
- **Metrics**: Font Size, Line Height, Letter Spacing.
- **Color**: Custom text color picker.

**Layout & Positioning**
- **Dimensions**: Width, Height (px, %, auto).
- **Box Model**: Margin, Padding.
- **Positioning**: Static, Relative, Absolute, Fixed. Supports Top/Left/Right/Bottom coordinates and Z-Index.
- **Flexbox**: Context-aware controls (Direction, Wrap, Justify, Align, Gap) that appear only when a container is selected.

**Appearance & Theming**
- **Background**: Color picker for custom backgrounds.
- **Theme Presets**: 20+ curated themes (Glassmorphism, Sunset, Cyberpunk, Midnight, etc.).
- **Intensity**: Opacity control for themes.
- **Borders**: Corner Radius, Border styling.
- **Effects**: Box Shadows (Soft, Medium, Float).

### Tools & Utilities
- **Preview Mode**: Toggle between "Edit Mode" and "View Only" to test interactions.
- **Export**: Generates clean HTML of the current canvas and copies it to the clipboard.
- **Auto-Save**: State is automatically persisted to LocalStorage.
- **AI Command Bar**: (Beta) Text-based insertion of components (e.g., "add card", "hero").

## 3. Visual Identity
The project follows the **"Momentum"** design language:
- **Colors**: Industrial Grays (`#F0F0F2`), Primary Red (`#FF2E00`) for actions.
- **Icons**: Ionicons for a clean, technical look.
- **Textures**: Glassmorphism and subtle gradients for a premium feel.

## 4. Technical Stack
- **Core**: Vanilla JavaScript (Zero dependencies).
- **Icons**: Ionicons (ESM).
- **Font**: Google Fonts (Inter, JetBrains Mono).

## 5. Upcoming Roadmap
- [ ] **Publish Functionality**: Save builds to server/file.
- [ ] **Advanced AI**: Integrate LLM for "Text to Layout" generation.
- [ ] **Multi-Page Support**: Create and manage multiple views.
- [ ] **Component Saving**: Save custom composites as new library items.
