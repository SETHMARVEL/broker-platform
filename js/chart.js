// High-Performance Lightweight Candlestick Chart Engine for Profit FX WebTrader

class CandlestickChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.candles = [];
        this.activeAsset = null;
        this.timeframe = '1m';
        this.showMA = true;
        this.showVolume = true;
        this.mouseX = null;
        this.mouseY = null;
        this.isHovering = false;

        this.initCanvasResolution();
        this.attachEventListeners();
    }

    initCanvasResolution() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;
    }

    resize() {
        this.initCanvasResolution();
        this.render();
    }

    setData(candles, asset) {
        this.candles = [...candles];
        this.activeAsset = asset;
        this.render();
    }

    updateLastCandle(price) {
        if (!this.candles || this.candles.length === 0) return;
        const lastCandle = this.candles[this.candles.length - 1];
        lastCandle.close = price;
        if (price > lastCandle.high) lastCandle.high = price;
        if (price < lastCandle.low) lastCandle.low = price;
        lastCandle.volume += Math.floor(Math.random() * 8) + 1;
        this.render();
    }

    addNewCandle(openPrice) {
        if (!this.candles || this.candles.length === 0) return;
        const digits = this.activeAsset ? this.activeAsset.digits : 2;
        const newCandle = {
            time: Date.now(),
            open: openPrice,
            high: openPrice,
            low: openPrice,
            close: openPrice,
            volume: 10
        };
        this.candles.push(newCandle);
        if (this.candles.length > 80) {
            this.candles.shift(); // keep sliding window
        }
        this.render();
    }

    attachEventListeners() {
        window.addEventListener('resize', () => this.resize());

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            this.isHovering = true;
            this.render();
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isHovering = false;
            this.render();
        });
    }

    calculateMA(period = 20) {
        const ma = [];
        for (let i = 0; i < this.candles.length; i++) {
            if (i < period - 1) {
                ma.push(null);
            } else {
                let sum = 0;
                for (let j = 0; j < period; j++) {
                    sum += this.candles[i - j].close;
                }
                ma.push(sum / period);
            }
        }
        return ma;
    }

    render() {
        if (!this.ctx || !this.width || !this.height || this.candles.length === 0) return;

        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const paddingRight = 75;
        const paddingBottom = 30;
        const paddingTop = 25;
        const chartW = w - paddingRight;
        const chartH = h - paddingBottom - paddingTop;

        // Clear canvas
        ctx.fillStyle = '#0a0e18';
        ctx.fillRect(0, 0, w, h);

        // Find min / max prices
        let minPrice = Infinity;
        let maxPrice = -Infinity;
        let maxVolume = 0;

        for (const c of this.candles) {
            if (c.low < minPrice) minPrice = c.low;
            if (c.high > maxPrice) maxPrice = c.high;
            if (c.volume > maxVolume) maxVolume = c.volume;
        }

        const priceRange = maxPrice - minPrice || 1;
        const paddedMin = minPrice - (priceRange * 0.08);
        const paddedMax = maxPrice + (priceRange * 0.08);
        const paddedRange = paddedMax - paddedMin;

        // Helper price to Y
        const getY = (price) => paddingTop + chartH - ((price - paddedMin) / paddedRange) * chartH;
        // Helper index to X
        const candleSpacing = chartW / this.candles.length;
        const candleWidth = Math.max(3, candleSpacing * 0.65);
        const getX = (index) => index * candleSpacing + (candleSpacing / 2);

        // 1. Draw Background Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        const gridLinesCount = 6;
        for (let i = 0; i <= gridLinesCount; i++) {
            const y = paddingTop + (chartH / gridLinesCount) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(chartW, y);
            ctx.stroke();

            // Price Labels on right axis
            const price = paddedMax - (paddedRange / gridLinesCount) * i;
            const digits = this.activeAsset ? this.activeAsset.digits : 2;
            ctx.fillStyle = '#64748b';
            ctx.font = '10px JetBrains Mono';
            ctx.textAlign = 'left';
            ctx.fillText(price.toFixed(digits), chartW + 8, y + 3);
        }

        // Vertical grid lines
        for (let i = 0; i < this.candles.length; i += 10) {
            const x = getX(i);
            ctx.beginPath();
            ctx.moveTo(x, paddingTop);
            ctx.lineTo(x, paddingTop + chartH);
            ctx.stroke();

            // Time label
            const d = new Date(this.candles[i].time);
            const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            ctx.fillStyle = '#64748b';
            ctx.font = '10px JetBrains Mono';
            ctx.textAlign = 'center';
            ctx.fillText(timeStr, x, h - 10);
        }

        // 2. Draw Volume Bars (at bottom 20% of chart)
        if (this.showVolume && maxVolume > 0) {
            const volHeight = chartH * 0.18;
            for (let i = 0; i < this.candles.length; i++) {
                const c = this.candles[i];
                const x = getX(i) - (candleWidth / 2);
                const barH = (c.volume / maxVolume) * volHeight;
                const y = paddingTop + chartH - barH;
                const isBull = c.close >= c.open;
                ctx.fillStyle = isBull ? 'rgba(16, 185, 129, 0.22)' : 'rgba(239, 68, 68, 0.22)';
                ctx.fillRect(x, y, candleWidth, barH);
            }
        }

        // 3. Draw Candlesticks
        for (let i = 0; i < this.candles.length; i++) {
            const c = this.candles[i];
            const x = getX(i);
            const isBull = c.close >= c.open;
            const color = isBull ? '#10b981' : '#ef4444';

            // Wick
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(x, getY(c.high));
            ctx.lineTo(x, getY(c.low));
            ctx.stroke();

            // Candle Body
            const openY = getY(c.open);
            const closeY = getY(c.close);
            const bodyY = Math.min(openY, closeY);
            const bodyHeight = Math.max(2, Math.abs(closeY - openY));

            ctx.fillStyle = color;
            ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, bodyHeight);
        }

        // 4. Moving Average (MA 20)
        if (this.showMA) {
            const maValues = this.calculateMA(20);
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            let started = false;
            for (let i = 0; i < maValues.length; i++) {
                if (maValues[i] !== null) {
                    const x = getX(i);
                    const y = getY(maValues[i]);
                    if (!started) {
                        ctx.moveTo(x, y);
                        started = true;
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
            }
            ctx.stroke();
        }

        // 5. Current Price Highlight Line (Right axis dashed line)
        const lastCandle = this.candles[this.candles.length - 1];
        const lastPrice = lastCandle.close;
        const lastY = getY(lastPrice);
        const digits = this.activeAsset ? this.activeAsset.digits : 2;
        const isBullLast = lastCandle.close >= lastCandle.open;
        const lastColor = isBullLast ? '#10b981' : '#ef4444';

        ctx.strokeStyle = lastColor;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, lastY);
        ctx.lineTo(chartW, lastY);
        ctx.stroke();
        ctx.setLineDash([]); // reset dash

        // Price badge on axis
        ctx.fillStyle = lastColor;
        ctx.fillRect(chartW + 2, lastY - 10, 68, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(lastPrice.toFixed(digits), chartW + 36, lastY + 4);

        // 6. Crosshair & Hover Tooltip
        if (this.isHovering && this.mouseX !== null && this.mouseX < chartW) {
            // Draw crosshairs
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);

            // Vertical line
            ctx.beginPath();
            ctx.moveTo(this.mouseX, paddingTop);
            ctx.lineTo(this.mouseX, paddingTop + chartH);
            ctx.stroke();

            // Horizontal line
            ctx.beginPath();
            ctx.moveTo(0, this.mouseY);
            ctx.lineTo(chartW, this.mouseY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Find closest candle index
            const hoverIndex = Math.min(
                this.candles.length - 1,
                Math.max(0, Math.floor(this.mouseX / candleSpacing))
            );
            const hc = this.candles[hoverIndex];

            if (hc) {
                // Info header bar at top-left
                ctx.fillStyle = '#f8fafc';
                ctx.font = 'bold 11px JetBrains Mono';
                ctx.textAlign = 'left';

                const timeStr = new Date(hc.time).toLocaleTimeString();
                const o = `O: ${hc.open.toFixed(digits)}`;
                const h_str = `H: ${hc.high.toFixed(digits)}`;
                const l = `L: ${hc.low.toFixed(digits)}`;
                const c_str = `C: ${hc.close.toFixed(digits)}`;
                const vol_str = `Vol: ${hc.volume}`;

                ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                ctx.fillRect(10, 5, 420, 22);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.strokeRect(10, 5, 420, 22);

                ctx.fillStyle = '#94a3b8';
                ctx.fillText(`[${timeStr}]`, 16, 20);

                ctx.fillStyle = hc.close >= hc.open ? '#10b981' : '#ef4444';
                ctx.fillText(`${o}   ${h_str}   ${l}   ${c_str}`, 105, 20);

                ctx.fillStyle = '#38bdf8';
                ctx.fillText(vol_str, 360, 20);
            }
        }
    }
}

window.CandlestickChart = CandlestickChart;
