// Click To Seek Manager - Handles click-to-seek functionality and highlighting system preparation
class ClickToSeekManager {
    constructor() {
        // Simple utility class - no complex state needed
    }

    // Create word spans with proper data attributes and click handlers
    createWordSpans(words, audioSystem) {
        if (!words || words.length === 0) {
            return document.createElement('div');
        }

        const textContent = document.createElement('div');
        textContent.className = 'text-content';

        words.forEach((wordData, index) => {
            const span = document.createElement('span');
            span.textContent = wordData.word;
            span.className = 'word';
            span.dataset.index = wordData.originalIndex;
            span.dataset.start = wordData.start;
            span.dataset.end = wordData.end;

            // Add click to seek functionality
            this.addClickHandler(span, wordData, audioSystem);

            textContent.appendChild(span);
            textContent.appendChild(document.createTextNode(' '));
        });

        return textContent;
    }

    // Add click-to-seek functionality to a word span
    addClickHandler(wordSpan, wordData, audioSystem) {
        wordSpan.addEventListener('click', () => {
            if (!audioSystem.currentAudioElement) return;

            const startTime = parseFloat(wordData.start);
            audioSystem.currentAudioElement.currentTime = startTime;

            // Update highlighting
            audioSystem.captioning.updateWordHighlighting(startTime);

            // Remove the 'playing' class to ensure the correct view is shown
            const textDisplay = audioSystem.elements.textDisplay;
            if (textDisplay.classList.contains('playing')) {
                textDisplay.classList.remove('playing');
            }

        });
    }

    // Add click handlers to existing word spans (for FullChunkDisplay integration)
    addClickHandlersToExistingSpans(audioSystem) {
        const textDisplay = audioSystem.elements.textDisplay;
        if (!textDisplay) return;

        const wordSpans = textDisplay.querySelectorAll('.word');
        wordSpans.forEach(span => {
            const startTime = span.dataset.startTime;
            
            if (startTime !== undefined) {
                // Add click handler for selected word functionality
                span.addEventListener('click', () => {
                    this.setSelectedWord(span, parseFloat(startTime), audioSystem);
                });
            }
        });
    }

    // Set selected word and update visual state
    setSelectedWord(wordSpan, startTime, audioSystem) {
        // Remove selected class from all words
        const textDisplay = audioSystem.elements.textDisplay;
        const allWords = textDisplay.querySelectorAll('.word');
        allWords.forEach(word => word.classList.remove('selected'));

        // Apply selected class to clicked word
        wordSpan.classList.add('selected');

        // Store the selected word start time
        audioSystem.selectedWordStartTime = startTime;
    }

    // Set selected page and update visual state
    setSelectedPage(pageContainer, pageIndex, startTime, audioSystem) {
        // Remove selected class from all pages
        const textDisplay = audioSystem.elements.textDisplay;
        const allPages = textDisplay.querySelectorAll('.page-container');
        allPages.forEach(page => page.classList.remove('selected'));
        
        // Add selected class to clicked page
        pageContainer.classList.add('selected');
        
        // Store selected page info
        audioSystem.selectedPageIndex = pageIndex;
        audioSystem.selectedWordStartTime = startTime; // Reuse existing property for compatibility
    }

    // Add click handlers to page containers (for Full Chunk Display)
    addPageClickHandlers(audioSystem) {
        const textDisplay = audioSystem.elements.textDisplay;
        if (!textDisplay) return;
        
        const pageContainers = textDisplay.querySelectorAll('.page-container');
        pageContainers.forEach(container => {
            const pageIndex = parseInt(container.dataset.pageIndex);
            const startTime = parseFloat(container.dataset.startTime);
            
            if (!isNaN(pageIndex) && !isNaN(startTime)) {
                container.addEventListener('click', () => {
                    this.setSelectedPage(container, pageIndex, startTime, audioSystem);
                });
            }
        });
    }

    // Main method to process words for Pages Display
    processWords(words, container, audioSystem, useFullWidth) {
        // Preserve original word indices for highlighting
        const wordsWithIndices = words.map((word, index) => ({
            ...word,
            originalIndex: index
        }));

        // Create word spans with click handlers
        return this.createWordSpans(wordsWithIndices, audioSystem);
    }
}