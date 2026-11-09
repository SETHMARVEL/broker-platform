// Profit FX Broker - Interactive WebTrader Engine & Simulated Execution

class WebTrader {
    constructor() {
        this.selectedAsset = MARKET_ASSETS[0]; // EUR/USD default
        this.activeTimeframe = '1m';
        this.chart = null;

        // Account State
        this.account = {
            name: 'Demo Account (VIP ECN)',
            accountNumber: '8849201',
            server: 'ProfitFX-LiveLD4',
            balance: 10000.00,
            equity: 10000.00,
            margin: 0.00,
            freeMargin: 10000.00,
            marginLevel: 0.00,
            currency: 'USD'
        };

        this.positions = [];
        this.history = [];
        this.candlesByAsset = {};

        this.init();
    }

    init() {
        // Initialize candle history for all assets
        MARKET_ASSETS.forEach(asset => {
            this.candlesByAsset[asset.id] = generateInitialCandles(asset.bid, 45, asset.digits);
        });

        // Initialize Chart
        this.chart = new CandlestickChart('tradingChart');
        if (this.chart) {
            this.chart.setData(this.candlesByAsset[this.selectedAsset.id], this.selectedAsset);
        }

        this.renderWatchlist();
        this.renderActiveAssetHeader();
        this.renderAccountSummary();
        this.renderPositionsTable();
        this.attachEventListeners();
        this.startMarketSimulation();
    }

    selectAsset(assetId) {
        const asset = MARKET_ASSETS.find(a => a.id === assetId);
        if (!asset) return;
        this.selectedAsset = asset;

        if (this.chart) {
            this.chart.setData(this.candlesByAsset[asset.id], asset);
        }

        this.renderActiveAssetHeader();
        this.updateOrderTicketPrices();
        this.renderWatchlist();
    }

