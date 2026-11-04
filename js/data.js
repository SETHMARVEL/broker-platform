// Market Data and Asset Definitions for Apex Global Markets

const MARKET_ASSETS = [
    // Forex
    { id: 'eurusd', symbol: 'EUR/USD', name: 'Euro / US Dollar', category: 'forex', bid: 1.08450, ask: 1.08458, digits: 5, spread: 0.8, change24h: 0.34, high24h: 1.08720, low24h: 1.08110, volume: '84.2B' },
    { id: 'gbpusd', symbol: 'GBP/USD', name: 'British Pound / US Dollar', category: 'forex', bid: 1.29820, ask: 1.29832, digits: 5, spread: 1.2, change24h: -0.18, high24h: 1.30210, low24h: 1.29450, volume: '46.1B' },
    { id: 'usdjpy', symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', category: 'forex', bid: 152.450, ask: 152.461, digits: 3, spread: 1.1, change24h: 0.52, high24h: 152.880, low24h: 151.720, volume: '62.9B' },
    { id: 'audusd', symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', category: 'forex', bid: 0.66540, ask: 0.66552, digits: 5, spread: 1.2, change24h: 0.15, high24h: 0.66900, low24h: 0.66310, volume: '22.4B' },
    { id: 'usdcad', symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', category: 'forex', bid: 1.38620, ask: 1.38635, digits: 5, spread: 1.5, change24h: -0.22, high24h: 1.38990, low24h: 1.38350, volume: '18.7B' },
    
    // Crypto
    { id: 'btcusd', symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', category: 'crypto', bid: 67850.00, ask: 67865.00, digits: 2, spread: 15.0, change24h: 3.42, high24h: 68420.00, low24h: 65200.00, volume: '34.8B' },
    { id: 'ethusd', symbol: 'ETH/USD', name: 'Ethereum / US Dollar', category: 'crypto', bid: 2540.50, ask: 2541.30, digits: 2, spread: 0.8, change24h: 2.15, high24h: 2590.00, low24h: 2470.00, volume: '16.3B' },
    { id: 'solusd', symbol: 'SOL/USD', name: 'Solana / US Dollar', category: 'crypto', bid: 174.20, ask: 174.45, digits: 2, spread: 0.25, change24h: 5.84, high24h: 179.80, low24h: 164.10, volume: '6.7B' },
    
    // Commodities
    { id: 'xauusd', symbol: 'XAU/USD', name: 'Gold / US Dollar (Oz)', category: 'commodities', bid: 2735.60, ask: 2735.95, digits: 2, spread: 0.35, change24h: 0.88, high24h: 2748.20, low24h: 2712.50, volume: '58.2B' },
    { id: 'usoil', symbol: 'WTI Oil', name: 'West Texas Intermediate Crude', category: 'commodities', bid: 71.85, ask: 71.89, digits: 2, spread: 0.04, change24h: -1.45, high24h: 73.40, low24h: 71.20, volume: '29.5B' },
    
    // Indices
    { id: 'spx500', symbol: 'US 500', name: 'S&P 500 Index Cash', category: 'indices', bid: 5845.20, ask: 5845.80, digits: 2, spread: 0.6, change24h: 0.72, high24h: 5865.00, low24h: 5810.00, volume: '95.1B' },
    { id: 'nas100', symbol: 'US Tech 100', name: 'Nasdaq 100 Index Cash', category: 'indices', bid: 20420.50, ask: 20422.00, digits: 2, spread: 1.5, change24h: 1.18, high24h: 20510.00, low24h: 20250.00, volume: '112.4B' }
];

// Generate initial realistic candlestick history for charts
function generateInitialCandles(basePrice, count = 50, digits = 2) {
    const candles = [];
    let currentPrice = basePrice * 0.985;
    const now = Date.now();
    const intervalMs = 60 * 1000; // 1 min per candle default

    for (let i = count; i >= 0; i--) {
        const timestamp = now - (i * intervalMs);
        const volatility = currentPrice * 0.0025;
        const change = (Math.random() - 0.49) * volatility;
        const open = currentPrice;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * (volatility * 0.6);
        const low = Math.min(open, close) - Math.random() * (volatility * 0.6);
        const volume = Math.floor(Math.random() * 500) + 50;

        candles.push({
            time: timestamp,
            open: parseFloat(open.toFixed(digits)),
            high: parseFloat(high.toFixed(digits)),
            low: parseFloat(low.toFixed(digits)),
            close: parseFloat(close.toFixed(digits)),
            volume: volume
        });

        currentPrice = close;
    }
    return candles;
}

// Account Tiers specifications
const ACCOUNT_TIERS = [
    {
        name: 'Standard',
        badge: 'Most Popular for Beginners',
        minDeposit: '$100',
        spreadFrom: '1.0 pips',
        commission: '$0 / Lot',
        leverage: 'Up to 1:500',
        minLot: '0.01 Micro Lots',
        execution: 'Instant Market',
        recommended: false,
        features: [
            'Access to all 1,200+ global assets',
            'Zero commissions on trades',
            'Full WebTrader & Mobile Access',
            'Standard customer support 24/5',
            'Negative Balance Protection'
        ]
    },
    {
        name: 'Raw ECN',
        badge: 'Recommended for Active Traders',
        minDeposit: '$500',
        spreadFrom: '0.0 pips (Raw)',
        commission: '$3.50 per lot / side',
        leverage: 'Up to 1:500',
        minLot: '0.01 Micro Lots',
        execution: 'Direct Market Access (ECN)',
        recommended: true,
        features: [
            'Zero mark-up institutional spreads from 0.0 pips',
            'Ultra-fast NY4/LD4 fiber cross-connect execution',
            'Level II Market Depth',
            'Scalping, EA & automated trading enabled',
            'Priority 24/7 dedicated trade desk support',
            'Free VPS hosting (for volume > 15 lots)'
        ]
    },
    {
        name: 'Institutional VIP',
        badge: 'For High Net-Worth & Prop Firms',
        minDeposit: '$10,000',
        spreadFrom: '0.0 pips (Institutional)',
        commission: '$1.50 per lot / side',
        leverage: 'Custom up to 1:200',
        minLot: '0.1 Mini Lots',
        execution: 'Direct Tier-1 Liquidity Pool',
        recommended: false,
        features: [
            'Lowest institutional commission structure',
            'Dedicated 1-on-1 Chief Market Strategist',
            'Custom FIX API trading protocol access',
            'Daily bespoke institutional macro research',
            'Complimentary dedicated low-latency server',
            'Customized margin requirements & VIP events'
        ]
    }
];

// FAQs
const FAQS = [
    {
        q: 'How fast are account deposits and withdrawals processed?',
        a: 'Deposits made via credit/debit cards, Apple Pay, and cryptocurrencies (USDT, BTC) are credited instantly with 0% deposit fees. Bank wire withdrawals are processed within 2 hours during normal business banking hours.'
    },
    {
        q: 'Are client funds safe and segregated?',
        a: 'Yes. 100% of client funds are kept in segregated Tier-1 banking accounts, completely separate from company operating capital. We are covered by primary financial regulatory frameworks and offer negative balance protection to ensure you never lose more than your deposited equity.'
    },
    {
        q: 'Can I test my strategies on a free Demo account first?',
        a: 'Absolutely. Every registration grants immediate access to an unexpiring $10,000 virtual demo balance in the WebTrader terminal with true live market conditions, zero risk, and real-time execution speeds.'
    },
    {
        q: 'What instruments can I trade with Apex Markets?',
        a: 'You can trade over 1,200 financial instruments across Major & Minor Forex pairs, Cryptocurrencies, Global Stock Indices (US 500, Tech 100, DAX 40), Commodities (Gold, Silver, Crude Oil, Natural Gas), and blue-chip equities.'
    },
    {
        q: 'Do you permit scalping, hedging, and Expert Advisors (EAs)?',
        a: 'Yes, our Raw ECN infrastructure welcomes all trading styles including high-frequency scalping, algorithmic trading bots, news trading, and complete hedging with no artificial holding time restrictions.'
    }
];
