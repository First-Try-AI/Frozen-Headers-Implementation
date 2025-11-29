// Captioning Manager - Coordinates different captioning styles
class CaptioningManager {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
        this.currentStyle = 'original';
        this.captioningSystems = {};
        this.activeCaptioningSystem = null;

        this.initializeCaptioningSystems();
    }

    initializeCaptioningSystems() {
        // Initialize available captioning systems
        this.captioningSystems.original = new CaptionOriginal(this.audioSystem);

        // Set default active system
        this.activeCaptioningSystem = this.captioningSystems.original;
    }
    
    switchCaptioningStyle(styleName) {
        if (this.captioningSystems[styleName]) {
            // Stop current system
            if (this.activeCaptioningSystem) {
                this.activeCaptioningSystem.stopHighlighting();
            }
            
            // Switch to new system
            this.currentStyle = styleName;
            this.activeCaptioningSystem = this.captioningSystems[styleName];
            
            // Start new system if audio is playing
            if (this.audioSystem.currentAudioElement && !this.audioSystem.currentAudioElement.paused) {
                this.activeCaptioningSystem.startHighlighting();
            }
            
        }
    }
    
    getCurrentStyle() {
        return this.currentStyle;
    }
    
    getAvailableStyles() {
        return Object.keys(this.captioningSystems);
    }
    
    // Delegate methods to active captioning system
    getActiveWordIndices() {
        return this.activeCaptioningSystem ? this.activeCaptioningSystem.getActiveWordIndices() : [];
    }
    
    getLookaheadIndices() {
        return this.activeCaptioningSystem ? this.activeCaptioningSystem.getLookaheadIndices() : [];
    }
    
    getLookbackIndices() {
        return this.activeCaptioningSystem ? this.activeCaptioningSystem.getLookbackIndices() : [];
    }
    
    getCurrentPrimaryWordIndex() {
        return this.activeCaptioningSystem ? this.activeCaptioningSystem.getCurrentPrimaryWordIndex() : null;
    }
    
    getLookaheadCount() {
        return this.activeCaptioningSystem ? this.activeCaptioningSystem.getLookaheadCount() : 2;
    }
    
    setLookaheadCount(count) {
        if (this.activeCaptioningSystem) {
            this.activeCaptioningSystem.setLookaheadCount(count);
        }
    }
    
    getLookbackCount() {
        return this.activeCaptioningSystem ? this.activeCaptioningSystem.getLookbackCount() : 1;
    }
    
    setLookbackCount(count) {
        if (this.activeCaptioningSystem) {
            this.activeCaptioningSystem.setLookbackCount(count);
        }
    }
    
    startHighlighting() {
        if (this.activeCaptioningSystem) {
            this.activeCaptioningSystem.startHighlighting();
        }
    }
    
    stopHighlighting() {
        if (this.activeCaptioningSystem) {
            this.activeCaptioningSystem.stopHighlighting();
        }
    }
    
    updateWordHighlighting(currentTime) {
        if (this.activeCaptioningSystem) {
            this.activeCaptioningSystem.updateWordHighlighting(currentTime);
        }
    }
    
    highlightWordAtTime(targetTime) {
        if (this.activeCaptioningSystem) {
            this.activeCaptioningSystem.highlightWordAtTime(targetTime);
        }
    }
    
    cleanup() {
        if (this.activeCaptioningSystem) {
            this.activeCaptioningSystem.cleanup();
        }
    }
}
