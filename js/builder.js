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

    // --- Export Helper ---
    getFormattedHTML() {
        // Clone the canvas to manipulate it without affecting the live view
        const clone = this.canvas.cloneNode(true);

        // Remove builder-specific elements
        const selection = clone.querySelector('.selection-box');
        if (selection) selection.remove();

        const welcome = clone.querySelector('.welcome-msg');
        if (welcome) welcome.remove();

        // Clean up attributes and styles
        const allElements = clone.querySelectorAll('*');
        allElements.forEach(el => {
            el.removeAttribute('contenteditable');
            el.removeAttribute('draggable');
            el.classList.remove('nexus-component');

            // Fix Inputs: Remove pointer-events: none if present so they are clickable
            if (el.tagName === 'INPUT' || el.tagName === 'BUTTON' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
                if (el.style.pointerEvents === 'none') {
                    el.style.pointerEvents = 'auto';
                }
            }

            // Remove builder artifacts (red outlines, etc.)
            if (el.style.outline && el.style.outline.includes('dashed')) {
                el.style.outline = '';
            }
            if (el.style.outlineOffset) {
                el.style.outlineOffset = '';
            }
            // Remove dashed border common in builder containers
            if (el.style.border && el.style.border.includes('dashed')) {
                el.style.border = '';
            }

            // Remove empty class attributes
            if (el.classList.length === 0) {
                el.removeAttribute('class');
            }
        });




        // Specific cleanup for editable text nodes to ensure they are static
        clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));

        // Handle Body Content with MaxWidth wrapper if needed
        let bodyContent = clone.innerHTML;
        const currentMaxWidth = this.canvas.style.maxWidth;
        if (currentMaxWidth && currentMaxWidth !== '100%' && currentMaxWidth !== 'none') {
            bodyContent = `<div style="max-width: ${currentMaxWidth}; margin: 0 auto; background: #FFF; min-height: 100vh;">${bodyContent}</div>`;
        }

        // Return COMPLETE HTML Document
        const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QuickEdit Export</title>
    <style>
        body { margin: 0; font-family: 'Inter', sans-serif; background: #FFF; }
        * { box-sizing: border-box; }
        /* Essential styles from builder that might be needed */
        .nexus-container { display: flex; flex-direction: column; gap: 16px; min-height: 50px; }
        .nexus-card { background: #FFF; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); padding: 24px; }
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
</head>
<body>
    ${bodyContent}
</body>
</html>`;

        return fullHTML;
    },

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
            gap: document.getElementById('prop-gap'),
            // Image
            src: document.getElementById('prop-src')
        };

        this.flexGroup = document.getElementById('flex-controls');
        this.imageGroup = document.getElementById('image-controls');

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

        // Export & Publish & Clear
        const btnExport = document.getElementById('btn-export');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                this.deselectAll();
                const html = this.getFormattedHTML(); // Now returns full HTML
                navigator.clipboard.writeText(html).then(() => alert('Full HTML copied to clipboard!'));
            });
        }

        const btnPublish = document.getElementById('btn-publish');
        if (btnPublish) {
            btnPublish.addEventListener('click', () => {
                this.deselectAll();
                const fullHTML = this.getFormattedHTML(); // Already full HTML
                const blob = new Blob([fullHTML], { type: 'text/html' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'quick_edit_site.html';
                a.click();
            });
        }

        const btnClear = document.getElementById('btn-clear');
        if (btnClear) {
            btnClear.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
                    this.canvas.innerHTML = `
                <div class="welcome-msg" style="padding: 40px; text-align: center; color: #999; pointer-events: none;">
                    <p>Canvas Ready. Drop items here.</p>
                </div>`;
                    this.deselectAll();
                    this.saveState();
                }
            });
        }

        // Sidebar Toggle
        const toggleBtn = document.getElementById('btn-toggle-lib');
        const sidebar = document.getElementById('sidebar-library');
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
            });
        }

        // Viewport Controls
        const vpBtns = document.querySelectorAll('.vp-btn');
        const vpLabel = document.querySelector('.vp-label');
        if (vpBtns && vpLabel) {
            vpBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Update active state
                    vpBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    // Set size
                    const size = btn.getAttribute('data-size');
                    const title = btn.getAttribute('title');

                    if (size === '100%') {
                        this.canvas.style.maxWidth = '100%';
                        this.canvas.style.width = '100%';
                    } else {
                        this.canvas.style.width = size;
                        this.canvas.style.maxWidth = size;
                    }

                    // Update label
                    vpLabel.innerText = title;
                });
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

        // Image Src Bind
        if (this.props.src) {
            this.props.src.addEventListener('input', (e) => {
                if (this.selectedElement) {
                    // Check if it's an IMG tag or contains one
                    const img = this.selectedElement.tagName === 'IMG' ? this.selectedElement : this.selectedElement.querySelector('img');
                    if (img) {
                        img.src = e.target.value;
                        this.saveState();
                    }
                }
            });
        }

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

    checkEmptyState() {
        const welcome = this.canvas.querySelector('.welcome-msg');
        if (welcome) welcome.remove();
    },

    handleDrop(e) {
        if (!this.draggedType) return;

        this.checkEmptyState();

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

        if (this.imageGroup) {
            if (el.tagName === 'IMG' || el.querySelector('img')) {
                this.imageGroup.style.display = 'block';
            } else {
                this.imageGroup.style.display = 'none';
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
        if (this.imageGroup) this.imageGroup.style.display = 'none';
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

        // Image Src
        if (this.props.src) {
            const img = el.tagName === 'IMG' ? el : el.querySelector('img');
            this.props.src.value = img ? img.getAttribute('src') : '';
        }
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
            const imgEl = document.createElement('img');
            imgEl.className = 'nexus-component';
            imgEl.src = 'https://via.placeholder.com/300x200';
            imgEl.style.width = '100%';
            imgEl.style.maxWidth = '300px';
            imgEl.style.height = 'auto';
            imgEl.style.display = 'block';
            return imgEl;
        } else if (type === 'Input Field') {
            el.innerHTML = '<input type="text" placeholder="Input..." style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; pointer-events:none;">';
            el.style.width = '100%';
        } else if (type === 'Text Block') {
            el.innerText = 'Lorem ipsum text block.';
            el.contentEditable = 'true';
        } else if (type === 'Admin Dashboard') {
            el.classList.add('nexus-container');
            el.style.width = '100%';
            el.style.height = '600px';
            el.style.display = 'flex';
            el.style.background = '#f4f6f8';
            el.innerHTML = `
                <!-- Sidebar -->
                <div style="width: 250px; background: #2c3e50; color: white; padding: 20px; display: flex; flex-direction: column;">
                    <div style="font-size: 20px; font-weight: bold; margin-bottom: 40px;">AdminPanel</div>
                    <div style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">Dashboard</div>
                    <div style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">Users</div>
                    <div style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">Settings</div>
                </div>
                <!-- Main Content -->
                <div style="flex: 1; padding: 40px;">
                    <h2 contenteditable="true">Dashboard Overview</h2>
                    <div style="display: flex; gap: 20px; margin-top: 20px;">
                        <div style="flex: 1; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <h4 style="margin:0 0 10px 0;">Total Users</h4>
                            <div style="font-size: 24px; font-weight: bold;">1,234</div>
                        </div>
                        <div style="flex: 1; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <h4 style="margin:0 0 10px 0;">Revenue</h4>
                            <div style="font-size: 24px; font-weight: bold;">$12,345</div>
                        </div>
                        <div style="flex: 1; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <h4 style="margin:0 0 10px 0;">Orders</h4>
                            <div style="font-size: 24px; font-weight: bold;">89</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (type === 'Auth Page') {
            el.classList.add('nexus-container');
            el.style.width = '100%';
            el.style.padding = '80px 20px';
            el.style.background = '#f0f2f5';
            el.style.display = 'flex';
            el.style.justifyContent = 'center';
            el.style.alignItems = 'center';
            el.innerHTML = `
                <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 400px; text-align: center;">
                    <h2 contenteditable="true" style="margin-bottom: 20px;">Welcome Back</h2>
                    <input type="text" placeholder="Email Address" style="width: 100%; padding: 12px; margin-bottom: 16px; border: 1px solid #ddd; border-radius: 6px;">
                    <input type="password" placeholder="Password" style="width: 100%; padding: 12px; margin-bottom: 24px; border: 1px solid #ddd; border-radius: 6px;">
                    <button style="width: 100%; padding: 12px; background: #FF3B30; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Sign In</button>
                    <p style="margin-top: 20px; font-size: 14px; color: #666;" contenteditable="true">Don't have an account? <span style="color: #FF3B30;">Sign up</span></p>
                </div>
            `;
        } else if (type === 'Navbar') {
            el.classList.add('nexus-container');
            el.style.width = '100%';
            el.style.padding = '16px 32px';
            el.style.background = '#FFF';
            el.style.display = 'flex';
            el.style.justifyContent = 'space-between';
            el.style.alignItems = 'center';
            el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
            el.innerHTML = `
                <div style="font-weight: 700; font-size: 20px; color: #333;" contenteditable="true">Brand</div>
                <div style="display: flex; gap: 24px;">
                    <a href="#" style="text-decoration: none; color: #555; font-weight: 500;" contenteditable="true">Home</a>
                    <a href="#" style="text-decoration: none; color: #555; font-weight: 500;" contenteditable="true">About</a>
                    <a href="#" style="text-decoration: none; color: #555; font-weight: 500;" contenteditable="true">Services</a>
                    <a href="#" style="text-decoration: none; color: #555; font-weight: 500;" contenteditable="true">Contact</a>
                </div>
                <button style="padding: 8px 16px; background: #000; color: white; border: none; border-radius: 6px; cursor: pointer;" contenteditable="true">Get Started</button>
            `;
        } else if (type === 'Landing Page') {
            el.classList.add('nexus-container');
            el.style.width = '100%';
            el.innerHTML = `
                <!-- Hero -->
                <div style="text-align: center; padding: 100px 20px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);">
                    <h1 style="font-size: 48px; margin-bottom: 24px; color: #333;" contenteditable="true">Build Faster with Nexus</h1>
                    <p style="font-size: 20px; color: #666; margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto;" contenteditable="true">Drag, drop, and design professional websites in minutes. No coding required.</p>
                    <button style="padding: 16px 32px; font-size: 18px; background: #000; color: white; border: none; border-radius: 8px; cursor: pointer;" contenteditable="true">Start Building Now</button>
                    <div style="margin-top: 60px;">
                        <img src="https://via.placeholder.com/800x400" style="border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); width: 80%; max-width: 800px;">
                    </div>
                </div>
                <!-- Features -->
                <div style="padding: 80px 20px; max-width: 1200px; margin: 0 auto;">
                    <h2 style="text-align: center; margin-bottom: 60px;" contenteditable="true">Why Choose Us?</h2>
                    <div style="display: flex; gap: 40px; flex-wrap: wrap;">
                        <div style="flex: 1; min-width: 250px; text-align: center;">
                            <ion-icon name="flash-outline" style="font-size: 48px; color: #FF3B30; margin-bottom: 16px;"></ion-icon>
                            <h3 contenteditable="true">Lightning Fast</h3>
                            <p style="color: #666;" contenteditable="true">Optimized for speed and performance right out of the box.</p>
                        </div>
                        <div style="flex: 1; min-width: 250px; text-align: center;">
                            <ion-icon name="layers-outline" style="font-size: 48px; color: #007AFF; margin-bottom: 16px;"></ion-icon>
                            <h3 contenteditable="true">Easy Layers</h3>
                            <p style="color: #666;" contenteditable="true">Manage complex layouts with our intuitive layer system.</p>
                        </div>
                        <div style="flex: 1; min-width: 250px; text-align: center;">
                            <ion-icon name="rocket-outline" style="font-size: 48px; color: #34C759; margin-bottom: 16px;"></ion-icon>
                            <h3 contenteditable="true">Launch Ready</h3>
                            <p style="color: #666;" contenteditable="true">Export clean, production-ready code in one click.</p>
                        </div>
                    </div>
                </div>
            `;
        } else if (type === 'Portfolio Grid') {
            el.classList.add('nexus-container');
            el.style.width = '100%';
            el.style.padding = '60px 20px';
            el.style.background = '#111';
            el.style.color = 'white';
            el.innerHTML = `
                <div style="max-width: 1200px; margin: 0 auto;">
                    <h2 style="margin-bottom: 10px; font-size: 36px;" contenteditable="true">Selected Works</h2>
                    <p style="color: #888; margin-bottom: 60px;" contenteditable="true">A collection of our recent digital experiences.</p>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 30px;">
                        <!-- Item 1 -->
                        <div style="background: #222; border-radius: 12px; overflow: hidden; transition: transform 0.2s;">
                            <div style="height: 200px; background: #333; display: flex; align-items: center; justify-content: center; color: #555;">Image</div>
                            <div style="padding: 24px;">
                                <h3 style="margin: 0 0 8px 0;" contenteditable="true">Project Alpha</h3>
                                <p style="color: #888; font-size: 14px; margin: 0;" contenteditable="true">Brand Identity</p>
                            </div>
                        </div>
                        <!-- Item 2 -->
                        <div style="background: #222; border-radius: 12px; overflow: hidden; transition: transform 0.2s;">
                            <div style="height: 200px; background: #333; display: flex; align-items: center; justify-content: center; color: #555;">Image</div>
                            <div style="padding: 24px;">
                                <h3 style="margin: 0 0 8px 0;" contenteditable="true">Project Beta</h3>
                                <p style="color: #888; font-size: 14px; margin: 0;" contenteditable="true">Web Development</p>
                            </div>
                        </div>
                        <!-- Item 3 -->
                        <div style="background: #222; border-radius: 12px; overflow: hidden; transition: transform 0.2s;">
                            <div style="height: 200px; background: #333; display: flex; align-items: center; justify-content: center; color: #555;">Image</div>
                            <div style="padding: 24px;">
                                <h3 style="margin: 0 0 8px 0;" contenteditable="true">Project Gamma</h3>
                                <p style="color: #888; font-size: 14px; margin: 0;" contenteditable="true">App Design</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (type === 'Pricing Table') {
            el.classList.add('nexus-container');
            el.style.width = '100%';
            el.style.padding = '80px 20px';
            el.style.background = '#f9f9f9';
            el.innerHTML = `
                <div style="text-align: center; margin-bottom: 60px;">
                    <h2 style="font-size: 36px; margin-bottom: 16px;" contenteditable="true">Simple Pricing</h2>
                    <p style="color: #666;" contenteditable="true">Choose the plan that fits your needs.</p>
                </div>
                <div style="display: flex; gap: 30px; justify-content: center; flex-wrap: wrap; max-width: 1200px; margin: 0 auto;">
                    <!-- Basic -->
                    <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); flex: 1; min-width: 300px; max-width: 350px;">
                        <h3 style="color: #666; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;" contenteditable="true">Starter</h3>
                        <div style="font-size: 48px; font-weight: 700; margin: 20px 0; color: #333;" contenteditable="true">$19<span style="font-size: 16px; color: #999; font-weight: 400;">/mo</span></div>
                        <ul style="list-style: none; padding: 0; margin: 30px 0; color: #555; line-height: 2;">
                            <li contenteditable="true"><ion-icon name="checkmark-circle" style="color: #34C759; margin-right: 8px;"></ion-icon> 5 Projects</li>
                            <li contenteditable="true"><ion-icon name="checkmark-circle" style="color: #34C759; margin-right: 8px;"></ion-icon> Basic Analytics</li>
                            <li contenteditable="true"><ion-icon name="checkmark-circle" style="color: #34C759; margin-right: 8px;"></ion-icon> 24/7 Support</li>
                        </ul>
                        <button style="width: 100%; padding: 14px; background: white; border: 2px solid #000; color: #000; font-weight: 600; border-radius: 8px; cursor: pointer;" contenteditable="true">Get Started</button>
                    </div>
                    <!-- Pro -->
                    <div style="background: #000; padding: 40px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); flex: 1; min-width: 300px; max-width: 350px; color: white; transform: scale(1.05);">
                        <div style="text-align: right; margin-top: -20px; margin-bottom: 20px;"><span style="background: #FF3B30; font-size: 11px; padding: 4px 8px; border-radius: 99px; font-weight: 700;">POPULAR</span></div>
                        <h3 style="color: #888; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;" contenteditable="true">Pro</h3>
                        <div style="font-size: 48px; font-weight: 700; margin: 20px 0; color: white;" contenteditable="true">$49<span style="font-size: 16px; color: #666; font-weight: 400;">/mo</span></div>
                        <ul style="list-style: none; padding: 0; margin: 30px 0; color: #ccc; line-height: 2;">
                            <li contenteditable="true"><ion-icon name="checkmark-circle" style="color: #34C759; margin-right: 8px;"></ion-icon> Unlimited Projects</li>
                            <li contenteditable="true"><ion-icon name="checkmark-circle" style="color: #34C759; margin-right: 8px;"></ion-icon> Advanced Analytics</li>
                            <li contenteditable="true"><ion-icon name="checkmark-circle" style="color: #34C759; margin-right: 8px;"></ion-icon> Priority Support</li>
                            <li contenteditable="true"><ion-icon name="checkmark-circle" style="color: #34C759; margin-right: 8px;"></ion-icon> Custom Domain</li>
                        </ul>
                        <button style="width: 100%; padding: 14px; background: #FF3B30; border: none; color: white; font-weight: 600; border-radius: 8px; cursor: pointer;" contenteditable="true">Get Pro</button>
                    </div>
                </div>
            `;
        }

        return el;
    },

    handleCommand(cmd) {
        // Map short codes to internal component types
        const typeMap = {
            'card': 'Card Basic',
            'box': 'Container',
            'container': 'Container',
            'div': 'Container',
            'hero': 'Hero Section',
            'btn': 'Button Primary',
            'button': 'Button Primary',
            'img': 'Image Placeholder',
            'image': 'Image Placeholder',
            'input': 'Input Field',
            'text': 'Text Block',
            'p': 'Text Block',
            'admin': 'Admin Dashboard',
            'auth': 'Auth Page',
            'nav': 'Navbar',
            'navbar': 'Navbar',
            'landing': 'Landing Page',
            'portfolio': 'Portfolio Grid',
            'pricing': 'Pricing Table'
        };

        const parts = cmd.split('>').map(s => s.trim().toLowerCase());

        // Root element to append to canvas
        let root = null;
        let parent = null;

        parts.forEach(part => {
            // Find type based on keys
            // We check if the part includes the key to allow for things like "red card" (future expansion)
            // For now, strict mapping or "includes" check.
            let matchedType = null;
            Object.keys(typeMap).forEach(key => {
                if (part === key || part.includes(key)) {
                    matchedType = typeMap[key];
                }
            });

            if (matchedType) {
                const newEl = this.createComponent(matchedType);

                if (!root) {
                    root = newEl;
                } else {
                    parent.appendChild(newEl);
                }
                parent = newEl;
            }
        });

        if (root) {
            this.checkEmptyState();
            this.canvas.appendChild(root);
            this.selectElement(root);
            this.canvas.scrollTop = this.canvas.scrollHeight;
            this.saveState();
        } else {
            // Fallback for empty or unknown
            console.log("AI: No matching component for command:", cmd);
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
