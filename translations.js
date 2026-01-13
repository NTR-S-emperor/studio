// translations.js - Translation system for multi-language support

window.Translations = {
    data: {},               // { "English text": { en: '...', fr: '...', ... } }
    languages: [],          // [{ code: 'EN', name: 'English' }, ...]
    currentLang: 'en',
    loaded: false,
    callbacks: [],

    /**
     * Initialize the translation system
     */
    async init(lang = 'en') {
        await this.load();
        const validLang = this.languages.find(l => l.code.toLowerCase() === lang.toLowerCase());
        this.currentLang = validLang ? validLang.code.toLowerCase() : (this.languages[0]?.code.toLowerCase() || 'en');
        return this;
    },

    /**
     * Load and parse the translations file
     */
    async load() {
        try {
            const url = window.getAssetUrl ? window.getAssetUrl('system_translations.txt') : 'system_translations.txt';
            const response = await fetch(url);
            const text = await response.text();
            this.parse(text);
            this.loaded = true;
            this.callbacks.forEach(cb => cb());
            this.callbacks = [];
        } catch (error) {
        }
    },

    /**
     * Parse the translations file
     * @LANG: CODE = Display Name
     * @key: CODE= Text | CODE= Text | ...
     */
    parse(text) {
        const lines = text.split('\n');
        this.languages = [];
        this.data = {};

        // First pass: find all @LANG definitions
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('@LANG:')) {
                const match = trimmed.match(/@LANG:\s*(\w+)\s*=\s*(.+)/);
                if (match) {
                    this.languages.push({
                        code: match[1].toUpperCase(),
                        name: match[2].trim()
                    });
                }
            }
        }

        // Second pass: parse translations
        // New format: @key: EN= Text | FR= Text
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            if (trimmed.startsWith('@LANG:')) continue; // Skip language definitions

            // Match @key: translations format
            const keyMatch = trimmed.match(/^@([a-zA-Z0-9_.]+):\s*(.+)$/);
            if (!keyMatch) continue;

            const key = keyMatch[1];
            const translationsPart = keyMatch[2];

            // Split by | and parse each CODE= value
            const parts = translationsPart.split('|').map(p => p.trim());
            const translations = {};

            for (const part of parts) {
                // Match CODE= value (CODE is 2-3 uppercase letters)
                const match = part.match(/^([A-Z]{2,3})=\s*(.*)$/);
                if (match) {
                    const code = match[1].toLowerCase();
                    const value = match[2].trim()
                        .replace(/\\n/g, '\n')
                        .replace(/\\t/g, '\t');

                    translations[code] = value;
                }
            }

            // Store translation using the explicit key
            if (Object.keys(translations).length > 0) {
                this.data[key] = translations;
            }
        }
    },

    /**
     * Set current language
     */
    setLanguage(lang) {
        const normalized = lang.toLowerCase();
        const valid = this.languages.find(l => l.code.toLowerCase() === normalized);
        this.currentLang = valid ? normalized : (this.languages[0]?.code.toLowerCase() || 'en');
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: this.currentLang } }));
    },

    getLanguage() {
        return this.currentLang;
    },

    /**
     * Get available languages (for settings dropdown)
     * Returns: [{ code: 'en', name: 'English' }, ...]
     */
    getAvailableLanguages() {
        return this.languages.map(l => ({
            code: l.code.toLowerCase(),
            name: l.name
        }));
    },

    /**
     * Get translation
     * t('Settings') → 'Paramètres' (if lang = fr)
     */
    get(key, vars = {}, lang = null) {
        const useLang = (lang || this.currentLang).toLowerCase();
        const entry = this.data[key];

        if (!entry) return this.interpolate(key, vars);

        const firstLang = this.languages[0]?.code.toLowerCase() || 'en';
        let text = entry[useLang] || entry[firstLang] || key;
        return this.interpolate(text, vars);
    },

    /**
     * Replace {varName} with values
     */
    interpolate(text, vars) {
        if (!vars || typeof vars !== 'object') return text;
        for (const [name, value] of Object.entries(vars)) {
            text = text.replace(new RegExp(`\\{${name}\\}`, 'gi'), value);
        }
        return text;
    },

    t(key, vars = {}) {
        return this.get(key, vars);
    },

    has(key) {
        return key in this.data;
    },

    onReady(callback) {
        if (this.loaded) callback();
        else this.callbacks.push(callback);
    },

    /**
     * Check if current language is the default (first in list)
     */
    isDefaultLanguage() {
        const defaultLang = this.languages[0]?.code.toLowerCase() || 'en';
        return this.currentLang === defaultLang;
    },

    /**
     * Get URL with cache-busting hash from manifest
     * Uses window.getAssetUrl if available (defined in index.php)
     */
    getCacheBustedUrl(url) {
        if (window.getAssetUrl) {
            return window.getAssetUrl(url);
        }
        return url;
    },

    /**
     * Get the translated file URL by adding $XX. prefix to filename
     * Example: "stories/demo/messenger/start.txt" → "stories/demo/messenger/$FR.start.txt"
     */
    getTranslatedUrl(url) {
        if (this.isDefaultLanguage()) return url;

        const langCode = this.currentLang.toUpperCase();
        const lastSlash = url.lastIndexOf('/');

        if (lastSlash === -1) {
            // No folder, just filename
            return `$${langCode}.${url}`;
        }

        const folder = url.substring(0, lastSlash + 1);
        const filename = url.substring(lastSlash + 1);
        return `${folder}$${langCode}.${filename}`;
    },

    /**
     * Fetch a file with translation support
     * Tries to load translated version first ($XX.filename.txt)
     * Falls back to original file if translation doesn't exist
     *
     * @param {string} url - Original file URL
     * @param {object} options - Fetch options (optional)
     * @returns {Promise<Response>} - Fetch response
     */
    async fetchTranslated(url, options = {}) {
        // If default language, just fetch normally with cache-busting
        if (this.isDefaultLanguage()) {
            return fetch(this.getCacheBustedUrl(url), options);
        }

        // Try translated version first
        const translatedUrl = this.getTranslatedUrl(url);

        try {
            const res = await fetch(this.getCacheBustedUrl(translatedUrl), options);
            if (res.ok) {
                return res;
            }
        } catch (e) {
            // Translated file not found, fall back to original
        }

        // Fall back to original file with cache-busting
        return fetch(this.getCacheBustedUrl(url), options);
    },

    /**
     * Fetch a file with LINE-LEVEL translation fallback
     * Loads both default and translated files, then merges line by line.
     * Missing or empty lines in translation fall back to the default.
     *
     * @param {string} url - Original file URL (default language)
     * @param {object} options - Fetch options (optional)
     * @returns {Promise<string|null>} - Merged content, or null if file not found
     */
    async fetchMergedContent(url, options = {}) {
        // Fetch the default file first (always needed as the reference)
        // Use cache-busting to ensure latest version
        let defaultContent = null;
        try {
            const defaultRes = await fetch(this.getCacheBustedUrl(url), options);
            if (defaultRes.ok) {
                defaultContent = await defaultRes.text();
            }
        } catch (e) {
            // Default file not found
        }

        // If default doesn't exist, return null (file not found)
        if (defaultContent === null) {
            return null;
        }

        // If we're using the default language, just return the default content
        if (this.isDefaultLanguage()) {
            return defaultContent;
        }

        // Try to fetch the translated file with cache-busting
        const translatedUrl = this.getTranslatedUrl(url);
        let translatedContent = null;
        try {
            const translatedRes = await fetch(this.getCacheBustedUrl(translatedUrl), options);
            if (translatedRes.ok) {
                translatedContent = await translatedRes.text();
            }
        } catch (e) {
            // No translation available
        }

        // If no translation found, return default
        if (translatedContent === null) {
            return defaultContent;
        }

        // Merge line by line
        return this.mergeContentLines(defaultContent, translatedContent);
    },

    /**
     * Merge two file contents line by line.
     * For each line, use the translated version if it exists and is not empty,
     * otherwise use the default version.
     *
     * @param {string} defaultContent - Content from the default language file
     * @param {string} translatedContent - Content from the translated file
     * @returns {string} - Merged content
     */
    mergeContentLines(defaultContent, translatedContent) {
        const defaultLines = defaultContent.split('\n');
        const translatedLines = translatedContent.split('\n');

        const mergedLines = defaultLines.map((defaultLine, index) => {
            const translatedLine = translatedLines[index];

            // Use translated line if it exists and is not empty/whitespace
            if (translatedLine !== undefined && translatedLine.trim() !== '') {
                return translatedLine;
            }

            // Fall back to default line
            return defaultLine;
        });

        return mergedLines.join('\n');
    },

    /**
     * Update DOM elements with data-i18n attributes
     */
    updateDOM() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const vars = el.getAttribute('data-i18n-vars');
            el.textContent = this.get(key, vars ? JSON.parse(vars) : {});
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = this.get(el.getAttribute('data-i18n-placeholder'));
        });

        document.querySelectorAll('[data-i18n-alt]').forEach(el => {
            el.alt = this.get(el.getAttribute('data-i18n-alt'));
        });
    }
};

// Global shorthand
window.t = (key, vars) => window.Translations.t(key, vars);

// Global fetch with translation support for story content files
window.fetchTranslated = (url, options) => window.Translations.fetchTranslated(url, options);

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('studioSettings');
    let lang = 'en';
    if (saved) {
        try { lang = JSON.parse(saved).language || 'en'; } catch (e) {}
    }
    window.Translations.init(lang);
});
