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
            // We need to be more specific with selectors or IDs in HTML, but for now using index or robust query
            // Assuming the order based on HTML structure:
            // Typography Size:
            fontSize: document.querySelector('.prop-group:nth-of-type(2) input[type="number"]'),
            // Typography Color:
            color: document.querySelector('.prop-group:nth-of-type(2) input[type="color"]'),
            // Background Color:
            bgColor: document.querySelector('.prop-group:nth-of-type(3) input[type="color"]'),
            // Radius:
            radius: document.querySelector('input[placeholder="Radius (px)"]'),
            // Shadow (Select):
            shadow: document.querySelector('.prop-group:nth-of-type(4) select')
        };
    },

    bindEvents() {
        // --- Drag & Drop ---
        document.querySelectorAll('.component-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                this.draggedType = e.target.querySelector('.comp-name').innerText;
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('text/plain', this.draggedType); // For firefox
            });
        });

        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            this.canvas.style.boxShadow = '0 0 0 4px rgba(255, 59, 48, 0.2)';
        });

        this.canvas.addEventListener('dragleave', () => {
            this.canvas.style.boxShadow = '';
        });

        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            this.canvas.style.boxShadow = '';
            this.handleDrop(e);
        });

        // --- Selection ---
        this.canvas.addEventListener('click', (e) => {
            // Traverse up to find draggable wrapper if clicked on child
            let target = e.target;

            // Don't select the artboard itself as a component
            if (target === this.canvas) {
                this.deselectAll();
                return;
            }

            // In our simple model, direct children of artboard are components.
            // If we have nested structures, we might need closest('.component') logic.
            // For now, let's assume direct children or prevent bubbling from children.
            e.stopPropagation();
            this.selectElement(target);
        });

        // --- Properties (Two-way Binding) ---
        // Helper to bind input to style
        const bindProp = (input, styleProp, unit = '') => {
            if (!input) return;
            input.addEventListener('input', (e) => {
                if (this.selectedElement) {
                    this.selectedElement.style[styleProp] = e.target.value + unit;
                }
            });
        };

        bindProp(this.propInputs.width, 'width');
        bindProp(this.propInputs.height, 'height');
        bindProp(this.propInputs.fontSize, 'fontSize', 'px');
        bindProp(this.propInputs.radius, 'borderRadius');

        // Colors don't need units
        if (this.propInputs.color) {
            this.propInputs.color.addEventListener('input', (e) => {
                if (this.selectedElement) this.selectedElement.style.color = e.target.value;
            });
        }
        if (this.propInputs.bgColor) {
            this.propInputs.bgColor.addEventListener('input', (e) => {
                if (this.selectedElement) this.selectedElement.style.backgroundColor = e.target.value;
            });
        }

        // Shadow Select
        if (this.propInputs.shadow) {
            this.propInputs.shadow.addEventListener('change', (e) => {
                if (!this.selectedElement) return;
                const val = e.target.value;
                switch (val) {
                    case 'None': this.selectedElement.style.boxShadow = 'none'; break;
                    case 'Soft': this.selectedElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; break;
                    case 'Medium': this.selectedElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; break;
                    case 'Float': this.selectedElement.style.boxShadow = '0 12px 24px -5px rgba(0,0,0,0.15)'; break;
                }
            });
        }

        // --- Quick Insert "AI" Bar ---
        const aiInput = document.querySelector('.ai-input');
        const aiBtn = document.querySelector('.ai-btn');

        const runCommand = () => {
            const cmd = aiInput.value.toLowerCase().trim();
            if (!cmd) return;
            this.handleCommand(cmd);
            aiInput.value = '';
        };

        if (aiInput) {
            aiInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') runCommand();
            });
        }
        if (aiBtn) {
            aiBtn.addEventListener('click', runCommand);
        }

        // Export
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
    },

    handleDrop(e) {
        // We do simple append for now. 
        // Improvement: Insert at closest index? (Skipped for simplicity, sticking to append)
        if (this.draggedType) {
            const newEl = this.createComponent(this.draggedType);
            if (newEl) {
                this.canvas.appendChild(newEl);
                this.selectElement(newEl);
            }
            this.draggedType = null;
        }
    },

    // "AI" / Command Logic
    handleCommand(cmd) {
        // Button State
        const aiBtn = document.querySelector('.ai-btn'); // Refresh ref
        const originalIcon = aiBtn.innerHTML;
        aiBtn.innerHTML = '<ion-icon name="flash" class="spin"></ion-icon>'; // Flash icon for action

        setTimeout(() => {
            let type = null;
            // Simple NLP (Keyword matching)
            if (cmd.includes('card')) type = 'Card Basic';
            else if (cmd.includes('btn') || cmd.includes('button')) type = 'Button Primary';
            else if (cmd.includes('hero') || cmd.includes('header')) type = 'Hero Section';
            else if (cmd.includes('text') || cmd.includes('paragraph')) type = 'Text Block';

            if (type) {
                const newEl = this.createComponent(type);
                this.canvas.appendChild(newEl);
                this.selectElement(newEl);
                // Optional: Scroll to bottom
                this.canvas.scrollTop = this.canvas.scrollHeight;
            } else {
                alert(`Nexus AI: I don't know how to build "${cmd}" yet. Try "card", "button", or "hero".`);
            }
            aiBtn.innerHTML = originalIcon;
        }, 600); // Small delay for "processing" feel
    },

    createComponent(type) {
        const el = document.createElement('div');
        el.className = 'nexus-component'; // Class marker
        el.style.padding = '20px';
        el.style.marginBottom = '16px';
        el.style.transition = 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)';
        el.style.cursor = 'pointer'; // Clickable
        el.style.position = 'relative';

        switch (type) {
            case 'Card Basic':
                el.innerHTML = '<h3 contenteditable="true" style="margin-bottom:8px;">Card Title</h3><p contenteditable="true">We make progress by building, not waiting.</p>';
                el.style.background = '#FFFFFF';
                el.style.borderRadius = '12px';
                el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                el.style.border = '1px solid #EAEAEA';
                return el;
            case 'Button Primary':
                // Wrapper for alignment
                el.style.padding = '10px';
                el.style.display = 'flex';
                el.style.justifyContent = 'flex-start';
                el.style.background = 'transparent';
                el.innerHTML = '<button style="pointer-events:none; padding: 12px 24px; background: #FF3B30; color: white; border: none; border-radius: 99px; font-weight: 600;">Click Action</button>';
                // Pointer events none on inner button so we select the wrapper div
                return el;
            case 'Text Block':
                el.innerText = 'Start typing your content here...';
                el.style.fontSize = '16px';
                el.style.lineHeight = '1.6';
                el.style.color = '#333';
                el.contentEditable = 'true';
                el.style.outline = 'none'; // handled by selection wrapper
                el.style.border = '1px dashed transparent';
                el.onfocus = () => { el.style.border = '1px dashed #ccc'; };
                el.onblur = () => { el.style.border = '1px dashed transparent'; };
                return el;
            case 'Hero Section':
                el.innerHTML = '<h1 contenteditable="true" style="font-size:32px; font-weight:800; margin-bottom:16px;">The Future is Now</h1><p contenteditable="true" style="font-size:18px; color:#666;">Create something undefined.</p>';
                el.style.padding = '80px 40px';
                el.style.textAlign = 'center';
                el.style.background = '#F5F5F7';
                el.style.borderRadius = '16px';
                return el;
            default:
                return null;
        }
    },

    selectElement(el) {
        if (this.selectedElement) {
            this.selectedElement.style.outline = 'none';
        }

        this.selectedElement = el;
        // Visual indicator
        this.selectedElement.style.outline = '2px solid #FF3B30';
        this.selectedElement.style.outlineOffset = '2px';

        // SYNC PROPERTIES TO SIDEBAR (Read computed styles)
        const computed = window.getComputedStyle(el);

        // Helper to value or default
        const setVal = (input, val) => { if (input) input.value = val; };

        // Convert rgb to hex for color inputs is complex, so we skip exact color syncing for now
        // or just try best effort if it's already hex/named (but computed returns rgb usually).
        // For '100% working' feeling, updating text inputs is most critical.

        setVal(this.propInputs.width, el.style.width.replace('px', '') || computed.width.replace('px', ''));
        setVal(this.propInputs.height, el.style.height.replace('px', '') || computed.height.replace('px', ''));
        setVal(this.propInputs.radius, el.style.borderRadius.replace('px', '') || computed.borderRadius.replace('px', ''));
        setVal(this.propInputs.fontSize, computed.fontSize.replace('px', ''));

        // We can try to sync color if simple, otherwise keep it decoupled to avoid crashing logic
    },

    deselectAll() {
        if (this.selectedElement) {
            this.selectedElement.style.outline = 'none';
            this.selectedElement = null;
        }
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    Nexus.init();
});
