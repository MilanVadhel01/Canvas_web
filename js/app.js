/**
 * AI Air Canvas - Main Application (Web Version)
 * 
 * A virtual drawing application that allows you to draw in the air
 * using hand gestures detected via webcam.
 */

class AirCanvasApp {
    constructor() {
        // Configuration
        this.config = {
            brushSize: 15,
            minBrushSize: 5,
            maxBrushSize: 50,
            brushSizeStep: 5,
            eraserSize: 50,
            drawColor: '#FF00FF',
            previousColor: '#FF00FF'
        };

        // State
        this.state = {
            isEraserMode: false,
            prevX: 0,
            prevY: 0,
            currentMode: 'IDLE',
            isDrawing: false
        };

        // DOM Elements
        this.video = document.getElementById('video');
        this.drawingCanvas = document.getElementById('drawing-canvas');
        this.uiCanvas = document.getElementById('ui-canvas');
        this.drawingCtx = this.drawingCanvas.getContext('2d');
        this.uiCtx = this.uiCanvas.getContext('2d');

        // Components
        this.handDetector = new HandDetector();
        this.colorPalette = null; // Initialize after DOM ready

        // MediaPipe
        this.hands = null;
        this.camera = null;

        // Bind methods
        this.onResults = this.onResults.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onResize = this.onResize.bind(this);
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            this.updateLoadingStatus('Initializing hand tracking...');

            // Initialize MediaPipe Hands
            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
                }
            });

            this.hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.7
            });

            this.hands.onResults(this.onResults);

            this.updateLoadingStatus('Requesting camera access...');

            // Initialize camera
            this.camera = new Camera(this.video, {
                onFrame: async () => {
                    await this.hands.send({ image: this.video });
                },
                width: 1280,
                height: 720
            });

            await this.camera.start();

            this.updateLoadingStatus('Setting up canvas...');

            // Setup canvas sizes
            this.setupCanvases();

            // Initialize color palette
            this.colorPalette = new ColorPalette();

            // Setup event listeners
            this.setupEventListeners();

            // Update UI
            this.updateBrushPreview();

            // Hide loading screen, show app
            this.showApp();

            console.log('🎨 AI Air Canvas initialized successfully!');
        } catch (error) {
            console.error('Initialization error:', error);
            this.updateLoadingStatus(`Error: ${error.message}. Please allow camera access and refresh.`);
        }
    }

    /**
     * Update loading status text
     */
    updateLoadingStatus(message) {
        const statusEl = document.getElementById('loading-status');
        if (statusEl) {
            statusEl.textContent = message;
        }
    }

    /**
     * Show the main app and hide loading screen
     */
    showApp() {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
    }

    /**
     * Setup canvas dimensions
     */
    setupCanvases() {
        const rect = document.querySelector('.canvas-area').getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        [this.drawingCanvas, this.uiCanvas].forEach(canvas => {
            canvas.width = width;
            canvas.height = height;
        });

        // Set drawing canvas to be transparent initially
        this.drawingCtx.lineCap = 'round';
        this.drawingCtx.lineJoin = 'round';
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', this.onKeyDown);

        // Window resize
        window.addEventListener('resize', this.onResize);

        // Color palette changes
        window.addEventListener('colorChange', (e) => {
            const color = e.detail.color;
            if (color === 'eraser') {
                this.enableEraser();
            } else {
                this.disableEraser();
                this.config.drawColor = color;
                this.updateBrushPreview();
            }
        });

        // UI Buttons
        document.getElementById('clear-btn').addEventListener('click', () => this.clearCanvas());
        document.getElementById('save-btn').addEventListener('click', () => this.saveDrawing());
        document.getElementById('brush-increase').addEventListener('click', () => this.changeBrushSize(this.config.brushSizeStep));
        document.getElementById('brush-decrease').addEventListener('click', () => this.changeBrushSize(-this.config.brushSizeStep));

        // Help button
        document.getElementById('help-btn').addEventListener('click', () => {
            document.getElementById('instructions').classList.toggle('hidden');
        });
    }

    /**
     * Handle window resize
     */
    onResize() {
        // Store current drawing
        const imageData = this.drawingCtx.getImageData(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);

        // Resize canvases
        this.setupCanvases();

        // Restore drawing (scaled)
        this.drawingCtx.putImageData(imageData, 0, 0);

        // Update palette rects
        if (this.colorPalette) {
            this.colorPalette.updateRects();
        }
    }

    /**
     * Handle keyboard events
     */
    onKeyDown(e) {
        switch (e.key.toLowerCase()) {
            case 'c':
                this.clearCanvas();
                break;
            case 's':
                this.saveDrawing();
                break;
            case 'e':
                this.toggleEraser();
                break;
            case '+':
            case '=':
                this.changeBrushSize(this.config.brushSizeStep);
                break;
            case '-':
            case '_':
                this.changeBrushSize(-this.config.brushSizeStep);
                break;
        }
    }

    /**
     * Handle MediaPipe results
     */
    onResults(results) {
        const width = this.uiCanvas.width;
        const height = this.uiCanvas.height;

        // Clear UI canvas
        this.uiCtx.clearRect(0, 0, width, height);

        // Update hand detector with new landmarks
        this.handDetector.updateLandmarks(results);

        if (this.handDetector.hasHand()) {
            // Draw hand landmarks
            this.drawHandLandmarks(results);

            // Get finger states
            const fingers = this.handDetector.fingersUp();
            const indexTip = this.handDetector.getFingerTip(1, width, height);

            // Mirror the x coordinate (video is mirrored)
            if (indexTip) {
                indexTip.x = width - indexTip.x;
            }

            // Gesture recognition
            this.processGestures(fingers, indexTip, width, height);
        } else {
            this.setMode('IDLE');
            this.state.prevX = 0;
            this.state.prevY = 0;
        }
    }

    /**
     * Draw hand landmarks on UI canvas
     */
    drawHandLandmarks(results) {
        if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
                // Mirror landmarks horizontally to match the mirrored video feed
                const mirroredLandmarks = landmarks.map(lm => ({
                    x: 1 - lm.x,  // Flip x-coordinate
                    y: lm.y,
                    z: lm.z
                }));

                // Draw connections
                drawConnectors(this.uiCtx, mirroredLandmarks, HAND_CONNECTIONS, {
                    color: 'rgba(168, 85, 247, 0.5)',
                    lineWidth: 2
                });

                // Draw landmarks
                drawLandmarks(this.uiCtx, mirroredLandmarks, {
                    color: '#a855f7',
                    lineWidth: 1,
                    radius: 4
                });
            }
        }
    }

    /**
     * Process hand gestures
     */
    processGestures(fingers, indexTip, width, height) {
        // SELECTION MODE: Index + Middle finger up [0, 1, 1, 0, 0]
        if (this.handDetector.matchPattern([0, 1, 1, 0, 0])) {
            this.setMode('SELECTION');
            this.state.prevX = 0;
            this.state.prevY = 0;

            if (indexTip) {
                // Draw cursor
                this.drawCursor(indexTip.x, indexTip.y);

                // Check for color selection
                const selectedColor = this.colorPalette.checkSelection(indexTip.x, indexTip.y);
                if (selectedColor) {
                    this.colorPalette.selectColor(selectedColor);
                }
            }
        }
        // DRAWING MODE: Only index finger up [0, 1, 0, 0, 0]
        else if (this.handDetector.matchPattern([0, 1, 0, 0, 0])) {
            this.setMode(this.state.isEraserMode ? 'ERASER' : 'DRAWING');

            if (indexTip) {
                const x = indexTip.x;
                const y = indexTip.y;

                // Draw fingertip indicator
                this.uiCtx.beginPath();
                this.uiCtx.arc(x, y, 15, 0, Math.PI * 2);
                this.uiCtx.fillStyle = this.state.isEraserMode ? '#666' : this.config.drawColor;
                this.uiCtx.fill();

                // Skip if in header area
                if (this.colorPalette.isInHeader(y)) {
                    this.state.prevX = 0;
                    this.state.prevY = 0;
                    return;
                }

                // Initialize previous point
                if (this.state.prevX === 0 && this.state.prevY === 0) {
                    this.state.prevX = x;
                    this.state.prevY = y;
                }

                // Draw on canvas
                this.drawLine(this.state.prevX, this.state.prevY, x, y);

                // Update previous point
                this.state.prevX = x;
                this.state.prevY = y;
            }
        }
        // CLEAR CANVAS: All fingers up [1, 1, 1, 1, 1]
        else if (this.handDetector.matchPattern([1, 1, 1, 1, 1])) {
            this.setMode('CLEAR');
            this.clearCanvas();
            this.state.prevX = 0;
            this.state.prevY = 0;
        }
        // ERASER MODE: Fist gesture [0, 0, 0, 0, 0]
        else if (this.handDetector.matchPattern([0, 0, 0, 0, 0])) {
            this.setMode('ERASER');
            if (!this.state.isEraserMode) {
                this.enableEraser();
            }
            this.state.prevX = 0;
            this.state.prevY = 0;
        }
        // Other gestures
        else {
            this.state.prevX = 0;
            this.state.prevY = 0;
        }
    }

    /**
     * Draw a line on the drawing canvas
     */
    drawLine(x1, y1, x2, y2) {
        this.drawingCtx.beginPath();
        this.drawingCtx.moveTo(x1, y1);
        this.drawingCtx.lineTo(x2, y2);

        if (this.state.isEraserMode) {
            // Use destination-out to erase
            this.drawingCtx.globalCompositeOperation = 'destination-out';
            this.drawingCtx.strokeStyle = 'rgba(0,0,0,1)';
            this.drawingCtx.lineWidth = this.config.eraserSize;
        } else {
            this.drawingCtx.globalCompositeOperation = 'source-over';
            this.drawingCtx.strokeStyle = this.config.drawColor;
            this.drawingCtx.lineWidth = this.config.brushSize;
        }

        this.drawingCtx.stroke();
    }

    /**
     * Draw cursor indicator in selection mode
     */
    drawCursor(x, y) {
        const size = 20;
        this.uiCtx.strokeStyle = this.config.drawColor;
        this.uiCtx.lineWidth = 3;
        this.uiCtx.strokeRect(x - size, y - size, size * 2, size * 2);
    }

    /**
     * Set current mode and update UI
     */
    setMode(mode) {
        if (this.state.currentMode === mode) return;

        this.state.currentMode = mode;
        const modeDisplay = document.getElementById('mode-display');

        modeDisplay.textContent = mode;
        modeDisplay.className = 'mode-badge ' + mode.toLowerCase();
    }

    /**
     * Enable eraser mode
     */
    enableEraser() {
        if (!this.state.isEraserMode) {
            this.config.previousColor = this.config.drawColor;
        }
        this.state.isEraserMode = true;
        this.updateBrushPreview();
    }

    /**
     * Disable eraser mode
     */
    disableEraser() {
        this.state.isEraserMode = false;
        this.config.drawColor = this.config.previousColor;
        this.updateBrushPreview();
    }

    /**
     * Toggle eraser mode
     */
    toggleEraser() {
        if (this.state.isEraserMode) {
            this.disableEraser();
            // Update palette to show previous color
            this.colorPalette.selectColor(this.config.drawColor);
        } else {
            this.enableEraser();
            this.colorPalette.selectColor('eraser');
        }
    }

    /**
     * Change brush size
     */
    changeBrushSize(delta) {
        this.config.brushSize = Math.max(
            this.config.minBrushSize,
            Math.min(this.config.maxBrushSize, this.config.brushSize + delta)
        );
        this.updateBrushPreview();
    }

    /**
     * Update brush preview in UI
     */
    updateBrushPreview() {
        const preview = document.getElementById('brush-preview');
        const sizeValue = document.getElementById('brush-size-value');

        const size = this.state.isEraserMode ? this.config.eraserSize : this.config.brushSize;
        const color = this.state.isEraserMode ? '#666' : this.config.drawColor;

        preview.style.width = `${Math.min(size, 50)}px`;
        preview.style.height = `${Math.min(size, 50)}px`;
        preview.style.background = color;
        preview.style.boxShadow = `0 0 20px ${color}`;

        sizeValue.textContent = size;
    }

    /**
     * Clear the drawing canvas
     */
    clearCanvas() {
        this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        console.log('🗑️ Canvas cleared!');
    }

    /**
     * Save drawing as PNG
     */
    saveDrawing() {
        // Create a temporary canvas with white background
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.drawingCanvas.width;
        tempCanvas.height = this.drawingCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        // Fill with dark background
        tempCtx.fillStyle = '#0a0a0f';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Draw the canvas content
        tempCtx.drawImage(this.drawingCanvas, 0, 0);

        // Create download link
        const link = document.createElement('a');
        link.download = `air-canvas-${Date.now()}.png`;
        link.href = tempCanvas.toDataURL('image/png');
        link.click();

        console.log('💾 Drawing saved!');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const welcomePage = document.getElementById('welcome-page');
    const loadingScreen = document.getElementById('loading-screen');

    startBtn.addEventListener('click', () => {
        // Hide welcome page
        welcomePage.classList.add('hidden');

        // Show loading screen
        loadingScreen.classList.remove('hidden');

        // Initialize the app
        const app = new AirCanvasApp();
        app.init();
    });
});
