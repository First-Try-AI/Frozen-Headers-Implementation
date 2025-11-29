// Audio Progress Module - Minimal visual progress bars only
class AudioProgress {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
    }
    
    createProgressBars(progressSection) {
        const totalChunks = this.audioSystem.totalChunks;
        
        // Create single progress container
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        progressContainer.id = 'progressBar';
        
        // Create segments for each chunk
        for (let i = 0; i < totalChunks; i++) {
            const segment = document.createElement('div');
            segment.className = 'progress-segment';
            segment.dataset.chunkIndex = i;

            segment.addEventListener('click', (e) => {
                this.audioSystem.navigation.handleProgressSegmentClick(e, i);
            });
            
            const segmentFill = document.createElement('div');
            segmentFill.className = 'progress-segment-fill';
            segmentFill.dataset.chunkIndex = i;
            
            segment.appendChild(segmentFill);
            progressContainer.appendChild(segment);
        }
        
        progressSection.appendChild(progressContainer);
    }
    
    updateProgressBars() {
        if (!this.audioSystem.currentAudioElement) {
            return;
        }
        
        const currentTime = this.audioSystem.currentAudioElement.currentTime;
        const duration = this.audioSystem.currentAudioElement.duration;
        
        // Verify audio element state before proceeding
        if (isNaN(currentTime) || isNaN(duration) || duration <= 0) {
            return;
        }
        
        if (duration > 0) {
            const progress = (currentTime / duration) * 100;
            
            // Update all segments based on current chunk and progress
            for (let i = 0; i < this.audioSystem.totalChunks; i++) {
                const segment = document.querySelector(`[data-chunk-index="${i}"]`);
                const segmentFill = segment?.querySelector('.progress-segment-fill');
                
                if (segment && segmentFill) {
                    // Update active state
                    if (i === this.audioSystem.currentChunkIndex) {
                        segment.classList.add('active');
                    } else {
                        segment.classList.remove('active');
                    }
                    
                    // Update progress fill
                    if (i < this.audioSystem.currentChunkIndex) {
                        // Completed chunks
                        segmentFill.style.width = '100%';
                    } else if (i === this.audioSystem.currentChunkIndex) {
                        // Current chunk
                        segmentFill.style.width = progress + '%';
                    } else {
                        // Future chunks
                        segmentFill.style.width = '0%';
                    }
                }
            }
        }
    }
    
    rebuildProgressBars() {
        // Rebuild progress bars if total chunks changed
        const currentTotal = document.querySelectorAll('[data-chunk-index]').length;
        
        if (currentTotal !== this.audioSystem.totalChunks) {
            const progressSection = document.querySelector('.progress-section');
            if (progressSection) {
                progressSection.innerHTML = '';
                this.createProgressBars(progressSection);
            }
        }
    }
}
