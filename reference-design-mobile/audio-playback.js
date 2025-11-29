// Audio Playback Module - Main coordinator for playback functionality
class AudioSystemPlayback {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
        // Defer controls initialization to avoid reference error
        this.controls = null;
        this.progress = new AudioProgress(audioSystem);
        this.navigation = new AudioNavigation(audioSystem);
    }
    
    initialize() {
        // Initialize controls after AudioControls class is available
        this.controls = new AudioControls(this.audioSystem);
        this.controls.setupEventListeners();
        this.navigation.setupNavigationListeners();
        this.controls.setupWordClickHandlers();
    }
    
    setupEventListeners() {
        // This method is called by the main audio system
        // Individual event listeners are set up in initialize()
    }
    
    createAudioControls() {
        this.controls.createAudioControls();
    }
    
    setupAudioEventListeners() {
        this.controls.setupAudioEventListeners();
    }
    
    // Delegate methods to appropriate modules
    async playAudio() {
        return this.controls.playAudio();
    }
    
    pauseAudio() {
        this.controls.pauseAudio();
    }
    
    togglePlayback() {
        this.controls.togglePlayback();
    }
    
    seekToTime(time) {
        this.controls.seekToTime(time);
    }
    
    updateHighlighting() {
        if (this.audioSystem.captioning && this.audioSystem.currentAudioElement) {
            const currentTime = this.audioSystem.currentAudioElement.currentTime;
            this.audioSystem.captioning.updateWordHighlighting(currentTime);
        }
    }
    
    updatePageDisplay() {
        if (!this.audioSystem.currentAudioElement || !this.audioSystem.pages || this.audioSystem.pages.length <= 1) {
            return;
        }

        const currentTime = this.audioSystem.currentAudioElement.currentTime;
        const targetPageIndex = this.audioSystem.input.dataDisplay.getCurrentPageForTime(currentTime);

        console.log(`📺 [PAGE-DISPLAY] Current time: ${currentTime.toFixed(3)}s, current page: ${this.audioSystem.currentPageIndex}, target page: ${targetPageIndex}`);

        // Only update if we're on a different page
        if (targetPageIndex !== this.audioSystem.currentPageIndex) {
            console.log(`🔄 [PAGE-DISPLAY] PAGE TRANSITION: ${this.audioSystem.currentPageIndex} → ${targetPageIndex} at ${currentTime.toFixed(3)}s`);
            this.audioSystem.currentPageIndex = targetPageIndex;
            this.audioSystem.input.dataDisplay.updateTextDisplayForPage(targetPageIndex);
        } else {
            console.log(`⏸️ [PAGE-DISPLAY] No page change needed, staying on page ${targetPageIndex}`);
        }
    }
    
    async testConnection() {
        return this.controls.testConnection();
    }
}