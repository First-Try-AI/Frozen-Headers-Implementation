// Audio System - Main Coordinator for Rocketship
class AudioSystem {
    constructor() {
        this.endpointUrl = window.defaultEndpoint;
        this.endpointPath = '/process-input'; // Single unified endpoint
        this.selectedVoice = 'shuffled';
        this.selectedSpeakers = 'multiple';
        this.overrideEnabled = false;
        this.speed = 0.90;
        this.playbackSpeed = 1.0; // Default normal playback speed (100%)
        
        // User font size preferences (persist across navigation)
        this.userPlayingFontSize = null;    // null = use defaults
        this.userNotPlayingFontSize = null;
        
        // Response data
        this.sessionId = null;
        this.words = [];
        this.pageWords = [];
        this.pageBreaks = [];
        this.pages = []; // Pre-calculated pages array
        this.currentAudioElement = null;
        
        // Multi-chunk audio management
        this.audioChunks = [];
        this.chunkPages = [];
        this.currentChunkIndex = 0;
        this.totalChunks = 0;
        this.currentPageIndex = 0;
        this.isTransitioningPage = false;
        
        // Style Rotation Logic
        this.highlightColors = ['#FBBF24', '#FD5A1E', '#1E90FF', '#FFFFFF'];
        this.currentColorIndex = 0;
        
        
        this.initializeElements();
        this.initializeModules();
        this.setupEventListeners();
        
        // Set initial overlay mode
        this.setOverlayMode('input');
    }
    
    initializeElements() {
        this.elements = {
            textInput: document.getElementById('textInput'),
            generateBtn: document.getElementById('generateBtn'),
            statusMessage: document.getElementById('statusMessage'),
            charCounter: document.getElementById('charCounter'),
            audioPlaybackSection: document.getElementById('audioPlaybackSection'),
            textDisplay: document.getElementById('textDisplay'),
            audioControls: document.getElementById('audioControls')
        };
    }
    
    initializeModules() {
        // Initialize sub-modules
        this.input = new AudioSystemInput(this);
        this.playback = new AudioSystemPlayback(this);
        this.loading = new AudioSystemLoading(this);
        this.captioning = new CaptioningManager(this);
        this.devControls = new DevPanelControls(this);
        this.textProcessor = new TextProcessor();
        
        // Initialize new modular playback system
        this.playback.initialize();
        
        // Expose individual modules for other components to access
        this.progress = this.playback.progress;
        this.navigation = this.playback.navigation;
        this.controls = this.playback.controls;
        
        // Create dev panel dynamically
        this.devControls.createDevPanel();
        
        // Setup dev panel event listeners now that controls are available
        this.devControls.setupEventListeners();
        
        // Initialize dev panel defaults now that controls are available
        this.devControls.initializeDefaults();
    }
    
    setupEventListeners() {
        // Setup input module event listeners
        this.input.ui.setupEventListeners();

        // Setup playback module event listeners
        this.playback.setupEventListeners();
        
        // Dev panel event listeners are now set up in initializeModules() after controls are available
        
        const controlsToggleBtn = document.getElementById('controlsToggleBtn');
        if (controlsToggleBtn) {
            controlsToggleBtn.addEventListener('click', () => {
                this.devControls.toggleDevPanel();
            });
        }
    }

    setOverlayMode(mode) {
        const overlay = document.getElementById('builtin-overlay');
        if (!overlay) {
            console.warn('⚠️ [MODE] builtin-overlay element not found');
            return;
        }
        
        // Remove existing mode classes
        overlay.classList.remove('input-mode', 'loading-mode', 'playback-mode');
        
        // Add new mode class
        overlay.classList.add(`${mode}-mode`);
    }

    updateHighlightColor() {
        const color = this.highlightColors[this.currentColorIndex];
        document.documentElement.style.setProperty('--active-word-color', color);

        this.currentColorIndex = (this.currentColorIndex + 1) % this.highlightColors.length;

        // Also advance the slideshow to the next image
        if (window.advanceSlideForAudioPart) {
            window.advanceSlideForAudioPart();
        }
    }
    
    // Mobile detection
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }
}

// Initialize when DOM is ready
let audioSystem;
document.addEventListener('DOMContentLoaded', () => {
    audioSystem = new AudioSystem();
    // Expose globally for debugging
    window.audioSystem = audioSystem;
});