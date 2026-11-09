// Profit FX Broker - Main Application Controller

class App {
    constructor() {
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.currentUser = null;

        this.init();
    }

    init() {
        this.renderTickerMarquee();
        this.renderLandingTable();
        this.renderAccountTiers();
        this.renderFaqs();
        this.attachEventListeners();

        // Initialize WebTrader & Calculator instances
        window.webTrader = new WebTrader();
        window.calculator = new TradingCalculator();
    }

    renderTickerMarquee() {
        const track = document.getElementById('ticker-track');
        if (!track) return;

        // Duplicate assets to allow infinite CSS marquee loop
        const assetsDoubled = [...MARKET_ASSETS, ...MARKET_ASSETS];

        track.innerHTML = assetsDoubled.map((asset, index) => {
            const isBullish = asset.change24h >= 0;
            return `
                <div class="inline-flex items-center space-x-3 px-5 py-2 border-r border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
                     onclick="window.app.openWebTraderForAsset('${asset.id}')">
                    <span class="text-xs font-bold text-slate-200 tracking-wider">${asset.symbol}</span>
                    <span class="text-xs font-mono font-medium text-slate-100 marquee-price-${asset.id}-${index}">${asset.bid.toFixed(asset.digits)}</span>
                    <span class="text-[11px] font-mono px-1.5 py-0.5 rounded text-xs font-semibold ${isBullish ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}">
                        ${isBullish ? '+' : ''}${asset.change24h.toFixed(2)}%
                    </span>
                </div>
            `;
        }).join('');
    }

