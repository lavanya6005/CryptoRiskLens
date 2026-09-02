import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import PortfolioTable from '../components/dashboard/PortfolioTable';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { currentUser, portfolioStats } from '../data/mockData';
import './Dashboard.css';
import './Portfolio.css';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

export default function Portfolio() {
  const { holdings, totalValue, totalPnl, pnlPct } = portfolioStats;
  const [filter, setFilter] = useState('all');

  const filteredHoldings = filter === 'profit'
    ? holdings.filter((h) => h.pnl >= 0)
    : filter === 'loss'
    ? holdings.filter((h) => h.pnl < 0)
    : holdings;

  return (
    <div className="app-layout">
      <Navbar user={currentUser} />
      <Sidebar />
      <main className="app-main">
        <div className="page-header">
          <div>
            <h1 className="page-title">Portfolio</h1>
            <p className="page-sub">All your crypto holdings in one place</p>
          </div>
          <Button>+ Add Asset</Button>
        </div>

        {/* Summary cards */}
        <div className="portfolio-summary">
          <div className="port-sum-card">
            <span className="port-sum-label">Total Value</span>
            <span className="port-sum-value">{fmt(totalValue)}</span>
          </div>
          <div className="port-sum-card">
            <span className="port-sum-label">Total P&L</span>
            <span className={`port-sum-value ${totalPnl >= 0 ? 'text-success' : 'text-danger'}`}>
              {totalPnl >= 0 ? '+' : ''}{fmt(totalPnl)}
            </span>
          </div>
          <div className="port-sum-card">
            <span className="port-sum-label">Return</span>
            <Badge variant={pnlPct >= 0 ? 'success' : 'danger'} className="port-sum-badge">
              {pnlPct >= 0 ? '+' : ''}{pnlPct}%
            </Badge>
          </div>
          <div className="port-sum-card">
            <span className="port-sum-label">Assets</span>
            <span className="port-sum-value">{holdings.length}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="portfolio-filters">
          <span className="portfolio-filters__label">Filter:</span>
          {[['all','All'], ['profit','In Profit'], ['loss','At Loss']].map(([val, label]) => (
            <button
              key={val}
              className={`port-filter-btn${filter === val ? ' active' : ''}`}
              onClick={() => setFilter(val)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Holdings table */}
        <Card padding={false}>
          <div className="section-header" style={{ padding: '20px 20px 0' }}>
            <h2 className="section-title">Holdings</h2>
            <span className="section-meta">{filteredHoldings.length} of {holdings.length} assets</span>
          </div>
          <PortfolioTable holdings={filteredHoldings} />
        </Card>

        {/* Allocation breakdown */}
        <Card>
          <div className="section-header">
            <h2 className="section-title">Allocation Breakdown</h2>
          </div>
          <div className="alloc-breakdown">
            {holdings.map((h) => (
              <div key={h.id} className="alloc-row">
                <div className="alloc-row__asset">
                  <div className="alloc-row__dot" style={{ background: h.color }} />
                  <span className="alloc-row__name">{h.name}</span>
                  <span className="alloc-row__sym">{h.symbol}</span>
                </div>
                <div className="alloc-row__bar-wrap">
                  <div className="alloc-row__bar">
                    <div
                      className="alloc-row__fill"
                      style={{ width: `${h.allocation}%`, background: h.color }}
                    />
                  </div>
                </div>
                <span className="alloc-row__pct">{h.allocation}%</span>
                <span className="alloc-row__val">{fmt(h.currentValue)}</span>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
