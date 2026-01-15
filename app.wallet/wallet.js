// app.wallet/wallet.js

window.Wallet = {
    root: null,
    eventsAttached: false,

    // Transactions list: [{ type: 'debit'|'credit', amount: number, label: string, date: string, author: 'mc'|'gf' }]
    transactions: [],

    // Initial balance (set via $wallet.unlock.AMOUNT, not shown as transaction)
    initialBalance: 0,

    /**
     * Initializes the Wallet application
     */
    init() {
        // Don't clear transactions if they already exist (they may have been added before opening the app)
        if (!this.transactions) {
            this.transactions = [];
        }
        this.mount();
    },

    /**
     * Mounts the app's DOM
     */
    mount() {
        if (this.root) return;

        const container = document.getElementById('walletScreen');
        if (!container) {
            return;
        }

        this.root = document.createElement('div');
        this.root.id = 'wallet-app';
        this.root.innerHTML = this.renderContent();

        container.appendChild(this.root);

        // Apply translations to Wallet content
        if (window.Translations && window.Translations.loaded) {
            window.Translations.updateDOM();
        }

        // Listen for language changes to update translations (only once)
        if (!this.eventsAttached) {
            this.eventsAttached = true;
            window.addEventListener('languageChanged', () => {
                if (window.Translations) {
                    window.Translations.updateDOM();
                }
                this.render();
            });
        }
    },

    /**
     * Renders the main content structure
     */
    renderContent() {
        return `
            <header class="wallet-header">
                <span class="wallet-title" data-i18n="app.wallet">Wallet</span>
            </header>

            <div class="wallet-balance">
                <div class="wallet-balance-label" data-i18n="wallet.balance">Current Balance</div>
                <div class="wallet-balance-amount wallet-balance-amount--zero">$0.00</div>
            </div>

            <main class="wallet-content">
                <div class="wallet-empty">
                    <img class="wallet-empty-icon" src="assets/apps_icon/wallet.svg" alt="">
                    <p class="wallet-empty-text" data-i18n="wallet.empty">No transactions yet</p>
                </div>
            </main>
        `;
    },

    /**
     * Adds a transaction from messenger parsing
     * @param {string} author - 'mc' or 'gf'
     * @param {number} amount - positive for credit, negative for debit
     * @param {string} label - transaction description
     * @param {string} date - optional date/time indication
     */
    addTransaction(author, amount, label, date = '') {
        const transaction = {
            type: amount >= 0 ? 'credit' : 'debit',
            amount: Math.abs(amount),
            rawAmount: amount,
            label: label.trim(),
            date: date.trim(),
            author: author.toLowerCase()
        };

        this.transactions.push(transaction);
        this.render();
    },

    /**
     * Clears all transactions (used on story reset)
     */
    clearTransactions() {
        this.transactions = [];
        this.render();
    },

    /**
     * Sets the initial balance (not shown as transaction)
     */
    setInitialBalance(amount) {
        this.initialBalance = amount || 0;
        this.render();
    },

    /**
     * Calculates the total balance (initial + transactions)
     */
    getBalance() {
        const transactionsTotal = this.transactions.reduce((sum, t) => sum + t.rawAmount, 0);
        return (this.initialBalance || 0) + transactionsTotal;
    },

    /**
     * Gets the author display name
     */
    getAuthorName(author) {
        if (author === 'mc') {
            return window.mcName || window.customCharacterNames?.mc || 'John';
        } else if (author === 'gf') {
            if (window.customizableCharacterInfo) {
                const key = window.customizableCharacterInfo.key;
                return window.customCharacterNames?.[key] || window.customizableCharacterInfo.defaultName || 'Girlfriend';
            }
            return window.customCharacterNames?.gf || 'Girlfriend';
        }
        return author;
    },

    /**
     * Formats amount with currency
     */
    formatAmount(amount, type) {
        const formatted = amount.toFixed(2);
        const sign = type === 'credit' ? '+' : '-';
        return `${sign}$${formatted}`;
    },

    /**
     * Renders the wallet content
     */
    render() {
        if (!this.root) return;

        // Update balance
        const balance = this.getBalance();
        const balanceEl = this.root.querySelector('.wallet-balance-amount');
        if (balanceEl) {
            const sign = balance >= 0 ? '+' : '';
            balanceEl.textContent = `${sign}$${balance.toFixed(2)}`;
            balanceEl.classList.remove('wallet-balance-amount--positive', 'wallet-balance-amount--negative', 'wallet-balance-amount--zero');
            if (balance > 0) {
                balanceEl.classList.add('wallet-balance-amount--positive');
            } else if (balance < 0) {
                balanceEl.classList.add('wallet-balance-amount--negative');
            } else {
                balanceEl.classList.add('wallet-balance-amount--zero');
            }
        }

        // Update transactions list
        const contentEl = this.root.querySelector('.wallet-content');
        if (!contentEl) return;

        if (this.transactions.length === 0) {
            contentEl.innerHTML = `
                <div class="wallet-empty">
                    <img class="wallet-empty-icon" src="assets/apps_icon/wallet.svg" alt="">
                    <p class="wallet-empty-text" data-i18n="wallet.empty">No transactions yet</p>
                </div>
            `;
            // Apply translations
            if (window.Translations && window.Translations.loaded) {
                window.Translations.updateDOM();
            }
            return;
        }

        // Render transactions (newest first)
        const transactionsHtml = [...this.transactions].reverse().map(t => {
            const authorName = this.getAuthorName(t.author);
            const iconSrc = t.type === 'debit'
                ? 'assets/wallet/icon-debit.svg'
                : 'assets/wallet/icon-credit.svg';

            const metaHtml = t.date
                ? `<span class="wallet-transaction-author">${authorName}</span>
                   <span class="wallet-transaction-meta-separator">•</span>
                   <span class="wallet-transaction-date">${t.date}</span>`
                : `<span class="wallet-transaction-author">${authorName}</span>`;

            return `
                <div class="wallet-transaction wallet-transaction--${t.type}">
                    <div class="wallet-transaction-icon">
                        <img src="${iconSrc}" alt="">
                    </div>
                    <div class="wallet-transaction-details">
                        <div class="wallet-transaction-label">${t.label}</div>
                        <div class="wallet-transaction-meta">
                            ${metaHtml}
                        </div>
                    </div>
                    <div class="wallet-transaction-amount">
                        ${this.formatAmount(t.amount, t.type)}
                    </div>
                </div>
            `;
        }).join('');

        contentEl.innerHTML = transactionsHtml;
    },

    /**
     * Called when the app is opened
     */
    onOpen() {
        this.render();

        // Apply translations
        if (window.Translations && window.Translations.loaded) {
            window.Translations.updateDOM();
        }
    },

    /**
     * Called when the app is closed
     */
    onClose() {
        // Nothing special to do
    },

    /**
     * Parses a wallet command from messenger
     * Format: $wallet.mc = -100 : Label : Date
     * @param {string} line - the line to parse
     * @returns {boolean} true if parsed successfully
     */
    parseCommand(line) {
        // Match: $wallet.mc = -100 : Label : Date
        // or: $wallet.gf = +50.99 : Label
        const regex = /^\$wallet\.(mc|gf)\s*=\s*([+-]?\d+(?:\.\d{1,2})?)\s*:\s*([^:]+)(?:\s*:\s*(.+))?$/i;
        const match = line.trim().match(regex);

        if (!match) return false;

        const author = match[1].toLowerCase();
        const amount = parseFloat(match[2]);
        const label = match[3].trim();
        const date = match[4] ? match[4].trim() : '';

        this.addTransaction(author, amount, label, date);
        return true;
    }
};

