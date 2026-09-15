import { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import StatCard from '../components/dashboard/StatCard';
import RiskMeter from '../components/dashboard/RiskMeter';
import PortfolioTable from '../components/dashboard/PortfolioTable';
import RiskPanel from '../components/dashboard/RiskPanel';
import LineChart from '../components/charts/LineChart';
import PieChart from '../components/charts/PieChart';
import VolatilityChart from '../components/charts/VolatilityChart';
import Card from '../components/common/Card';
import { useAuth } from '../context/AuthContext';
import { portfolio as portfolioApi, coins as coinsApi } from '../api/api';
import './Dashboard.css';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

// Muted color palette for chart slices
const CHART_COLORS = ['#b87333', '#4a6fa5', '#6b7c93', '#3d6b6b', '#8a7440', '#5a7a5a', '#8a6a4a'];

export default function Dashboard() {
  const { user } = useAuth();

  // State for each data group
  const [portfolioId, setPortfolioId] = useState(null);
  const [summary,     setSummary]     = useState(null);
  const [risk,        setRisk]        = useState(null);
  const [history,     setHistory]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // 1. Get list of portfolios, use the first one
        const portfolios = await portfolioApi.list();
        if (!portfolios || portfolios.length === 0) {
          setLoading(false);
          return; // empty state — no portfolio yet
        }
        const pid = portfolios[0].id;
        setPortfolioId(pid);

        // 2. Fetch summary + risk in parallel
        const [sum, rsk] = await Promise.all([
          portfolioApi.summary(pid),
          portfolioApi.risk(pid),
        ]);
        if (cancelled) return;
        setSummary(sum);
        setRisk(rsk);

        // 3. Fetch price history for first holding coin (performance chart)
        if (sum?.holdings?.length > 0) {
          try {
            const hist = await coinsApi.history(sum.holdings[0].coinId);
            // Backend wraps as { coinId, range, prices: [{date, price}] }
            if (!cancelled) setHistory(hist?.prices || []);
          } catch { /* history is optional */ }
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'there';

  // ── Loading state ──
  if (loading) {
    return (
      <div className="app-layout">
        <Navbar />
        <Sidebar />
        <main className="app-main">
          <p className="text-secondary" style={{ padding: 'var(--spacing-8)' }}>Loading your dashboard…</p>
        </main>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="app-layout">
        <Navbar />
        <Sidebar />
        <main className="app-main">
          <Card>
            <p className="text-danger fw-600">Failed to load dashboard</p>
            <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', marginTop: 4 }}>{error}</p>
            <p className="text-secondary" style={{ fontSize: 'var(--font-size-xs)', marginTop: 8 }}>
              Make sure the backend server is running at {import.meta.env.VITE_API_URL || 'http://localhost:3000'}.
            </p>
          </Card>
        </main>
      </div>
    );
  }

  // ── Empty state — no portfolios yet ──
  if (!summary) {
    return (
      <div className="app-layout">
        <Navbar />
        <Sidebar />
        <main className="app-main">
          <div className="page-header">
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-sub">Good to see you, {firstName}. Let's get started.</p>
            </div>
          </div>
          <Card>
            <p className="fw-600" style={{ marginBottom: 8 }}>No portfolio yet</p>
            <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
              Create a portfolio and add your first holding to see your dashboard.
            </p>
          </Card>
        </main>
      </div>
    );
  }

  // ── Data-driven render ──
  const { totalValue = 0, totalInvested = 0, totalPnl = 0, pnlPct = 0, holdings = [] } = summary;

  const pieData = holdings.map((h, i) => ({
    name: h.coinId,
    value: h.allocation ?? 0,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  // Enrich holdings with color for the table
  const coloredHoldings = holdings.map((h, i) => ({
    ...h,
    symbol: h.coinId?.toUpperCase(),
    name: h.coinId,
    color: CHART_COLORS[i % CHART_COLORS.length],
    currentValue: h.currentValue ?? 0,
    pnl: h.pnl ?? 0,
    pnlPct: h.pnlPct ?? 0,
    allocation: h.allocation ?? 0,
    currentPrice: h.currentPrice ?? 0,
  }));

  const riskScore           = risk?.overallScore ?? 0;
  const diversification     = risk?.diversificationScore ?? 0;
  const concentrationRisk   = risk?.concentrationRisk ?? 0;
  const marketVolatility    = risk?.marketVolatility ?? 0;
  const liquidityScore      = risk?.liquidityScore ?? 0;
  const riskFactors         = risk?.factors ?? [];
  const recommendation      = risk?.recommendation ?? '';

  // Build volatility data from holdings
  const volatilityData = holdings.map((h, i) => ({
    asset: h.coinId?.toUpperCase(),
    volatility: Math.round((h.volatility ?? 50)),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className="app-layout">
      <Navbar />
      <Sidebar />

      <main className="app-main">
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-sub">Good morning, {firstName}. Here's your portfolio summary.</p>
          </div>
          <div className="page-header__meta">
            <span className="live-badge">
              <span className="live-badge__dot" />
              Live
            </span>
            <span className="page-header__date">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="stats-grid">
          <StatCard
            title="Total Portfolio Value"
            value={fmt(totalValue)}
            change={`${pnlPct >= 0 ? '+' : ''}${pnlPct}%`}
            positive={pnlPct >= 0}
            subtitle="vs. total invested"
            accent="primary"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
          />
          <StatCard
            title="Total Invested"
            value={fmt(totalInvested)}
            subtitle="across all positions"
            accent="primary"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>}
          />
          <StatCard
            title="Total Profit / Loss"
            value={`${totalPnl >= 0 ? '+' : ''}${fmt(totalPnl)}`}
            change={`${pnlPct >= 0 ? '+' : ''}${pnlPct}% all time`}
            positive={totalPnl >= 0}
            subtitle="unrealized P&L"
            accent={totalPnl >= 0 ? 'success' : 'danger'}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>}
          />
          <StatCard
            title="Overall Risk Score"
            value={`${riskScore}/100`}
            change={riskScore >= 66 ? 'High Risk' : riskScore >= 33 ? 'Medium Risk' : 'Low Risk'}
            positive={riskScore < 33}
            subtitle="portfolio risk level"
            accent={riskScore >= 66 ? 'danger' : riskScore >= 33 ? 'warning' : 'success'}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
          />
        </div>

        {/* Middle row */}
        <div className="mid-grid">
          <Card className="risk-section">
            <div className="section-header">
              <h2 className="section-title">Portfolio Risk Score</h2>
            </div>
            <RiskMeter score={riskScore} />
            <div className="risk-section__factors">
              <div className="risk-mini-row"><span>Diversification</span><span className="text-warning fw-600">{diversification}/100</span></div>
              <div className="risk-mini-row"><span>Concentration Risk</span><span className="text-danger fw-600">{concentrationRisk}/100</span></div>
              <div className="risk-mini-row"><span>Market Volatility</span><span className="text-danger fw-600">{marketVolatility}/100</span></div>
              <div className="risk-mini-row"><span>Liquidity Score</span><span className="text-success fw-600">{liquidityScore}/100</span></div>
            </div>
          </Card>

          <Card>
            {history.length > 0
              ? <LineChart data={history} title="Price History (30d)" />
              : <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', padding: 'var(--spacing-4)' }}>Price history unavailable</p>
            }
          </Card>
        </div>

        {/* Holdings Table */}
        <Card padding={false}>
          <div className="section-header" style={{ padding: '20px 20px 0' }}>
            <h2 className="section-title">Holdings</h2>
            <span className="section-meta">{coloredHoldings.length} assets</span>
          </div>
          <PortfolioTable holdings={coloredHoldings} />
        </Card>

        {/* Bottom row */}
        <div className="bottom-grid">
          <Card>
            <PieChart data={pieData} title="Asset Allocation" />
          </Card>
          <Card>
            {volatilityData.length > 0
              ? <VolatilityChart data={volatilityData} title="Asset Volatility (30d)" />
              : <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>No volatility data</p>
            }
          </Card>
          <Card>
            <div className="section-header" style={{ marginBottom: 'var(--spacing-5)' }}>
              <h2 className="section-title">Risk Analysis</h2>
            </div>
            <RiskPanel factors={riskFactors} recommendation={recommendation} />
          </Card>
        </div>
      </main>
    </div>
  );
}
