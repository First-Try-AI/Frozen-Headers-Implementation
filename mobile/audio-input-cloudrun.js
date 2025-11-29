// Audio Input Cloud Run Integration Module
class AudioInputCloudRun {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
    }
    
    applyFirstChunkVisualReset() {

        // Un-dim controls and deactivate background dimming (same as playback completion)
        const header = document.querySelector('.overlay-header');
        const controls = this.audioSystem.elements.audioControls;
        if (header) header.classList.remove('playback-dim');
        if (controls) controls.classList.remove('playback-dim');

        // Deactivate background dimming
        if (this.audioSystem.controls && this.audioSystem.controls.deactivateDimming) {
            this.audioSystem.controls.deactivateDimming();
        }

        // Remove playing class from text display (same as playback completion)
        const textDisplay = this.audioSystem.elements.textDisplay;
        if (textDisplay) {
            textDisplay.classList.remove('playing');
        }

        // Stop highlighting (same as playback completion)
        if (this.audioSystem.captioning && this.audioSystem.captioning.stopHighlighting) {
            this.audioSystem.captioning.stopHighlighting();
        }

        // Recalculate optimal font size (same as playback completion)
        setTimeout(() => {
            if (this.audioSystem.input.dataDisplay.calculateOptimalFontSize) {
                this.audioSystem.input.dataDisplay.calculateOptimalFontSize();
            }
        }, 100);

    }

    async handleGenerate() {
        let inputText = this.audioSystem.elements.textInput.value;
        
        // Clean the input text using the TextProcessor module
        const cleanedText = this.audioSystem.textProcessor.cleanText(inputText);
        
        if (!cleanedText) {
            this.showStatus('Please enter some text to generate audio.', 'error');
            return;
        }
        
        // Show loading interface
        this.audioSystem.loading.showLoadingInterface();
        this.audioSystem.elements.generateBtn.disabled = true;
        
        try {
            await this.sendCloudRunRequest(cleanedText);
        } catch (error) {
            this.handleError(error, 'Cloud Run request');
            // Hide loading interface on error
            this.audioSystem.loading.hideLoadingInterface();
        } finally {
            this.audioSystem.elements.generateBtn.disabled = false;
        }
    }
    
    async sendCloudRunRequest(inputText) {
        const requestStartTime = performance.now();
        
        const payload = {
            userText: inputText.replace(/\r\n/g, '\n').replace(/\r/g, '\n'),
            originalParams: {
                voiceGender: this.audioSystem.selectedVoice,
                speakerMode: this.audioSystem.selectedSpeakers === 'one' ? 'oneVoice' : 'readingRainbow',
                speed: this.audioSystem.speed
            },
            sessionId: `rocketship-${Date.now()}`,
            customVoices: [],
            thresholds: {
                breakPauseFirst: parseInt(document.getElementById('primaryThresholdValue')?.value),
                breakPauseSecond: parseInt(document.getElementById('secondaryThresholdValue')?.value),
                usePrimary: document.getElementById('usePrimaryToggle')?.checked ?? true,
                useSecondary: document.getElementById('useSecondaryToggle')?.checked ?? false
            }
        };
        
        // Include vlist when override is enabled
        if (this.audioSystem.overrideEnabled && this.audioSystem.elements.vlistInputs) {
            const vlist = this.audioSystem.elements.vlistInputs
                .map(inp => (inp && inp.value ? inp.value.trim() : ''))
                .filter(id => id.length > 0);
            if (vlist.length > 0) {
                payload.originalParams.vlist = vlist;
            }
        }
        
        
        const response = await this.sendToCloudRun(payload);
        
        if (response && response.success) {
            this.audioSystem.sessionId = response.sessionId;
            await this.handleCloudRunResponse(response);
            
            // Calculate and log total request time
            const requestEndTime = performance.now();
            const totalTime = requestEndTime - requestStartTime;
            
            // Hide loading interface after successful response
            this.audioSystem.loading.hideLoadingInterface();
        } else {
            throw new Error('Cloud Run returned unsuccessful response');
        }
    }
    
    async sendToCloudRun(payload) {
        try {
            const fullEndpoint = this.audioSystem.endpointUrl + this.audioSystem.endpointPath;
            
            const response = await fetch(this.audioSystem.endpointUrl + this.audioSystem.endpointPath, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                let errorDetails = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData.details) {
                        errorDetails += ` - ${errorData.details}`;
                    }
                    if (errorData.error) {
                        errorDetails = `${errorData.error}${errorData.details ? ' - ' + errorData.details : ''}`;
                    }
                } catch (parseError) {
                    // If we can't parse error response, use generic message
                }
                throw new Error(errorDetails);
            }
            
            const data = await response.json();
            
            return data;
            
        } catch (error) {
            console.error('Cloud Run request failed:', error);
            throw error;
        }
    }
    
    async handleCloudRunResponse(data) {
        try {
            
            // Clear previous data
            this.audioSystem.audioChunks = [];
            this.audioSystem.chunkPages = []; // Store pages for each chunk
            
            // Process all chunks, not just the first one
            if (data.chunks && data.chunks.length > 0) {
                
                // Set style for the first chunk
                this.audioSystem.updateHighlightColor();
                
                // Store all chunks for sequential playback
                this.audioSystem.audioChunks = data.chunks;

                for (let i = 0; i < this.audioSystem.audioChunks.length; i++) {
                    const chunk = this.audioSystem.audioChunks[i];
                    if (chunk.wordTimestampsUrl) {
                        const response = await fetch(chunk.wordTimestampsUrl);
                        const a_data = await response.json();
                        chunk.words = a_data.words;
                    }
                }
                
                // Store individual chunk pages
                data.chunks.forEach((chunk, index) => {
                    if (chunk.pages) {
                        this.audioSystem.chunkPages[index] = chunk.pages;
                    }
                });
                
                // Process first chunk for initial display
                const firstChunk = data.chunks[0];
                
                // Load timestamps and page words from first chunk
                if (firstChunk.wordTimestampsUrl) {
                    await this.audioSystem.input.dataCore.loadTimestamps(firstChunk.wordTimestampsUrl);
                } else if (firstChunk.timestampsUrl) {
                    // Fallback for older format
                    await this.audioSystem.input.dataCore.loadTimestamps(firstChunk.timestampsUrl);
                }
                
                // Load letter timestamps (accept but don't use yet)
                if (firstChunk.letterTimestampsUrl) {
                    // TODO: Implement letter timestamp loading and processing
                }
                
                // Load pages data from first chunk (individual chunk pages, not combined)
                if (firstChunk.pages) {
                    this.audioSystem.input.dataCore.loadPagesData(firstChunk.pages);
                }
                
                // Load page breaks from first chunk
                if (firstChunk.pageBreaksUrl) {
                    await this.audioSystem.input.dataCore.loadPageBreaks(firstChunk.pageBreaksUrl);
                }
                
                // Initialize audio from first chunk
                if (firstChunk.audioUrl) {
                    await this.audioSystem.input.dataCore.initializeAudio(firstChunk.audioUrl);
                }
                
                // Set up chunk management
                this.audioSystem.currentChunkIndex = 0;
                this.audioSystem.totalChunks = data.chunks.length;
                
                // Show success message with total parts
                this.showStatus(`Generated audio in ${data.chunks.length} parts`, 'success');
                
                // Create text display for first chunk
                this.audioSystem.input.dataDisplay.displayFullChunk(0);
                
                // Rebuild progress bars with correct number of chunks AFTER all data is processed
                this.audioSystem.playback.progress.rebuildProgressBars();

                // Advance slideshow for first audio chunk
                if (window.advanceSlideForAudioPart) {
                    window.advanceSlideForAudioPart();
                }

                // Set initial word states - all words should be inactive-future initially
                if (this.audioSystem.captioning && this.audioSystem.captioning.updateHighlightingStates) {
                    this.audioSystem.captioning.updateHighlightingStates([], [], [], null);
                }

                // Set up audio event listeners
                this.audioSystem.playback.controls.setupAudioEventListeners();

                // CRITICAL FIX: Transition to playback interface
                this.audioSystem.input.dataDisplay.showPlaybackInterface();
                
            } else {
                throw new Error('No audio chunks in response');
            }
            
        } catch (error) {
            console.error('Error processing Cloud Run response:', error);
            this.showStatus('Failed to process audio response', 'error');
            throw error;
        }
    }
    
    async loadChunk(chunkIndex, showFirstPageOnly) {
        // Validate chunk index
        if (!this.audioSystem.audioChunks || chunkIndex < 0 || chunkIndex >= this.audioSystem.audioChunks.length) {
            return false;
        }
        
        const targetChunk = this.audioSystem.audioChunks[chunkIndex];
        
        
        try {
            // Load timestamps for target chunk
            if (targetChunk.wordTimestampsUrl) {
                await this.audioSystem.input.dataCore.loadTimestamps(targetChunk.wordTimestampsUrl);
            } else if (targetChunk.timestampsUrl) {
                // Fallback for older format
                await this.audioSystem.input.dataCore.loadTimestamps(targetChunk.timestampsUrl);
            }
            
            // Load letter timestamps (accept but don't use yet)
            if (targetChunk.letterTimestampsUrl) {
                // TODO: Implement letter timestamp loading and processing
            }
            
            // Load pages data from target chunk (individual chunk pages)
            if (targetChunk.pages) {
                this.audioSystem.input.dataCore.loadPagesData(targetChunk.pages);
            }
            
            // Load page breaks for target chunk
            if (targetChunk.pageBreaksUrl) {
                await this.audioSystem.input.dataCore.loadPageBreaks(targetChunk.pageBreaksUrl);
            }
            
            // Initialize audio for target chunk
            if (targetChunk.audioUrl) {
                await this.audioSystem.input.dataCore.initializeAudio(targetChunk.audioUrl);
            }
            
            // Let pagination system handle display - no conflicting classes
            if (showFirstPageOnly) {
                this.audioSystem.input.dataDisplay.updateTextDisplayForPage(0);
            }
            
            // Update current chunk index
            this.audioSystem.currentChunkIndex = chunkIndex;
            
            // Reset page index for new chunk
            this.audioSystem.currentPageIndex = 0;
            
            // CRITICAL FIX: Set up audio event listeners for new chunk AFTER data is loaded
            this.audioSystem.playback.controls.setupAudioEventListeners();
            
            // Update progress segments in case new chunks were added
            this.audioSystem.playback.progress.rebuildProgressBars();
            
            // Advance slideshow for new audio chunk
            if (window.advanceSlideForAudioPart) {
                window.advanceSlideForAudioPart();
            }
            
            return true;
        } catch (error) {
            console.error(`Failed to load chunk ${chunkIndex + 1}:`, error);
            return false;
        }
    }
    
    async loadNextChunk() {
        if (!this.audioSystem.audioChunks || this.audioSystem.currentChunkIndex >= this.audioSystem.audioChunks.length - 1) {
            return false;
        }

        // Set style for the new chunk
        this.audioSystem.updateHighlightColor();

        this.audioSystem.currentChunkIndex++;
        const nextChunk = this.audioSystem.audioChunks[this.audioSystem.currentChunkIndex];

        
        try {
            // Load timestamps for next chunk
            if (nextChunk.wordTimestampsUrl) {
                await this.audioSystem.input.dataCore.loadTimestamps(nextChunk.wordTimestampsUrl);
            } else if (nextChunk.timestampsUrl) {
                // Fallback for older format
                await this.audioSystem.input.dataCore.loadTimestamps(nextChunk.timestampsUrl);
            }
            
            // Load letter timestamps (accept but don't use yet)
            if (nextChunk.letterTimestampsUrl) {
                // TODO: Implement letter timestamp loading and processing
            }
            
            // Load pages data from next chunk (individual chunk pages)
            if (nextChunk.pages) {
                this.audioSystem.input.dataCore.loadPagesData(nextChunk.pages);
            }
            
            // Load page breaks for next chunk
            if (nextChunk.pageBreaksUrl) {
                await this.audioSystem.input.dataCore.loadPageBreaks(nextChunk.pageBreaksUrl);
            }
            
            // Initialize audio for next chunk
            if (nextChunk.audioUrl) {
                await this.audioSystem.input.dataCore.initializeAudio(nextChunk.audioUrl);
            }
            
            // Reset page index for new chunk - let pagination system handle display
            this.audioSystem.currentPageIndex = 0;
            
            // CRITICAL FIX: Set up audio event listeners for new chunk AFTER data is loaded
            this.audioSystem.playback.controls.setupAudioEventListeners();
            
            // Update progress segments in case new chunks were added
            this.audioSystem.playback.progress.rebuildProgressBars();
            
            return true;
        } catch (error) {
            console.error(`Failed to load chunk ${this.audioSystem.currentChunkIndex + 1}:`, error);
            return false;
        }
    }
    
    async testConnection() {
        try {
            const testPayload = {
                userText: 'Test connection',
                originalParams: { voiceGender: 'shuffled', speakerMode: 'readingRainbow', speed: 0.8 },
                sessionId: 'test-connection',
                customVoices: [],
                thresholds: { breakPauseFirst: 100, breakPauseSecond: 70, usePrimary: true, useSecondary: false }
            };
            
            const response = await this.sendToCloudRun(testPayload);
            
            if (response.success) {
                this.showStatus('Connection successful!', 'success');
            } else {
                throw new Error('Connection test failed');
            }
            
        } catch (error) {
            this.showStatus(`Connection failed: ${error.message}`, 'error');
        }
    }
    
    showStatus(message, type) {
        const statusEl = this.audioSystem.elements.statusMessage;
        statusEl.textContent = message;
        statusEl.className = `status-message show ${type}`;
        
        if (type !== 'loading') {
            setTimeout(() => {
                statusEl.classList.remove('show');
            }, 3000);
        }
    }
    
    handleError(error, context) {
        console.error(`Error in ${context}:`, error);
        
        let userMessage = 'An unexpected error occurred. Please try again.';
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            userMessage = 'Network error. Please check your connection and try again.';
        } else if (error.name === 'SyntaxError') {
            userMessage = 'Invalid response from server. Please try again.';
        } else if (error.message) {
            userMessage = `Error: ${error.message}`;
        }
        
        this.showStatus(userMessage, 'error');
    }
}