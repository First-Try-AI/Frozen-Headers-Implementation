// Celestial Slideshow - Jesus Reader (Chunk-Synchronized)
class CelestialSlideshow {
    constructor() {
        this.currentSlide = 0;
        this.totalSlides = 0;
        this.slideshow = null;
        
        this.init();
    }
    
    init() {
        this.setupElements();
        this.createSlides();
        this.setupFullscreen();
    }
    
    setupElements() {
        this.slideshow = document.getElementById('slideshow');
    }
    
    setupFullscreen() {
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => {
                        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                    });
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    }
                }
            });
        }
    }
    
    createSlides() {
        // Beautiful, calming images for the slideshow - mixed themes from Unsplash
        const images = [
            'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&h=1080&fit=crop', // Purple and blue gradient
            'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&h=1080&fit=crop', // Blue and pink gradient
            'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&h=1080&fit=crop', // Soft rainbow gradient
            'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=1920&h=1080&fit=crop', // Light pink texture
            'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=1920&h=1080&fit=crop', // Neon pink and blue lines
            'https://images.unsplash.com/photo-1487147264018-f937fba0c817?w=1920&h=1080&fit=crop', // Holographic texture
            'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1920&h=1080&fit=crop', // White marble texture
            'https://images.unsplash.com/photo-1533120760634-4a3717c13b2c?w=1920&h=1080&fit=crop', // Wavy lines texture
            'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=1920&h=1080&fit=crop', // Abstract color paper
            'https://images.unsplash.com/photo-1561998396-e4a4d9b4c8a5?w=1920&h=1080&fit=crop'  // Blue painted texture
        ];
        
        this.totalSlides = images.length;
        
        // Create additional slides starting from index 1 (first slide already exists in HTML)
        for (let i = 1; i < images.length; i++) {
            const slide = document.createElement('div');
            slide.className = 'slide';
            slide.dataset.index = i;
            slide.style.backgroundImage = `url(${images[i]})`;
            this.slideshow.appendChild(slide);
        }
        
        // First slide is already active in HTML
        this.currentSlide = 0;
        const firstSlide = this.slideshow.querySelector('[data-index="0"]');
        if (firstSlide) {
            firstSlide.style.opacity = '1';
        }
        
    }
    
    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.totalSlides;
        this.goToSlide(nextIndex);
    }
    
    goToSlide(index) {
        const currentSlideEl = this.slideshow.querySelector('.slide.active');
        const nextSlideEl = this.slideshow.querySelector(`[data-index="${index}"]`);
        
        if (currentSlideEl) {
            currentSlideEl.classList.remove('active');
        }
        
        if (nextSlideEl) {
            nextSlideEl.classList.add('active');
            this.currentSlide = index;
        }
    }
    
    advanceSlideForAudioPart() {
        // Advance to the next slide when a new audio chunk is loaded
        this.nextSlide();
    }
}

// Initialize the slideshow when the page loads
let slideshowInstance;
document.addEventListener('DOMContentLoaded', () => {
    slideshowInstance = new CelestialSlideshow();
});

// Make slideshow methods globally accessible for audio system
window.advanceSlideForAudioPart = () => {
    if (slideshowInstance) {
        slideshowInstance.advanceSlideForAudioPart();
    }
};