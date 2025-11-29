// Audio Input Display Module - Handles text display and page management
class AudioSystemInputDataDisplay {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
        this.clickToSeekManager = new ClickToSeekManager();
        this.pageLineBalancer = new PageLineBalancer();
    }
    
    displayFullChunk(chunkIndex) {
        // Defer to next tick to ensure DOM rendering is complete
        setTimeout(() => {
            this._displayFullChunkInternal(chunkIndex);
        }, 0);
    }
    
    _displayFullChunkInternal(chunkIndex) {
        const textDisplay = this.audioSystem.elements.textDisplay;
        if (!textDisplay) {
            console.error('Text display element not found');
            return;
        }
        
        // Set fullchunk mode and clear existing content
        textDisplay.className = 'text-display fullchunk-mode';
        textDisplay.innerHTML = '';
        
        // Get fullChunkDisplay data for the specified chunk
        const chunk = this.audioSystem.audioChunks && this.audioSystem.audioChunks[chunkIndex];
        if (!chunk || !chunk.fullChunkDisplay || !chunk.fullChunkDisplay.displayElements) {
            // Fallback to old method if fullChunkDisplay is not available
            if (this.audioSystem.words && this.audioSystem.words.length > 0) {
                const textContent = this.clickToSeekManager.processWords(
                    this.audioSystem.words,
                    textDisplay,
                    this.audioSystem,
                    true // useFullWidth = true for 90% width
                );
                textDisplay.appendChild(textContent);
            }
            return;
        }

        const displayElements = chunk.fullChunkDisplay.displayElements;
        
        // Count element types
        const elementCounts = {};
        displayElements.forEach(el => {
            elementCounts[el.type] = (elementCounts[el.type] || 0) + 1;
        });

        // Create flex structure
        const textFlex = document.createElement('div');
        textFlex.className = 'text-flex';
        
        const textContent = document.createElement('div');
        textContent.className = 'text-content';

        // Check if we have pages data for page-based display
        if (this.audioSystem.pages && this.audioSystem.pages.length > 0) {
            // Build page boundary map from pages
            const pageBoundaries = this.audioSystem.pages.map((page, idx) => ({
                pageIndex: idx,
                startWordIndex: page.words[0].index,
                endWordIndex: page.words[page.words.length - 1].index,
                startTime: page.startTime,
                endTime: page.endTime
            }));
            
            // Helper: Add extra space after sentence-ending punctuation for better readability
            const addExtraSpaceAfterSentence = (container) => {
                const lastChild = container.lastChild;
                if (lastChild && lastChild.nodeType === Node.TEXT_NODE) {
                    const text = lastChild.textContent;
                    // If ends with sentence punctuation (. ! ? : ; -) followed by space, add another space
                    if (/[.!?:;-]\s$/.test(text)) {
                        lastChild.textContent = text + ' ';  // Add extra space (makes two total)
                    }
                }
            };
            
            let currentPageIndex = 0;
            let currentPageContainer = document.createElement('span');
            currentPageContainer.className = 'page-container';
            currentPageContainer.setAttribute('data-page-index', pageBoundaries[0].pageIndex);
            currentPageContainer.setAttribute('data-start-time', pageBoundaries[0].startTime);
            currentPageContainer.setAttribute('data-end-time', pageBoundaries[0].endTime);
            
            let pageElementCounts = {};
            
            // Process each display element and group into pages
            for (let i = 0; i < displayElements.length; i++) {
                const element = displayElements[i];
                
                // Check if we need to start a new page (when word belongs to next page)
                if (element.type === 'word' && currentPageIndex < pageBoundaries.length - 1) {
                    const currentBoundary = pageBoundaries[currentPageIndex];
                    const nextBoundary = pageBoundaries[currentPageIndex + 1];
                    
                    // If this word's index is beyond current page, start new page
                    if (element.wordIndex > currentBoundary.endWordIndex && 
                        element.wordIndex >= nextBoundary.startWordIndex) {
                        pageElementCounts = {};
                        
                        // Add extra space if page ends with sentence punctuation
                        addExtraSpaceAfterSentence(currentPageContainer);
                        
                        // Append current page to textContent
                        textContent.appendChild(currentPageContainer);
                        
                        // Start new page
                        currentPageIndex++;
                        currentPageContainer = document.createElement('span');
                        currentPageContainer.className = 'page-container';
                        currentPageContainer.setAttribute('data-page-index', pageBoundaries[currentPageIndex].pageIndex);
                        currentPageContainer.setAttribute('data-start-time', pageBoundaries[currentPageIndex].startTime);
                        currentPageContainer.setAttribute('data-end-time', pageBoundaries[currentPageIndex].endTime);
                    }
                }
                
                // Track element counts per page
                pageElementCounts[element.type] = (pageElementCounts[element.type] || 0) + 1;
                
                // Add element to current page container
                switch (element.type) {
                    case 'word':
                        currentPageContainer.appendChild(document.createTextNode(element.word + ' '));
                        break;
                    
                    case 'paragraph-break':
                        const paragraphBreak = document.createElement('br');
                        currentPageContainer.appendChild(paragraphBreak);
                        const paragraphBreak2 = document.createElement('br');
                        paragraphBreak2.className = 'paragraph-break';
                        currentPageContainer.appendChild(paragraphBreak2);
                        break;
                    
                    case 'line-break':
                        const lineBreak = document.createElement('br');
                        lineBreak.className = 'line-break';
                        currentPageContainer.appendChild(lineBreak);
                        break;
                    
                    case 'bullet-item':
                        const bulletDiv = document.createElement('div');
                        bulletDiv.className = `list-item bullet-item indent-${element.indent || 0}`;
                        bulletDiv.setAttribute('data-bullet', element.bullet || '•');
                        bulletDiv.setAttribute('data-start-time', element.startTime || 0);
                        bulletDiv.setAttribute('data-word-index', element.wordIndex || 0);
                        bulletDiv.textContent = element.content;
                        currentPageContainer.appendChild(bulletDiv);
                        break;
                    
                    case 'numbered-item':
                        const numberedDiv = document.createElement('div');
                        numberedDiv.className = `list-item numbered-item indent-${element.indent || 0}`;
                        numberedDiv.setAttribute('data-number', element.number || '1.');
                        numberedDiv.setAttribute('data-start-time', element.startTime || 0);
                        numberedDiv.setAttribute('data-word-index', element.wordIndex || 0);
                        numberedDiv.textContent = element.content;
                        currentPageContainer.appendChild(numberedDiv);
                        break;
                }
            }
            
            // Add extra space if final page ends with sentence punctuation
            addExtraSpaceAfterSentence(currentPageContainer);
            
            // Append final page container
            if (currentPageContainer.childNodes.length > 0) {
                textContent.appendChild(currentPageContainer);
            }
        }
        
        // Build flex structure
        textFlex.appendChild(textContent);
        textDisplay.appendChild(textFlex);
        
        // Add click-to-page functionality for Full Chunk Display
        setTimeout(() => {
            this.clickToSeekManager.addPageClickHandlers(this.audioSystem);
            
            // Determine which page to highlight
            let pageToHighlight = 0;
            
            // If selectedWordStartTime exists, find which page contains that time
            if (this.audioSystem.selectedWordStartTime !== undefined && this.audioSystem.pages) {
                for (let i = 0; i < this.audioSystem.pages.length; i++) {
                    const page = this.audioSystem.pages[i];
                    if (this.audioSystem.selectedWordStartTime >= page.startTime && 
                        this.audioSystem.selectedWordStartTime <= page.endTime) {
                        pageToHighlight = i;
                        break;
                    }
                }
            }
            
            // Auto-select the determined page
            const pageContainer = this.audioSystem.elements.textDisplay.querySelector(`.page-container[data-page-index="${pageToHighlight}"]`);
            if (pageContainer && this.audioSystem.pages && this.audioSystem.pages[pageToHighlight]) {
                this.clickToSeekManager.setSelectedPage(
                    pageContainer, 
                    pageToHighlight, 
                    this.audioSystem.pages[pageToHighlight].startTime,
                    this.audioSystem
                );
            }
        }, 0);
        
        // Initialize dev controls now that text content exists
        setTimeout(() => {
            if (this.audioSystem.devControls) {
                this.audioSystem.devControls.initializeDefaults();
            }
        }, 50);
        
        // Calculate optimal font size for all states
        setTimeout(() => this.calculateOptimalFontSize(), 100);
        
        // Restore user font size preferences if they exist (for FullChunkDisplay)
        setTimeout(() => {
            if (this.audioSystem.userNotPlayingFontSize) {
                document.documentElement.style.setProperty(
                    '--not-playing-font-size', 
                    `${this.audioSystem.userNotPlayingFontSize}px`
                );
            }
        }, 150);
    }

    
    updateTextDisplayForPage(pageIndex) {
        this._updateTextDisplayForPageInternal(pageIndex);
    }
    
    _updateTextDisplayForPageInternal(pageIndex) {
        if (!this.audioSystem.pages || this.audioSystem.pages.length === 0) {
            return;
        }
        
        if (pageIndex < 0 || pageIndex >= this.audioSystem.pages.length) {
            return;
        }
        
        const textDisplay = this.audioSystem.elements.textDisplay;
        if (!textDisplay) return;
        
        // Set transition flag to prevent updates during transition
        this.audioSystem.isTransitioningPage = true;
        
        // Fade out, then rebuild, then fade in (uses existing CSS transition)
        textDisplay.style.opacity = '0';
        
        requestAnimationFrame(() => {
            // Set pages mode and clear existing content
            textDisplay.className = 'text-display pages-mode';
            textDisplay.innerHTML = '';
            
            // Get words for the new page
            const pageWords = this.audioSystem.pages[pageIndex].words;

            // ADD WORD COUNT LOGGING:
            console.log(`📊 [FRONTEND] Page ${pageIndex}: displaying ${pageWords.length} words`);
            
            // Stage 1: ClickToSeekManager creates word spans with click handlers
            const textContent = this.clickToSeekManager.processWords(
                pageWords, 
                textDisplay, 
                this.audioSystem,
                false // useFullWidth = false for 75% width during active playback
            );
            
            // Add the text content wrapper to the text display
            textDisplay.appendChild(textContent);
            
            // Stage 2: PageLineBalancer optimizes line layout for better readability
            // Only show content after LineBalancer completes to prevent reflow
            setTimeout(() => {
                this.pageLineBalancer.optimizeLineBalance(textDisplay, () => {
                    // Fade back in after LineBalancer completes layout
            requestAnimationFrame(() => {
                textDisplay.style.opacity = '1';
                // Clear transition flag after fade-in completes
                this.audioSystem.isTransitioningPage = false;
            });
                });
            }, 0);
            
            // Apply initial highlighting to prevent text flash
            this.applyInitialHighlighting();
            
            // Initialize dev controls for page updates too
            setTimeout(() => {
                if (this.audioSystem.devControls) {
                    this.audioSystem.devControls.initializeDefaults();
                }
                
                // Restore user font size preferences if they exist (for PageView)
                if (this.audioSystem.userPlayingFontSize) {
                    document.documentElement.style.setProperty(
                        '--playing-font-size', 
                        `${this.audioSystem.userPlayingFontSize}px`
                    );
                }
            }, 50);
        });
        
    }
    
    showPlaybackInterface() {
        
        // Show audio playback section first
        const audioPlaybackSection = this.audioSystem.elements.audioPlaybackSection;
        if (audioPlaybackSection) {
            audioPlaybackSection.style.display = 'block';
        }
        
        // Set overlay to playback mode
        this.audioSystem.setOverlayMode('playback');
        
        // Hide the input elements and show playback controls
        const textInputSection = document.querySelector('.text-input-section');
        const statusSection = document.querySelector('.status-section');
        const playbackControlRow = document.querySelector('.controlrow-playback');
        const inputControlRow = document.querySelector('.controlrow-input');

        if (textInputSection) textInputSection.style.display = 'none';
        if (statusSection) statusSection.style.display = 'none';
        if (inputControlRow) inputControlRow.style.display = 'none';
        if (playbackControlRow) playbackControlRow.style.display = 'flex';
        
        // Fade watermark when playback starts (but keep visible)
        const watermark = document.querySelector('.watermark');
        if (watermark) {
            watermark.style.opacity = '0.25';
        }
        
        // Refresh button visibility is now handled in full chunk display creation
        
    }

    showInputInterface() {
        // Set overlay to input mode
        this.audioSystem.setOverlayMode('input');

        // Show input elements and hide playback controls
        const textInputSection = document.querySelector('.text-input-section');
        const statusSection = document.querySelector('.status-section');
        const playbackControlRow = document.querySelector('.controlrow-playback');
        const inputControlRow = document.querySelector('.controlrow-input');

        if (textInputSection) textInputSection.style.display = 'block';
        if (statusSection) statusSection.style.display = 'block';
        if (inputControlRow) inputControlRow.style.display = 'flex';
        if (playbackControlRow) playbackControlRow.style.display = 'none';

        // Hide audio playback section
        const audioPlaybackSection = this.audioSystem.elements.audioPlaybackSection;
        if (audioPlaybackSection) {
            audioPlaybackSection.style.display = 'none';
        }

        // Restore watermark to normal opacity when returning to input
        const watermark = document.querySelector('.watermark');
        if (watermark) {
            watermark.style.opacity = '';
        }
        
        // Refresh button visibility is now handled in full chunk display creation

    }
    
    getCurrentPageForTime(currentTime) {

        // Get the pages array, which now includes 'transitionInfo' from the backend
        const pages = this.audioSystem.pages;

        console.log(`🔍 [PAGE-SELECTOR] Finding page for time=${currentTime.toFixed(3)}s, pages available: ${pages?.length || 0}`);

        if (!pages || pages.length === 0) {
            console.log('⚠️ [PAGE-SELECTOR] No pages available, returning 0');
            return 0; // Default to page 0 if no pages exist
        }

        // Iterate backward through pages to find the last page where currentTime >= startTime
        for (let i = pages.length - 1; i >= 0; i--) {
            const page = pages[i];

            console.log(`🔍 [PAGE-SELECTOR] Checking page ${i} (index ${page.pageIndex}): startTime=${page.startTime?.toFixed(3)}s`);

            if (currentTime >= page.startTime) {
                console.log(`✅ [PAGE-SELECTOR] Found current page ${page.pageIndex}`);

                // Check if this page has transitionInfo (indicating a gap after it)
                if (page.transitionInfo) {
                    console.log(`🔄 [PAGE-SELECTOR] Page ${page.pageIndex} has transitionInfo: midpoint=${page.transitionInfo.gapMidpointTime.toFixed(3)}s`);

                    // If currentTime is at or after the midpoint, show the NEXT page
                    if (currentTime >= page.transitionInfo.gapMidpointTime) {
                        console.log(`🚀 [PAGE-SELECTOR] Time ${currentTime.toFixed(3)}s >= midpoint, PRE-EMPTIVELY showing NEXT page ${page.pageIndex + 1}`);
                        return page.pageIndex + 1;
                    } else {
                        console.log(`📍 [PAGE-SELECTOR] Time ${currentTime.toFixed(3)}s < midpoint, showing CURRENT page ${page.pageIndex}`);
                        return page.pageIndex;
            }
                } else {
                    // No transitionInfo means no gap after this page
                    console.log(`✅ [PAGE-SELECTOR] No transitionInfo, returning current page ${page.pageIndex}`);
                    return page.pageIndex;
                }
            }
        }

        // If we get here, time is before all pages
        console.log(`🏠 [PAGE-SELECTOR] Time ${currentTime.toFixed(3)}s is before first page, returning 0`);
        return 0;
    }
    
    applyInitialHighlighting() {
        // Apply initial highlighting to prevent text flash
        const textDisplay = this.audioSystem.elements.textDisplay;
        if (!textDisplay) return;
        
        const words = textDisplay.querySelectorAll('.word');
        words.forEach(word => {
            word.style.opacity = '0.3'; // Use the new default opacity for past/future words
        });
    }
    
    calculateOptimalFontSize() {
        // Dynamic font sizing now handled by dev panel controls
        // This function preserved for compatibility but functionality moved to dev controls
        // No longer needed - font sizes controlled by dev panel
    }
}