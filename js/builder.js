/**
 * Nexus Builder Core Logic
 * Version 3.0: Nested Drop, Resize Handles, Robust Selection
 */

const Nexus = {
    selectedElement: null,
    draggedType: null,
    selectionBox: null, // The overlay DOM element
    isResizing: false,

    // Resize state
    resizeStart: { x: 0, y: 0, w: 0, h: 0 },
    currentHandle: null,

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.initThemes(); // From previous step
        console.log("Nexus Builder 3.0 Initialized // Nested + Resize");
    },

    cacheDOM() {
        this.canvas = document.getElementById('artboard');
        this.inspector = document.getElementById('inspector');
        this.themeGrid = document.getElementById('theme-grid');

        // Property Inputs
        this.props = {
            width: document.getElementById('prop-width'),
            height: document.getElementById('prop-height'),
            padding: document.getElementById('prop-padding'),
            margin: document.getElementById('prop-margin'),
            fontSize: document.getElementById('prop-fontsize'),
            color: document.getElementById('prop-color'),
            bgColor: document.getElementById('prop-bg'),
            radius: document.getElementById('prop-radius'),
            border: document.getElementById('prop-border'),
            shadow: document.getElementById('prop-shadow')
        };

        // Actions
        this.actions = {
            duplicate: document.getElementById('action-duplicate'),
            delete: document.getElementById('action-delete'),
            alignBtns: document.querySelectorAll('.btn-icon[data-align]')
        };
    },

    bindEvents() {
        // --- Drag & Drop (Sidebar) ---
        document.querySelectorAll('.component-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                this.draggedType = item.getAttribute('data-type');
                e.dataTransfer.effectAllowed = 'copy';
                e.stopPropagation(); // Clean drag
            });
        });

        // --- Drag & Drop (Canvas / Nested) ---
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';

            // Highlight drop target
            this.clearDropHighlight();
            const target = this.getDropTarget(e.target);
            if (target) {
                target.style.outline = '2px dashed #FF3B30';
                target.style.outlineOffset = '-2px';
            }
        });

        this.canvas.addEventListener('dragleave', (e) => {
            // Basic cleanup, though dragover handles most highlighting logic
        });

        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            this.clearDropHighlight();
            this.handleDrop(e);
        });

        // --- Selection & Clicking ---
        this.canvas.addEventListener('click', (e) => {
            if (this.isResizing) return; // Ignore click if we just finished resizing
            e.stopPropagation();

            // Find component
            const target = e.target.closest('.nexus-component');
            if (target) {
                this.selectElement(target);
            } else {
                this.deselectAll();
            }
        });

        // --- Global Mouse Move / Up (For Resizing) ---
        document.addEventListener('mousemove', (e) => this.handleResizeMove(e));
        document.addEventListener('mouseup', (e) => this.handleResizeEnd(e));

        // --- Property Binding ---
        const bind = (input, styleProp, unit = '') => {
            if (!input) return;
            input.addEventListener('input', (e) => {
                if (this.selectedElement) {
                    this.selectedElement.style[styleProp] = e.target.value + unit;
                }
            });
        };
        bind(this.props.width, 'width');
        bind(this.props.height, 'height');
        bind(this.props.padding, 'padding');
        bind(this.props.margin, 'margin');
        bind(this.props.border, 'border');
        bind(this.props.radius, 'borderRadius');
        bind(this.props.fontSize, 'fontSize', 'px');

        if (this.props.bgColor) this.props.bgColor.addEventListener('input', (e) => this.updateStyle('backgroundColor', e.target.value));
        if (this.props.color) this.props.color.addEventListener('input', (e) => this.updateStyle('color', e.target.value));

        // --- Export ---
        const btnExport = document.getElementById('btn-export');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                // Remove selection box before export
                this.deselectAll();
                const html = this.canvas.innerHTML;
                navigator.clipboard.writeText(html).then(() => alert('Exported! (Selection tools helper removed)'));
            });
        }

        // --- AI Command Bar ---
        const aiInput = document.querySelector('.ai-input');
        if (aiInput) {
            aiInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.handleCommand(aiInput.value);
                    aiInput.value = '';
                }
            });
        }
    },

    // --- Dropping Logic ---
    getDropTarget(el) {
        // Find closest possible container
        // 1. Is it the canvas? Yes.
        // 2. Is it a component? 
        //    If it's a "Container" or "Card" (things that allow nesting), return it.
        //    If it's a "Button" or "Input" (Leaf), return its parent.

        if (el === this.canvas) return this.canvas;

        // Specific checks for container-like classes
        if (el.classList.contains('nexus-container') || el.classList.contains('nexus-card')) {
            return el;
        }

        // Bubbling up
        const component = el.closest('.nexus-component');
        if (component) {
            // Check if this component allows nesting.
            // For simplicity in this version: Cards and Containers allow nesting.
            // Others (Text, Button, Image) do not, so we drop into their parent.
            if (component.classList.contains('nexus-container') || component.classList.contains('nexus-card')) {
                return component;
            } else {
                return component.parentNode;
            }
        }

        return this.canvas;
    },

    clearDropHighlight() {
        // Brute force clear specific outlines used for drag
        const all = this.canvas.querySelectorAll('*');
        all.forEach(el => {
            if (el !== this.selectedElement) el.style.outline = '';
        });
        this.canvas.style.outline = '';
    },

    handleDrop(e) {
        if (!this.draggedType) return;

        const newEl = this.createComponent(this.draggedType);
        const target = this.getDropTarget(e.target);

        if (newEl && target) {
            target.appendChild(newEl);
            this.selectElement(newEl);
            e.stopPropagation();
        }
        this.draggedType = null;
    },

    // --- Resizing Logic ---
    startResize(e, handle) {
        e.stopPropagation();
        this.isResizing = true;
        this.currentHandle = handle;

        const rect = this.selectedElement.getBoundingClientRect();
        this.resizeStart = {
            x: e.clientX,
            y: e.clientY,
            w: rect.width,
            h: rect.height
        };
    },

    handleResizeMove(e) {
        if (!this.isResizing || !this.selectedElement) return;

        const dx = e.clientX - this.resizeStart.x;
        const dy = e.clientY - this.resizeStart.y;

        // Simple resizing (South-East handle logic primarily, others added)
        if (this.currentHandle.classList.contains('handle-se')) {
            this.selectedElement.style.width = (this.resizeStart.w + dx) + 'px';
            this.selectedElement.style.height = (this.resizeStart.h + dy) + 'px';
        }
        else if (this.currentHandle.classList.contains('handle-e')) {
            this.selectedElement.style.width = (this.resizeStart.w + dx) + 'px';
        }
        else if (this.currentHandle.classList.contains('handle-s')) {
            this.selectedElement.style.height = (this.resizeStart.h + dy) + 'px';
        }

        // Sync Inputs Live
        if (this.props.width) this.props.width.value = this.selectedElement.style.width;
        if (this.props.height) this.props.height.value = this.selectedElement.style.height;
    },

    handleResizeEnd(e) {
        this.isResizing = false;
        this.currentHandle = null;
    },

    // --- Selection ---
    selectElement(el) {
        this.deselectAll(); // Clear previous overlay
        this.selectedElement = el;

        // Create Selection Overlay inside the element (or append to it)
        // This is the simplest way to attach handles that move with it
        // We check if it already has one to be safe
        if (!el.querySelector('.selection-box')) {
            const overlay = document.createElement('div');
            overlay.className = 'selection-box';

            // Allow pointer events on itself to be none, but handles have pointer-events:auto
            overlay.innerHTML = `
                <div class="resize-handle handle-nw"></div>
                <div class="resize-handle handle-ne"></div>
                <div class="resize-handle handle-sw"></div>
                <div class="resize-handle handle-se"></div>
                <div class="resize-handle handle-e"></div>
                <div class="resize-handle handle-s"></div>
            `;

            el.appendChild(overlay);
            this.selectionBox = overlay;

            // Bind Handle Events
            overlay.querySelectorAll('.resize-handle').forEach(h => {
                h.addEventListener('mousedown', (e) => this.startResize(e, h));
            });
        }

        // Sync Properties
        this.syncProperties(el);
    },

    deselectAll() {
        if (this.selectedElement && this.selectionBox) {
            this.selectionBox.remove(); // Remove the handles DOM
            this.selectionBox = null;
        }
        this.selectedElement = null;
    },

    syncProperties(el) {
        // ... (Same sync logic as before, abbreviated for brevity)
        const comp = window.getComputedStyle(el);
        const val = (id, v) => { if (this.props[id]) this.props[id].value = v; };

        val('width', el.style.width || comp.width);
        val('height', el.style.height || comp.height);
        val('padding', el.style.padding || comp.padding);
        // ... etc
    },

    updateStyle(prop, val) {
        if (this.selectedElement) this.selectedElement.style[prop] = val;
    },

    // --- Creation ---
    createComponent(type) {
        const el = document.createElement('div');
        el.className = 'nexus-component';

        // Default styling
        el.style.position = 'relative'; // Important for internal handles logic
        el.style.boxSizing = 'border-box'; // Critical for layout

        switch (type) {
            case 'Container':
            case 'Card Basic':
                // Mark as nesting capable
                el.classList.add(type === 'Container' ? 'nexus-container' : 'nexus-card');
                break;
        }

        // Content Population
        if (type === 'Container') {
            el.style.padding = '20px';
            el.style.border = '1px dashed #ccc';
            el.style.display = 'flex';
            el.style.flexDirection = 'column';
            el.style.gap = '16px';
            el.style.minHeight = '100px';
        }
        else if (type === 'Card Basic') {
            el.style.background = '#FFF';
            el.style.borderRadius = '12px';
            el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
            el.style.padding = '24px';
            el.innerHTML = '<h3 contenteditable="true">Card</h3><p contenteditable="true">Details here...</p>';
        }
        else if (type === 'Hero Section') {
            el.classList.add('nexus-container'); // Allow nesting in hero too
            el.style.padding = '80px 20px';
            el.style.textAlign = 'center';
            el.style.background = '#F5F5F7';
            el.innerHTML = '<h1 contenteditable="true">Hero Title</h1>';
        }
        else if (type === 'Button Primary') {
            el.innerHTML = '<button style="pointer-events:none; padding:10px 20px; background:#FF3B30; color:white; border:none; border-radius:99px;">Button</button>';
            el.style.display = 'inline-block';
        }
        else if (type === 'Image Placeholder') {
            el.style.width = '100px';
            el.style.height = '100px';
            el.style.background = '#EEF';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.innerHTML = '<ion-icon name="image"></ion-icon>';
        }
        else if (type === 'Input Field') {
            el.innerHTML = '<input type="text" placeholder="Input..." style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; pointer-events:none;">';
            el.style.width = '100%';
        }
        else if (type === 'Text Block') {
            el.innerText = 'Lorem ipsum text block.';
            el.contentEditable = 'true';
        }

        return el;
    },

    handleCommand(cmd) {
        // (Same keyword mapping)
        let type = '';
        if (cmd.includes('card')) type = 'Card Basic';
        else if (cmd.includes('box')) type = 'Container';
        else if (cmd.includes('btn')) type = 'Button Primary';
        else if (cmd.includes('input')) type = 'Input Field';

        if (type) {
            const newEl = this.createComponent(type);
            this.canvas.appendChild(newEl);
            this.selectElement(newEl);
            this.canvas.scrollTop = this.canvas.scrollHeight;
        }
    },

    initThemes() {
        // Re-inject themes logic from before
        const themes = [
            { name: 'White', val: '#FFFFFF' },
            { name: 'Light', val: '#F5F5F7' },
            { name: 'Dark', val: '#1D1D1F' },
            { name: 'Black', val: '#000000' },
            { name: 'Sunset', val: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%)' },
            { name: 'Ocean', val: 'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)' },
            { name: 'Royal', val: 'linear-gradient(to right, #6a11cb 0%, #2575fc 100%)' },
            { name: 'Fire', val: 'linear-gradient(135deg, #ff512f 0%, #dd2476 100%)' },
        ];
        if (!this.themeGrid) return;
        this.themeGrid.innerHTML = ''; // Clear prev
        themes.forEach(t => {
            const d = document.createElement('div');
            d.className = 'theme-swatch';
            d.style.background = t.val;
            d.title = t.name;
            d.onclick = () => {
                if (this.selectedElement) {
                    this.selectedElement.style.background = t.val;
                    if (t.name === 'Dark' || t.name === 'Black' || t.name === 'Royal') this.selectedElement.style.color = '#FFF';
                    else this.selectedElement.style.color = '#000';
                }
            }
            this.themeGrid.appendChild(d);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Nexus.init();
});