    renderLandingTable() {
        const tbody = document.getElementById('market-table-body');
        if (!tbody) return;

        let filtered = MARKET_ASSETS.filter(asset => {
            const matchesCat = this.currentFilter === 'all' || asset.category === this.currentFilter;
            const matchesSearch = asset.symbol.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                                  asset.name.toLowerCase().includes(this.searchQuery.toLowerCase());
            return matchesCat && matchesSearch;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="py-12 text-center text-slate-500">
                        No instruments match your search criteria.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map(asset => {
            const isBullish = asset.change24h >= 0;
            return `
                <tr class="border-b border-white/5 hover:bg-slate-800/40 transition-colors group">
                    <td class="py-4 px-6 flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full bg-slate-800/90 border border-white/10 flex items-center justify-center font-bold text-xs text-cyan-400">
                            ${asset.symbol.slice(0, 3)}
                        </div>
                        <div>
                            <div class="font-bold text-slate-100 group-hover:text-cyan-400 transition-colors text-sm">${asset.symbol}</div>
                            <div class="text-xs text-slate-400">${asset.name}</div>
                        </div>
                    </td>
                    <td class="py-4 px-6 font-mono text-sm font-semibold text-slate-100 landing-bid-${asset.id}">
                        ${asset.bid.toFixed(asset.digits)}
                    </td>
                    <td class="py-4 px-6 font-mono text-sm font-semibold text-slate-300 landing-ask-${asset.id}">
                        ${asset.ask.toFixed(asset.digits)}
                    </td>
                    <td class="py-4 px-6">
                        <span class="px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-800 text-slate-300 border border-white/5">
                            ${asset.spread} pips
                        </span>
                    </td>
                    <td class="py-4 px-6 font-mono text-sm font-semibold ${isBullish ? 'text-emerald-400' : 'text-rose-400'}">
                        ${isBullish ? '+' : ''}${asset.change24h.toFixed(2)}%
                    </td>
                    <td class="py-4 px-6 font-mono text-xs text-slate-400 hidden md:table-cell">
                        ${asset.low24h.toFixed(asset.digits)} - ${asset.high24h.toFixed(asset.digits)}
                    </td>
                    <td class="py-4 px-6 text-right">
                        <button onclick="window.app.openWebTraderForAsset('${asset.id}')"
                                class="px-4 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 border border-cyan-500/30 transition-all">
                            Trade Now
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateLandingTablePrices() {
        MARKET_ASSETS.forEach(asset => {
            const bidEls = document.querySelectorAll(`.landing-bid-${asset.id}`);
            const askEls = document.querySelectorAll(`.landing-ask-${asset.id}`);

            bidEls.forEach(el => el.textContent = asset.bid.toFixed(asset.digits));
            askEls.forEach(el => el.textContent = asset.ask.toFixed(asset.digits));
        });
    }

    renderAccountTiers() {
        const container = document.getElementById('account-tiers-grid');
        if (!container) return;

        container.innerHTML = ACCOUNT_TIERS.map(tier => {
            return `
                <div class="relative glass-card rounded-2xl p-8 flex flex-col justify-between border ${tier.recommended ? 'border-cyan-500 shadow-2xl shadow-cyan-500/10' : 'border-white/10'}">
                    ${tier.recommended ? `
                        <div class="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 px-4 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
                            ${tier.badge}
                        </div>
                    ` : ''}

                    <div>
                        <div class="text-xs font-semibold text-slate-400 uppercase tracking-widest">${tier.name} Tier</div>
                        <div class="text-3xl font-extrabold text-slate-100 mt-2">${tier.minDeposit}</div>
                        <div class="text-xs text-slate-400 mt-0.5">Minimum Initial Deposit</div>

                        <div class="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                            <div>
                                <div class="text-[11px] text-slate-400">Spread From</div>
                                <div class="font-bold text-sm text-cyan-400 font-mono mt-0.5">${tier.spreadFrom}</div>
                            </div>
                            <div>
                                <div class="text-[11px] text-slate-400">Commission</div>
                                <div class="font-bold text-sm text-slate-200 font-mono mt-0.5">${tier.commission}</div>
                            </div>
                            <div>
                                <div class="text-[11px] text-slate-400">Leverage</div>
                                <div class="font-bold text-sm text-slate-200 font-mono mt-0.5">${tier.leverage}</div>
                            </div>
                            <div>
                                <div class="text-[11px] text-slate-400">Execution</div>
                                <div class="font-bold text-sm text-slate-200 mt-0.5">${tier.execution}</div>
                            </div>
                        </div>

                        <div class="mt-6 pt-6 border-t border-white/10 space-y-3">
                            <div class="text-xs font-semibold text-slate-300">Account Privileges:</div>
                            ${tier.features.map(f => `
                                <div class="flex items-start gap-2.5 text-xs text-slate-400">
                                    <svg class="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    <span>${f}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="mt-8 pt-4">
                        <button onclick="window.app.openAccountModal('${tier.name}')"
                                class="w-full py-3 rounded-xl font-bold text-sm transition-all ${tier.recommended ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 shadow-lg shadow-cyan-500/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-white/10'}">
                            Open ${tier.name} Account
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderFaqs() {
        const container = document.getElementById('faqs-container');
        if (!container) return;

        container.innerHTML = FAQS.map((faq, index) => {
            return `
                <div class="glass-card rounded-xl border border-white/10 overflow-hidden">
                    <button class="w-full py-5 px-6 text-left flex items-center justify-between font-semibold text-slate-200 hover:text-cyan-400 transition-colors"
                            onclick="window.app.toggleFaq(${index})">
                        <span>${faq.q}</span>
                        <svg id="faq-icon-${index}" class="w-5 h-5 text-slate-400 transform transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>
                    <div id="faq-ans-${index}" class="hidden px-6 pb-5 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4">
                        ${faq.a}
                    </div>
                </div>
            `;
        }).join('');
    }

    toggleFaq(index) {
        const ans = document.getElementById(`faq-ans-${index}`);
        const icon = document.getElementById(`faq-icon-${index}`);
        if (!ans) return;

        const isHidden = ans.classList.contains('hidden');
        if (isHidden) {
            ans.classList.remove('hidden');
            if (icon) icon.classList.add('rotate-180');
        } else {
            ans.classList.add('hidden');
            if (icon) icon.classList.remove('rotate-180');
        }
    }

    openWebTraderForAsset(assetId) {
        if (window.webTrader) {
            window.webTrader.selectAsset(assetId);
        }
        this.openWebTraderModal();
    }

    openWebTraderModal() {
        const modal = document.getElementById('webtrader-modal');
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            if (window.webTrader && window.webTrader.chart) {
                setTimeout(() => window.webTrader.chart.resize(), 150);
            }
        }
    }

    closeWebTraderModal() {
        const modal = document.getElementById('webtrader-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    openAccountModal(presetTier = 'Standard') {
        const modal = document.getElementById('account-modal');
        const tierSelect = document.getElementById('modal-acc-tier');
        if (tierSelect) tierSelect.value = presetTier;
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    closeAccountModal() {
        const modal = document.getElementById('account-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    openDepositModal() {
        const modal = document.getElementById('deposit-modal');
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    closeDepositModal() {
        const modal = document.getElementById('deposit-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    handleRegistration(e) {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const tier = document.getElementById('modal-acc-tier').value;

        this.currentUser = { name, email, tier };

        this.closeAccountModal();
        if (window.webTrader) {
            window.webTrader.account.name = `${name} (${tier})`;
            window.webTrader.showNotification(`Welcome, ${name}! Your ${tier} account is verified and ready.`, 'success');
            this.openWebTraderModal();
        }
    }

    handleDeposit(e) {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('dep-amount').value) || 1000;
        const method = document.getElementById('dep-method').value;

        this.closeDepositModal();
        if (window.webTrader) {
            window.webTrader.depositDemoFunds(amount);
            window.webTrader.showNotification(`Deposit of $${amount.toLocaleString()} via ${method} approved instantly!`, 'success');
        }
    }

    attachEventListeners() {
        // Market category filter tabs
        document.querySelectorAll('.market-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.market-filter-btn').forEach(b => {
                    b.classList.remove('bg-cyan-500', 'text-slate-950');
                    b.classList.add('text-slate-400', 'hover:text-slate-100');
                });
                btn.classList.add('bg-cyan-500', 'text-slate-950');
                btn.classList.remove('text-slate-400');
                this.currentFilter = btn.dataset.category;
                this.renderLandingTable();
            });
        });

        // Market search input
        const searchInput = document.getElementById('market-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.renderLandingTable();
            });
        }

        // Form handlers
        const regForm = document.getElementById('registration-form');
        if (regForm) regForm.addEventListener('submit', (e) => this.handleRegistration(e));

        const depForm = document.getElementById('deposit-form');
        if (depForm) depForm.addEventListener('submit', (e) => this.handleDeposit(e));
    }
}

// Instantiate on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
