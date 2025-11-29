// Dev Panel Controls Module - Compact development controls
class DevPanelControls {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
        this.devPanel = null;
        this.eventListenersSetup = false;
        this.defaultsInitialized = false;
    }
    
    createDevPanel() {
        this.devPanel = document.createElement('div');
        this.devPanel.id = 'devControls';
        this.devPanel.className = 'dev-panel-base controls-panel'; // Use controls-panel styles

        this.devPanel.innerHTML = `
            <button class="dev-close-btn" id="devCloseBtn">×</button>
            <div class="dev-panel-content">
                <div class="dev-panel-title">Dev Controls</div>

                <!-- Voice Controls -->
                <div class="controls-section">
                    <div class="section-title">Voice Controls</div>
                    <div class="control-group">
                        <label class="control-label">Group / Solo</label>
                        <div class="controls-button-group">
                            <button class="controls-btn voice-preset-btn btn-group">Group</button>
                            <button class="controls-btn voice-preset-btn btn-solo">Solo</button>
                        </div>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Mix / Gender</label>
                        <div class="controls-button-group">
                            <button class="controls-btn voice-preset-btn btn-mix">Mix</button>
                            <button class="controls-btn voice-preset-btn btn-male">Male</button>
                            <button class="controls-btn voice-preset-btn btn-female">Female</button>
                        </div>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Speech Speed</label>
                        <div class="speed-presets">
                            <button class="preset-btn btn-slow" data-speed="0.80">Slow</button>
                            <button class="preset-btn btn-normal" data-speed="0.90">Normal</button>
                            <button class="preset-btn btn-fast" data-speed="1.10">Fast</button>
                        </div>
                    </div>
                    <div class="control-group">
                        <label class="control-label speech-speed-hidden">Speech Speed</label>
                        <div class="control-wrapper no-checkbox">
                            <input type="range" id="devSpeedSlider" class="controls-slider" min="0.80" max="1.10" value="0.90" step="0.01">
                            <input type="number" id="devSpeedInput" class="controls-number-input" value="0.90" min="0.80" max="1.10" step="0.01">
                        </div>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Voice Override</label>
                        <div class="control-wrapper">
                            <input type="checkbox" id="devOverrideCheckbox" class="controls-checkbox">
                            <span class="checkbox-helper-text">Custom voice sequence</span>
                        </div>
                    </div>
                    <div id="devVoiceOverrideInputs" class="voice-override-section" style="display: none;">
                        <input type="text" id="devVlist1" class="voice-override-input" placeholder="VoiceID (ElevenLabs only)">
                        <input type="text" id="devVlist2" class="voice-override-input" placeholder="VoiceID (ElevenLabs only)">
                        <input type="text" id="devVlist3" class="voice-override-input" placeholder="VoiceID (ElevenLabs only)">
                        <input type="text" id="devVlist4" class="voice-override-input" placeholder="VoiceID (ElevenLabs only)">
                        <input type="text" id="devVlist5" class="voice-override-input" placeholder="VoiceID (ElevenLabs only)">
                        <input type="text" id="devVlist6" class="voice-override-input" placeholder="VoiceID (ElevenLabs only)">
                    </div>
                </div>
                
                <!-- Page Break Markers -->
                <div class="controls-section threshold-section">
                    <div class="section-title">Page Break Markers</div>
                    <div class="control-group">
                        <label class="control-label">Threshold 1</label>
                        <div class="control-wrapper">
                            <input type="checkbox" id="usePrimaryToggle" class="controls-checkbox" checked>
                            <input type="range" id="primaryThresholdSlider" class="controls-slider" min="50" max="500" value="240" step="5">
                            <input type="number" id="primaryThresholdValue" class="controls-number-input" value="240" min="50" max="500" step="5">
                        </div>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Threshold 2</label>
                        <div class="control-wrapper">
                            <input type="checkbox" id="useSecondaryToggle" class="controls-checkbox" checked>
                            <input type="range" id="secondaryThresholdSlider" class="controls-slider" min="50" max="500" value="110" step="5">
                            <input type="number" id="secondaryThresholdValue" class="controls-number-input" value="110" min="50" max="500" step="5">
                        </div>
                    </div>
                </div>

                <!-- Background Dimmer -->
                <div class="controls-section">
                    <div class="section-title">Background Dimmer</div>
                    <div class="control-group">
                        <label class="control-label">Opacity</label>
                        <div class="control-wrapper no-checkbox">
                            <input type="range" id="dimmingSlider" class="controls-slider" min="0" max="95" value="35" step="5">
                            <input type="number" id="dimmingValue" class="controls-number-input" value="35" min="0" max="95" step="5">
                        </div>
                    </div>
                </div>

                <!-- Playback Font Sizes -->
                <div class="controls-section">
                    <div class="section-title">Playback Font Sizes</div>
                    <div class="control-group">
                        <label class="control-label">Active</label>
                        <div class="control-wrapper no-checkbox">
                              <input type="range" id="activeFontSizeSlider" class="controls-slider" min="6" max="150" value="50" step="1">
                              <input type="number" id="activeFontSizeInput" class="controls-number-input" value="50" min="6" max="150" step="1">
                        </div>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Inactive</label>
                        <div class="control-wrapper no-checkbox">
                            <input type="range" id="inactiveFontSizeSlider" class="controls-slider" min="6" max="150" value="24" step="1">
                            <input type="number" id="inactiveFontSizeInput" class="controls-number-input" value="24" min="6" max="150" step="1">
                        </div>
                    </div>
                </div>

                <!-- Playback Font Opacity -->
                <div class="controls-section">
                    <div class="section-title">Playback Font Opacity</div>
                    <div class="control-group">
                        <label class="control-label">Baseline</label>
                        <div class="control-wrapper no-checkbox">
                            <input type="range" id="baseTextOpacitySlider" class="controls-slider" min="0.1" max="1.0" value="0.5" step="0.05">
                            <input type="number" id="baseTextOpacityInput" class="controls-number-input" value="0.5" min="0.1" max="1.0" step="0.05">
                        </div>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Look ahead</label>
                        <div class="control-wrapper no-checkbox">
                            <input type="range" id="lookaheadOffsetSlider" class="controls-slider" min="0.01" max="0.5" value="0.03" step="0.01">
                            <input type="number" id="lookaheadOffsetInput" class="controls-number-input" value="0.03" min="0.01" max="0.5" step="0.01">
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(this.devPanel);
    }
    
    setupEventListeners() {
        if (this.eventListenersSetup) { return; }
        
        // Voice Controls
        this.devPanel.querySelector('.btn-group').addEventListener('click', () => this.handleGroupSoloClick('group'));
        this.devPanel.querySelector('.btn-solo').addEventListener('click', () => this.handleGroupSoloClick('solo'));
        this.devPanel.querySelector('.btn-mix').addEventListener('click', () => this.handleGenderClick('mix'));
        this.devPanel.querySelector('.btn-male').addEventListener('click', () => this.handleGenderClick('male'));
        this.devPanel.querySelector('.btn-female').addEventListener('click', () => this.handleGenderClick('female'));
        
        this.devPanel.querySelectorAll('.preset-btn').forEach(btn => btn.addEventListener('click', (e) => this.handleSpeedPreset(e.target.dataset.speed)));

        document.getElementById('devSpeedSlider')?.addEventListener('input', (e) => this.syncSliderToInput('devSpeedSlider', 'devSpeedInput', 2));
        document.getElementById('devSpeedInput')?.addEventListener('input', (e) => this.syncInputToSlider('devSpeedInput', 'devSpeedSlider'));

        document.getElementById('devOverrideCheckbox')?.addEventListener('change', (e) => this.handleOverrideToggle(e.target.checked));
        
        const voiceIdInputs = this.devPanel.querySelectorAll('.voice-override-input');
        voiceIdInputs.forEach(input => {
            input.addEventListener('input', () => this.handleVoiceIdInput());
        });
        
        // Dimming
        document.getElementById('dimmingSlider')?.addEventListener('input', (e) => this.updateDimmingValue(e.target.value));
        
        // Font sizes
        document.getElementById('activeFontSizeSlider')?.addEventListener('input', (e) => this.syncSliderToInput(e.target.id, 'activeFontSizeInput'));
        document.getElementById('activeFontSizeInput')?.addEventListener('input', (e) => this.syncInputToSlider(e.target.id, 'activeFontSizeSlider'));
        document.getElementById('inactiveFontSizeSlider')?.addEventListener('input', (e) => this.syncSliderToInput(e.target.id, 'inactiveFontSizeInput'));
        document.getElementById('inactiveFontSizeInput')?.addEventListener('input', (e) => this.syncInputToSlider(e.target.id, 'inactiveFontSizeSlider'));
        
        // Opacity
        document.getElementById('baseTextOpacitySlider')?.addEventListener('input', (e) => this.syncSliderToInput(e.target.id, 'baseTextOpacityInput', 2));
        document.getElementById('baseTextOpacityInput')?.addEventListener('input', (e) => this.syncInputToSlider(e.target.id, 'baseTextOpacitySlider'));
        document.getElementById('lookaheadOffsetSlider')?.addEventListener('input', (e) => this.syncSliderToInput(e.target.id, 'lookaheadOffsetInput', 2));
        document.getElementById('lookaheadOffsetInput')?.addEventListener('input', (e) => this.syncInputToSlider(e.target.id, 'lookaheadOffsetSlider'));

        // Thresholds
        document.getElementById('primaryThresholdSlider')?.addEventListener('input', (e) => this.syncSliderToInput(e.target.id, 'primaryThresholdValue'));
        document.getElementById('primaryThresholdValue')?.addEventListener('input', (e) => this.syncInputToSlider(e.target.id, 'primaryThresholdSlider'));
        document.getElementById('secondaryThresholdSlider')?.addEventListener('input', (e) => this.syncSliderToInput(e.target.id, 'secondaryThresholdValue'));
        document.getElementById('secondaryThresholdValue')?.addEventListener('input', (e) => this.syncInputToSlider(e.target.id, 'secondaryThresholdSlider'));
        
        // Close button
        document.getElementById('devCloseBtn')?.addEventListener('click', () => this.toggleDevPanel());
        
        this.eventListenersSetup = true;
        this.makeDraggable();
    }
    
    toggleDevPanel() {
        if (!this.devPanel) return;
        const isVisible = this.devPanel.style.display !== 'none';
        if(isVisible) {
            this.applyValuesFromInputs();
        }
        this.devPanel.style.display = isVisible ? 'none' : 'block';
    }
    
    handleGroupSoloClick(mode) {
        const groupBtn = this.devPanel.querySelector('.btn-group');
        const soloBtn = this.devPanel.querySelector('.btn-solo');
        
        if (mode === 'group') {
            groupBtn.classList.add('selected');
            soloBtn.classList.remove('selected');
            this.audioSystem.selectedSpeakers = 'multiple';
        } else { // mode === 'solo'
            soloBtn.classList.add('selected');
            groupBtn.classList.remove('selected');
            this.audioSystem.selectedSpeakers = 'one';
        }
    }

    handleGenderClick(mode) {
        this.devPanel.querySelectorAll('.btn-mix, .btn-male, .btn-female').forEach(btn => btn.classList.remove('selected'));
        
        if (mode === 'mix') {
            this.devPanel.querySelector('.btn-mix').classList.add('selected');
            this.audioSystem.selectedVoice = 'shuffled';
        } else if (mode === 'male') {
            this.devPanel.querySelector('.btn-male').classList.add('selected');
            this.audioSystem.selectedVoice = 'male';
        } else { // mode === 'female'
            this.devPanel.querySelector('.btn-female').classList.add('selected');
            this.audioSystem.selectedVoice = 'female';
        }
    }

    handleSpeedPreset(speed) {
        const speedValue = parseFloat(speed);
        if (isNaN(speedValue)) return;

        this.devPanel.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
        if (speedValue === 0.80) this.devPanel.querySelector('.btn-slow').classList.add('active');
        if (speedValue === 0.90) this.devPanel.querySelector('.btn-normal').classList.add('active');
        if (speedValue === 1.10) this.devPanel.querySelector('.btn-fast').classList.add('active');
        
        const slider = document.getElementById('devSpeedSlider');
        const input = document.getElementById('devSpeedInput');
        if (slider) slider.value = speedValue;
        if (input) input.value = speedValue.toFixed(2);

        this.audioSystem.speed = speedValue;
    }

    handleOverrideToggle(isChecked) {
        this.audioSystem.overrideEnabled = isChecked;
        const overrideInputs = document.getElementById('devVoiceOverrideInputs');
        if (overrideInputs) {
            overrideInputs.style.display = isChecked ? 'block' : 'none';
        }
    }

    handleVoiceIdInput() {
        const voiceIdInputs = this.devPanel.querySelectorAll('.voice-override-input');
        this.audioSystem.vlist = Array.from(voiceIdInputs).map(input => input.value.trim());
    }

    syncSliderToInput(sliderId, inputId, precision = 0) {
        const slider = document.getElementById(sliderId);
        const input = document.getElementById(inputId);
        if (slider && input) {
            const value = parseFloat(slider.value);
            input.value = value.toFixed(precision);
            this.applyValuesFromInputs();
        }
    }

    syncInputToSlider(inputId, sliderId) {
        const input = document.getElementById(inputId);
        const slider = document.getElementById(sliderId);
        if (input && slider) {
            const value = parseFloat(input.value);
            if (!isNaN(value)) {
                slider.value = value;
                this.applyValuesFromInputs();
            }
        }
    }
    
    async testConnection() {
        const testBtn = document.getElementById('testConnectionBtn');
        if (testBtn) {
            testBtn.disabled = true;
            testBtn.textContent = 'Testing...';
        }
        
        try {
            const endpointInput = document.getElementById('endpointInput');
            if (endpointInput) {
                this.audioSystem.endpointUrl = endpointInput.value;
            }
            await this.audioSystem.input.cloudrun.testConnection();
        } catch (error) {
            console.error('Connection test failed:', error);
        } finally {
            if (testBtn) {
                testBtn.disabled = false;
                testBtn.textContent = 'Test';
            }
        }
    }
    
    updateDimmingValue(value) {
        const dimmingValueDisplay = document.getElementById('dimmingValue');
        if (dimmingValueDisplay) {
            dimmingValueDisplay.value = value;
        }
        this.syncSliderToInput('dimmingSlider', 'dimmingValue');
    }
    
    initializeDefaults() {
        if(this.defaultsInitialized) return;

        // Voice defaults
        this.handleGroupSoloClick('group');
        this.handleGenderClick('mix');
        this.handleSpeedPreset(0.90);
        this.handleOverrideToggle(false);
        this.audioSystem.vlist = ['', '', '', '', '', ''];

        // Sync speed controls
        this.syncSliderToInput('devSpeedSlider', 'devSpeedInput', 2);
        
        // Sync sliders to inputs on load
        this.syncSliderToInput('primaryThresholdSlider', 'primaryThresholdValue');
        this.syncSliderToInput('secondaryThresholdSlider', 'secondaryThresholdValue');
        this.syncSliderToInput('dimmingSlider', 'dimmingValue');
        this.syncSliderToInput('activeFontSizeSlider', 'activeFontSizeInput');
        this.syncSliderToInput('inactiveFontSizeSlider', 'inactiveFontSizeInput');
        this.syncSliderToInput('baseTextOpacitySlider', 'baseTextOpacityInput', 2);
        this.syncSliderToInput('lookaheadOffsetSlider', 'lookaheadOffsetInput', 2);
        
        this.applyValuesFromInputs();
        
        this.defaultsInitialized = true;
    }
    
    applyValuesFromInputs() {
        // Speed
        const speed = parseFloat(document.getElementById('devSpeedInput').value);
        if(!isNaN(speed)) {
            this.audioSystem.speed = speed;
        }

        // Font sizes
        const activeSize = document.getElementById('activeFontSizeInput').value;
        const inactiveSize = document.getElementById('inactiveFontSizeInput').value;
        document.documentElement.style.setProperty('--playing-font-size', `${activeSize}px`);
        document.documentElement.style.setProperty('--not-playing-font-size', `${inactiveSize}px`);

        // Opacity
        const baseOpacity = document.getElementById('baseTextOpacityInput').value;
        const lookaheadOffset = document.getElementById('lookaheadOffsetInput').value;
        document.documentElement.style.setProperty('--base-text-opacity', baseOpacity);
        document.documentElement.style.setProperty('--lookahead-offset', lookaheadOffset);
        
        // Thresholds
        this.audioSystem.thresholds = [
            {
                value: parseInt(document.getElementById('primaryThresholdValue').value),
                enabled: document.getElementById('usePrimaryToggle').checked
            },
            {
                value: parseInt(document.getElementById('secondaryThresholdValue').value),
                enabled: document.getElementById('useSecondaryToggle').checked
            }
        ];
    }

    makeDraggable() {
        const devPanel = this.devPanel;
        const dragHandle = devPanel.querySelector('.dev-drag-handle');
        let isDragging = false;
        let startY;
        let startTop;

        const onMouseDown = (e) => {
            isDragging = true;
            startY = e.clientY;
            startTop = devPanel.offsetTop;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            devPanel.style.transition = 'none';
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;
            const newTop = startTop + (e.clientY - startY) * 0.5; // Reduced sensitivity
            devPanel.style.top = `${newTop}px`;
        };

        const onMouseUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            devPanel.style.transition = '';
        };

        if (dragHandle) {
            dragHandle.addEventListener('mousedown', onMouseDown);
        }
    }
}