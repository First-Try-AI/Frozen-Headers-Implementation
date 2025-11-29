// Audio Input Data Core Module - Handles data loading and audio initialization
class AudioSystemInputDataCore {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
    }
    
    async loadTimestamps(timestampsUrl) {
        try {
            const response = await fetch(timestampsUrl);
            const data = await response.json();
            
            
            this.audioSystem.words = data.words;
            this.audioSystem.wordTimestamps = data.words;
            
        } catch (error) {
            console.error('Error loading timestamps:', error);
            throw error;
        }
    }
    
    loadPagesData(pages) {
        if (!pages || pages.length === 0) {
            console.log('⚠️ [PAGE-DATA] No pages data received');
            return;
        }
        
        this.audioSystem.pages = pages;
        
    }
    
    async loadPageBreaks(pageBreaksUrl) {
        try {
            const response = await fetch(pageBreaksUrl);
            const data = await response.json();
            
            this.audioSystem.pageBreaks = data.pageBreaks;
            
            // Extract pages array and load page structure
            if (data.pages && Array.isArray(data.pages)) {
                this.loadPagesData(data.pages);
            } else {
                console.warn('No pages array found in pagination data');
            }
        } catch (error) {
            console.error('Error loading page breaks:', error);
            throw error;
        }
    }
    
    async initializeAudio(audioUrl) {
        try {

            // Remove previous audio element reference to prevent double playback
            // Let the old element be garbage collected - this avoids triggering events on it
            if (this.audioSystem.currentAudioElement) {

                // Remove all event listeners to prevent memory leaks and double events
                const handlers = ['_timeupdateHandler', '_endedHandler', '_loadedmetadataHandler', '_errorHandler'];
                handlers.forEach(handler => {
                    if (this.audioSystem.currentAudioElement[handler]) {
                        const eventType = handler.replace('Handler', '').replace('_', '');
                        this.audioSystem.currentAudioElement.removeEventListener(eventType, this.audioSystem.currentAudioElement[handler]);
                    }
                });

                // Replace reference without manipulating the old element to avoid triggering events
                this.audioSystem.currentAudioElement = null;
            }

            // Create new audio element
            const audio = new Audio();
            audio.crossOrigin = 'anonymous';
            audio.preload = 'auto';

            // Store reference
            this.audioSystem.currentAudioElement = audio;

            // Apply current playback speed to audio element
            audio.playbackRate = this.audioSystem.playbackSpeed;

            // Load audio
            await new Promise((resolve, reject) => {
                const onLoadedMetadata = () => {
                    // Clean up the temporary event listeners
                    audio.removeEventListener('loadedmetadata', onLoadedMetadata);
                    audio.removeEventListener('error', onError);
                    resolve();
                };

                const onError = (e) => {
                    console.error('Audio load error:', e);
                    // Clean up the temporary event listeners
                    audio.removeEventListener('loadedmetadata', onLoadedMetadata);
                    audio.removeEventListener('error', onError);
                    reject(e);
                };

                audio.addEventListener('loadedmetadata', onLoadedMetadata);
                audio.addEventListener('error', onError);

                audio.src = audioUrl;
                audio.load();
            });

            // Set up audio event listeners after audio is loaded
            this.audioSystem.playback.controls.setupAudioEventListeners();

        } catch (error) {
            console.error('Error initializing audio:', error);
            throw error;
        }
    }
}
