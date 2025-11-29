// Caption Original - Brain-friendly word highlighting (Original Style)
class CaptionOriginal {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
        this.highlightingInterval = null;
        this.activeWordIndices = [];
        this.lookaheadIndices = [];
        this.lookbackIndices = [];
        this.currentPrimaryWordIndex = null;
        this.lookaheadCount = 1;
        this.lookbackCount = 1;
        this.isPauseState = false;
        this.pauseStateHandler = new PauseStateHandler(this);
    }
    
    // Core highlighting methods required for all captioning systems
    getActiveWordIndices() {
        return this.activeWordIndices;
    }
    
    getLookaheadIndices() {
        return this.lookaheadIndices;
    }
    
    getLookbackIndices() {
        return this.lookbackIndices;
    }
    
    getCurrentPrimaryWordIndex() {
        return this.currentPrimaryWordIndex;
    }
    
    getLookaheadCount() {
        return this.lookaheadCount;
    }
    
    setLookaheadCount(count) {
        this.lookaheadCount = count;
    }
    
    getLookbackCount() {
        return this.lookbackCount;
    }
    
    setLookbackCount(count) {
        this.lookbackCount = count;
    }
    
    startHighlighting() {
        this.isPauseState = false;
        this.pauseStateHandler.restoreNormalTextSize();
        this.setupHighlightingInterval();
    }
    
    stopHighlighting() {
        if (this.highlightingInterval) {
            clearInterval(this.highlightingInterval);
            this.highlightingInterval = null;
        }
        
        this.isPauseState = true;
        
        // Delay showing pause state to let timeupdate events finish
        setTimeout(() => {
            if (this.isPauseState) {
                this.pauseStateHandler.showPauseState();
            }
        }, 150);
    }
    
    setupHighlightingInterval() {
        if (this.highlightingInterval) {
            clearInterval(this.highlightingInterval);
        }
        
        this.highlightingInterval = setInterval(() => {
            if (this.audioSystem.currentAudioElement && !this.audioSystem.currentAudioElement.paused) {
                const currentTime = this.audioSystem.currentAudioElement.currentTime;
                this.updateWordHighlighting(currentTime);
            }
        }, 100);
    }
    
    updateWordHighlighting(currentTime) {
        
        // Use page words if available, otherwise fall back to full words array
        const words = this.getCurrentPageWords();
        if (!words || words.length === 0) return;
        
        // Find active words with buffer
        const buffer = 0.1;
        const activeWordIndices = [];
        
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const startBuffer = i === 0 ? 0.0 : buffer;
            const effectiveStart = word.start - startBuffer;
            const effectiveEnd = word.end + buffer;
            
            if (currentTime >= effectiveStart && currentTime <= effectiveEnd) {
                activeWordIndices.push(i);
            }
        }
        
        // Find primary word
        const primaryWord = this.findWordAtTime(currentTime, words);
        const primaryIndex = primaryWord ? words.indexOf(primaryWord) : 0;
        
        // Calculate lookahead and lookback indices
        const lookaheadIndices = [];
        for (let k = 1; k <= this.lookaheadCount; k++) {
            const idx = primaryIndex + k;
            if (idx < words.length) lookaheadIndices.push(idx);
        }
        
        const lookbackIndices = [];
        for (let k = 1; k <= this.lookbackCount; k++) {
            const idx = primaryIndex - k;
            if (idx >= 0) lookbackIndices.push(idx);
        }
        
        // Only update if there's a change
        const hasChanged = this.hasHighlightingChanged(activeWordIndices, lookaheadIndices, lookbackIndices, primaryIndex);
        
        if (hasChanged) {
            this.updateHighlightingStates(activeWordIndices, lookaheadIndices, lookbackIndices, primaryIndex);
        }
    }
    
    getCurrentPageWords() {
        // Use page words if available, otherwise fall back to full words array
        if (this.audioSystem.pages && this.audioSystem.pages.length > 0) {
            const pageIndex = this.audioSystem.currentPageIndex || 0;
            // Add safety check for page index bounds and page existence
            if (pageIndex >= 0 && pageIndex < this.audioSystem.pages.length) {
                const page = this.audioSystem.pages[pageIndex];
                if (page && page.words && Array.isArray(page.words)) {
                    return page.words;
                }
            }
        }
        // Fallback to main words array if page words aren't available
        return this.audioSystem.words;
    }
    
    findWordAtTime(targetTime, words) {
        if (!words || words.length === 0) return null;
        
        // Find word that contains the target time
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (targetTime >= word.start && targetTime <= word.end) {
                return word;
            }
        }
        
        // Find closest word
        let closestWord = null;
        let minDistance = Infinity;
        
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const distanceToStart = Math.abs(targetTime - word.start);
            const distanceToEnd = Math.abs(targetTime - word.end);
            const minWordDistance = Math.min(distanceToStart, distanceToEnd);
            
            if (minWordDistance < minDistance) {
                minDistance = minWordDistance;
                closestWord = word;
            }
        }
        
        return closestWord;
    }
    
    hasHighlightingChanged(activeIndices, lookaheadIndices, lookbackIndices, primaryIndex) {
        return activeIndices.length !== this.activeWordIndices.length ||
               !this.activeWordIndices.every((index, i) => index === activeIndices[i]) ||
               lookaheadIndices.length !== this.lookaheadIndices.length ||
               !this.lookaheadIndices.every((index, i) => index === lookaheadIndices[i]) ||
               lookbackIndices.length !== this.lookbackIndices.length ||
               !this.lookbackIndices.every((index, i) => index === lookbackIndices[i]) ||
               this.currentPrimaryWordIndex !== primaryIndex;
    }
    
    updateHighlightingStates(activeIndices, lookaheadIndices, lookbackIndices, primaryIndex) {
        
        // Clear all previous highlights
        const allWords = this.audioSystem.elements.textDisplay.querySelectorAll('.word');
        allWords.forEach(wordElement => {
            wordElement.classList.remove('active', 'lookahead', 'lookback', 'inactive-read', 'inactive-future');
            wordElement.style.opacity = '';
            wordElement.style.color = ''; // Clear any pause state color overrides
        });
        
        // Store new indices
        this.activeWordIndices = activeIndices;
        this.lookaheadIndices = lookaheadIndices;
        this.lookbackIndices = lookbackIndices;
        this.currentPrimaryWordIndex = primaryIndex;
        
        // Apply visual states with enhanced opacity values
        allWords.forEach((wordElement, i) => {
            if (activeIndices.includes(i)) {
                wordElement.classList.add('active');
                wordElement.style.opacity = '1.0';
                
            } else if (lookbackIndices.includes(i)) {
                wordElement.classList.add('lookback');
                wordElement.style.opacity = '0.55'; // 55% for lookback
            } else if (lookaheadIndices.includes(i)) {
                wordElement.classList.add('lookahead');
                wordElement.style.opacity = '0.55'; // 55% for lookahead
            } else {
                // Past and future words at 30% - no invisible words
                if (i < primaryIndex) {
                    wordElement.classList.add('inactive-read');
                    wordElement.style.opacity = '0.3'; // 30% for past words
                } else {
                    wordElement.classList.add('inactive-future');
                    wordElement.style.opacity = '0.3'; // 30% for future words
                }
            }
        });
    }
    
    highlightWordAtTime(targetTime) {
        const words = this.getCurrentPageWords();
        if (!words || words.length === 0) return;
        
        const targetWord = this.findWordAtTime(targetTime, words);
        if (targetWord) {
            const targetIndex = words.indexOf(targetWord);
            this.applyLookaheadFromPrimaryIndex(targetIndex);
        }
    }
    
    applyLookaheadFromPrimaryIndex(primaryIndex) {
        const words = this.getCurrentPageWords();
        if (!words || words.length === 0) return;
        
        // Calculate indices
        const activeIndices = [primaryIndex];
        const lookaheadIndices = [];
        const lookbackIndices = [];
        
        for (let k = 1; k <= this.lookaheadCount; k++) {
            const idx = primaryIndex + k;
            if (idx < words.length) lookaheadIndices.push(idx);
        }
        
        for (let k = 1; k <= this.lookbackCount; k++) {
            const idx = primaryIndex - k;
            if (idx >= 0) lookbackIndices.push(idx);
        }
        
        // Update highlighting
        this.updateHighlightingStates(activeIndices, lookaheadIndices, lookbackIndices, primaryIndex);
    }
    
    cleanup() {
        this.stopHighlighting();
        this.isPauseState = false;
        this.pauseStateHandler.restoreNormalTextSize();
        this.activeWordIndices = [];
        this.lookaheadIndices = [];
        this.lookbackIndices = [];
        this.currentPrimaryWordIndex = null;
    }
}