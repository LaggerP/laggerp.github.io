// ================================
// WindowManager - Reusable Window Controls
// Handles drag, minimize, maximize, close for macOS-style windows
// ================================

(function() {
    'use strict';

    class WindowManager {
        /**
         * @param {Object} options
         * @param {HTMLElement} options.element - Window element (required)
         * @param {HTMLElement} options.titlebar - Titlebar element for dragging
         * @param {Object} options.trafficLights - { close, minimize, maximize } elements
         * @param {number} options.minVisible - Minimum visible pixels when dragging (default: 50)
         * @param {string[]} options.preventDragOn - Selectors that prevent drag start
         * @param {string} options.draggingClass - Class for dragging state
         * @param {string} options.minimizedClass - Class for minimized state
         * @param {string} options.maximizedClass - Class for maximized state
         * @param {Function} options.onClose - Callback when closed
         * @param {Function} options.onMinimize - Callback when minimized
         * @param {Function} options.onMaximize - Callback when maximized
         * @param {Function} options.onRestore - Callback when restored
         * @param {string} options.windowId - Identifier for window events
         */
        constructor(options) {
            if (!options.element) {
                throw new Error('WindowManager: element is required');
            }

            // Configuration
            this.element = options.element;
            this.titlebar = options.titlebar || this.element.querySelector('.titlebar');
            this.minVisible = options.minVisible ?? 50;
            this.preventDragOn = options.preventDragOn || ['.traffic-lights'];
            this.windowId = options.windowId || null;

            // CSS classes
            this.classes = {
                dragging: options.draggingClass || 'dragging',
                minimized: options.minimizedClass || 'minimized',
                maximized: options.maximizedClass || 'maximized'
            };

            // Callbacks
            this.onClose = options.onClose || null;
            this.onMinimize = options.onMinimize || null;
            this.onMaximize = options.onMaximize || null;
            this.onRestore = options.onRestore || null;

            // State
            this.state = {
                isDragging: false,
                isMinimized: false,
                isMaximized: false,
                hasDragged: false,
                savedPosition: null,
                dragOffset: { x: 0, y: 0 }
            };

            // Bound methods for event listeners
            this._boundOnMouseMove = this._onMouseMove.bind(this);
            this._boundOnMouseUp = this._onMouseUp.bind(this);
            this._boundOnMouseDown = this._onMouseDown.bind(this);

            // Initialize
            this._init();

            // Set up traffic lights if provided
            if (options.trafficLights) {
                this.setTrafficLights(options.trafficLights);
            }
        }

        // ================================
        // Initialization
        // ================================

        _init() {
            if (this.titlebar) {
                this.titlebar.addEventListener('mousedown', this._boundOnMouseDown);
            }
            document.addEventListener('mousemove', this._boundOnMouseMove);
            document.addEventListener('mouseup', this._boundOnMouseUp);
        }

        // ================================
        // Drag Handling
        // ================================

        _onMouseDown(e) {
            // Check if click is on a prevent-drag element
            for (const selector of this.preventDragOn) {
                if (e.target.closest(selector)) return;
            }

            // Don't drag if maximized
            if (this.state.isMaximized) return;

            this.state.isDragging = true;
            const rect = this.element.getBoundingClientRect();
            this.state.dragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            this.element.classList.add(this.classes.dragging);
        }

        _onMouseMove(e) {
            if (!this.state.isDragging) return;

            // Reset transform on first drag if centered
            if (!this.state.hasDragged) {
                this.state.hasDragged = true;
                this.element.style.transform = 'none';
            }

            let newX = e.clientX - this.state.dragOffset.x;
            let newY = e.clientY - this.state.dragOffset.y;

            // Viewport boundary constraints - keep window fully inside viewport
            const rect = this.element.getBoundingClientRect();
            const menubar = document.querySelector('.menubar');
            const menubarHeight = menubar ? menubar.offsetHeight : 0;
            const maxX = window.innerWidth - rect.width;
            const maxY = window.innerHeight - rect.height;

            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(menubarHeight, Math.min(newY, maxY));

            this.element.style.left = newX + 'px';
            this.element.style.top = newY + 'px';
        }

        _onMouseUp() {
            if (this.state.isDragging) {
                this.state.isDragging = false;
                this.element.classList.remove(this.classes.dragging);
            }
        }

        // ================================
        // Traffic Lights Setup
        // ================================

        /**
         * Set up traffic light button handlers
         * @param {Object} lights - { close, minimize, maximize } elements
         */
        setTrafficLights(lights) {
            if (lights.close) {
                lights.close.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.close();
                });
            }

            if (lights.minimize) {
                lights.minimize.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleMinimize();
                });
            }

            if (lights.maximize) {
                lights.maximize.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleMaximize();
                });
            }
        }

        // ================================
        // Window State Methods
        // ================================

        minimize() {
            // If maximized, restore first
            if (this.state.isMaximized) {
                this.element.classList.remove(this.classes.maximized);
                this.state.isMaximized = false;
            }

            this.state.isMinimized = true;
            this.element.classList.add(this.classes.minimized);

            // Dispatch event
            if (this.windowId) {
                document.dispatchEvent(new CustomEvent('window:minimize', {
                    detail: { windowId: this.windowId }
                }));
            }

            if (this.onMinimize) {
                this.onMinimize();
            }
        }

        restore() {
            const wasMinimized = this.state.isMinimized;
            const wasMaximized = this.state.isMaximized;

            this.state.isMinimized = false;
            this.state.isMaximized = false;
            this.element.classList.remove(this.classes.minimized);
            this.element.classList.remove(this.classes.maximized);

            // Restore saved position if coming from maximized
            if (wasMaximized && this.state.savedPosition) {
                this.element.style.left = this.state.savedPosition.x + 'px';
                this.element.style.top = this.state.savedPosition.y + 'px';
                this.element.style.transform = 'none';
            }

            // Dispatch event
            if (this.windowId) {
                document.dispatchEvent(new CustomEvent('window:restore', {
                    detail: { windowId: this.windowId }
                }));
            }

            if (this.onRestore) {
                this.onRestore();
            }
        }

        maximize() {
            // If minimized, restore first
            if (this.state.isMinimized) {
                this.element.classList.remove(this.classes.minimized);
                this.state.isMinimized = false;
            }

            // Save current position before maximizing
            const rect = this.element.getBoundingClientRect();
            this.state.savedPosition = { x: rect.left, y: rect.top };

            this.state.isMaximized = true;
            this.element.classList.add(this.classes.maximized);

            if (this.onMaximize) {
                this.onMaximize();
            }
        }

        close() {
            // If maximized, restore first
            if (this.state.isMaximized) {
                this.element.classList.remove(this.classes.maximized);
                this.state.isMaximized = false;
            }

            // Hide window (same visual effect as minimize)
            this.state.isMinimized = true;
            this.element.classList.add(this.classes.minimized);

            // Reset position for next open (difference from minimize)
            this.resetPosition();

            // Dispatch close event (NOT minimize - different behavior)
            if (this.windowId) {
                document.dispatchEvent(new CustomEvent('window:close', {
                    detail: { windowId: this.windowId }
                }));
            }

            if (this.onClose) {
                this.onClose();
            }
        }

        // ================================
        // Toggle Methods
        // ================================

        toggleMinimize() {
            if (this.state.isMinimized) {
                this.restore();
            } else {
                this.minimize();
            }
        }

        toggleMaximize() {
            if (this.state.isMaximized) {
                this.restore();
            } else {
                this.maximize();
            }
        }

        // ================================
        // State Queries
        // ================================

        isMinimized() {
            return this.state.isMinimized;
        }

        isMaximized() {
            return this.state.isMaximized;
        }

        isDragging() {
            return this.state.isDragging;
        }

        // ================================
        // Utility Methods
        // ================================

        /**
         * Reset window to center position (above dock)
         */
        resetPosition() {
            this.element.style.top = 'calc(50% - 35px)';
            this.element.style.left = '50%';
            this.element.style.transform = 'translate(-50%, -50%)';
            this.state.hasDragged = false;
        }

        /**
         * Show the window (add visibility)
         */
        show() {
            this.restore();
        }

        /**
         * Hide the window completely
         */
        hide() {
            this.minimize();
        }

        // ================================
        // Cleanup
        // ================================

        destroy() {
            if (this.titlebar) {
                this.titlebar.removeEventListener('mousedown', this._boundOnMouseDown);
            }
            document.removeEventListener('mousemove', this._boundOnMouseMove);
            document.removeEventListener('mouseup', this._boundOnMouseUp);
        }
    }

    // Expose to global scope
    window.WindowManager = WindowManager;
})();
