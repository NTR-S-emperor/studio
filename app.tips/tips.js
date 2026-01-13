// app.tips/tips.js

window.Tips = {
    root: null,
    eventsAttached: false,
    initialized: false,
    basePath: 'app.tips',
    slides: [],
    currentSlide: 0,
    totalSlides: 0,
    lightboxEl: null,
    lightboxOpen: false,

    /**
     * Initializes the Tips application
     */
    init() {
        if (this.initialized) return;
        this.initialized = true;
        this.mount();
        this.loadSlides();
    },

    /**
     * Mounts the app's DOM
     */
    mount() {
        if (this.root) return;

        const container = document.getElementById("tipsScreen");
        if (!container) return;

        this.root = document.createElement("div");
        this.root.id = "tips-app";
        this.root.innerHTML = this.renderContent();

        container.appendChild(this.root);
        this.attachEvents();
    },

    /**
     * Renders the content
     */
    renderContent() {
        return `
            <header class="tips-header">
                <span class="tips-title">Tips</span>
            </header>

            <main class="tips-content">
                <div class="tips-slider">
                    <div class="tips-slides-container">
                        <!-- Slides will be loaded here -->
                    </div>
                </div>

                <div class="tips-navigation">
                    <button class="tips-nav-btn tips-nav-prev" type="button" disabled>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 18l-6-6 6-6"/>
                        </svg>
                    </button>
                    <div class="tips-dots">
                        <!-- Dots will be added here -->
                    </div>
                    <button class="tips-nav-btn tips-nav-next" type="button" disabled>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 18l6-6-6-6"/>
                        </svg>
                    </button>
                </div>
            </main>

            <div class="tips-loading">
                <span>Loading tips...</span>
            </div>
        `;
    },

    /**
     * Loads all tip slides by checking for numbered .txt files
     */
    async loadSlides() {
        this.slides = [];
        this.currentSlide = 0;
        let slideNumber = 1;
        let hasMore = true;

        // Show loading
        const loading = this.root.querySelector('.tips-loading');
        const slider = this.root.querySelector('.tips-slider');
        if (loading) loading.classList.add('tips-loading--visible');
        if (slider) slider.classList.add('tips-slider--loading');

        // Try to load files sequentially: 1.txt, 2.txt, 3.txt, etc.
        while (hasMore) {
            try {
                const fileUrl = `${this.basePath}/${slideNumber}.txt`;
                const cacheBustedUrl = window.getAssetUrl ? window.getAssetUrl(fileUrl) : fileUrl;
                const response = await fetch(cacheBustedUrl);
                if (response.ok) {
                    const content = await response.text();
                    const parsed = this.parseSlideContent(content, slideNumber);
                    this.slides.push(parsed);
                    slideNumber++;
                } else {
                    hasMore = false;
                }
            } catch (e) {
                hasMore = false;
            }
        }

        this.totalSlides = this.slides.length;

        // Hide loading
        if (loading) loading.classList.remove('tips-loading--visible');
        if (slider) slider.classList.remove('tips-slider--loading');

        // Render slides
        this.renderSlides();
        this.updateNavigation();
    },

    /**
     * Parses the content of a slide file
     * Format:
     * $tips = image.png
     * Text explanation here
     * Can be multiple lines
     */
    parseSlideContent(content, slideNumber) {
        const lines = content.split(/\r?\n/);
        let image = null;
        let textLines = [];

        for (const line of lines) {
            // Check for image directive: $tips = filename.png
            const imageMatch = line.match(/^\$tips\s*=\s*(.+)$/i);
            if (imageMatch) {
                image = imageMatch[1].trim();
                continue;
            }

            // Collect text lines
            textLines.push(line);
        }

        // Join text and trim
        const text = textLines.join('\n').trim();

        // Build absolute image path with cache-busting
        let imagePath = null;
        if (image) {
            const rawPath = `${this.basePath}/images/${image}`;
            imagePath = '/' + (window.getAssetUrl ? window.getAssetUrl(rawPath) : rawPath);
        }

        return {
            number: slideNumber,
            image: imagePath,
            text: text
        };
    },

    /**
     * Renders all slides
     */
    renderSlides() {
        const container = this.root.querySelector('.tips-slides-container');
        const dotsContainer = this.root.querySelector('.tips-dots');
        if (!container) return;

        if (this.slides.length === 0) {
            container.innerHTML = `
                <div class="tips-slide tips-slide--empty">
                    <p>No tips available.</p>
                </div>
            `;
            if (dotsContainer) dotsContainer.innerHTML = '';
            return;
        }

        // Render slides
        let slidesHtml = '';
        let dotsHtml = '';

        this.slides.forEach((slide, index) => {
            const isActive = index === 0 ? ' tips-slide--active' : '';

            slidesHtml += `
                <div class="tips-slide${isActive}" data-slide="${index}">
                    ${slide.image ? `
                        <div class="tips-slide-image">
                            <img src="${slide.image}" alt="Tip ${slide.number}">
                        </div>
                    ` : ''}
                    ${slide.text ? `
                        <div class="tips-slide-text">
                            ${this.formatText(slide.text)}
                        </div>
                    ` : ''}
                </div>
            `;

            const dotActive = index === 0 ? ' tips-dot--active' : '';
            dotsHtml += `<button class="tips-dot${dotActive}" data-slide="${index}" type="button"></button>`;
        });

        container.innerHTML = slidesHtml;
        if (dotsContainer) dotsContainer.innerHTML = dotsHtml;
    },

    /**
     * Formats text (converts line breaks to paragraphs and applies formatting)
     */
    formatText(text) {
        // Replace [b]...[/b] with <strong>...</strong>
        let formatted = text.replace(/\[b\](.*?)\[\/b\]/gi, '<strong>$1</strong>');

        // Split by double line breaks for paragraphs
        const paragraphs = formatted.split(/\n\n+/);
        return paragraphs
            .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
            .join('');
    },

    /**
     * Updates navigation buttons state
     */
    updateNavigation() {
        const prevBtn = this.root.querySelector('.tips-nav-prev');
        const nextBtn = this.root.querySelector('.tips-nav-next');

        if (prevBtn) {
            prevBtn.disabled = this.currentSlide === 0 || this.totalSlides === 0;
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentSlide >= this.totalSlides - 1 || this.totalSlides === 0;
        }

        // Update dots
        const dots = this.root.querySelectorAll('.tips-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('tips-dot--active', index === this.currentSlide);
        });
    },

    /**
     * Goes to a specific slide
     */
    goToSlide(index) {
        if (index < 0 || index >= this.totalSlides) return;

        const slides = this.root.querySelectorAll('.tips-slide');
        const container = this.root.querySelector('.tips-slides-container');

        // Update current slide
        this.currentSlide = index;

        // Slide animation via transform
        if (container) {
            container.style.transform = `translateX(-${index * 100}%)`;
        }

        // Update active state
        slides.forEach((slide, i) => {
            slide.classList.toggle('tips-slide--active', i === index);
        });

        this.updateNavigation();
    },

    /**
     * Goes to the previous slide
     */
    prevSlide() {
        if (this.currentSlide > 0) {
            this.goToSlide(this.currentSlide - 1);
        }
    },

    /**
     * Goes to the next slide
     */
    nextSlide() {
        if (this.currentSlide < this.totalSlides - 1) {
            this.goToSlide(this.currentSlide + 1);
        }
    },

    /**
     * Attaches events
     */
    attachEvents() {
        if (this.eventsAttached || !this.root) return;

        // Previous button
        const prevBtn = this.root.querySelector('.tips-nav-prev');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevSlide());
        }

        // Next button
        const nextBtn = this.root.querySelector('.tips-nav-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextSlide());
        }

        // Dots
        this.root.querySelector('.tips-dots')?.addEventListener('click', (e) => {
            const dot = e.target.closest('.tips-dot');
            if (dot) {
                const index = parseInt(dot.dataset.slide, 10);
                this.goToSlide(index);
            }
        });

        // Swipe support for touch devices
        let touchStartX = 0;
        let touchEndX = 0;

        const slider = this.root.querySelector('.tips-slider');
        if (slider) {
            slider.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            slider.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                const diff = touchStartX - touchEndX;

                if (Math.abs(diff) > 50) {
                    if (diff > 0) {
                        this.nextSlide();
                    } else {
                        this.prevSlide();
                    }
                }
            }, { passive: true });
        }

        // Click on images to open lightbox
        this.root.addEventListener('click', (e) => {
            const img = e.target.closest('.tips-slide-image img');
            if (img) {
                this.openLightbox(img.src);
            }
        });

        this.eventsAttached = true;
    },

    /**
     * Opens the lightbox with an image
     */
    openLightbox(src) {
        if (!this.lightboxEl) {
            this.createLightbox();
        }

        const img = this.lightboxEl.querySelector('.tips-lightbox-image');
        if (img) {
            img.src = src;
        }

        this.lightboxEl.classList.add('tips-lightbox--open');
        this.lightboxOpen = true;
    },

    /**
     * Closes the lightbox
     */
    closeLightbox() {
        if (this.lightboxEl) {
            this.lightboxEl.classList.remove('tips-lightbox--open');
        }
        this.lightboxOpen = false;
    },

    /**
     * Creates the lightbox element
     */
    createLightbox() {
        const lightbox = document.createElement('div');
        lightbox.className = 'tips-lightbox';
        lightbox.innerHTML = `
            <div class="tips-lightbox-backdrop"></div>
            <div class="tips-lightbox-content">
                <button class="tips-lightbox-close" type="button" aria-label="Close">&times;</button>
                <img class="tips-lightbox-image" src="" alt="Enlarged image">
            </div>
        `;

        // Close by clicking on backdrop
        lightbox.querySelector('.tips-lightbox-backdrop').addEventListener('click', () => {
            this.closeLightbox();
        });

        // Close with X button
        lightbox.querySelector('.tips-lightbox-close').addEventListener('click', () => {
            this.closeLightbox();
        });

        // Close with Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.lightboxOpen) {
                this.closeLightbox();
            }
        });

        // Add to phone frame
        const phoneFrame = document.querySelector('.phone-frame');
        if (phoneFrame) {
            phoneFrame.appendChild(lightbox);
        } else {
            document.body.appendChild(lightbox);
        }

        this.lightboxEl = lightbox;
    },

    /**
     * Called when the app is opened
     */
    onOpen() {
        // Reset to first slide when opening
        this.goToSlide(0);
    },

    /**
     * Called when the app is closed
     */
    onClose() {
        // Nothing to do
    }
};
