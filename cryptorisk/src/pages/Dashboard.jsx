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
import { currentUser, portfolioStats, riskAnalysis, performanceHistory, volatilityData } from '../data/mockData';
import './Dashboard.css';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

const pieData = portfolioStats.holdings.map((h) => ({
  name: h.name,
  value: h.allocation,
  color: h.color,
}));

export default function Dashboard() {
  const { totalValue, totalInvested, totalPnl, pnlPct, holdings } = portfolioStats;

  return (
    <div className="app-layout">
      <Navbar user={currentUser} />
      <Sidebar />

      <main className="app-main">
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-sub">Good morning, {currentUser.name.split(' ')[0]}. Here's your portfolio summary.</p>
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
            value={`${riskAnalysis.overallScore}/100`}
            change="High Risk"
            positive={false}
            subtitle="portfolio risk level"
            accent="danger"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
          />
        </div>

        {/* Middle row: Risk Meter + Line Chart */}
        <div className="mid-grid">
          <Card className="risk-section">
            <div className="section-header">
              <h2 className="section-title">Portfolio Risk Score</h2>
            </div>
            <RiskMeter score={riskAnalysis.overallScore} />
            <div className="risk-section__factors">
              <div className="risk-mini-row">
                <span>Diversification</span>
                <span className="text-warning fw-600">{riskAnalysis.diversificationScore}/100</span>
              </div>
              <div className="risk-mini-row">
                <span>Concentration Risk</span>
                <span className="text-danger fw-600">{riskAnalysis.concentrationRisk}/100</span>
              </div>
              <div className="risk-mini-row">
                <span>Market Volatility</span>
                <span className="text-danger fw-600">{riskAnalysis.marketVolatility}/100</span>
              </div>
              <div className="risk-mini-row">
                <span>Liquidity Score</span>
                <span className="text-success fw-600">{riskAnalysis.liquidityScore}/100</span>
              </div>
            </div>
          </Card>

          <Card>
            <LineChart data={performanceHistory} title="Portfolio Performance (30d)" />
          </Card>
        </div>

        {/* Holdings Table */}
        <Card padding={false}>
          <div className="section-header" style={{ padding: '20px 20px 0' }}>
            <h2 className="section-title">Holdings</h2>
            <span className="section-meta">{holdings.length} assets</span>
          </div>
          <PortfolioTable holdings={holdings} />
        </Card>

        {/* Bottom row: Pie + Volatility + Risk Panel */}
        <div className="bottom-grid">
          <Card>
            <PieChart
              data={pieData}
              title="Asset Allocation"
            />
          </Card>
          <Card>
            <VolatilityChart data={volatilityData} title="Asset Volatility (30d)" />
          </Card>
          <Card>
            <div className="section-header" style={{ marginBottom: 'var(--spacing-5)' }}>
              <h2 className="section-title">Risk Analysis</h2>
            </div>
            <RiskPanel factors={riskAnalysis.factors} recommendation={riskAnalysis.recommendation} />
          </Card>
        </div>
      </main>
    </div>
  );
}
