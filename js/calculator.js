// Profit FX Broker - Margin & Pip Value Calculator

class TradingCalculator {
    constructor() {
        this.assetSelect = document.getElementById('calc-asset');
        this.lotInput = document.getElementById('calc-lots');
        this.lotSlider = document.getElementById('calc-lots-slider');
        this.leverageSelect = document.getElementById('calc-leverage');
        this.currencySelect = document.getElementById('calc-currency');

        this.marginOutput = document.getElementById('calc-res-margin');
        this.pipValueOutput = document.getElementById('calc-res-pip');
        this.contractOutput = document.getElementById('calc-res-contract');
        this.spreadCostOutput = document.getElementById('calc-res-spread');

        this.init();
    }

    init() {
        if (!this.assetSelect) return;

        // Populate assets
        this.assetSelect.innerHTML = MARKET_ASSETS.map(asset => 
            `<option value="${asset.id}">${asset.symbol} - ${asset.name}</option>`
        ).join('');

        // Sync slider and input
        if (this.lotInput && this.lotSlider) {
            this.lotInput.addEventListener('input', () => {
                this.lotSlider.value = this.lotInput.value;
                this.calculate();
            });
            this.lotSlider.addEventListener('input', () => {
                this.lotInput.value = this.lotSlider.value;
                this.calculate();
            });
        }

        [this.assetSelect, this.leverageSelect, this.currencySelect].forEach(el => {
            if (el) el.addEventListener('change', () => this.calculate());
        });

        this.calculate();
    }

    calculate() {
        const assetId = this.assetSelect ? this.assetSelect.value : 'eurusd';
        const asset = MARKET_ASSETS.find(a => a.id === assetId) || MARKET_ASSETS[0];
        const lots = parseFloat(this.lotInput ? this.lotInput.value : 1.0) || 1.0;
        const leverage = parseInt(this.leverageSelect ? this.leverageSelect.value : 500) || 500;
        
        let contractUnits = 100000; // Standard Forex
        let pipMultiplier = 0.0001; // 1 pip

        if (asset.category === 'crypto') {
            contractUnits = 1;
            pipMultiplier = 1.0;
        } else if (asset.id === 'xauusd') {
            contractUnits = 100; // 100 oz per lot
            pipMultiplier = 0.1;
        } else if (asset.id === 'usoil') {
            contractUnits = 1000; // 1000 barrels
            pipMultiplier = 0.01;
        } else if (asset.category === 'indices') {
            contractUnits = 10;
            pipMultiplier = 1.0;
        } else if (asset.digits === 3) {
            // e.g. USD/JPY
            pipMultiplier = 0.01;
        }

        const totalUnits = lots * contractUnits;
        const nominalValue = totalUnits * asset.ask;
        const requiredMargin = nominalValue / leverage;
        const pipValue = totalUnits * pipMultiplier;
        const spreadCost = (asset.spread || 1.0) * pipValue;

        if (this.marginOutput) {
            this.marginOutput.textContent = `$${requiredMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (this.pipValueOutput) {
            this.pipValueOutput.textContent = `$${pipValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (this.contractOutput) {
            this.contractOutput.textContent = `${totalUnits.toLocaleString('en-US')} Units`;
        }
        if (this.spreadCostOutput) {
            this.spreadCostOutput.textContent = `$${spreadCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    }
}

window.TradingCalculator = TradingCalculator;
