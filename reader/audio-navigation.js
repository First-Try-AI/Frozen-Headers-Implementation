// Audio Navigation Module - Chunk switching and transitions
class AudioNavigation {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
    }
    
    setupNavigationListeners() {
        // Add click handlers for progress segments
        /* document.addEventListener('click', (e) => {
            const segment = e.target.closest('[data-chunk-index]');
            if (segment) {
                const chunkIndex = parseInt(segment.dataset.chunkIndex);
                this.handleProgressSegmentClick(e, chunkIndex);
            }
        }); */
    }
    
    handleProgressSegmentClick(e, chunkIndex) {
        
        // Remove playing class to reset to initial state styling
        const textDisplay = this.audioSystem.elements.textDisplay;
        if (textDisplay) {
            textDisplay.classList.remove('playing');
        }

        // Always pause audio first if it's playing
        if (this.audioSystem.currentAudioElement && !this.audioSystem.currentAudioElement.paused) {
            this.audioSystem.playback.pauseAudio();
        }
        
        // If clicking the current chunk, just ensure full text is shown
        if (chunkIndex === this.audioSystem.currentChunkIndex) {
            // Store current playback time to set as selected word
            const currentTime = this.audioSystem.currentAudioElement ? this.audioSystem.currentAudioElement.currentTime : 0;
            this.audioSystem.selectedWordStartTime = currentTime;
            
            this.audioSystem.input.dataDisplay.displayFullChunk(chunkIndex);
            return;
        }
        
        // For any other chunk, switch to it
        this.switchToChunk(chunkIndex);
    }
    
    async switchToChunk(chunkIndex) {
        
        // Pause current audio if playing
        if (this.audioSystem.currentAudioElement && !this.audioSystem.currentAudioElement.paused) {
            this.audioSystem.playback.pauseAudio();
        }
        
        // Reset selected word time to start of chunk when switching to a new chunk
        this.audioSystem.selectedWordStartTime = 0;
        
        // Load the requested chunk and show full text
        const success = await this.audioSystem.input.cloudrun.loadChunk(chunkIndex, false);
        
        if (success) {
            // Show initial state for nav bar clicks
            this.audioSystem.input.dataDisplay.displayFullChunk(chunkIndex);
            
            this.audioSystem.currentChunkIndex = chunkIndex;
            this.audioSystem.currentPageIndex = 0; // Reset to first page of new chunk
            
            // Update progress bars to show previous chunks as completed
            this.audioSystem.progress.updateProgressBars();
            
            // Reset button state to show ready to play (like initial load)
            const playButton = document.querySelector('.play-button');
            if (playButton) {
                playButton.textContent = '▶ Play Audio';
                playButton.classList.remove('pause-state');
                playButton.classList.add('play-state');
            }
        }
    }
    
    async handleAudioEnded() {
        // Prevent multiple simultaneous calls to handleAudioEnded
        if (this.audioSystem.isTransitioningChunks) {
            return;
        }

        this.audioSystem.isTransitioningChunks = true;

        try {

            // Check if there's a next chunk available
            const nextChunkIndex = this.audioSystem.currentChunkIndex + 1;
            const hasNextChunk = this.audioSystem.audioChunks && nextChunkIndex < this.audioSystem.audioChunks.length;

            if (hasNextChunk) {

                // Load the next chunk and show only the first page for seamless transition
                const success = await this.audioSystem.input.cloudrun.loadChunk(nextChunkIndex, true);

                if (success) {
                    // Update current chunk index
                    this.audioSystem.currentChunkIndex = nextChunkIndex;
                    this.audioSystem.currentPageIndex = 0;

                    // Update color for new chunk
                    this.audioSystem.updateHighlightColor();

                    // Update progress bars
                    this.audioSystem.progress.rebuildProgressBars();

                    // Update page display
                    this.audioSystem.playback.updatePageDisplay();

                    // Auto-play next chunk directly (skip initialization UI)
                    await this.audioSystem.currentAudioElement.play();
                    
                    // Activate background dimming
                    if (this.audioSystem.controls && this.audioSystem.controls.activateDimming) {
                        this.audioSystem.controls.activateDimming();
                    }
                    
                    // Start captioning system highlighting
                    if (this.audioSystem.captioning) {
                        this.audioSystem.captioning.startHighlighting();
                    }
                    
                    // Add playing class for larger font size
                    const textDisplay = this.audioSystem.elements.textDisplay;
                    if (textDisplay) {
                        textDisplay.classList.add('playing');
                    }
                    
                    // Update button state
                    const playButton = document.querySelector('.play-button');
                    if (playButton) {
                        playButton.textContent = '⏸ Pause Audio';
                        playButton.classList.remove('play-state');
                        playButton.classList.add('pause-state');
                    }
                } else {
                    console.error('Failed to load next chunk');
                    this.handlePlaybackComplete();
                }
            } else {
                this.handlePlaybackComplete();
            }
        } finally {
            // Reset the transition flag after a short delay to allow the new audio to start
            setTimeout(() => {
                this.audioSystem.isTransitioningChunks = false;
            }, 100);
        }
    }
    
    async handlePlaybackComplete() {
        
        // Un-dim controls on completion
        const header = document.querySelector('.overlay-header');
        const controls = this.audioSystem.elements.audioControls;
        if (header) header.classList.remove('playback-dim');
        if (controls) controls.classList.remove('playback-dim');

        // Keep background dimming active during slideshow cycling
        // Dimming remains at 85% throughout the entire slideshow experience
        
        // Reset selected word time to start when playback completes
        this.audioSystem.selectedWordStartTime = 0;
        
        // Load the first chunk (chunk 0) to cycle back to beginning, showing full text
        const success = await this.audioSystem.input.cloudrun.loadChunk(0, false);
        
        if (success) {
            // Update current chunk index to first chunk
            this.audioSystem.currentChunkIndex = 0;
            this.audioSystem.currentPageIndex = 0;
            
            // Update progress bars to show we're back at the beginning
            this.audioSystem.progress.rebuildProgressBars();
            
            // Update page display for first chunk
            this.audioSystem.playback.updatePageDisplay();
            
            // Reset button state to show ready to play (like initial load)
            const playButton = document.querySelector('.play-button');
            if (playButton) {
                playButton.textContent = '▶ Play Audio';
                playButton.classList.remove('pause-state');
                playButton.classList.add('play-state');
            }
            
            // Remove playing class to ensure proper text alignment
            const textDisplay = this.audioSystem.elements.textDisplay;
            if (textDisplay) {
                textDisplay.classList.remove('playing');
            }
            
            // Stop highlighting
            if (this.audioSystem.captioning && this.audioSystem.captioning.stopHighlighting) {
                this.audioSystem.captioning.stopHighlighting();
            }
            
            // Recalculate optimal font size for reading
            setTimeout(() => {
                if (this.audioSystem.input.dataDisplay.calculateOptimalFontSize) {
                    this.audioSystem.input.dataDisplay.calculateOptimalFontSize();
                }
            }, 100);
            
            // Show cycling status
            this.audioSystem.input.ui.showStatus('Cycled back to beginning', 'success');
        } else {
            console.error('Failed to load first chunk for cycling');
            // Fallback to original behavior if loading fails
            this.audioSystem.input.ui.showStatus('Playback complete', 'success');
        }
    }
}