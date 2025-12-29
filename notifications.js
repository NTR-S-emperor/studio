// notifications.js - Phone notification system

window.Notifications = {
    container: null,
    defaultDuration: 5000, // 5 seconds by default
    queue: [],             // Queue to guarantee order
    isProcessing: false,   // Indicates if we're processing the queue
    nextReservationId: 1,  // ID for reservations

    init() {
        this.container = document.getElementById('notificationContainer');
        if (!this.container) {
        }
    },

    /**
     * Reserve a spot in the queue BEFORE async loading
     * Returns an ID to use with fulfill()
     */
    reserve() {
        const id = this.nextReservationId++;
        this.queue.push({ id, data: null, ready: false });
        return id;
    },

    /**
     * Fill reservation data and start processing
     */
    fulfill(reservationId, options) {
        const item = this.queue.find(q => q.id === reservationId);
        if (item) {
            item.data = options;
            item.ready = true;
            this.processQueue();
        }
    },

    /**
     * Add a notification to the queue and process it
     * (for direct calls without reservation)
     */
    enqueue(options) {
        const id = this.nextReservationId++;
        this.queue.push({ id, data: options, ready: true });
        this.processQueue();
    },

    /**
     * Process the queue one notification at a time
     */
    processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;

        // Wait for the first element to be ready
        const first = this.queue[0];
        if (!first.ready) return;

        this.isProcessing = true;
        this.queue.shift();

        // Show the notification
        this.showImmediate(first.data);

        // After a short delay, move to the next
        setTimeout(() => {
            this.isProcessing = false;
            this.processQueue();
        }, 500); // 500ms between each notification
    },

    /**
     * Show a notification (via queue to guarantee order)
     */
    show(options) {
        this.enqueue(options);
    },

    /**
     * Show a notification immediately (called by the queue)
     */
    showImmediate(options) {
        if (!this.container) this.init();
        if (!this.container) return;

        const {
            app,
            appIcon,
            avatar,
            author,
            text,
            postIndex,
            duration = this.defaultDuration
        } = options;

        // Create the notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.dataset.app = app.toLowerCase().replace(/\s+/g, '');
        notification.dataset.postIndex = postIndex;
        notification.dataset.author = author;

        notification.innerHTML = `
            <img class="notification-icon" src="${appIcon}" alt="${app}">
            <img class="notification-avatar" src="${avatar}" alt="${author}">
            <div class="notification-content">
                <div class="notification-header">
                    <span class="notification-app">${app}</span>
                    <span class="notification-time" data-i18n="notif.now">now</span>
                </div>
                <div class="notification-body">
                    <span class="notification-author">${author}</span>
                    ${text ? `<span class="notification-text">${text}</span>` : ''}
                </div>
            </div>
            <button class="notification-close" type="button" aria-label="Close">×</button>
        `;

        // Add click handler (with stopPropagation to prevent click from bubbling to apps)
        // Capture app and author in closure to avoid reference issues
        const capturedApp = app.toLowerCase().replace(/\s+/g, '');
        const capturedAuthor = author;
        notification.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleClickDirect(notification, capturedApp, capturedAuthor);
        });

        // Handler for close button (just close, no redirect)
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hide(notification);
            });
        }

        // Add to container (appendChild because order is guaranteed by the queue)
        this.container.appendChild(notification);

        // Apply translations to the notification
        if (window.Translations) {
            const timeEl = notification.querySelector('[data-i18n]');
            if (timeEl) {
                const key = timeEl.getAttribute('data-i18n');
                timeEl.textContent = window.Translations.get(key);
            }
        }

        // Trigger appear animation with double RAF to guarantee initial render
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                notification.classList.add('show');
            });
        });

        // Schedule disappearance
        setTimeout(() => {
            this.hide(notification);
        }, duration);

        return notification;
    },

    /**
     * Hide a notification
     */
    hide(notification) {
        if (!notification || !notification.parentNode) return;

        notification.classList.remove('show');
        notification.classList.add('hide');

        // Remove after animation
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    },

    /**
     * Handle click on notification (version with direct parameters)
     */
    handleClickDirect(notification, app, authorName) {
        // Hide immediately
        this.hide(notification);

        // Redirect to appropriate app and filter by author
        if (app === 'instapics') {
            this.openInstaPicsProfile(authorName);
        } else if (app === 'onlyslut') {
            this.openOnlySlutProfile(authorName);
        }
    },

    /**
     * Open InstaPics and filter by author
     */
    openInstaPicsProfile(authorName) {
        const instapicsScreen = document.getElementById('instapicsScreen');
        const isAlreadyOpen = instapicsScreen && !instapicsScreen.classList.contains('hidden');

        // Function to apply the filter
        const applyFilter = () => {
            if (window.InstaPics) {
                const user = window.InstaPics.users.find(u => u.name === authorName);
                if (user) {
                    window.InstaPics.filterUser = user.id;
                    window.InstaPics.renderFeed();
                    window.InstaPics.renderUsers();
                }
            }
        };

        if (isAlreadyOpen) {
            // App already open, filter immediately
            applyFilter();
        } else {
            // Open app then wait for users to load
            const openBtn = document.getElementById('openInstapicsBtn');
            if (openBtn) {
                openBtn.click();
            }
            // Wait for users to load (polling)
            this.waitForUsersAndFilter(window.InstaPics, authorName);
        }
    },

    /**
     * Open OnlySlut and filter by author
     */
    openOnlySlutProfile(authorName) {
        const onlyslutScreen = document.getElementById('onlyslutScreen');
        const isAlreadyOpen = onlyslutScreen && !onlyslutScreen.classList.contains('hidden');

        // Function to apply the filter
        const applyFilter = () => {
            if (window.OnlySlut) {
                const user = window.OnlySlut.users.find(u => u.name === authorName);
                if (user) {
                    window.OnlySlut.filterUser = user.id;
                    window.OnlySlut.renderFeed();
                    window.OnlySlut.renderUsers();
                }
            }
        };

        if (isAlreadyOpen) {
            // App already open, filter immediately
            applyFilter();
        } else {
            // Open app then wait for users to load
            const openBtn = document.getElementById('openOnlySlutBtn');
            if (openBtn) {
                openBtn.click();
            }
            // Wait for users to load (polling)
            this.waitForUsersAndFilter(window.OnlySlut, authorName);
        }
    },

    /**
     * Wait for users to load then apply filter
     * Polling every 100ms, max 3 seconds
     */
    waitForUsersAndFilter(app, authorName) {
        const maxAttempts = 30; // 30 * 100ms = 3 seconds max
        let attempts = 0;

        const tryFilter = () => {
            attempts++;

            if (app && app.users && app.users.length > 0) {
                const user = app.users.find(u => u.name === authorName);

                if (user) {
                    app.filterUser = user.id;
                    app.renderFeed();
                    app.renderUsers();
                    return;
                }
            }

            if (attempts < maxAttempts) {
                setTimeout(tryFilter, 100);
            }
        };

        // First attempt after 100ms
        setTimeout(tryFilter, 100);
    },

    /**
     * Utility method to create an InstaPics notification
     */
    showInstaPics(author, avatar, text, postIndex) {
        return this.show({
            app: 'InstaPics',
            appIcon: 'assets/apps_icon/instapics.svg',
            avatar: avatar,
            author: author,
            text: text,
            postIndex: postIndex
        });
    },

    /**
     * Utility method to create an OnlySlut notification
     */
    showOnlySlut(author, avatar, text, postIndex) {
        return this.show({
            app: 'OnlySlut',
            appIcon: 'assets/apps_icon/onlyslut.png',
            avatar: avatar,
            author: author,
            text: text,
            postIndex: postIndex
        });
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.Notifications.init();
});
