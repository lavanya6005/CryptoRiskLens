import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import PortfolioTable from '../components/dashboard/PortfolioTable';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { portfolio as portfolioApi } from '../api/api';
import './Dashboard.css';
import './Portfolio.css';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
const COLORS = ['#b87333','#4a6fa5','#6b7c93','#3d6b6b','#8a7440','#5a7a5a','#8a6a4a'];

export default function Portfolio() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState('all');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const portfolios = await portfolioApi.list();
        if (!portfolios?.length) { setLoading(false); return; }
        const sum = await portfolioApi.summary(portfolios[0].id);
        if (!cancelled) setSummary(sum);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <PageShell><p className="text-secondary">Loading portfolio…</p></PageShell>;
  if (error)   return <PageShell><Card><p className="text-danger">{error}</p></Card></PageShell>;
  if (!summary) return (
    <PageShell>
      <Card>
        <p className="fw-600" style={{ marginBottom: 8 }}>No portfolio yet</p>
        <Link to="/add-portfolio"><Button>Add your first asset</Button></Link>
      </Card>
    </PageShell>
  );

  const { holdings = [], totalValue = 0, totalPnl = 0, pnlPct = 0 } = summary;

  const enriched = holdings.map((h, i) => ({
    ...h,
    symbol: h.coinId?.toUpperCase(),
    name: h.coinId,
    color: COLORS[i % COLORS.length],
    currentValue: h.currentValue ?? 0,
    pnl: h.pnl ?? 0,
    pnlPct: h.pnlPct ?? 0,
    allocation: h.allocation ?? 0,
    currentPrice: h.currentPrice ?? 0,
  }));

  const filtered = filter === 'profit' ? enriched.filter(h => h.pnl >= 0)
                 : filter === 'loss'   ? enriched.filter(h => h.pnl < 0)
                 : enriched;

  return (
    <div className="app-layout">
      <Navbar />
      <Sidebar />
      <main className="app-main">
        <div className="page-header">
          <div>
            <h1 className="page-title">Portfolio</h1>
            <p className="page-sub">All your crypto holdings in one place</p>
          </div>
          <Link to="/add-portfolio"><Button>+ Add Asset</Button></Link>
        </div>

        <div className="portfolio-summary">
          <div className="port-sum-card"><span className="port-sum-label">Total Value</span><span className="port-sum-value">{fmt(totalValue)}</span></div>
          <div className="port-sum-card"><span className="port-sum-label">Total P&L</span><span className={`port-sum-value ${totalPnl >= 0 ? 'text-success' : 'text-danger'}`}>{totalPnl >= 0 ? '+' : ''}{fmt(totalPnl)}</span></div>
          <div className="port-sum-card"><span className="port-sum-label">Return</span><Badge variant={pnlPct >= 0 ? 'success' : 'danger'}>{pnlPct >= 0 ? '+' : ''}{pnlPct}%</Badge></div>
          <div className="port-sum-card"><span className="port-sum-label">Assets</span><span className="port-sum-value">{enriched.length}</span></div>
        </div>

        <div className="portfolio-filters">
          <span className="portfolio-filters__label">Filter:</span>
          {[['all','All'], ['profit','In Profit'], ['loss','At Loss']].map(([val, label]) => (
            <button key={val} className={`port-filter-btn${filter === val ? ' active' : ''}`} onClick={() => setFilter(val)}>{label}</button>
          ))}
        </div>

        <Card padding={false}>
          <div className="section-header" style={{ padding: '20px 20px 0' }}>
            <h2 className="section-title">Holdings</h2>
            <span className="section-meta">{filtered.length} of {enriched.length} assets</span>
          </div>
          <PortfolioTable holdings={filtered} />
        </Card>

        <Card>
          <div className="section-header"><h2 className="section-title">Allocation Breakdown</h2></div>
          <div className="alloc-breakdown">
            {enriched.map((h) => (
              <div key={h.coinId} className="alloc-row">
                <div className="alloc-row__asset">
                  <div className="alloc-row__dot" style={{ background: h.color }} />
                  <span className="alloc-row__name">{h.name}</span>
                  <span className="alloc-row__sym">{h.symbol}</span>
                </div>
                <div className="alloc-row__bar-wrap">
                  <div className="alloc-row__bar">
                    <div className="alloc-row__fill" style={{ width: `${h.allocation}%`, background: h.color }} />
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

function PageShell({ children }) {
  return (
    <div className="app-layout">
      <Navbar /><Sidebar />
      <main className="app-main">
        <div className="page-header"><div><h1 className="page-title">Portfolio</h1></div></div>
        {children}
      </main>
    </div>
  );
}
