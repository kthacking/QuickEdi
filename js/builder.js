/**
 * Nexus Builder Core Logic
 * Handles Drag & Drop, Selection, and Property Editing
 */

const Nexus = {
    selectedElement: null,
    draggedType: null,

    init() {
        this.cacheDOM();
        this.bindEvents();
        console.log("Nexus Builder Initialized // Momentum Theme");
    },

    cacheDOM() {
        this.canvas = document.querySelector('.artboard');
        this.propInputs = {
            width: document.querySelector('input[placeholder="W"]'),
            height: document.querySelector('input[placeholder="H"]'),
            color: document.querySelector('input[type="color"]'),
            text: document.querySelector('input[placeholder="Content"]'), // I might need to add this to HTML
            radius: document.querySelector('input[placeholder="Radius (px)"]'),
            bgColor: document.querySelectorAll('input[type="color"]')[1] // The second color input for background
        };
    },

    bindEvents() {
        // Drag & Drop
        document.querySelectorAll('.component-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                this.draggedType = e.target.querySelector('.comp-name').innerText;
                e.dataTransfer.effectAllowed = 'copy';
            });
        });

        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessary for drop to fire
            e.dataTransfer.dropEffect = 'copy';
            this.canvas.style.boxShadow = '0 0 0 4px rgba(255, 59, 48, 0.2)'; // Visual cue
        });

        this.canvas.addEventListener('dragleave', () => {
            this.canvas.style.boxShadow = ''; // Reset
        });

        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            this.canvas.style.boxShadow = '';
            this.handleDrop(e);
        });

        // Selection
        this.canvas.addEventListener('click', (e) => {
            if (e.target !== this.canvas) {
                e.stopPropagation();
                this.selectElement(e.target);
            } else {
                this.deselectAll();
            }
        });

        // Property Editing
        // We'll attach generic listeners for now
        if (this.propInputs.width) this.propInputs.width.addEventListener('input', (e) => this.updateStyle('width', e.target.value));
        if (this.propInputs.height) this.propInputs.height.addEventListener('input', (e) => this.updateStyle('height', e.target.value));
        if (this.propInputs.bgColor) this.propInputs.bgColor.addEventListener('input', (e) => this.updateStyle('backgroundColor', e.target.value));
        if (this.propInputs.radius) this.propInputs.radius.addEventListener('input', (e) => this.updateStyle('borderRadius', e.target.value));

        // Export Feature
        const btnExport = document.getElementById('btn-export');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                const html = this.canvas.innerHTML;
                navigator.clipboard.writeText(html).then(() => {
                    alert('Full HTML copied to clipboard!');
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                    alert('Failed to copy code. Check console.');
                });
            });
        }

        // AI Input Mock
        const aiInput = document.querySelector('.ai-input');
        if (aiInput) {
            aiInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.mockAIGeneration(aiInput.value);
                    aiInput.value = '';
                }
            });
        }
    },

    handleDrop(e) {
        // Calculate drop position relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newEl = this.createComponent(this.draggedType);
        if (newEl) {
            // style it
            newEl.style.position = 'relative'; // or absolute if we want freeform
            // For this version, let's just append to flow to be beginner friendly, 
            // unless we want absolute positioning.
            // Let's stick to flow for now, but maybe later add absolute.

            this.canvas.appendChild(newEl);
            this.selectElement(newEl);
        }
    },

    createComponent(type) {
        const el = document.createElement('div');
        el.style.padding = '20px';
        el.style.marginBottom = '10px';
        el.style.border = '1px solid transparent';
        el.style.transition = 'all 0.2s';
        el.style.cursor = 'default';

        switch (type) {
            case 'Card Basic':
                el.innerHTML = '<h3>Card Title</h3><p>Nice little content here.</p>';
                el.style.background = '#FFFFFF';
                el.style.borderRadius = '12px';
                el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                el.style.border = '1px solid #EAEAEA';
                return el;
            case 'Button Primary':
                const btn = document.createElement('button');
                btn.innerText = 'Click Me';
                btn.style.padding = '12px 24px';
                btn.style.background = 'var(--color-accent)'; // Red
                btn.style.color = '#FFF';
                btn.style.border = 'none';
                btn.style.borderRadius = '99px';
                return btn;
            case 'Text Block':
                el.innerText = 'Editable text block. Double click to change me.';
                el.style.fontSize = '16px';
                el.contentEditable = 'true';
                return el;
            case 'Hero Section':
                el.innerHTML = '<h1 style="font-size:32px; font-weight:800;">Big Hero Title</h1><p>Subtitle goes here</p>';
                el.style.padding = '60px 20px';
                el.style.textAlign = 'center';
                el.style.background = '#F9F9F9';
                el.style.borderRadius = '8px';
                return el;
            default:
                return null;
        }
    },

    selectElement(el) {
        // Remove previous selection styles
        if (this.selectedElement) {
            this.selectedElement.style.outline = 'none';
        }

        this.selectedElement = el;
        // Visual indicator
        this.selectedElement.style.outline = '2px solid var(--color-accent)';

        // Sync properties to sidebar (Basic mapping)
        // In a real app, this finds computed styles
        // this.propInputs.width.value = el.style.width;
        // this.propInputs.radius.value = el.style.borderRadius;
    },

    deselectAll() {
        if (this.selectedElement) {
            this.selectedElement.style.outline = 'none';
            this.selectedElement = null;
        }
    },

    updateStyle(prop, value) {
        if (this.selectedElement) {
            this.selectedElement.style[prop] = value;
        }
    },

    mockAIGeneration(prompt) {
        // Simulates AI thinking
        const aiBtn = document.querySelector('.ai-btn');
        const originalIcon = aiBtn.innerHTML;
        aiBtn.innerHTML = '<ion-icon name="sync" class="spin"></ion-icon>'; // Need to add spin animation class

        setTimeout(() => {
            const el = this.createComponent('Card Basic');
            el.innerHTML = `<h3>Generated: ${prompt}</h3><p>AI created this based on your input.</p>`;
            this.canvas.appendChild(el);
            this.selectElement(el);
            aiBtn.innerHTML = originalIcon;
        }, 1500);
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    Nexus.init();
});
