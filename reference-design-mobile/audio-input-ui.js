// Audio Input UI Module - Handles UI events and state management
class AudioInputUI {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
    }
    
    setupEventListeners() {
        // Generate button
        this.audioSystem.elements.generateBtn.addEventListener('click', () => {
            this.audioSystem.input.handleGenerate();
        });
        
        // Secondary generate button
        const secondaryGenerateBtn = document.getElementById('generateBtnSecondary');
        if (secondaryGenerateBtn) {
            secondaryGenerateBtn.addEventListener('click', () => {
                this.audioSystem.input.handleGenerate();
            });
        }
        
        // Character counter
        this.audioSystem.elements.textInput.addEventListener('input', () => {
            this.updateCharCounter();
            this.updateGenerateButtonState();
            this.autoResizeTextarea();
        });
        
        this.audioSystem.elements.textInput.addEventListener('focus', () => {
            this.audioSystem.elements.charCounter.classList.add('show');
        });
        
        this.audioSystem.elements.textInput.addEventListener('blur', () => {
            this.audioSystem.elements.charCounter.classList.remove('show');
        });
        
        // Initial textarea resize to fit any pre-filled content
        setTimeout(() => this.autoResizeTextarea(), 100);
    }
    
    autoResizeTextarea() {
        const textarea = this.audioSystem.elements.textInput;
        if (!textarea) return;
        
        // Reset height to auto to get accurate scrollHeight
        textarea.style.height = 'auto';
        
        // Set height to match content
        textarea.style.height = textarea.scrollHeight + 'px';
        
        // Also update container height
        const container = document.getElementById('textInputContainer');
        if (container) {
            container.style.height = 'auto';
        }
        
        // Check overlay height and toggle secondary container
        const overlay = document.getElementById('builtin-overlay');
        const secondaryContainer = document.getElementById('secondaryContainer');
        
        if (overlay && secondaryContainer) {
            const overlayHeight = overlay.offsetHeight;
            const viewportHeight = window.innerHeight;
            const threshold = viewportHeight * 1.0;
            
            const wasVisible = secondaryContainer.classList.contains('visible');
            
            if (overlayHeight > threshold) {
                secondaryContainer.classList.add('visible');
                
                // Auto-scroll to show button when it first appears
                if (!wasVisible) {
                    setTimeout(() => {
                        secondaryContainer.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'end'
                        });
                    }, 100);
                }
            } else {
                secondaryContainer.classList.remove('visible');
            }
        }
        
        // Auto-scroll overlay-content to bottom when typing, if user is near bottom
        const overlayContent = document.querySelector('.builtin-overlay.input-mode .overlay-content');
        if (overlayContent && overlayContent.scrollHeight > overlayContent.clientHeight) {
            // Check if user is near bottom (within 10px tolerance)
            const isNearBottom = overlayContent.scrollHeight - overlayContent.scrollTop <= overlayContent.clientHeight + 10;
            
            // Only scroll to bottom if user is already near bottom (respects manual scroll up)
            if (isNearBottom) {
                overlayContent.scrollTop = overlayContent.scrollHeight;
            }
        }
    }
    
    updateCharCounter() {
        const length = this.audioSystem.elements.textInput.value.length;
        const displayMaxLength = 3000;  // Display limit (shown to user)
        const actualMaxLength = 15000;  // Actual limit (backend accepts up to this)
        
        // Always show actual length (even past display limit)
        const displayValue = length;
        
        this.audioSystem.elements.charCounter.textContent = `${displayValue} / ${displayMaxLength}`;
        
        this.audioSystem.elements.charCounter.classList.remove('warning', 'danger');
        
        // Turn red when exceeding display limit
        if (length >= displayMaxLength) {
            this.audioSystem.elements.charCounter.classList.add('danger');
        } else if (length >= displayMaxLength * 0.8) {
            this.audioSystem.elements.charCounter.classList.add('warning');
        }
    }
    
    updateGenerateButtonState() {
        const hasText = this.audioSystem.elements.textInput.value.trim().length > 0;
        if (hasText) {
            this.audioSystem.elements.generateBtn.classList.add('ready');
        } else {
            this.audioSystem.elements.generateBtn.classList.remove('ready');
        }
    }
    
    showStatus(message, type) {
        // Find or create status element
        let statusElement = document.querySelector('.status-message');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.className = 'status-message';
            statusElement.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 10px 15px;
                border-radius: 5px;
                color: white;
                font-weight: bold;
                z-index: 1000;
                max-width: 300px;
                word-wrap: break-word;
            `;
            document.body.appendChild(statusElement);
        }
        
        // Set message and styling based on type
        statusElement.textContent = message;
        statusElement.className = `status-message status-${type}`;
        
        // Color coding
        switch (type) {
            case 'error':
                statusElement.style.backgroundColor = '#dc3545';
                break;
            case 'success':
                statusElement.style.backgroundColor = '#28a745';
                break;
            case 'warning':
                statusElement.style.backgroundColor = '#ffc107';
                statusElement.style.color = '#000';
                break;
            default:
                statusElement.style.backgroundColor = '#007bff';
        }
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (statusElement && statusElement.parentNode) {
                statusElement.parentNode.removeChild(statusElement);
            }
        }, 3000);
    }
}