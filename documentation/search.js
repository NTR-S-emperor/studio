/**
 * Documentation Search with Autocomplete
 * Provides instant search results as user types
 */
(function() {
    // Search index - all searchable terms with their locations
    const searchIndex = [
        // Messenger Commands
        { term: '$mc', description: 'MC\'s custom name variable', page: 'messenger.html', anchor: '#commands' },
        { term: '$gf', description: 'Girlfriend\'s custom name variable', page: 'messenger.html', anchor: '#commands' },
        { term: '$pics', description: 'Send a photo in conversation', page: 'messenger.html', anchor: '#media' },
        { term: '$vids', description: 'Send a video in conversation', page: 'messenger.html', anchor: '#media' },
        { term: '$audio', description: 'Send a voice note', page: 'messenger.html', anchor: '#media' },
        { term: '$talks', description: 'Start a new conversation', page: 'messenger.html', anchor: '#commands' },
        { term: '$insta', description: 'Unlock an InstaPics post', page: 'messenger.html', anchor: '#commands' },
        { term: '$slut', description: 'Unlock an OnlySlut post', page: 'messenger.html', anchor: '#commands' },
        { term: '$status', description: 'Display a central bubble', page: 'messenger.html', anchor: '#commands' },
        { term: '$delete', description: 'Delete a message', page: 'messenger.html', anchor: '#commands' },
        { term: '$choices', description: 'Choices with story impact', page: 'messenger.html', anchor: '#choices' },
        { term: '$fake.choices', description: 'Cosmetic choices (no impact)', page: 'messenger.html', anchor: '#choices' },
        { term: '$lock', description: 'Premium content lock', page: 'messenger.html', anchor: '#locks' },
        { term: '$thinking', description: 'MC inner thoughts overlay', page: 'messenger.html', anchor: '#thinking' },
        { term: '$/', description: 'Separate thought bubbles', page: 'messenger.html', anchor: '#thinking' },
        { term: '@typing', description: 'Typing indicator effect', page: 'messenger.html', anchor: '#commands' },
        { term: '$spy_unlock', description: 'Unlock the Spy App', page: 'spy.html', anchor: '#unlock' },
        { term: '$spy_unlock_instapics', description: 'Show InstaPics on GF phone', page: 'spy.html', anchor: '#unlock' },
        { term: '$spy_unlock_onlyslut', description: 'Show OnlySlut on GF phone', page: 'spy.html', anchor: '#unlock' },
        { term: '$spy_anchor', description: 'Set visibility anchor point', page: 'spy.html', anchor: '#anchors' },
        { term: '(liked)', description: 'Indicate GF liked the post', page: 'spy.html', anchor: '#gf-social' },
        { term: 'path', description: 'Narrative choice branch', page: 'messenger.html', anchor: '#choices' },
        { term: 'end path', description: 'End of choice branch', page: 'messenger.html', anchor: '#choices' },

        // Files
        { term: 'characters.txt', description: 'Character definition file', page: 'messenger.html', anchor: '#characters' },
        { term: 'start.txt', description: 'First conversation (entry point)', page: 'messenger.html', anchor: '#conversations' },
        { term: 'desc.txt', description: 'Story description', page: 'create-story.html', anchor: '' },
        { term: 'icon.png', description: 'Story icon', page: 'create-story.html', anchor: '' },
        { term: 'favicon.png', description: 'Site icon (browser tab)', page: 'configuration.html', anchor: '#customization' },
        { term: 'version.txt', description: 'Displayed version number', page: 'configuration.html', anchor: '#customization' },
        { term: 'system_translations.txt', description: 'Interface text + languages', page: 'configuration.html', anchor: '#translations' },

        // Folders
        { term: 'talks/', description: 'Conversations folder', page: 'messenger.html', anchor: '#conversations' },
        { term: 'pics/', description: 'Images folder (conversation)', page: 'messenger.html', anchor: '#media' },
        { term: 'vids/', description: 'Videos folder', page: 'messenger.html', anchor: '#media' },
        { term: 'audio/', description: 'Audio files folder', page: 'messenger.html', anchor: '#media' },
        { term: 'avatar/', description: 'Avatar images folder', page: 'messenger.html', anchor: '#characters' },
        { term: 'posts/', description: 'Social media posts folder', page: 'instapics.html', anchor: '#posts' },
        { term: 'images/', description: 'Post images folder', page: 'instapics.html', anchor: '#posts' },
        { term: 'stories/', description: 'Stories root folder', page: 'create-story.html', anchor: '' },
        { term: 'assets/music/', description: 'Background music', page: 'configuration.html', anchor: '#assets' },
        { term: 'assets/wallpapers/', description: 'Wallpapers', page: 'configuration.html', anchor: '#assets' },
        { term: 'gfwallpaper.png', description: 'Girlfriend\'s phone wallpaper (Spy App)', page: 'configuration.html', anchor: '#assets' },

        // Concepts
        { term: 'characters', description: 'Character creation', page: 'messenger.html', anchor: '#characters' },
        { term: 'conversations', description: 'Writing dialogues', page: 'messenger.html', anchor: '#conversations' },
        { term: 'commands', description: 'List of $ commands', page: 'messenger.html', anchor: '#commands' },
        { term: 'media', description: 'Images, videos, audio', page: 'messenger.html', anchor: '#media' },
        { term: 'choices', description: 'Narrative choice system', page: 'messenger.html', anchor: '#choices' },
        { term: 'translations', description: 'Multi-language support', page: 'configuration.html', anchor: '#translations' },
        { term: 'comments', description: 'Comments on posts', page: 'instapics.html', anchor: '#comments' },
        { term: 'comments.replied', description: 'Reply to a comment', page: 'instapics.html', anchor: '#comments' },
        { term: 'replied.replied', description: 'Reply to a reply', page: 'instapics.html', anchor: '#comments' },

        // Applications
        { term: 'Messenger', description: 'Messaging application', page: 'messenger.html', anchor: '' },
        { term: 'InstaPics', description: 'Instagram-like social network', page: 'instapics.html', anchor: '' },
        { term: 'OnlySlut', description: 'Subscription platform', page: 'onlyslut.html', anchor: '' },
        { term: 'Spy App', description: 'View girlfriend\'s phone', page: 'spy.html', anchor: '' },
        { term: 'anchor', description: 'Spy App visibility anchor', page: 'spy.html', anchor: '#anchors' },
        { term: 'girlfriend', description: 'GF phone content (Spy App)', page: 'spy.html', anchor: '' },

        // Locks
        { term: '[BRONZE]', description: 'Bronze lock level', page: 'messenger.html', anchor: '#locks' },
        { term: '[SILVER]', description: 'Silver lock level', page: 'messenger.html', anchor: '#locks' },
        { term: '[GOLD]', description: 'Gold lock level', page: 'messenger.html', anchor: '#locks' },
        { term: '[DIAMOND]', description: 'Diamond lock level', page: 'messenger.html', anchor: '#locks' },
        { term: '[PLATINUM]', description: 'Platinum lock level', page: 'messenger.html', anchor: '#locks' },

        // Post format
        { term: 'Image:', description: 'Image in a social post', page: 'instapics.html', anchor: '#posts' },
        { term: 'Text:', description: 'Text in a social post', page: 'instapics.html', anchor: '#posts' },
        { term: 'Likes:', description: 'Number of likes', page: 'instapics.html', anchor: '#posts' },
        { term: 'Comments', description: 'Comments section', page: 'instapics.html', anchor: '#comments' },
    ];

    /**
     * Create autocomplete dropdown element
     * @returns {HTMLElement} Dropdown container
     */
    function createDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = 'search-dropdown';
        dropdown.id = 'search-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-top: none;
            border-radius: 0 0 6px 6px;
            max-height: 300px;
            overflow-y: auto;
            display: none;
            z-index: 1000;
        `;
        return dropdown;
    }

    /**
     * Create a single result item
     * @param {Object} item - Search result item
     * @param {string} query - Search query for highlighting
     * @returns {HTMLElement} Result item element
     */
    function createResultItem(item, query) {
        const div = document.createElement('div');
        div.className = 'search-result';
        div.style.cssText = `
            padding: 10px 14px;
            cursor: pointer;
            border-bottom: 1px solid var(--border);
            transition: background 0.15s;
        `;

        // Highlight matching text
        const termHtml = highlightMatch(item.term, query);

        div.innerHTML = `
            <div style="color: var(--accent-light); font-family: monospace; font-size: 0.9rem;">${termHtml}</div>
            <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">${item.description}</div>
        `;

        div.addEventListener('mouseenter', () => {
            div.style.background = 'var(--bg-secondary)';
        });
        div.addEventListener('mouseleave', () => {
            div.style.background = 'transparent';
        });
        div.addEventListener('click', () => {
            window.location.href = item.page + item.anchor;
        });

        return div;
    }

    /**
     * Highlight matching text in search results
     * @param {string} text - Text to highlight
     * @param {string} query - Query to match
     * @returns {string} HTML with highlighted matches
     */
    function highlightMatch(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<span style="background: var(--accent); color: var(--bg-primary); padding: 0 2px; border-radius: 2px;">$1</span>');
    }

    /**
     * Escape regex special characters
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Search function - returns matching results
     * @param {string} query - Search query
     * @returns {Array} Matching search results
     */
    function search(query) {
        if (!query || query.length < 1) return [];

        const lowerQuery = query.toLowerCase();

        return searchIndex
            .filter(item =>
                item.term.toLowerCase().includes(lowerQuery) ||
                item.description.toLowerCase().includes(lowerQuery)
            )
            .sort((a, b) => {
                // Prioritize items that start with the query
                const aStarts = a.term.toLowerCase().startsWith(lowerQuery);
                const bStarts = b.term.toLowerCase().startsWith(lowerQuery);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                return a.term.localeCompare(b.term);
            })
            .slice(0, 10);
    }

    /**
     * Initialize search functionality on all search inputs
     */
    function initSearch() {
        const searchInputs = document.querySelectorAll('.search-input');

        searchInputs.forEach(input => {
            const parent = input.parentElement;
            parent.style.position = 'relative';

            const dropdown = createDropdown();
            parent.appendChild(dropdown);

            // Handle input changes
            input.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                const results = search(query);

                dropdown.innerHTML = '';

                if (results.length > 0) {
                    results.forEach(item => {
                        dropdown.appendChild(createResultItem(item, query));
                    });
                    dropdown.style.display = 'block';
                } else if (query.length > 0) {
                    dropdown.innerHTML = '<div style="padding: 14px; color: var(--text-muted); text-align: center;">No results found</div>';
                    dropdown.style.display = 'block';
                } else {
                    dropdown.style.display = 'none';
                }
            });

            // Handle keyboard navigation
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    dropdown.style.display = 'none';
                    input.blur();
                }
                if (e.key === 'Enter') {
                    const firstResult = dropdown.querySelector('.search-result');
                    if (firstResult) {
                        firstResult.click();
                    }
                }
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!parent.contains(e.target)) {
                    dropdown.style.display = 'none';
                }
            });

            // Keyboard shortcut: Ctrl+K or / to focus search
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement.tagName !== 'INPUT')) {
                    e.preventDefault();
                    input.focus();
                }
            });
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearch);
    } else {
        initSearch();
    }
})();
