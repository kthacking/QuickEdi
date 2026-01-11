/**
 * Nexus Builder Core Logic
 * Version 3.4: Typography Suite + Flexbox + Auto-Save
 */

const Nexus = {
    selectedElement: null,
    draggedType: null,
    selectionBox: null,
    isResizing: false,
    isMoving: false,

    resizeStart: { x: 0, y: 0, w: 0, h: 0 },
    moveStart: { mouseX: 0, mouseY: 0, elemLeft: 0, elemTop: 0 },
    currentHandle: null,

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.initThemes();
        console.log("Nexus Builder 3.4 Initialized // Typography Suite");
    },

    // --- Persistence ---
    saveState() {
        if (!this.canvas) return;
        localStorage.setItem('nexus_content', this.canvas.innerHTML);
    },

    loadState() {
        const content = localStorage.getItem('nexus_content');
        if (content) {
            this.canvas.innerHTML = content;
            const selection = this.canvas.querySelector('.selection-box');
            if (selection) selection.remove();
        }
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

            // Typography (Extended)
            fontFamily: document.getElementById('prop-font-family'),
            fontWeight: document.getElementById('prop-font-weight'),
            fontSize: document.getElementById('prop-fontsize'),
            color: document.getElementById('prop-color'),
            textTransform: document.getElementById('prop-transform'),
            lineHeight: document.getElementById('prop-line-height'),
            letterSpacing: document.getElementById('prop-letter-spacing'),

            bgColor: document.getElementById('prop-bg'),
            radius: document.getElementById('prop-radius'),
            border: document.getElementById('prop-border'),
            shadow: document.getElementById('prop-shadow'),
            opacity: document.getElementById('prop-opacity'),
            // Position
            position: document.getElementById('prop-position'),
            float: document.getElementById('prop-float'),
            top: document.getElementById('prop-top'),
            left: document.getElementById('prop-left'),
            right: document.getElementById('prop-right'),
            bottom: document.getElementById('prop-bottom'),
            zIndex: document.getElementById('prop-zindex'),
            // Flex 
            flexDir: document.getElementById('prop-flex-dir'),
            flexWrap: document.getElementById('prop-flex-wrap'),
            justify: document.getElementById('prop-justify'),
            align: document.getElementById('prop-align'),
            gap: document.getElementById('prop-gap')
        };

        this.flexGroup = document.getElementById('flex-controls');

        // Actions
        this.actions = {
            duplicate: document.getElementById('action-duplicate'),
            delete: document.getElementById('action-delete'),
            alignBtns: {
                left: document.getElementById('align-left'),
                center: document.getElementById('align-center'),
                right: document.getElementById('align-right')
            },
            styleBtns: {
                italic: document.getElementById('style-italic'),
                underline: document.getElementById('style-underline')
            }
        };
    },

    bindEvents() {
        this.loadState();

        // Sidebar Toggle
        const toggleBtn = document.getElementById('btn-toggle-lib');
        const sidebar = document.getElementById('sidebar-library');
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
            });
        }

        // Drag & Drop (Sidebar)
        document.querySelectorAll('.component-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                this.draggedType = item.getAttribute('data-type');
                e.dataTransfer.effectAllowed = 'copy';
                e.stopPropagation();
            });
        });

        // Drag & Drop (Canvas)
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            this.clearDropHighlight();
            const target = this.getDropTarget(e.target);
            if (target) {
                target.style.outline = '2px dashed #FF3B30';
                target.style.outlineOffset = '-2px';
            }
        });

        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            this.clearDropHighlight();
            this.handleDrop(e);
            this.saveState();
        });

        // Selection
        this.canvas.addEventListener('click', (e) => {
            if (this.isResizing || this.isMoving) return;
            e.stopPropagation();
            const target = e.target.closest('.nexus-component');
            if (target) {
                this.selectElement(target);
            } else {
                this.deselectAll();
            }
        });

        // Global Mouse
        document.addEventListener('mousemove', (e) => this.handleResizeMove(e));
        document.addEventListener('mouseup', (e) => {
            if (this.isMoving || this.isResizing) {
                this.saveState();
            }
            this.handleResizeEnd(e);
        });

        // Property Binding Helper
        const bind = (input, styleProp, unit = '') => {
            if (!input) return;
            input.addEventListener('input', (e) => {
                if (this.selectedElement) {
                    this.selectedElement.style[styleProp] = e.target.value + unit;
                    this.saveState();
                }
            });
        };

        const bindUpdate = (input, prop) => {
            if (input) input.addEventListener('input', (e) => {
                this.updateStyle(prop, e.target.value);
                this.saveState();
            });
        };

        // Dimensions
        bind(this.props.width, 'width');
        bind(this.props.height, 'height');
        bind(this.props.padding, 'padding');
        bind(this.props.margin, 'margin');
        bind(this.props.border, 'border');
        bind(this.props.radius, 'borderRadius');

        // Typography
        bind(this.props.fontSize, 'fontSize', 'px');
        bindUpdate(this.props.fontFamily, 'fontFamily');
        bindUpdate(this.props.fontWeight, 'fontWeight');
        bindUpdate(this.props.textTransform, 'textTransform');
        bind(this.props.lineHeight, 'lineHeight');
        bind(this.props.letterSpacing, 'letterSpacing', 'px');

        // Position
        bind(this.props.gap, 'gap');
        bind(this.props.top, 'top');
        bind(this.props.left, 'left');
        bind(this.props.right, 'right');
        bind(this.props.bottom, 'bottom');
        bind(this.props.zIndex, 'zIndex');

        // Styles
        bindUpdate(this.props.bgColor, 'backgroundColor');
        // Custom Color Bind
        if (this.props.color) {
            this.props.color.addEventListener('input', (e) => {
                if (this.selectedElement) {
                    const btn = this.selectedElement.querySelector('button');
                    (btn || this.selectedElement).style.color = e.target.value;
                    this.saveState();
                }
            });
        }

        bindUpdate(this.props.opacity, 'opacity');
        bindUpdate(this.props.position, 'position');
        bindUpdate(this.props.float, 'float');
        bindUpdate(this.props.shadow, 'boxShadow');

        // Flex
        bindUpdate(this.props.flexDir, 'flexDirection');
        bindUpdate(this.props.flexWrap, 'flexWrap');
        bindUpdate(this.props.justify, 'justifyContent');
        bindUpdate(this.props.align, 'alignItems');

        // Typography Actions
        const toggleStyle = (prop, valOn, valOff) => {
            if (this.selectedElement) {
                const current = this.selectedElement.style[prop];
                this.selectedElement.style[prop] = (current === valOn) ? valOff : valOn;
                this.saveState();
            }
        };

        if (this.actions.styleBtns.italic) {
            this.actions.styleBtns.italic.onclick = () => toggleStyle('fontStyle', 'italic', 'normal');
        }
        if (this.actions.styleBtns.underline) {
            this.actions.styleBtns.underline.onclick = () => toggleStyle('textDecoration', 'underline', 'none');
        }

        ['left', 'center', 'right'].forEach(align => {
            if (this.actions.alignBtns[align]) {
                this.actions.alignBtns[align].onclick = () => {
                    if (this.selectedElement) {
                        this.selectedElement.style.textAlign = align;
                        this.saveState();
                    }
                }
            }
        });

        // Content Save
        this.canvas.addEventListener('input', () => this.saveState());

        // Actions
        if (this.actions.duplicate) {
            this.actions.duplicate.addEventListener('click', () => {
                if (this.selectedElement) {
                    const clone = this.selectedElement.cloneNode(true);
                    if (this.selectedElement.parentNode) {
                        this.selectedElement.parentNode.insertBefore(clone, this.selectedElement.nextSibling);
                        this.selectElement(clone);
                        this.saveState();
                    }
                }
            });
        }

        if (this.actions.delete) {
            this.actions.delete.addEventListener('click', () => {
                this.deleteSelected();
                this.saveState();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete') {
                const active = document.activeElement;
                const isEditingText = active.isContentEditable || (this.selectedElement && this.selectedElement.isContentEditable);
                if (this.selectedElement && !isEditingText) {
                    this.deleteSelected();
                    this.saveState();
                }
            }
        });

        const btnExport = document.getElementById('btn-export');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                this.deselectAll();
                const html = this.canvas.innerHTML;
                navigator.clipboard.writeText(html).then(() => alert('Exported!'));
            });
        }

        const btnPreview = document.getElementById('btn-preview');
        if (btnPreview) {
            btnPreview.addEventListener('click', () => {
                document.body.classList.toggle('preview-mode');

                if (document.body.classList.contains('preview-mode')) {
                    this.deselectAll();
                    if (document.querySelector('.preview-bar')) return;

                    // Create Toolbar
                    const bar = document.createElement('div');
                    bar.className = 'preview-bar';

                    // Exit Button
                    const exitBtn = document.createElement('button');
                    exitBtn.className = 'btn-exit';
                    exitBtn.innerText = 'Exit Preview';
                    exitBtn.onclick = () => {
                        document.body.classList.remove('preview-mode');
                        document.body.classList.remove('view-only'); // Ensure cleanup
                        // Restore editable state
                        this.canvas.querySelectorAll('[contenteditable]').forEach(el => el.contentEditable = 'true');
                        bar.remove();
                    };

                    // Toggle Switch
                    const toggleWrapper = document.createElement('label');
                    toggleWrapper.className = 'toggle-wrapper';
                    toggleWrapper.innerHTML = `
                        <input type="checkbox" checked id="preview-edit-toggle">
                        <div class="toggle-switch"></div>
                        <span id="label-mode">Edit Mode</span>
                    `;

                    // Toggle Logic
                    const checkbox = toggleWrapper.querySelector('input');
                    const label = toggleWrapper.querySelector('span');

                    checkbox.onchange = (e) => {
                        const isEditable = e.target.checked;
                        label.innerText = isEditable ? 'Edit Mode' : 'View Only';

                        if (isEditable) {
                            document.body.classList.remove('view-only');
                            this.canvas.querySelectorAll('*').forEach(el => {
                                // Restore simple content editable logic if it was text
                                if (el.tagName === 'H1' || el.tagName === 'H3' || el.tagName === 'P' || el.tagName === 'BUTTON' || el.innerText.length > 0) {
                                    // Basic heuristic to restore editable
                                    if (!el.classList.contains('nexus-component')) el.contentEditable = 'true';
                                }
                            });
                            // Re-apply to known editable types
                            this.canvas.querySelectorAll('.nexus-component h1, .nexus-component h3, .nexus-component p, .nexus-component button').forEach(el => el.contentEditable = 'true');
                        } else {
                            document.body.classList.add('view-only');
                            this.canvas.querySelectorAll('[contenteditable]').forEach(el => el.contentEditable = 'false');
                        }
                    };

                    bar.appendChild(toggleWrapper);
                    bar.appendChild(exitBtn);
                    document.body.appendChild(bar);
                }
            });
        }

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

    getDropTarget(el) {
        if (el === this.canvas) return this.canvas;
        if (el.classList.contains('nexus-container') || el.classList.contains('nexus-card')) return el;
        const component = el.closest('.nexus-component');
        if (component) {
            if (component.classList.contains('nexus-container') || component.classList.contains('nexus-card')) {
                return component;
            }
            return component.parentNode;
        }
        return this.canvas;
    },

    clearDropHighlight() {
        const all = this.canvas.querySelectorAll('*');
        all.forEach(el => { if (el !== this.selectedElement) el.style.outline = ''; });
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

    startResize(e, handle) {
        e.stopPropagation();
        this.isResizing = true;
        this.currentHandle = handle;
        const rect = this.selectedElement.getBoundingClientRect();
        this.resizeStart = { x: e.clientX, y: e.clientY, w: rect.width, h: rect.height };
    },

    startMove(e) {
        if (!this.selectedElement) return;
        this.isMoving = true;

        const style = window.getComputedStyle(this.selectedElement);
        if (style.position === 'static') {
            const rect = this.selectedElement.getBoundingClientRect();
            this.selectedElement.style.left = this.selectedElement.offsetLeft + 'px';
            this.selectedElement.style.top = this.selectedElement.offsetTop + 'px';
            this.selectedElement.style.position = 'absolute';
            if (this.props.position) this.props.position.value = 'absolute';
        }

        const rect = this.selectedElement.getBoundingClientRect();
        this.moveStart = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            elemLeft: this.selectedElement.offsetLeft,
            elemTop: this.selectedElement.offsetTop
        };
    },

    handleResizeMove(e) {
        if (this.isResizing && this.selectedElement) {
            const dx = e.clientX - this.resizeStart.x;
            const dy = e.clientY - this.resizeStart.y;
            if (this.currentHandle.classList.contains('handle-se')) {
                this.selectedElement.style.width = (this.resizeStart.w + dx) + 'px';
                this.selectedElement.style.height = (this.resizeStart.h + dy) + 'px';
            } else if (this.currentHandle.classList.contains('handle-e')) {
                this.selectedElement.style.width = (this.resizeStart.w + dx) + 'px';
            } else if (this.currentHandle.classList.contains('handle-s')) {
                this.selectedElement.style.height = (this.resizeStart.h + dy) + 'px';
            }
            if (this.props.width) this.props.width.value = this.selectedElement.style.width;
            if (this.props.height) this.props.height.value = this.selectedElement.style.height;
            return;
        }

        if (this.isMoving && this.selectedElement) {
            const dx = e.clientX - this.moveStart.mouseX;
            const dy = e.clientY - this.moveStart.mouseY;
            this.selectedElement.style.left = (this.moveStart.elemLeft + dx) + 'px';
            this.selectedElement.style.top = (this.moveStart.elemTop + dy) + 'px';
            if (this.props.left) this.props.left.value = this.selectedElement.style.left;
            if (this.props.top) this.props.top.value = this.selectedElement.style.top;
        }
    },

    handleResizeEnd() {
        this.isResizing = false;
        this.isMoving = false;
        this.currentHandle = null;
    },

    selectElement(el) {
        this.deselectAll();
        this.selectedElement = el;

        if (!el.querySelector('.selection-box')) {
            const overlay = document.createElement('div');
            overlay.className = 'selection-box';
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

            overlay.querySelectorAll('.resize-handle').forEach(h => {
                h.addEventListener('mousedown', (e) => this.startResize(e, h));
            });
            el.onmousedown = (e) => {
                if (e.target.classList.contains('resize-handle')) return;
                if (e.target.isContentEditable) return;
                this.startMove(e);
            };
        }

        if (this.flexGroup) {
            const comp = window.getComputedStyle(el);
            if (comp.display === 'flex' || el.classList.contains('nexus-container')) {
                this.flexGroup.style.display = 'block';
            } else {
                this.flexGroup.style.display = 'none';
            }
        }
        this.syncProperties(el);
    },

    deselectAll() {
        if (this.selectedElement && this.selectionBox) {
            this.selectionBox.remove();
            this.selectionBox = null;
        }
        this.selectedElement = null;
        if (this.flexGroup) this.flexGroup.style.display = 'none';
    },

    syncProperties(el) {
        const comp = window.getComputedStyle(el);
        const val = (id, v) => { if (this.props[id]) this.props[id].value = v; };

        val('width', el.style.width || comp.width);
        val('height', el.style.height || comp.height);
        val('padding', el.style.padding || comp.padding);
        val('margin', el.style.margin || comp.margin);
        val('border', el.style.border !== '0px none rgb(0, 0, 0)' ? el.style.border : '');
        val('radius', el.style.borderRadius || comp.borderRadius);

        val('fontSize', parseFloat(comp.fontSize));
        val('fontFamily', comp.fontFamily.replace(/"/g, ''));
        val('fontWeight', comp.fontWeight);
        val('textTransform', comp.textTransform);
        val('lineHeight', comp.lineHeight === 'normal' ? '' : parseFloat(comp.lineHeight));
        val('letterSpacing', comp.letterSpacing === 'normal' ? '' : parseFloat(comp.letterSpacing));

        val('opacity', comp.opacity);

        val('position', comp.position);
        val('float', comp.float);
        val('top', comp.top === 'auto' ? '' : comp.top);
        val('left', comp.left === 'auto' ? '' : comp.left);
        val('right', comp.right === 'auto' ? '' : comp.right);
        val('bottom', comp.bottom === 'auto' ? '' : comp.bottom);
        val('zIndex', comp.zIndex === 'auto' ? '' : comp.zIndex);

        val('flexDir', comp.flexDirection);
        val('flexWrap', comp.flexWrap);
        val('justify', comp.justifyContent);
        val('align', comp.alignItems);
        val('gap', comp.gap === 'normal' ? '' : comp.gap);
    },

    updateStyle(prop, val) {
        if (this.selectedElement) this.selectedElement.style[prop] = val;
    },

    deleteSelected() {
        if (this.selectedElement) {
            if (this.selectionBox) {
                this.selectionBox.remove();
                this.selectionBox = null;
            }
            this.selectedElement.remove();
            this.selectedElement = null;
            if (this.flexGroup) this.flexGroup.style.display = 'none';
        }
    },

    createComponent(type) {
        const el = document.createElement('div');
        el.className = 'nexus-component';
        el.style.position = 'relative';
        el.style.boxSizing = 'border-box';

        if (type === 'Container') {
            el.classList.add('nexus-container');
            el.style.padding = '20px';
            el.style.border = '1px dashed #ccc';
            el.style.display = 'flex';
            el.style.flexDirection = 'column';
            el.style.gap = '16px';
            el.style.minHeight = '100px';
        } else if (type === 'Card Basic') {
            el.classList.add('nexus-card');
            el.style.background = '#FFF';
            el.style.borderRadius = '12px';
            el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
            el.style.padding = '24px';
            el.innerHTML = '<h3 contenteditable="true">Card</h3><p contenteditable="true">Details here...</p>';
        } else if (type === 'Hero Section') {
            el.classList.add('nexus-container');
            el.style.padding = '80px 20px';
            el.style.textAlign = 'center';
            el.style.background = '#F5F5F7';
            el.innerHTML = '<h1 contenteditable="true">Hero Title</h1>';
        } else if (type === 'Button Primary') {
            el.innerHTML = '<button style="padding:10px 20px; background:#FF3B30; color:white; border:none; border-radius:99px;" contenteditable="true">Button</button>';
            el.style.display = 'inline-block';
        } else if (type === 'Image Placeholder') {
            el.style.width = '100px';
            el.style.height = '100px';
            el.style.background = '#EEF';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.innerHTML = '<ion-icon name="image"></ion-icon>';
        } else if (type === 'Input Field') {
            el.innerHTML = '<input type="text" placeholder="Input..." style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; pointer-events:none;">';
            el.style.width = '100%';
        } else if (type === 'Text Block') {
            el.innerText = 'Lorem ipsum text block.';
            el.contentEditable = 'true';
        }

        return el;
    },

    handleCommand(cmd) {
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
            this.saveState();
        }
    },

    initThemes() {
        const themes = [
            { name: 'White', val: '#FFFFFF' },
            { name: 'Glass', val: 'rgba(255, 255, 255, 0.2)' },
            { name: 'Off White', val: '#F9F9F9' },
            { name: 'Dark Mode', val: '#121212' },
            { name: 'Pitch Black', val: '#000000' },
            { name: 'Sunset', val: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%)' },
            { name: 'Oceanic', val: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)' },
            { name: 'Lush Green', val: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
            { name: 'Royal Purple', val: 'linear-gradient(to right, #6a11cb 0%, #2575fc 100%)' },
            { name: 'Cherry', val: 'linear-gradient(to right, #eb3349, #f45c43)' },
            { name: 'Gold Rush', val: 'linear-gradient(to right, #f83600 0%, #f9d423 100%)' },
            { name: 'Cyberpunk', val: 'linear-gradient(45deg, #ff00cc, #333399)' },
            { name: 'Midnight City', val: 'linear-gradient(to top, #232526, #414345)' },
            { name: 'Electric', val: 'linear-gradient(to right, #4776E6, #8E54E9)' },
            { name: 'Slate', val: '#64748b' },
            { name: 'Peach', val: '#ffecd2' },
            { name: 'Mint', val: '#d4fc79' },
            { name: 'Lavender', val: '#e0c3fc' },
            { name: 'Retro Sun', val: 'linear-gradient(to right, #fc466b, #3f5efb)' },
            { name: 'Old Paper', val: '#fdfbf7' },
        ];

        if (!this.themeGrid) return;
        this.themeGrid.innerHTML = '';
        themes.forEach(t => {
            const swatch = document.createElement('div');
            swatch.className = 'theme-swatch';
            swatch.style.background = t.val;
            swatch.title = t.name;
            if (t.val === '#FFFFFF' || t.val === '#F9F9F9' || t.val === '#fdfbf7') swatch.style.border = '1px solid #ccc';
            swatch.onclick = () => {
                if (this.selectedElement) {
                    const btn = this.selectedElement.querySelector('button');
                    const target = btn ? btn : this.selectedElement;

                    target.style.background = t.val;
                    const isDark = t.name.match(/Dark|Black|Cyber|Midnight|Royal|Ocean|Lush|Cherry|Retro|Gold/i);
                    target.style.color = isDark ? '#FFFFFF' : '#111111';

                    if (t.name === 'Glass') {
                        target.style.backdropFilter = 'blur(10px)';
                        target.style.border = '1px solid rgba(255,255,255,0.3)';
                    } else {
                        target.style.backdropFilter = 'none';
                        if (btn) target.style.border = 'none';
                    }
                    this.saveState();
                }
            }
            this.themeGrid.appendChild(swatch);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Nexus.init();
});
