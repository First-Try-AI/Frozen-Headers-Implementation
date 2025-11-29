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

        // Don't update page display if in pause state
        if (this.audioSystem.captioning && this.audioSystem.captioning.activeCaptioningSystem && this.audioSystem.captioning.activeCaptioningSystem.isPauseState) {
            return;
        }

        // Don't update page display if a transition is in progress
        if (this.audioSystem.isTransitioningPage) {
            return;
        }

        const currentTime = this.audioSystem.currentAudioElement.currentTime;
        const targetPageIndex = this.audioSystem.input.dataDisplay.getCurrentPageForTime(currentTime);

        // Only update if we're on a different page
        if (targetPageIndex !== this.audioSystem.currentPageIndex) {
            this.audioSystem.currentPageIndex = targetPageIndex;
            this.audioSystem.input.dataDisplay.updateTextDisplayForPage(targetPageIndex);
        }
    }
    
    async testConnection() {
        return this.controls.testConnection();
    }
}