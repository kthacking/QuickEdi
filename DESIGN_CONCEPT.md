# QuickEdit: Smart Live Components Builder ("Nexus") - Design & Implementation Plan

## 1. Feature Overview
**Name**: **Nexus Builder** (The connector of code and design)
**Goal**: Transform QuickEdit from a code editor into a visual site builder.
**Vibe**: Scientific, Industrial, Swiss Design (inspired by the provided reference). Precision tools for creative minds.

## 2. Visual Identity (The "Momentum" Theme)
Based on your reference image, the design language dictates:
- **Philosophy**: "Progress over Perfection." Clean, grid-based, honest.
- **Color Palette**:
    - **Canvas Background**: `#F0F0F2` (Soft industrial gray)
    - **Grid Lines**: `rgba(0,0,0,0.06)` (Precision markers)
    - **Surface/Panels**: `#FFFFFF` (Clean white sheets)
    - **Primary Accent**: `#FF2E00` (The "Appreciation" tag red - High energy)
    - **Text High-Contrast**: `#0A0A0A` (Stark black)
    - **Text Muted**: `#545454` (Technical gray)
- **Typography**:
    - Headings: **Inter / Helvetica Now** (Bold, tight tracking).
    - Code: **JetBrains Mono** or **Fira Code**.
- **Forms/UI**:
    - Pill-shaped buttons (`border-radius: 99px`).
    - Glassmorphism only on overlapping panels.
    - 3D Metallic/Matte textures for tool icons (Compass/Pen feel).

## 3. User Interface Layout (The 3-Pane "Workbench")

### Left Sidebar: The "Depot" (Component Library)
- **Categories**: Layouts, Forms, Typography, Media, AI Lab.
- **Interaction**: Drag and drop cards.
- **Visuals**: Vertical list, small thumbnail previews, minimalistic icons.

### Center: The "Canvas" (Live Workspace)
- **Background**: Infinite dot or crosshair grid (from the image).
- **Behavior**:
    - **Selection Engine**: Blue/Red bounding boxes when hovering elements.
    - **Smart Guides**: Snap-to-grid alignment lines (red dashed).
    - **Live Edit**: Double-click text to edit, drag handles to resize.

### Right Sidebar: The "Inspector" (Properties)
- **Tabs**: Design (CSS), Config (Attributes), AI (Prompts).
- **Controls**: Sliders for padding/margin, Color pickers with swatches, Dropdowns for fonts.

## 4. Technical Architecture
- **Tech Stack**: Vanilla JS (Keep it fast) or Vue/React if scaling. *Decision: Vanilla JS + Custom Web Components for speed.*
- **Core Modules**:
    - `DragDropEngine`: Handles coordinate mapping and insert positions.
    - `ComponentRegistry`: JSON-based definition of all available blocks.
    - `CodeGenerator`: Traverses the DOM tree and outputs clean HTML/CSS.
    - `StyleInjector`: Reactively updates CSS variables.

## 5. Roadmap
### Phase 1: Foundation (Current)
- Set up the grid layout.
- Implement the "Momentum" theme (CSS Variables).
- Create basic drag-and-drop zones.

### Phase 2: Core Components
- Build the component library (Cards, Navbars, Heroes).
- Implement the Properties Panel for basic CSS (Color, Font Size).

### Phase 3: Intelligence
- Integrate AI (OpenAI/Gemini API mock) for "Text to Component".
- "Smart Copy" (One-click HTML export).

### Phase 4: Polish
- Add 3D-style micro-animations.
- Dark Mode toggle (Inverse metallic palette).

---

# Next Steps
I will now generate the **Core Theme (CSS)** and the **Main Layout (HTML)** to visualize this concept.
