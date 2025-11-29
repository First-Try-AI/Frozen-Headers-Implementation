// Pause State Handler - Manages viewport fitting and pause highlighting
class PauseStateHandler {
    constructor(captionSystem) {
        this.captionSystem = captionSystem;
        this.originalFontSize = null;
    }
    
    showPauseState() {
        // Store current active word time for pause highlighting
        const currentTime = this.captionSystem.audioSystem.currentAudioElement ? 
            this.captionSystem.audioSystem.currentAudioElement.currentTime : 0;
        
        // Use existing createTextDisplay method to show original full text
        const currentChunkIndex = this.captionSystem.audioSystem.currentChunkIndex || 0;
        this.captionSystem.audioSystem.input.dataDisplay.displayFullChunk(currentChunkIndex);
        
        // Highlight paused word (font sizing handled by dynamic system)
        this.highlightPausedWord(currentTime);
    }
    
    fitTextToViewport() {
        // Use the dynamic sizing system instead of custom calculations
        const textDisplay = this.captionSystem.audioSystem.elements.textDisplay;
        if (!textDisplay) return;
        
        // Call the dynamic sizing system to calculate optimal font size
        this.captionSystem.audioSystem.input.dataDisplay.calculateOptimalFontSize();
        
    }
    
    restoreNormalTextSize() {
        // Use the dynamic sizing system to recalculate optimal font size
        this.captionSystem.audioSystem.input.dataDisplay.calculateOptimalFontSize();
        
    }
    
    highlightPausedWord(currentTime) {
        if (!this.captionSystem.audioSystem.words || this.captionSystem.audioSystem.words.length === 0) return;
        
        // Find the word that was active when paused
        let activeWordIndex = -1;
        for (let i = 0; i < this.captionSystem.audioSystem.words.length; i++) {
            const word = this.captionSystem.audioSystem.words[i];
            if (currentTime >= word.start && currentTime <= word.end) {
                activeWordIndex = i;
                break;
            }
        }
        
        // If no exact match, find closest word
        if (activeWordIndex === -1) {
            let closestDistance = Infinity;
            for (let i = 0; i < this.captionSystem.audioSystem.words.length; i++) {
                const word = this.captionSystem.audioSystem.words[i];
                const distance = Math.min(Math.abs(currentTime - word.start), Math.abs(currentTime - word.end));
                if (distance < closestDistance) {
                    closestDistance = distance;
                    activeWordIndex = i;
                }
            }
        }
        
        // Highlight the paused word with bold white text (same font size)
        if (activeWordIndex >= 0) {
            const textDisplay = this.captionSystem.audioSystem.elements.textDisplay;
            const words = textDisplay.querySelectorAll('.word');
            if (words[activeWordIndex]) {
                words[activeWordIndex].classList.add('paused-word');
                words[activeWordIndex].style.opacity = '1.0';
                words[activeWordIndex].style.color = '#ffffff';
                words[activeWordIndex].style.fontWeight = 'bold';
                // No font-size change - keeps uniform text flow
            }
        }
    }
}
