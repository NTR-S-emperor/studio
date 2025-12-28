// app.gallery/gallery.js

window.Gallery = {
    root: null,
    storyPath: null,
    images: [],           // List of images [{src, sender, senderName, isMe}]
    videos: [],           // List of videos [{src, sender, senderName, isMe}]
    filterUser: null,     // null = all, "me" = my messages, otherwise = contact key
    viewMode: 'images',   // 'images' or 'videos'
    eventsAttached: false,

    /**
     * Initialize Gallery for a given story
     */
    async init(storyPath) {
        if (storyPath) {
            this.storyPath = storyPath;
        }

        if (!this.storyPath) {
            return;
        }

        this.mount();
        this.attachEvents();
        this.loadImages();
    },

    /**
     * Change story
     */
    async setStory(storyPath) {
        if (this.storyPath === storyPath) return;
        this.storyPath = storyPath;
        this.filterUser = null;
        this.loadImages();
    },

    /**
     * Reload images and videos from Messenger
     */
    loadImages() {
        this.images = [];
        this.videos = [];

        if (!window.Messenger) {
            this.render();
            return;
        }

        // Get all images and videos from Messenger conversations
        const conversationsByKey = window.Messenger.conversationsByKey || {};

        for (const contactKey of Object.keys(conversationsByKey)) {
            const conv = conversationsByKey[contactKey];

            // Loop through already played messages (playedMessages) to only display media that has already been seen
            for (const msg of conv.playedMessages || []) {
                if (msg.deleted) continue;

                // Get the speaker key (can be speakerKey or from depending on the message)
                const speakerKey = msg.speakerKey || msg.from;
                const isMe = speakerKey === 'mc';

                // Store the keys - names will be resolved at render time
                const senderInfo = {
                    sender: isMe ? 'me' : speakerKey,
                    senderKey: speakerKey,  // raw key for later resolution
                    contactKey: contactKey,
                    isMe: isMe
                };

                // Images
                if (msg.kind === 'image' && msg.image) {
                    const picsBasePath = msg.parentDir
                        ? `${this.storyPath}/messenger/talks/${msg.parentDir}/pics`
                        : `${this.storyPath}/messenger/talks/pics`;
                    this.images.push({
                        src: `${picsBasePath}/${msg.image}`,
                        ...senderInfo
                    });
                }

                // Videos
                if (msg.kind === 'video' && msg.video) {
                    const vidsBasePath = msg.parentDir
                        ? `${this.storyPath}/messenger/talks/${msg.parentDir}/vids`
                        : `${this.storyPath}/messenger/talks/vids`;
                    this.videos.push({
                        src: `${vidsBasePath}/${msg.video}`,
                        ...senderInfo
                    });
                }
            }
        }

        this.render();
    },

    /**
     * Mount the app's DOM
     */
    mount() {
        if (this.root) return;

        const container = document.getElementById("galleryScreen");
        if (!container) {
            return;
        }

        this.root = document.createElement("div");
        this.root.id = "gallery-app";
        this.root.innerHTML = `
            <header class="gallery-header">
                <span class="gallery-title" data-i18n="app.gallery">Gallery</span>
                <span class="gallery-counter">0</span>
            </header>
            <div class="gallery-tabs">
                <button class="gallery-tab gallery-tab--active" data-tab="images" data-i18n="gallery.photos">Photos</button>
                <button class="gallery-tab" data-tab="videos" data-i18n="gallery.videos">Videos</button>
            </div>
            <div class="gallery-filters"></div>
            <main class="gallery-content">
                <div class="gallery-grid"></div>
            </main>
        `;

        container.appendChild(this.root);

        // Global modal
        let modal = document.querySelector(".gallery-modal");
        if (!modal) {
            const phoneFrame = document.querySelector(".phone-frame");
            if (phoneFrame) {
                modal = document.createElement("div");
                modal.className = "gallery-modal hidden";
                modal.innerHTML = `
                    <div class="gallery-modal-backdrop"></div>
                    <div class="gallery-modal-content">
                        <button class="gallery-modal-close" type="button" aria-label="Close">×</button>
                        <img src="" alt="">
                        <video controls playsinline style="display: none;"></video>
                        <div class="gallery-modal-info"></div>
                    </div>
                `;
                phoneFrame.appendChild(modal);
            }
        }
    },

    /**
     * Attach events
     */
    attachEvents() {
        if (this.eventsAttached) return;

        const phoneFrame = document.querySelector('.phone-frame');
        if (!phoneFrame) return;

        phoneFrame.addEventListener("click", (e) => {
            // Click on a tab (Photos / Videos)
            const tabBtn = e.target.closest(".gallery-tab");
            if (tabBtn && this.root && this.root.contains(tabBtn)) {
                const tabValue = tabBtn.dataset.tab;
                if (tabValue && tabValue !== this.viewMode) {
                    this.viewMode = tabValue;
                    this.filterUser = null; // Reset user filter
                    this.render();
                }
                return;
            }

            // Click on a filter
            const filterBtn = e.target.closest(".gallery-filter");
            if (filterBtn && this.root && this.root.contains(filterBtn)) {
                const filterValue = filterBtn.dataset.filter;
                this.filterUser = filterValue === 'all' ? null : filterValue;
                this.render();
                return;
            }

            // Click on an image/video in the gallery
            const galleryItem = e.target.closest(".gallery-item");
            if (galleryItem && this.root && this.root.contains(galleryItem)) {
                const src = galleryItem.dataset.src;
                const info = galleryItem.dataset.info;
                const isVideo = galleryItem.dataset.type === 'video';
                this.openModal(src, info, isVideo);
                return;
            }

            // Close the modal
            const closeBtn = e.target.closest(".gallery-modal-close");
            const backdrop = e.target.closest(".gallery-modal-backdrop");
            if (closeBtn || backdrop) {
                this.closeModal();
                return;
            }
        });

        // Close with Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'Esc') {
                if (this.isModalOpen()) {
                    this.closeModal();
                    e.preventDefault();
                }
            }
        });

        this.eventsAttached = true;
    },

    /**
     * Complete render
     */
    render() {
        this.renderTabs();
        this.renderFilters();
        this.renderGrid();
        this.updateCounter();
    },

    /**
     * Render tabs
     */
    renderTabs() {
        if (!this.root) return;
        const tabs = this.root.querySelectorAll(".gallery-tab");
        tabs.forEach(tab => {
            const isActive = tab.dataset.tab === this.viewMode;
            tab.classList.toggle('gallery-tab--active', isActive);
        });
    },

    /**
     * Resolve a key to a full name via Messenger.keyToName or contacts
     */
    resolveName(key) {
        if (!key) return key;
        if (key === 'mc' || key === 'me') return window.t('gallery.me');

        // Try keyToName first
        if (window.Messenger && window.Messenger.keyToName) {
            const name = window.Messenger.keyToName[key];
            if (name) return name;
        }

        // Fallback: search in contacts
        if (window.Messenger && window.Messenger.contacts) {
            const contact = window.Messenger.contacts.find(c => c.key === key);
            if (contact && contact.name) return contact.name;
        }

        // Last resort: return the key
        return key;
    },

    /**
     * Render filters
     */
    renderFilters() {
        if (!this.root) return;
        const container = this.root.querySelector(".gallery-filters");
        if (!container) return;

        // Data source according to mode
        const dataSource = this.viewMode === 'videos' ? this.videos : this.images;

        // Collect unique users
        const users = new Map(); // key -> name
        users.set('all', window.t('gallery.all'));
        users.set('me', window.t('gallery.me'));

        for (const item of dataSource) {
            if (!item.isMe && item.sender) {
                // Resolve name at render time
                const resolvedName = this.resolveName(item.senderKey || item.sender);
                users.set(item.sender, resolvedName);
            }
        }

        let html = '';
        for (const [key, name] of users) {
            const isActive = (key === 'all' && this.filterUser === null) || (key === this.filterUser);
            const activeClass = isActive ? ' gallery-filter--active' : '';
            html += `<button class="gallery-filter${activeClass}" data-filter="${key}">${name}</button>`;
        }

        container.innerHTML = html;
    },

    /**
     * Render image/video grid
     */
    renderGrid() {
        if (!this.root) return;

        const parent = this.root.querySelector(".gallery-content");
        if (!parent) return;

        const filtered = this.getFilteredItems();
        const isVideoMode = this.viewMode === 'videos';
        const emptyMessage = isVideoMode ? window.t('gallery.novideos') : window.t('gallery.nophotos');

        if (filtered.length === 0) {
            parent.innerHTML = `<div class="gallery-empty">${emptyMessage}</div>`;
            return;
        }

        // Ensure gallery-grid container exists
        if (!parent.querySelector(".gallery-grid")) {
            parent.innerHTML = '<div class="gallery-grid"></div>';
        }
        const grid = parent.querySelector(".gallery-grid");
        if (!grid) return;

        grid.innerHTML = filtered.map(item => {
            // Resolve names at render time
            const senderName = this.resolveName(item.senderKey || item.sender);
            const contactName = this.resolveName(item.contactKey);
            const info = item.isMe ? window.t('gallery.sentto', { name: contactName }) : window.t('gallery.receivedfrom', { name: senderName });

            if (isVideoMode) {
                return `
                    <div class="gallery-item gallery-item--video" data-src="${item.src}" data-info="${info}" data-type="video">
                        <video src="${item.src}" preload="metadata"></video>
                        <div class="gallery-item-play">▶</div>
                        <div class="gallery-item-overlay">${senderName}</div>
                    </div>
                `;
            } else {
                return `
                    <div class="gallery-item" data-src="${item.src}" data-info="${info}" data-type="image">
                        <img src="${item.src}" alt="">
                        <div class="gallery-item-overlay">${senderName}</div>
                    </div>
                `;
            }
        }).join('');
    },

    /**
     * Return filtered items (images or videos depending on mode)
     */
    getFilteredItems() {
        const dataSource = this.viewMode === 'videos' ? this.videos : this.images;

        if (this.filterUser === null) {
            return dataSource;
        }

        if (this.filterUser === 'me') {
            return dataSource.filter(item => item.isMe);
        }

        return dataSource.filter(item => item.sender === this.filterUser);
    },

    /**
     * Return filtered images (for compatibility)
     */
    getFilteredImages() {
        if (this.filterUser === null) {
            return this.images;
        }

        if (this.filterUser === 'me') {
            return this.images.filter(img => img.isMe);
        }

        return this.images.filter(img => img.sender === this.filterUser);
    },

    /**
     * Update counter
     */
    updateCounter() {
        if (!this.root) return;
        const counter = this.root.querySelector(".gallery-counter");
        if (!counter) return;

        const count = this.getFilteredItems().length;
        counter.textContent = count;
    },

    /**
     * Open modal with an image or video
     */
    openModal(src, info, isVideo = false) {
        const modal = document.querySelector(".gallery-modal");
        if (!modal) return;

        const img = modal.querySelector(".gallery-modal-content img");
        const video = modal.querySelector(".gallery-modal-content video");
        const infoDiv = modal.querySelector(".gallery-modal-info");

        if (isVideo) {
            if (img) img.style.display = 'none';
            if (video) {
                video.style.display = 'block';
                video.src = src;
                video.play();
            }
        } else {
            if (video) {
                video.style.display = 'none';
                video.pause();
                video.src = '';
            }
            if (img) {
                img.style.display = 'block';
                img.src = src;
            }
        }

        if (infoDiv) infoDiv.textContent = info || '';

        modal.classList.remove("hidden");
    },

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.querySelector(".gallery-modal");
        if (modal) {
            // Pause video if playing
            const video = modal.querySelector("video");
            if (video) {
                video.pause();
                video.src = '';
            }
            modal.classList.add("hidden");
        }
    },

    /**
     * Check if modal is open
     */
    isModalOpen() {
        const modal = document.querySelector(".gallery-modal");
        return modal && !modal.classList.contains("hidden");
    },

    /**
     * Called when app is opened
     */
    onOpen() {
        this.loadImages();
    },

    onClose() {}
};
