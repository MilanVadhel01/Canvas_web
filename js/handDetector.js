/**
 * Hand Detector Module for AI Air Canvas (Web Version)
 * 
 * Wrapper class for MediaPipe Hands that provides gesture recognition.
 */

class HandDetector {
    // Landmark IDs for fingertips
    static THUMB_TIP = 4;
    static INDEX_TIP = 8;
    static MIDDLE_TIP = 12;
    static RING_TIP = 16;
    static PINKY_TIP = 20;

    // All tip IDs in order: [thumb, index, middle, ring, pinky]
    static TIP_IDS = [4, 8, 12, 16, 20];

    constructor() {
        this.landmarks = [];
        this.handedness = null;
        this.isReady = false;
    }

    /**
     * Update landmarks from MediaPipe results
     * @param {Object} results - MediaPipe Hands results
     */
    updateLandmarks(results) {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            this.landmarks = results.multiHandLandmarks[0];
            this.handedness = results.multiHandedness ? results.multiHandedness[0] : null;
        } else {
            this.landmarks = [];
            this.handedness = null;
        }
    }

    /**
     * Check if hand is detected
     * @returns {boolean}
     */
    hasHand() {
        return this.landmarks.length > 0;
    }

    /**
     * Get landmark position in pixel coordinates
     * @param {number} id - Landmark ID (0-20)
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @returns {Object|null} {x, y} or null
     */
    getLandmark(id, width, height) {
        if (this.landmarks.length === 0 || id < 0 || id > 20) {
            return null;
        }
        const landmark = this.landmarks[id];
        return {
            x: landmark.x * width,
            y: landmark.y * height
        };
    }

    /**
     * Get fingertip position
     * @param {number} fingerIndex - 0=thumb, 1=index, 2=middle, 3=ring, 4=pinky
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @returns {Object|null} {x, y} or null
     */
    getFingerTip(fingerIndex, width, height) {
        const tipId = HandDetector.TIP_IDS[fingerIndex];
        return this.getLandmark(tipId, width, height);
    }

    /**
     * Detect which fingers are raised/extended
     * @returns {number[]} [thumb, index, middle, ring, pinky] - 1=up, 0=down
     */
    fingersUp() {
        if (this.landmarks.length === 0) {
            return [0, 0, 0, 0, 0];
        }

        const fingers = [];

        // Thumb - Check x-axis (horizontal movement)
        // For the mirrored view, we compare thumb tip with thumb IP joint
        const thumbTip = this.landmarks[HandDetector.THUMB_TIP];
        const thumbIp = this.landmarks[HandDetector.THUMB_TIP - 1];

        // Determine if right or left hand for correct thumb detection
        // Note: In mirrored video, MediaPipe reports the opposite hand
        // So "Right" in MediaPipe is actually the user's left hand on screen
        const isRightHand = this.handedness && this.handedness.label === 'Left';

        // For the actual right hand (reported as "Left" by MediaPipe in mirrored view):
        // thumb is up when tip.x > ip.x
        // For the actual left hand (reported as "Right" by MediaPipe in mirrored view):
        // thumb is up when tip.x < ip.x
        if (isRightHand) {
            fingers.push(thumbTip.x > thumbIp.x ? 1 : 0);
        } else {
            fingers.push(thumbTip.x < thumbIp.x ? 1 : 0);
        }

        // Other 4 fingers - Check y-axis (vertical movement)
        // Finger is UP if the tip is ABOVE (lower y value) the PIP joint
        const fingerTips = [
            HandDetector.INDEX_TIP,
            HandDetector.MIDDLE_TIP,
            HandDetector.RING_TIP,
            HandDetector.PINKY_TIP
        ];

        for (const tipId of fingerTips) {
            const tip = this.landmarks[tipId];
            const pip = this.landmarks[tipId - 2]; // PIP joint is 2 below tip
            fingers.push(tip.y < pip.y ? 1 : 0);
        }

        return fingers;
    }

    /**
     * Count total number of raised fingers
     * @returns {number} 0-5
     */
    countFingers() {
        return this.fingersUp().reduce((a, b) => a + b, 0);
    }

    /**
     * Calculate distance between two landmarks
     * @param {number} p1 - First landmark ID
     * @param {number} p2 - Second landmark ID
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @returns {Object} {distance, center: {x, y}}
     */
    findDistance(p1, p2, width, height) {
        const l1 = this.getLandmark(p1, width, height);
        const l2 = this.getLandmark(p2, width, height);

        if (!l1 || !l2) {
            return { distance: 0, center: null };
        }

        const dx = l2.x - l1.x;
        const dy = l2.y - l1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const center = {
            x: (l1.x + l2.x) / 2,
            y: (l1.y + l2.y) / 2
        };

        return { distance, center, p1: l1, p2: l2 };
    }

    /**
     * Check if fingers match a specific pattern
     * @param {number[]} pattern - Expected finger pattern [thumb, index, middle, ring, pinky]
     * @returns {boolean}
     */
    matchPattern(pattern) {
        const fingers = this.fingersUp();
        return fingers.every((finger, i) => finger === pattern[i]);
    }
}

// Export for use in other modules
window.HandDetector = HandDetector;
