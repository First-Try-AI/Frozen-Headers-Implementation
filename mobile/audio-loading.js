// Audio System Loading Module - Handles loading states and countdown
class AudioSystemLoading {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
    }
    
    showLoadingInterface() {
        // Set overlay to loading mode
        this.audioSystem.setOverlayMode('loading');
        
        // Hide input interface sections
        const textInputSection = document.querySelector('.text-input-section');
        const statusSection = document.querySelector('.status-section');
        const inputControlRow = document.querySelector('.controlrow-input');
        
        if (textInputSection) textInputSection.style.display = 'none';
        if (statusSection) statusSection.style.display = 'none';
        if (inputControlRow) inputControlRow.style.display = 'none';
        
        // Show loading interface
        const loadingInterface = document.getElementById('loadingInterface');
        if (loadingInterface) {
            loadingInterface.style.display = 'block';
            loadingInterface.style.visibility = 'visible';
            loadingInterface.style.height = 'auto';
        }
        
        // Start countdown timer
        this.startCountdownTimer();
        
        // Start scripted steps
        this.startScriptedSteps();
    }
    
    startCountdownTimer() {
        const countdownEl = document.getElementById('countdown');
        if (!countdownEl) return;
        
        let seconds = 15;
        countdownEl.textContent = `00:${String(seconds).padStart(2, '0')}`;
        
        this.countdownInterval = setInterval(() => {
            seconds--;
            if (seconds <= 0) {
                countdownEl.textContent = '00:00';
                clearInterval(this.countdownInterval);
                setTimeout(() => {
                    countdownEl.textContent = '…few more seconds';
                }, 1000);
            } else {
                countdownEl.textContent = `00:${String(seconds).padStart(2, '0')}`;
            }
        }, 1000);
    }
    
    startScriptedSteps() {
        const stepsEl = document.getElementById('stepsDisplay');
        if (!stepsEl) return;
        
        const steps = [
            { label: 'Smoothing timing so words land naturally.', seconds: 2 },
            { label: 'Leveling gain for calm, even loudness.', seconds: 2 },
            { label: 'Steadying stress patterns for easier follow.', seconds: 2 },
            { label: 'Reducing jitter and shimmer artifacts.', seconds: 2 },
            { label: 'Placing micro‑pauses to reset attention.', seconds: 2 },
            { label: 'Balancing sibilants and plosives for clarity.', seconds: 2 },
            { label: 'Aligning breaths and sentence endings.', seconds: 2 },
            { label: 'Final polish and handoff.', seconds: 1 }
        ];
        
        let currentStep = 0;
        const showStep = () => {
            if (currentStep >= steps.length) {
                stepsEl.textContent = '';
                return;
            }
            
            const step = steps[currentStep];
            stepsEl.textContent = step.label;
            
            setTimeout(() => {
                currentStep++;
                showStep();
            }, step.seconds * 1000);
        };
        
        showStep();
    }
    
    hideLoadingInterface() {
        // Hide loading interface
        const loadingInterface = document.getElementById('loadingInterface');
        if (loadingInterface) {
            loadingInterface.style.display = 'none';
            loadingInterface.style.visibility = 'hidden';
            loadingInterface.style.height = '0';
        }
        
        // Cleanup countdown
        this.cleanup();
    }
    
    cleanup() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }
}