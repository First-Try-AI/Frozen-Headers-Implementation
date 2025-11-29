// Audio Input Coordinator - Main coordinator for input modules
class AudioSystemInput {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
        this.initializeModules();
    }
    
    initializeModules() {
        // Initialize sub-modules
        this.ui = new AudioInputUI(this.audioSystem);
        this.cloudrun = new AudioInputCloudRun(this.audioSystem);
        this.dataCore = new AudioSystemInputDataCore(this.audioSystem);
        this.dataDisplay = new AudioSystemInputDataDisplay(this.audioSystem);
        
        // Note: Event listeners are set up by the main AudioSystem setupEventListeners() method
        // to avoid duplicate listeners and maintain proper orchestration
    }
    
    // Public interface methods for backward compatibility
    get handleGenerate() {
        return this.cloudrun.handleGenerate.bind(this.cloudrun);
    }
    
    get showStatus() {
        return this.cloudrun.showStatus.bind(this.cloudrun);
    }
    
    get handleError() {
        return this.cloudrun.handleError.bind(this.cloudrun);
    }
}
