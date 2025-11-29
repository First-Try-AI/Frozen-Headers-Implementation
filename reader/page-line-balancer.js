// Page Line Balancer - Intelligent line balancing within CSS constraints
class PageLineBalancer {
    constructor() {
        this.containerWidth = 0;
        this.workingWidth = 0;
        this.characterWidth = 0;
        this.canvas = null;
        this.context = null;
    }

    // Initialize the character measurement system
    initializeMeasurement(container, fontFamily, fontSize) {
        // Create a hidden canvas for character measurement
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.context = this.canvas.getContext('2d');
        }

        // Set up the context with the active text font size (1.13x scale)
        // This eliminates reflow because measurements match display size
        this.context.font = `${fontSize * 1.13}px ${fontFamily}`;
        
        // Store container reference and get width
        this.container = container;
        this.containerWidth = container.offsetWidth;
        this.lastContainerWidth = this.containerWidth;
        
        // Measure actual .text-content element to match overflow detection
        const textContent = container.querySelector('.text-content');
        if (textContent) {
            this.containerWidth = textContent.getBoundingClientRect().width;

            // 1. Calculate the CSS-constrained width (now 100% since .text-content fills parent)
            const cssConstrainedWidth = this.containerWidth * 1.0;

            // 2. Set workingWidth to 100% of that. No safety margin needed,
            // since measureTextWidth() already returns the scaled 1.13x size.
            this.workingWidth = cssConstrainedWidth;
        } else {
            // Fallback to CSS-based calculation
            this.workingWidth = Math.floor(this.containerWidth * 1.0);
        }

        // Measure average character width
        this.characterWidth = this.measureCharacterWidth();
        
        // Setup window resize listener for responsive text redistribution
        this.setupWindowResizeListener();
    }

    // Measure average character width for the current font
    measureCharacterWidth() {
        const testString = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const metrics = this.context.measureText(testString);
        return metrics.width / testString.length;
    }

    // Measure the width of a specific text string
    measureTextWidth(text) {
        return this.context.measureText(text).width;
    }

    // Distribute words across lines using character counting with intelligent space detection
    distributeWordsIntoLines(words) {
        if (!words || words.length === 0) {
            return [];
        }

        const lines = [];
        let currentLine = [];
        let currentLineWidth = 0;

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const wordWidth = this.measureTextWidth(word.word);
            const spaceWidth = this.measureCharacterWidth();
            const totalWidth = wordWidth + (currentLine.length > 0 ? spaceWidth : 0);

            // Check if adding this word would exceed our working width.
            // The safety margin is already baked into this.workingWidth.
            const maxLineWidth = this.workingWidth; // Remove the * 0.884 multiplier
            if (currentLineWidth + totalWidth > maxLineWidth && currentLine.length > 0) {
                // We're at the limit - clean break point
                lines.push([...currentLine]);
                currentLine = [word];
                currentLineWidth = wordWidth;
            } else {
                // Add word to current line
                currentLine.push(word);
                currentLineWidth += totalWidth;
            }
        }

        // Add any remaining words to the last line
        if (currentLine.length > 0) {
            lines.push(currentLine);
        }

        return lines;
    }

    // Analyze existing CSS-wrapped text and optimize line balance
    optimizeLineBalance(container, callback) {
        if (!container) return;

            // Get computed styles for measurement
            const computedStyle = window.getComputedStyle(container);
            const fontFamily = computedStyle.fontFamily;
            const fontSize = parseFloat(computedStyle.fontSize);

            // Initialize measurement system
            this.initializeMeasurement(container, fontFamily, fontSize);

            // Get existing word spans
            const wordSpans = Array.from(container.querySelectorAll('.word'));
            if (wordSpans.length === 0) return;

            // Convert word spans to word data for processing
            const words = wordSpans.map(span => ({
                word: span.textContent,
                originalIndex: span.dataset.index,
                start: span.dataset.start,
                end: span.dataset.end
            }));

            // Distribute words into optimized lines
            const optimizedLines = this.distributeWordsIntoLines(words);

            // Apply optimized layout
            this.applyOptimizedLayout(optimizedLines, container, wordSpans);

            // Execute callback if provided (for layout completion)
            if (callback) {
                callback();
            }
    }

    // Apply optimized line layout to existing word spans
    applyOptimizedLayout(optimizedLines, container, wordSpans) {
        // Create .text-line containers for optimized layout
        const textContent = container.querySelector('.text-content');
        if (!textContent) {
            return;
        }

        // Clear existing content but preserve word spans
        textContent.innerHTML = '';

        // Create line containers and redistribute word spans
        optimizedLines.forEach((lineWords, lineIndex) => {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'text-line';
            lineDiv.dataset.lineIndex = lineIndex;

            lineWords.forEach((wordData, wordIndex) => {
                // Find the corresponding word span
                const wordSpan = wordSpans.find(span => 
                    span.dataset.index === wordData.originalIndex
                );
                
                if (wordSpan) {
                    lineDiv.appendChild(wordSpan);
                    
                    // Add space between words (except for the last word in the line)
                    if (wordIndex < lineWords.length - 1) {
                        lineDiv.appendChild(document.createTextNode(' '));
                    }
                }
            });

            textContent.appendChild(lineDiv);
        });
    }

    // Update the working width when container size changes
    updateContainerWidth(container) {
        this.containerWidth = container.offsetWidth;
        this.workingWidth = Math.floor(this.containerWidth * 0.75);
    }
    
    // Handle window resize events for responsive text redistribution
    handleWindowResize() {
        const currentWidth = this.container.offsetWidth;
        const widthChange = Math.abs(currentWidth - this.lastContainerWidth);
        
        // Only redistribute if window actually changed by meaningful amount
        if (widthChange > 50) {
            
            this.lastContainerWidth = currentWidth;
            this.containerWidth = currentWidth;
            this.workingWidth = Math.floor(this.containerWidth * 0.75);
            
            // Re-optimize existing text layout
            if (this.container.querySelector('.text-content')) {
                this.optimizeLineBalance(this.container);
            }
        }
    }
    
    // Distribute existing DOM word spans into line arrays using optimized width logic
    distributeWordSpansIntoLines(wordSpans) {
        if (!wordSpans || wordSpans.length === 0) {
            return [];
        }

        const lines = [];
        let currentLine = [];
        let currentLineWidth = 0;

        for (let i = 0; i < wordSpans.length; i++) {
            const wordSpan = wordSpans[i];
            const wordText = wordSpan.textContent;
            const wordWidth = this.measureTextWidth(wordText);
            const spaceWidth = this.measureCharacterWidth();
            const totalWidth = wordWidth + (currentLine.length > 0 ? spaceWidth : 0);

            // Check if adding this word would exceed our working width
            if (currentLineWidth + totalWidth > this.workingWidth && currentLine.length > 0) {
                // We're at the limit - clean break point
                lines.push([...currentLine]);
                currentLine = [wordSpan];
                currentLineWidth = wordWidth;
            } else {
                // Add word span to current line
                currentLine.push(wordSpan);
                currentLineWidth += totalWidth;
            }
        }

        // Add any remaining word spans to the last line
        if (currentLine.length > 0) {
            lines.push(currentLine);
        }

        return lines;
    }
    
    // Setup window resize listener
    setupWindowResizeListener() {
        this.resizeHandler = () => this.handleWindowResize();
        window.addEventListener('resize', this.resizeHandler);
    }
    
    // Remove window resize listener
    removeWindowResizeListener() {
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }
    }
    
    // Cleanup method to remove listeners
    cleanup() {
        this.removeWindowResizeListener();
    }
}