// ─── Mock Data ────────────────────────────────────────────────────────────────

export const currentUser = {
  id: 1,
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  avatar: "AJ",
  role: "user",        // "user" | "admin" — change to "admin" to test admin access
  joinedDate: "2024-01-15",
};


export const portfolioHoldings = [
  {
    id: 1,
    symbol: "BTC",
    name: "Bitcoin",
    quantity: 0.85,
    purchasePrice: 42000,
    currentPrice: 67450,
    purchaseDate: "2024-01-10",
    color: "#b87333",
  },
  {
    id: 2,
    symbol: "ETH",
    name: "Ethereum",
    quantity: 4.2,
    purchasePrice: 2200,
    currentPrice: 3580,
    purchaseDate: "2024-02-05",
    color: "#4a6fa5",
  },
  {
    id: 3,
    symbol: "SOL",
    name: "Solana",
    quantity: 32,
    purchasePrice: 95,
    currentPrice: 178,
    purchaseDate: "2024-03-01",
    color: "#6b7c93",
  },
  {
    id: 4,
    symbol: "ADA",
    name: "Cardano",
    quantity: 2500,
    purchasePrice: 0.42,
    currentPrice: 0.61,
    purchaseDate: "2024-02-20",
    color: "#3d6b6b",
  },
  {
    id: 5,
    symbol: "BNB",
    name: "BNB",
    quantity: 6.5,
    purchasePrice: 310,
    currentPrice: 408,
    purchaseDate: "2024-03-15",
    color: "#8a7440",
  },
];

export const enrichedHoldings = portfolioHoldings.map((h) => {
  const currentValue = h.quantity * h.currentPrice;
  const investedValue = h.quantity * h.purchasePrice;
  const pnl = currentValue - investedValue;
  const pnlPct = ((pnl / investedValue) * 100).toFixed(2);
  return { ...h, currentValue, investedValue, pnl, pnlPct: parseFloat(pnlPct) };
});

export const portfolioStats = (() => {
  const totalValue = enrichedHoldings.reduce((s, h) => s + h.currentValue, 0);
  const totalInvested = enrichedHoldings.reduce((s, h) => s + h.investedValue, 0);
  const totalPnl = totalValue - totalInvested;
  const pnlPct = ((totalPnl / totalInvested) * 100).toFixed(2);
  const enrichedWithAlloc = enrichedHoldings.map((h) => ({
    ...h,
    allocation: parseFloat(((h.currentValue / totalValue) * 100).toFixed(2)),
  }));
  return {
    totalValue,
    totalInvested,
    totalPnl,
    pnlPct: parseFloat(pnlPct),
    holdings: enrichedWithAlloc,
  };
})();

export const riskAnalysis = {
  overallScore: 72,
  diversificationScore: 41,
  concentrationRisk: 78,
  marketVolatility: 68,
  liquidityScore: 85,
  factors: [
    {
      label: "Asset Concentration",
      value: 78,
      status: "high",
      description: "57% of portfolio is concentrated in Bitcoin.",
    },
    {
      label: "Market Volatility",
      value: 68,
      status: "high",
      description: "Crypto markets show elevated 30-day volatility.",
    },
    {
      label: "Portfolio Diversification",
      value: 41,
      status: "medium",
      description: "Portfolio spans 5 assets across 3 blockchain ecosystems.",
    },
    {
      label: "Liquidity",
      value: 85,
      status: "low",
      description: "All holdings are high-liquidity, top-tier assets.",
    },
  ],
  recommendation:
    "Your portfolio carries high risk primarily due to Bitcoin concentration (57%). Consider rebalancing into mid-cap altcoins or stablecoins to reduce single-asset exposure. Diversifying across DeFi, Layer-2 and RWA sectors may lower overall portfolio volatility.",
};

const generateHistory = (seed, volatility) => {
  const points = [];
  let val = seed;
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    val = Math.max(60, val + (Math.random() - 0.48) * volatility);
    points.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: parseFloat(val.toFixed(2)),
    });
  }
  return points;
};

export const performanceHistory = generateHistory(100, 8);

export const volatilityData = [
  { asset: "BTC", volatility: 62, color: "#b87333" },
  { asset: "ETH", volatility: 74, color: "#4a6fa5" },
  { asset: "SOL", volatility: 88, color: "#6b7c93" },
  { asset: "ADA", volatility: 55, color: "#3d6b6b" },
  { asset: "BNB", volatility: 49, color: "#8a7440" },
];


// Admin
export const adminUsers = [
  { id: 1, name: "Alex Johnson", email: "alex.johnson@example.com", role: "admin", status: "active", joined: "2024-01-15", portfolioValue: 94820.15 },
  { id: 2, name: "Maria Chen", email: "maria.chen@example.com", role: "user", status: "active", joined: "2024-02-01", portfolioValue: 52340.80 },
  { id: 3, name: "James Park", email: "james.park@example.com", role: "user", status: "active", joined: "2023-11-10", portfolioValue: 0 },
  { id: 4, name: "Sarah Mills", email: "sarah.mills@example.com", role: "user", status: "inactive", joined: "2024-03-05", portfolioValue: 8760.20 },
  { id: 5, name: "Tom Rivera", email: "tom.rivera@example.com", role: "user", status: "active", joined: "2024-04-20", portfolioValue: 31500.00 },
];

export const systemStats = {
  totalUsers: 1247,
  activePortfolios: 892,
  totalAUM: 48_600_000,
  avgRiskScore: 61,
  apiStatus: [
    { name: "CoinGecko API", status: "operational", latency: "142ms" },
    { name: "Auth Service", status: "operational", latency: "38ms" },
    { name: "Risk Engine", status: "operational", latency: "210ms" },
    { name: "Database", status: "operational", latency: "24ms" },
    { name: "Email Service", status: "operational", latency: "95ms" },
  ],
};

export const cryptoOptions = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "ADA", name: "Cardano" },
  { symbol: "BNB", name: "BNB" },
  { symbol: "XRP", name: "XRP" },
  { symbol: "DOGE", name: "Dogecoin" },
  { symbol: "AVAX", name: "Avalanche" },
  { symbol: "DOT", name: "Polkadot" },
  { symbol: "MATIC", name: "Polygon" },
];