// Track wallet app unlock state (not persisted to localStorage)
window.walletAppUnlocked = false;

/**
 * Unlock Wallet app (called via $wallet.unlock in MC's conversations)
 * Does NOT persist to localStorage - unlocked state is tied to conversation progress
 */
window.unlockWalletApp = function() {
    window.walletAppUnlocked = true;
    const walletBtn = document.getElementById('openWalletBtn');
    if (walletBtn) {
        walletBtn.classList.remove('hidden');
    }
};

/**
 * Lock Wallet app (called on goBack or story reset)
 */
window.lockWalletApp = function() {
    window.walletAppUnlocked = false;
    const walletBtn = document.getElementById('openWalletBtn');
    if (walletBtn) {
        walletBtn.classList.add('hidden');
    }
};

/**
 * Check if Wallet app is unlocked for current session
 */
window.isWalletUnlocked = function() {
    return window.walletAppUnlocked === true;
};

/**
 * Reset wallet app state (used on story change/reset)
 */
window.resetWalletAppState = function() {
    window.walletAppUnlocked = false;
    window.Wallet.transactions = [];
    window.Wallet.initialBalance = 0;
    const walletBtn = document.getElementById('openWalletBtn');
    if (walletBtn) {
        walletBtn.classList.add('hidden');
    }
};
