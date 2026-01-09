/**
 * Color Palette Module for AI Air Canvas (Web Version)
 * 
 * Manages color selection from the palette header.
 */

class ColorPalette {
    constructor() {
        this.colors = [
            { name: 'Purple', hex: '#FF00FF', rgb: 'rgb(255, 0, 255)' },
            { name: 'Blue', hex: '#0066FF', rgb: 'rgb(0, 102, 255)' },
            { name: 'Green', hex: '#00FF00', rgb: 'rgb(0, 255, 0)' },
            { name: 'Red', hex: '#FF3333', rgb: 'rgb(255, 51, 51)' },
            { name: 'Yellow', hex: '#FFFF00', rgb: 'rgb(255, 255, 0)' },
            { name: 'Eraser', hex: 'eraser', rgb: null }
        ];

        this.selectedColor = this.colors[0].hex;
        this.colorBoxes = [];
        this.headerHeight = 80; // matches CSS --header-height

        this.init();
    }

    /**
     * Initialize color box elements and event listeners
     */
    init() {
        this.colorBoxes = document.querySelectorAll('.color-box');

        this.colorBoxes.forEach((box, index) => {
            box.addEventListener('click', () => {
                this.selectColor(box.dataset.color);
            });

            // Store bounding rect for gesture detection
            const rect = box.getBoundingClientRect();
            this.colors[index].rect = rect;
        });

        // Set initial selection
        this.updateActiveState();
    }

    /**
     * Update bounding rects (call on resize)
     */
    updateRects() {
        this.colorBoxes.forEach((box, index) => {
            this.colors[index].rect = box.getBoundingClientRect();
        });
    }

    /**
     * Select a color by hex value
     * @param {string} colorHex - Color hex value or 'eraser'
     */
    selectColor(colorHex) {
        this.selectedColor = colorHex;
        this.updateActiveState();

        // Dispatch custom event for app to listen
        window.dispatchEvent(new CustomEvent('colorChange', {
            detail: { color: colorHex }
        }));
    }

    /**
     * Update active state styling on color boxes
     */
    updateActiveState() {
        this.colorBoxes.forEach(box => {
            if (box.dataset.color === this.selectedColor) {
                box.classList.add('active');
            } else {
                box.classList.remove('active');
            }
        });
    }

    /**
     * Check if a point (finger position) is over a color box
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {string|null} Color hex or 'eraser' if over a box, null otherwise
     */
    checkSelection(x, y) {
        // Only check if in header area
        if (y > this.headerHeight) {
            return null;
        }

        for (let i = 0; i < this.colors.length; i++) {
            const rect = this.colors[i].rect;
            if (rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return this.colors[i].hex;
            }
        }

        return null;
    }

    /**
     * Get current selected color
     * @returns {string}
     */
    getSelectedColor() {
        return this.selectedColor;
    }

    /**
     * Check if eraser is selected
     * @returns {boolean}
     */
    isEraserSelected() {
        return this.selectedColor === 'eraser';
    }

    /**
     * Check if y coordinate is in header area
     * @param {number} y - Y coordinate
     * @returns {boolean}
     */
    isInHeader(y) {
        return y < this.headerHeight;
    }
}

// Export for use in other modules
window.ColorPalette = ColorPalette;
