/**
 * Nexus Builder Core Logic
 * Handles Drag & Drop, Selection, Property Editing, and AI Commands
 */

const Nexus = {
    selectedElement: null,
    draggedType: null,
    clipboard: null, // For duplication

    init() {
        this.cacheDOM();
        this.bindEvents();
        console.log("Nexus Builder 2.0 Initialized // Momentum Theme");
    },

    cacheDOM() {
        this.canvas = document.getElementById('artboard');
        this.inspector = document.getElementById('inspector');

        // Property Inputs - using IDs now for robustness
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
        // --- Drag & Drop ---
        document.querySelectorAll('.component-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                this.draggedType = item.getAttribute('data-type');
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('text/plain', this.draggedType);
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
            e.stopPropagation();
            if (e.target === this.canvas) {
                this.deselectAll();
            } else {
                // Find closest component or select target if it is one
                // Simplified: select direct target
                this.selectElement(e.target);
            }
        });

        // --- Property Binding (Generic) ---
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

        // Color Inputs
        if (this.props.color) this.props.color.addEventListener('input', (e) => this.updateStyle('color', e.target.value));
        if (this.props.bgColor) this.props.bgColor.addEventListener('input', (e) => this.updateStyle('backgroundColor', e.target.value));

        // Shadow Select
        if (this.props.shadow) {
            this.props.shadow.addEventListener('change', (e) => {
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

        // --- Actions ---
        if (this.actions.duplicate) {
            this.actions.duplicate.addEventListener('click', () => {
                if (this.selectedElement) {
                    const clone = this.selectedElement.cloneNode(true);
                    this.selectedElement.parentNode.insertBefore(clone, this.selectedElement.nextSibling);
                    this.selectElement(clone);
                }
            });
        }

        if (this.actions.delete) {
            this.actions.delete.addEventListener('click', () => {
                if (this.selectedElement) {
                    this.selectedElement.remove();
                    this.deselectAll();
                }
            });
        }

        // Alignment Buttons
        this.actions.alignBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const align = btn.getAttribute('data-align');
                this.updateStyle('textAlign', align);
                // Visual toggle
                this.actions.alignBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // --- Keyboard Shortcuts ---
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedElement) {
                // Don't delete if editing text
                if (!this.selectedElement.isContentEditable) {
                    this.selectedElement.remove();
                    this.deselectAll();
                }
            }
        });

        // --- Command Bar ---
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
        if (aiBtn) aiBtn.addEventListener('click', runCommand);

        // Export
        const btnExport = document.getElementById('btn-export');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                const html = this.canvas.innerHTML;
                navigator.clipboard.writeText(html).then(() => {
                    alert('HTML Copied to Clipboard!');
                });
            });
        }

        // Preview
        const btnPreview = document.querySelector('.btn-ghost ion-icon[name="eye-outline"]').parentElement;
        if (btnPreview) {
            btnPreview.addEventListener('click', () => {
                document.body.classList.toggle('preview-mode');
                if (document.body.classList.contains('preview-mode')) {
                    document.querySelector('.sidebar').style.display = 'none';
                    document.querySelector('.properties').style.display = 'none';
                    document.querySelector('header').style.display = 'none';
                    document.querySelector('.bg-grid').style.opacity = '0';
                    this.canvas.style.width = '100%';
                    this.canvas.style.height = '100%';
                    this.canvas.style.boxShadow = 'none';
                    // Re-add exit button/logic
                    const exitBtn = document.createElement('button');
                    exitBtn.innerText = 'Exit Preview';
                    exitBtn.className = 'exit-preview-btn';
                    exitBtn.style.position = 'fixed';
                    exitBtn.style.bottom = '20px';
                    exitBtn.style.right = '20px';
                    exitBtn.style.zIndex = '999';
                    exitBtn.style.padding = '10px 20px';
                    exitBtn.style.background = '#000';
                    exitBtn.style.color = '#fff';
                    exitBtn.style.border = 'none';
                    exitBtn.style.borderRadius = '99px';
                    exitBtn.style.cursor = 'pointer';
                    exitBtn.onclick = () => window.location.reload(); // Simple reset for now
                    document.body.appendChild(exitBtn);
                }
            });
        }
    },

    handleDrop(e) {
        if (this.draggedType) {
            const newEl = this.createComponent(this.draggedType);
            // Drop specific logic (append to target if container?)
            // For now, always append to canvas root or nearest container if dropped inside one
            let target = e.target;
            if (target === this.canvas || target.classList.contains('nexus-container')) {
                // Good to drop
            } else {
                target = this.canvas;
            }

            if (newEl) {
                target.appendChild(newEl);
                this.selectElement(newEl);
            }
            this.draggedType = null;
        }
    },

    handleCommand(cmd) {
        let type = null;
        if (cmd.includes('card')) type = 'Card Basic';
        else if (cmd.includes('btn') || cmd.includes('button')) type = 'Button Primary';
        else if (cmd.includes('hero')) type = 'Hero Section';
        else if (cmd.includes('text')) type = 'Text Block';
        else if (cmd.includes('input') || cmd.includes('form')) type = 'Input Field';
        else if (cmd.includes('image') || cmd.includes('pic')) type = 'Image Placeholder';
        else if (cmd.includes('box') || cmd.includes('container')) type = 'Container';

        if (type) {
            const newEl = this.createComponent(type);
            this.canvas.appendChild(newEl);
            this.selectElement(newEl);
            this.canvas.scrollTop = this.canvas.scrollHeight;
        } else {
            alert(`Unknown command: "${cmd}"`);
        }
    },

    createComponent(type) {
        const el = document.createElement('div');
        el.className = 'nexus-component';
        el.style.position = 'relative';
        el.style.transition = 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)';
        el.style.cursor = 'pointer';

        switch (type) {
            case 'Container':
                el.className += ' nexus-container';
                el.style.padding = '20px';
                el.style.border = '1px dashed #ccc';
                el.style.backgroundColor = 'transparent';
                el.style.minHeight = '100px';
                el.style.display = 'flex';
                el.style.flexDirection = 'column';
                el.style.gap = '10px';
                el.innerHTML = '<span style="font-size:10px; color:#999; pointer-events:none; user-select:none;">Container</span>';
                return el;

            case 'Card Basic':
                el.innerHTML = '<h3 contenteditable="true" style="margin-bottom:8px;">Title</h3><p contenteditable="true">Content goes here.</p>';
                el.style.padding = '20px';
                el.style.background = '#FFFFFF';
                el.style.borderRadius = '12px';
                el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                el.style.border = '1px solid #EAEAEA';
                return el;

            case 'Button Primary':
                el.style.display = 'inline-block';
                el.style.padding = '12px 24px';
                el.style.backgroundColor = '#FF3B30';
                el.style.color = '#FFF';
                el.style.borderRadius = '99px';
                el.style.fontWeight = '600';
                el.innerText = 'Button';
                el.contentEditable = 'true';
                el.style.textAlign = 'center';
                return el;

            case 'Text Block':
                el.innerText = 'Lorem ipsum dolor sit amet.';
                el.style.fontSize = '16px';
                el.style.lineHeight = '1.6';
                el.contentEditable = 'true';
                el.style.padding = '8px';
                return el;

            case 'Hero Section':
                el.innerHTML = '<h1 contenteditable="true" style="font-size:32px; font-weight:800; margin-bottom:16px;">Hero Title</h1><p contenteditable="true">Subtitle text.</p>';
                el.style.padding = '60px 20px';
                el.style.textAlign = 'center';
                el.style.backgroundColor = '#F5F5F7';
                return el;

            case 'Image Placeholder':
                el.style.width = '100%';
                el.style.height = '200px';
                el.style.backgroundColor = '#E0E0E0';
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
                el.style.borderRadius = '8px';
                el.innerHTML = '<ion-icon name="image" style="font-size:48px; color:#999;"></ion-icon>';
                return el;

            case 'Input Field':
                const inp = document.createElement('input');
                inp.type = 'text';
                inp.placeholder = 'Enter text...';
                inp.style.width = '100%';
                inp.style.padding = '10px 12px';
                inp.style.border = '1px solid #ddd';
                inp.style.borderRadius = '6px';
                inp.style.pointerEvents = 'none'; // So we can select the wrapper
                el.appendChild(inp);
                el.style.padding = '4px';
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
        if (el === this.canvas) return;

        this.selectedElement.style.outline = '2px solid #FF3B30';

        // Sync Inputs
        const comp = window.getComputedStyle(el);
        const set = (input, val) => { if (input) input.value = val; };

        // Best effort property parsing
        set(this.props.width, el.style.width || comp.width);
        set(this.props.height, el.style.height || comp.height);
        set(this.props.padding, el.style.padding || comp.padding);
        set(this.props.margin, el.style.margin || comp.margin);
        set(this.props.fontSize, parseInt(comp.fontSize));
        set(this.props.radius, el.style.borderRadius || comp.borderRadius);
        set(this.props.border, el.style.border !== '0px none rgb(0, 0, 0)' ? el.style.border : ''); // simplify

        // Colors (rgb to hex is tricky without lib, keeping native input behavior which might fail on rgb strings)
        // Ignoring color sync for this prototype step to avoid complexity, 
        // focus is on setting new values which works fine.
    },

    updateStyle(prop, val) {
        if (this.selectedElement) {
            this.selectedElement.style[prop] = val;
        }
    },

    deselectAll() {
        if (this.selectedElement) {
            this.selectedElement.style.outline = 'none';
            this.selectedElement = null;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Nexus.init();
});
