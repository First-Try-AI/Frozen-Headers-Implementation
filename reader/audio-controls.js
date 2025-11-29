// Audio Controls Module - Play/pause/seek controls
class AudioControls {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
        this.dimmingDiv = null;
        this.dimmingOpacity = 85; // Default opacity percentage
        this.isDimmingActive = false;
        this.speedDisplayTimeout = null;
        this.createDimmingDiv();
    }
    
    createDimmingDiv() {
        // Create full-screen dimming overlay
        this.dimmingDiv = document.createElement('div');
        this.dimmingDiv.id = 'backgroundDimmer';
        this.dimmingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: #000000;
            opacity: 0;
            pointer-events: none;
            z-index: 5;
            transition: opacity 0.3s ease;
            display: none;
        `;
        
        // Add to body
        document.body.appendChild(this.dimmingDiv);
    }
    
    activateDimming() {
        if (this.isDimmingActive) return;

        // Dimming div should already be created and visible for live preview
        if (this.dimmingDiv) {
            this.dimmingDiv.style.display = 'block';
            this.dimmingDiv.style.opacity = this.dimmingOpacity / 100;
            this.isDimmingActive = true;
        }
    }
    
    deactivateDimming() {
        if (!this.dimmingDiv || !this.isDimmingActive) return;

        this.dimmingDiv.style.opacity = '0';
        this.isDimmingActive = false;
    }
    
    updateDimmingOpacity(opacity) {
        const newOpacity = Math.max(0, Math.min(95, parseInt(opacity)));
        this.dimmingOpacity = newOpacity;

        // Always update dimming div when it exists, make it visible for live preview
        if (this.dimmingDiv) {
            this.dimmingDiv.style.display = 'block';
            this.dimmingDiv.style.opacity = this.dimmingOpacity / 100;
        }

    }
    
    setupEventListeners() {
        // Test connection button
        const testConnectionBtn = document.getElementById('testConnectionBtn');
        if (testConnectionBtn) {
            testConnectionBtn.addEventListener('click', () => {
                this.testConnection();
            });
        }

        // Play/Pause button from the main UI
        const playButton = document.getElementById('playButton');
        if (playButton) {
            playButton.addEventListener('click', () => {
                this.togglePlayback();
            });
        }

        // Keyboard controls for playback speed (0.5% steps) and font size
        document.addEventListener('keydown', (e) => {
            // Only handle if audio is loaded and not in input field
            if (this.audioSystem.currentAudioElement && 
                !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const newSpeed = this.audioSystem.playbackSpeed - 0.01;
                    this.setPlaybackSpeed(newSpeed);
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    const newSpeed = this.audioSystem.playbackSpeed + 0.01;
                    this.setPlaybackSpeed(newSpeed);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.adjustFontSize(1); // Increase by 1px
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.adjustFontSize(-1); // Decrease by 1px
                }
            }
        });
    }
    
    createAudioControls() {
        const audioControls = this.audioSystem.elements.audioControls;
        audioControls.innerHTML = '';
        
        // Play/Pause button
        const playButton = document.createElement('button');
        playButton.className = 'play-button play-state';
        playButton.textContent = '▶ Play Audio';
        playButton.addEventListener('click', () => {
            this.audioSystem.playback.togglePlayback();
        });
        
        // Progress section
        const progressSection = document.createElement('div');
        progressSection.className = 'progress-section';
        
        // Create progress bars
        this.audioSystem.progress.createProgressBars(progressSection);
        
        // Assemble controls
        audioControls.appendChild(playButton);
        audioControls.appendChild(progressSection);
    }
    
    setupAudioEventListeners() {
        if (!this.audioSystem.currentAudioElement) return;
        
        const audio = this.audioSystem.currentAudioElement;
        
        // Create named functions so we can remove them later
        audio._timeupdateHandler = () => {
            this.audioSystem.progress.updateProgressBars();
            // Highlighting is handled by the main setInterval system in caption-original.js
            this.audioSystem.playback.updatePageDisplay();
        };
        
        audio._endedHandler = () => {
            this.audioSystem.navigation.handleAudioEnded();
        };
        
        audio._loadedmetadataHandler = () => {
        };
        
        audio._errorHandler = (e) => {
            console.error('Audio error:', e);
            this.audioSystem.input.ui.showStatus('Audio playback error', 'error');
        };
        
        // Add event listeners with named functions
        audio.addEventListener('timeupdate', audio._timeupdateHandler);
        audio.addEventListener('ended', audio._endedHandler);
        audio.addEventListener('loadedmetadata', audio._loadedmetadataHandler);
        audio.addEventListener('error', audio._errorHandler);
    }
    
    setupWordClickHandlers() {
        // Word click handling for seeking
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('word')) {
                const wordIndex = parseInt(e.target.dataset.wordIndex);
                if (!isNaN(wordIndex) && this.audioSystem.timestamps && this.audioSystem.timestamps[wordIndex]) {
                    const seekTime = this.audioSystem.timestamps[wordIndex].start;
                    this.seekToTime(seekTime);
                }
            }
        });
    }
    
    async playAudio() {
        if (!this.audioSystem.currentAudioElement) {
            console.log('No audio element to play');
            return;
        }
        
        try {
            // Set audio time to selected word start time if available
            if (this.audioSystem.selectedWordStartTime !== undefined) {
                this.audioSystem.currentAudioElement.currentTime = this.audioSystem.selectedWordStartTime;
            }
            
            await this.audioSystem.currentAudioElement.play();

            // Dim title during playback (left column only)
            const headerLeft = document.querySelector('.header-left');
            const playButton = document.querySelector('.play-button');
            if (headerLeft) headerLeft.classList.add('playback-dim');
            if (playButton) playButton.classList.add('playback-dim');
            
            // Activate background dimming
            this.activateDimming();
            
            // Show speed display
            const speedDisplay = document.getElementById('speedDisplay');
            speedDisplay.style.display = 'block';
            
            // Start captioning system highlighting
            if (this.audioSystem.captioning) {
                this.audioSystem.captioning.startHighlighting();
            }
            
            // Add playing class for larger font size
            const textDisplay = this.audioSystem.elements.textDisplay;
            if (textDisplay) {
                textDisplay.classList.add('playing');
                textDisplay.classList.remove('chunk-initial-state');
            }
            
            // Initialize page display based on selected word or show first page
            if (this.audioSystem.selectedWordStartTime !== undefined) {
                const pageIndex = this.audioSystem.input.dataDisplay.getCurrentPageForTime(this.audioSystem.selectedWordStartTime);
                this.audioSystem.currentPageIndex = pageIndex;
                if (this.audioSystem.pages && this.audioSystem.pages.length > 0) {
                    this.audioSystem.input.dataDisplay.updateTextDisplayForPage(pageIndex);
                }
            } else {
                this.audioSystem.currentPageIndex = 0;
                if (this.audioSystem.pages && this.audioSystem.pages.length > 0) {
                    this.audioSystem.input.dataDisplay.updateTextDisplayForPage(0);
                }
            }
            
            // Update button state
            const playButton2 = document.querySelector('.play-button');
            if (playButton2) {
                playButton2.textContent = '⏸ Pause Audio';
                playButton2.classList.remove('play-state');
                playButton2.classList.add('pause-state');
            }
        } catch (error) {
            console.error('Playback failed:', error);
            this.audioSystem.input.ui.showStatus('Playback failed', 'error');
        }
    }
    
    pauseAudio() {
        if (this.audioSystem.currentAudioElement) {
            this.audioSystem.currentAudioElement.pause();

            // Un-dim controls when paused
            const headerLeft = document.querySelector('.header-left');
            const playButton = document.querySelector('.play-button');
            if (headerLeft) headerLeft.classList.remove('playback-dim');
            if (playButton) playButton.classList.remove('playback-dim');

            // Deactivate background dimming when paused
            this.deactivateDimming();

            // Hide speed display
            const speedDisplay = document.getElementById('speedDisplay');
            speedDisplay.style.display = 'none';
            speedDisplay.classList.remove('highlighted');

            // Clear any pending timeout
            if (this.speedDisplayTimeout) {
                clearTimeout(this.speedDisplayTimeout);
                this.speedDisplayTimeout = null;
            }

            // Capture the start time of the currently highlighted word for resume
            if (this.audioSystem.captioning) {
                const currentTime = this.audioSystem.currentAudioElement.currentTime;
                const words = this.audioSystem.captioning.getCurrentPageWords();
                const currentWord = this.audioSystem.captioning.findWordAtTime(currentTime, words);
                if (currentWord) {
                    this.audioSystem.selectedWordStartTime = currentWord.start;
                }
            }

            // Update button state
            const playButton3 = document.querySelector('.play-button');
            if (playButton3) {
                playButton3.textContent = '▶ Play Audio';
                playButton3.classList.remove('pause-state');
                playButton3.classList.add('play-state');
            }
        }
    }
    
    togglePlayback() {
        if (!this.audioSystem.currentAudioElement) return;
        
        if (this.audioSystem.currentAudioElement.paused) {
            this.playAudio();
        } else {
            this.pauseAudio();
        }
    }
    
    seekToTime(time) {
        if (this.audioSystem.currentAudioElement) {
            this.audioSystem.currentAudioElement.currentTime = time;
        }
    }
    
    async testConnection() {
        try {
            await this.audioSystem.input.cloudrun.testConnection();
        } catch (error) {
            console.error('Connection test failed:', error);
        }
    }

    setPlaybackSpeed(speed) {
        // Clamp speed between 0.85 and 1.30
        const clampedSpeed = Math.max(0.85, Math.min(1.30, speed));
        this.audioSystem.playbackSpeed = clampedSpeed;
        
        // Apply to current audio element
        if (this.audioSystem.currentAudioElement) {
            this.audioSystem.currentAudioElement.playbackRate = clampedSpeed;
        }
        
        // Update speed display
        const speedDisplay = document.getElementById('speedDisplay');
        if (speedDisplay) {
            speedDisplay.textContent = Math.round(clampedSpeed * 100) + '%';
            
            // Brighten speed display when user is adjusting
            this.highlightSpeedDisplay();
        }
    }

    highlightSpeedDisplay() {
        const speedDisplay = document.getElementById('speedDisplay');
        if (!speedDisplay) return;
        
        // Highlight the speed display
        speedDisplay.classList.add('highlighted');
        
        // Clear existing timeout
        if (this.speedDisplayTimeout) {
            clearTimeout(this.speedDisplayTimeout);
        }
        
        // Set new timeout to remove highlight after 1 second
        this.speedDisplayTimeout = setTimeout(() => {
            speedDisplay.classList.remove('highlighted');
            this.speedDisplayTimeout = null;
        }, 1000);
    }

    adjustFontSize(delta) {
        const isPlaying = this.audioSystem.currentAudioElement && 
                          !this.audioSystem.currentAudioElement.paused;
        
        // Determine which font size to adjust based on playback state
        const targetProperty = isPlaying ? '--playing-font-size' : '--not-playing-font-size';
        
        // Get current value from CSS variable
        const currentSize = parseInt(
            getComputedStyle(document.documentElement)
                .getPropertyValue(targetProperty)
        ) || (isPlaying ? 50 : 24); // Fallback to defaults
        
        // Calculate new size with bounds (6-150px)
        const newSize = Math.max(6, Math.min(150, currentSize + delta));
        
        // Apply to CSS variable
        document.documentElement.style.setProperty(targetProperty, `${newSize}px`);
        
        // Persist in audioSystem for session
        if (isPlaying) {
            this.audioSystem.userPlayingFontSize = newSize;
        } else {
            this.audioSystem.userNotPlayingFontSize = newSize;
        }
        
        // Sync dev panel inputs if they exist
        this.syncDevPanelFontInputs(isPlaying, newSize);
    }

    syncDevPanelFontInputs(isPlaying, newSize) {
        const inputId = isPlaying ? 'activeFontSizeInput' : 'inactiveFontSizeInput';
        const sliderId = isPlaying ? 'activeFontSizeSlider' : 'inactiveFontSizeSlider';
        
        const input = document.getElementById(inputId);
        const slider = document.getElementById(sliderId);
        
        if (input) input.value = newSize;
        if (slider) slider.value = newSize;
    }
}