    renderWatchlist() {
        const container = document.getElementById('wt-watchlist');
        if (!container) return;

        container.innerHTML = MARKET_ASSETS.map(asset => {
            const isSelected = asset.id === this.selectedAsset.id;
            const isBullish = asset.change24h >= 0;
            const changeSign = isBullish ? '+' : '';
            return `
                <div class="wt-asset-item p-2.5 rounded-lg cursor-pointer transition-all flex items-center justify-between border ${isSelected ? 'bg-cyan-950/40 border-cyan-500/50' : 'bg-slate-900/40 border-white/5 hover:bg-slate-800/40'}"
                     onclick="window.webTrader.selectAsset('${asset.id}')">
                    <div>
                        <div class="font-bold text-sm text-slate-100">${asset.symbol}</div>
                        <div class="text-[11px] text-slate-400 truncate max-w-[110px]">${asset.name}</div>
                    </div>
                    <div class="text-right">
                        <div class="font-mono text-sm font-semibold text-slate-100 wt-bid-${asset.id}">${asset.bid.toFixed(asset.digits)}</div>
                        <div class="text-[11px] font-mono ${isBullish ? 'text-emerald-400' : 'text-rose-400'}">
                            ${changeSign}${asset.change24h.toFixed(2)}%
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderActiveAssetHeader() {
        const symbolEl = document.getElementById('wt-active-symbol');
        const nameEl = document.getElementById('wt-active-name');
        const bidEl = document.getElementById('wt-active-bid');
        const askEl = document.getElementById('wt-active-ask');
        const spreadEl = document.getElementById('wt-active-spread');
        const highEl = document.getElementById('wt-active-high');
        const lowEl = document.getElementById('wt-active-low');

        if (symbolEl) symbolEl.textContent = this.selectedAsset.symbol;
        if (nameEl) nameEl.textContent = this.selectedAsset.name;
        if (bidEl) bidEl.textContent = this.selectedAsset.bid.toFixed(this.selectedAsset.digits);
        if (askEl) askEl.textContent = this.selectedAsset.ask.toFixed(this.selectedAsset.digits);
        if (spreadEl) spreadEl.textContent = `${this.selectedAsset.spread} pips`;
        if (highEl) highEl.textContent = this.selectedAsset.high24h.toFixed(this.selectedAsset.digits);
        if (lowEl) lowEl.textContent = this.selectedAsset.low24h.toFixed(this.selectedAsset.digits);

        this.updateOrderTicketPrices();
    }

    updateOrderTicketPrices() {
        const buyBtnPrice = document.getElementById('wt-buy-price');
        const sellBtnPrice = document.getElementById('wt-sell-price');
        if (buyBtnPrice) buyBtnPrice.textContent = this.selectedAsset.ask.toFixed(this.selectedAsset.digits);
        if (sellBtnPrice) sellBtnPrice.textContent = this.selectedAsset.bid.toFixed(this.selectedAsset.digits);
    }

    renderAccountSummary() {
        let totalPnl = 0;
        let totalMargin = 0;

        this.positions.forEach(pos => {
            const asset = MARKET_ASSETS.find(a => a.id === pos.assetId);
            if (!asset) return;

            const currentPrice = pos.type === 'BUY' ? asset.bid : asset.ask;
            let diff = 0;
            if (pos.type === 'BUY') {
                diff = currentPrice - pos.openPrice;
            } else {
                diff = pos.openPrice - currentPrice;
            }

            let contractUnits = 100000;
            if (asset.category === 'crypto') contractUnits = 1;
            else if (asset.id === 'xauusd') contractUnits = 100;
            else if (asset.id === 'usoil') contractUnits = 1000;
            else if (asset.category === 'indices') contractUnits = 10;

            const pnl = diff * pos.lots * contractUnits;
            pos.currentPnl = pnl;
            totalPnl += pnl;
            totalMargin += pos.margin;
        });

        this.account.margin = totalMargin;
        this.account.equity = this.account.balance + totalPnl;
        this.account.freeMargin = Math.max(0, this.account.equity - this.account.margin);
        this.account.marginLevel = this.account.margin > 0 ? (this.account.equity / this.account.margin) * 100 : 0;

        // Update DOM elements
        const balEl = document.getElementById('wt-acc-balance');
        const eqEl = document.getElementById('wt-acc-equity');
        const mgEl = document.getElementById('wt-acc-margin');
        const freeMgEl = document.getElementById('wt-acc-free-margin');
        const mgLevelEl = document.getElementById('wt-acc-margin-level');

        if (balEl) balEl.textContent = `$${this.account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (eqEl) {
            eqEl.textContent = `$${this.account.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            eqEl.className = `font-mono font-bold text-sm ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
        }
        if (mgEl) mgEl.textContent = `$${this.account.margin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (freeMgEl) freeMgEl.textContent = `$${this.account.freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (mgLevelEl) mgLevelEl.textContent = this.account.margin > 0 ? `${this.account.marginLevel.toFixed(1)}%` : '--%';
    }

    executeTrade(type) {
        const lotInput = document.getElementById('wt-lot-size');
        const lots = parseFloat(lotInput ? lotInput.value : 1.0) || 1.0;
        const leverageSelect = document.getElementById('wt-leverage');
        const leverage = parseInt(leverageSelect ? leverageSelect.value : 500) || 500;

        const asset = this.selectedAsset;
        const executionPrice = type === 'BUY' ? asset.ask : asset.bid;

        let contractUnits = 100000;
        if (asset.category === 'crypto') contractUnits = 1;
        else if (asset.id === 'xauusd') contractUnits = 100;
        else if (asset.id === 'usoil') contractUnits = 1000;
        else if (asset.category === 'indices') contractUnits = 10;

        const nominalValue = lots * contractUnits * executionPrice;
        const requiredMargin = nominalValue / leverage;

        if (requiredMargin > this.account.freeMargin) {
            this.showNotification('Insufficient Free Margin to place this order!', 'error');
            return;
        }

        const slInput = document.getElementById('wt-sl-input');
        const tpInput = document.getElementById('wt-tp-input');

        const newPosition = {
            id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
            assetId: asset.id,
            symbol: asset.symbol,
            type: type,
            lots: lots,
            openPrice: executionPrice,
            openTime: new Date(),
            margin: requiredMargin,
            sl: slInput && slInput.value ? parseFloat(slInput.value) : null,
            tp: tpInput && tpInput.value ? parseFloat(tpInput.value) : null,
            currentPnl: 0.00
        };

        this.positions.push(newPosition);
        this.renderAccountSummary();
        this.renderPositionsTable();
        this.showNotification(`Order Executed: ${type} ${lots} Lots ${asset.symbol} @ ${executionPrice.toFixed(asset.digits)}`, 'success');
    }

    closePosition(orderId) {
        const index = this.positions.findIndex(p => p.id === orderId);
        if (index === -1) return;

        const pos = this.positions[index];
        const asset = MARKET_ASSETS.find(a => a.id === pos.assetId);
        const closePrice = pos.type === 'BUY' ? asset.bid : asset.ask;

        this.account.balance += pos.currentPnl;
        pos.closePrice = closePrice;
        pos.closeTime = new Date();
        pos.finalPnl = pos.currentPnl;

        this.history.unshift(pos);
        this.positions.splice(index, 1);

        this.renderAccountSummary();
        this.renderPositionsTable();
        this.renderHistoryTable();

        const pnlFormatted = pos.finalPnl >= 0 ? `+$${pos.finalPnl.toFixed(2)}` : `-$${Math.abs(pos.finalPnl).toFixed(2)}`;
        this.showNotification(`Position ${orderId} Closed. Realized P&L: ${pnlFormatted}`, pos.finalPnl >= 0 ? 'success' : 'info');
    }

    renderPositionsTable() {
        const container = document.getElementById('wt-positions-list');
        const badgeCount = document.getElementById('wt-positions-count');
        if (badgeCount) badgeCount.textContent = this.positions.length;

        if (!container) return;

        if (this.positions.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-8 text-slate-500 font-medium">
                        No open positions. Place an order via the trading ticket above.
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = this.positions.map(pos => {
            const asset = MARKET_ASSETS.find(a => a.id === pos.assetId);
            const digits = asset ? asset.digits : 2;
            const currentPrice = pos.type === 'BUY' ? asset.bid : asset.ask;
            const isProfit = pos.currentPnl >= 0;
            const pnlFormatted = (isProfit ? '+' : '') + `$${pos.currentPnl.toFixed(2)}`;

            return `
                <tr class="border-b border-white/5 hover:bg-slate-800/30 transition-colors">
                    <td class="py-2.5 px-3 font-mono text-xs text-slate-400">${pos.id}</td>
                    <td class="py-2.5 px-3 font-bold text-xs text-slate-100">${pos.symbol}</td>
                    <td class="py-2.5 px-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${pos.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">
                            ${pos.type}
                        </span>
                    </td>
                    <td class="py-2.5 px-3 font-mono text-xs text-slate-200">${pos.lots.toFixed(2)}</td>
                    <td class="py-2.5 px-3 font-mono text-xs text-slate-300">${pos.openPrice.toFixed(digits)}</td>
                    <td class="py-2.5 px-3 font-mono text-xs font-semibold text-slate-100">${currentPrice.toFixed(digits)}</td>
                    <td class="py-2.5 px-3 font-mono text-xs text-slate-400">${pos.sl ? pos.sl.toFixed(digits) : '--'} / ${pos.tp ? pos.tp.toFixed(digits) : '--'}</td>
                    <td class="py-2.5 px-3 font-mono text-xs font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}">
                        ${pnlFormatted}
                    </td>
                    <td class="py-2.5 px-3 text-right">
                        <button onclick="window.webTrader.closePosition('${pos.id}')"
                                class="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-600 hover:text-white text-rose-300 rounded text-xs transition-colors font-medium">
                            Close
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderHistoryTable() {
        const container = document.getElementById('wt-history-list');
        if (!container) return;

        if (this.history.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-8 text-slate-500 font-medium">
                        No closed trade history yet.
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = this.history.map(pos => {
            const asset = MARKET_ASSETS.find(a => a.id === pos.assetId);
            const digits = asset ? asset.digits : 2;
            const isProfit = pos.finalPnl >= 0;

            return `
                <tr class="border-b border-white/5 hover:bg-slate-800/30">
                    <td class="py-2 px-3 font-mono text-xs text-slate-400">${pos.id}</td>
                    <td class="py-2 px-3 font-bold text-xs text-slate-100">${pos.symbol}</td>
                    <td class="py-2 px-3 text-xs ${pos.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}">${pos.type} (${pos.lots})</td>
                    <td class="py-2 px-3 font-mono text-xs text-slate-300">${pos.openPrice.toFixed(digits)}</td>
                    <td class="py-2 px-3 font-mono text-xs text-slate-300">${pos.closePrice.toFixed(digits)}</td>
                    <td class="py-2 px-3 font-mono text-xs text-slate-400">${pos.closeTime.toLocaleTimeString()}</td>
                    <td class="py-2 px-3 font-mono text-xs font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'} text-right">
                        ${isProfit ? '+' : ''}$${pos.finalPnl.toFixed(2)}
                    </td>
                </tr>
            `;
        }).join('');
    }

    depositDemoFunds(amount = 5000) {
        this.account.balance += amount;
        this.renderAccountSummary();
        this.showNotification(`Successfully deposited $${amount.toLocaleString()} into Demo Account!`, 'success');
    }

    showNotification(msg, type = 'info') {
        const toast = document.createElement('div');
        const colors = {
            success: 'bg-emerald-950/90 border-emerald-500 text-emerald-200',
            error: 'bg-rose-950/90 border-rose-500 text-rose-200',
            info: 'bg-cyan-950/90 border-cyan-500 text-cyan-200'
        };

        toast.className = `fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg border shadow-2xl backdrop-blur-md flex items-center gap-3 transition-all transform translate-y-0 opacity-100 ${colors[type] || colors.info}`;
        toast.innerHTML = `
            <div class="font-medium text-xs md:text-sm">${msg}</div>
        `;

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    attachEventListeners() {
        const buyBtn = document.getElementById('wt-btn-buy');
        const sellBtn = document.getElementById('wt-btn-sell');

        if (buyBtn) buyBtn.addEventListener('click', () => this.executeTrade('BUY'));
        if (sellBtn) sellBtn.addEventListener('click', () => this.executeTrade('SELL'));

        // Timeframe buttons
        document.querySelectorAll('.wt-tf-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.wt-tf-btn').forEach(b => b.classList.remove('bg-cyan-600', 'text-white'));
                btn.classList.add('bg-cyan-600', 'text-white');
                this.activeTimeframe = btn.dataset.tf;
                // Re-seed candles to match timeframe aesthetic
                this.candlesByAsset[this.selectedAsset.id] = generateInitialCandles(this.selectedAsset.bid, 45, this.selectedAsset.digits);
                if (this.chart) {
                    this.chart.setData(this.candlesByAsset[this.selectedAsset.id], this.selectedAsset);
                }
            });
        });

        // Tab switcher in bottom panel (Positions vs History)
        const tabPos = document.getElementById('wt-tab-positions');
        const tabHist = document.getElementById('wt-tab-history');
        const panelPos = document.getElementById('wt-panel-positions');
        const panelHist = document.getElementById('wt-panel-history');

        if (tabPos && tabHist && panelPos && panelHist) {
            tabPos.addEventListener('click', () => {
                tabPos.classList.add('text-cyan-400', 'border-cyan-400');
                tabPos.classList.remove('text-slate-400', 'border-transparent');
                tabHist.classList.remove('text-cyan-400', 'border-cyan-400');
                tabHist.classList.add('text-slate-400', 'border-transparent');
                panelPos.classList.remove('hidden');
                panelHist.classList.add('hidden');
            });

            tabHist.addEventListener('click', () => {
                tabHist.classList.add('text-cyan-400', 'border-cyan-400');
                tabHist.classList.remove('text-slate-400', 'border-transparent');
                tabPos.classList.remove('text-cyan-400', 'border-cyan-400');
                tabPos.classList.add('text-slate-400', 'border-transparent');
                panelHist.classList.remove('hidden');
                panelPos.classList.add('hidden');
                this.renderHistoryTable();
            });
        }
    }

    startMarketSimulation() {
        let tickCounter = 0;

        setInterval(() => {
            tickCounter++;

            // Update random asset prices
            MARKET_ASSETS.forEach(asset => {
                const volatility = asset.bid * (asset.category === 'crypto' ? 0.0008 : 0.00015);
                const delta = (Math.random() - 0.495) * volatility;
                
                asset.bid = Math.max(0.00001, asset.bid + delta);
                asset.ask = asset.bid + (asset.spread * (asset.digits === 5 ? 0.0001 : 0.01));

                if (asset.bid > asset.high24h) asset.high24h = asset.bid;
                if (asset.bid < asset.low24h) asset.low24h = asset.bid;

                // Ticker DOM updates
                const tickerBidEl = document.querySelector(`.wt-bid-${asset.id}`);
                if (tickerBidEl) {
                    tickerBidEl.textContent = asset.bid.toFixed(asset.digits);
                    tickerBidEl.classList.remove('text-emerald-400', 'text-rose-400');
                    tickerBidEl.classList.add(delta >= 0 ? 'text-emerald-400' : 'text-rose-400');
                }

                // If currently selected asset, update active candle & header
                if (asset.id === this.selectedAsset.id) {
                    this.renderActiveAssetHeader();
                    if (this.chart) {
                        this.chart.updateLastCandle(asset.bid);
                        if (tickCounter % 15 === 0) {
                            this.chart.addNewCandle(asset.bid);
                        }
                    }
                }
            });

            // Update account floating P&L and open positions
            this.renderAccountSummary();
            this.renderPositionsTable();

            // Also trigger landing page live table updates if visible
            if (window.app && window.app.updateLandingTablePrices) {
                window.app.updateLandingTablePrices();
            }

        }, 1200);
    }
}

window.WebTrader = WebTrader;
