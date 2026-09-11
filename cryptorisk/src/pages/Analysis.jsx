import { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Card from '../components/common/Card';
import RiskMeter from '../components/dashboard/RiskMeter';
import RiskPanel from '../components/dashboard/RiskPanel';
import LineChart from '../components/charts/LineChart';
import VolatilityChart from '../components/charts/VolatilityChart';
import Badge from '../components/common/Badge';
import { portfolio as portfolioApi, coins as coinsApi } from '../api/api';
import './Dashboard.css';
import './Analysis.css';

const COLORS = ['#b87333','#4a6fa5','#6b7c93','#3d6b6b','#8a7440','#5a7a5a','#8a6a4a'];

const recommendations = [
  { priority:'high',   title:'Reduce Bitcoin Concentration',  desc:'Consider reallocating 20-25% into mid-cap assets to reduce single-asset exposure.', action:'Rebalance Portfolio' },
  { priority:'medium', title:'Add Stablecoin Exposure',       desc:'Adding 10-15% stablecoins can reduce portfolio volatility and provide liquidity.', action:'Explore Stablecoins' },
  { priority:'low',    title:'Consider DeFi Diversification', desc:'DeFi tokens often have low correlation with BTC and can improve risk-adjusted returns.', action:'Explore DeFi' },
];

const histPerf = [
  { period:'1W', return:+4.2,  riskScore:71 },
  { period:'1M', return:+18.6, riskScore:72 },
  { period:'3M', return:+31.4, riskScore:69 },
  { period:'6M', return:+52.1, riskScore:74 },
  { period:'1Y', return:+89.3, riskScore:68 },
];

export default function Analysis() {
  const [risk,    setRisk]    = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const portfolios = await portfolioApi.list();
        if (!portfolios?.length) { setLoading(false); return; }
        const pid = portfolios[0].id;

        const [rsk, summary] = await Promise.all([
          portfolioApi.risk(pid),
          portfolioApi.summary(pid),
        ]);
        if (cancelled) return;
        setRisk(rsk);
        setUpdatedAt(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));

        // Price history for the chart
        if (summary?.holdings?.length > 0) {
          try {
            const hist = await coinsApi.history(summary.holdings[0].coinId);
            if (!cancelled) setHistory(hist || []);
          } catch { /* optional */ }
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

  if (loading) return <Shell><p className="text-secondary">Loading analysis…</p></Shell>;
  if (error)   return <Shell><Card><p className="text-danger">{error}</p></Card></Shell>;
  if (!risk)   return <Shell><Card><p className="text-secondary">No portfolio data yet. Add holdings to see risk analysis.</p></Card></Shell>;

  const riskScore = risk.overallScore ?? 0;
  const riskLabel = riskScore >= 66 ? 'High Risk' : riskScore >= 33 ? 'Medium Risk' : 'Low Risk';
  const riskBadge = riskScore >= 66 ? 'danger' : riskScore >= 33 ? 'warning' : 'success';

  const volatilityData = (risk.holdings ?? []).map((h, i) => ({
    asset: h.coinId?.toUpperCase(),
    volatility: Math.round(h.volatility ?? 50),
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="app-layout">
      <Navbar />
      <Sidebar />
      <main className="app-main">
        <div className="page-header">
          <div>
            <h1 className="page-title">Risk Analysis</h1>
            <p className="page-sub">Detailed risk report for your portfolio</p>
          </div>
          <div className="analysis-updated">
            <span>Last updated</span>
            <strong>{updatedAt || 'Just now'}</strong>
          </div>
        </div>

        <div className="analysis-top">
          <Card className="analysis-risk-card">
            <div className="section-header">
              <h2 className="section-title">Overall Risk Score</h2>
              <Badge variant={riskBadge}>{riskLabel}</Badge>
            </div>
            <RiskMeter score={riskScore} />
            <p className="analysis-risk-note">
              Your portfolio is in the <strong>{riskLabel.toLowerCase()} zone</strong>.
              {riskScore >= 66 ? ' This is primarily driven by high concentration and elevated market volatility.' : ''}
            </p>
          </Card>

          <Card>
            <div className="section-header"><h2 className="section-title">Performance vs Risk</h2></div>
            <table className="hist-perf-table">
              <thead><tr><th>Period</th><th>Return</th><th>Risk Score</th><th>Risk/Return</th></tr></thead>
              <tbody>
                {histPerf.map((row) => (
                  <tr key={row.period}>
                    <td className="fw-600">{row.period}</td>
                    <td className={row.return >= 0 ? 'text-success fw-600' : 'text-danger fw-600'}>{row.return >= 0 ? '+' : ''}{row.return}%</td>
                    <td>{row.riskScore}/100</td>
                    <td><Badge variant={row.return / row.riskScore > 0.6 ? 'success' : 'warning'}>{(row.return / row.riskScore).toFixed(2)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <Card>
          {history.length > 0
            ? <LineChart data={history} title="30-Day Price History" />
            : <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>Price history unavailable</p>
          }
        </Card>

        <div className="analysis-mid">
          <Card>
            <div className="section-header"><h2 className="section-title">Risk Factor Breakdown</h2></div>
            <RiskPanel factors={risk.factors ?? []} recommendation={risk.recommendation ?? ''} />
          </Card>
          <Card>
            {volatilityData.length > 0
              ? <>
                  <VolatilityChart data={volatilityData} title="30-Day Asset Volatility" />
                  <div className="vol-legend">
                    <div className="vol-legend__item vol-legend__item--high"><span className="vol-legend__dot" /><span>{'>'} 75: Very High</span></div>
                    <div className="vol-legend__item vol-legend__item--med"><span className="vol-legend__dot" /><span>50-75: High</span></div>
                    <div className="vol-legend__item vol-legend__item--low"><span className="vol-legend__dot" /><span>{'<'} 50: Moderate</span></div>
                  </div>
                </>
              : <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>No volatility data</p>
            }
          </Card>
        </div>

        <Card>
          <div className="section-header">
            <h2 className="section-title">Recommendations</h2>
            <span className="section-meta">{recommendations.length} suggestions</span>
          </div>
          <div className="recommendations">
            {recommendations.map((r) => (
              <div key={r.title} className="rec-item">
                <div className="rec-item__priority">
                  <Badge variant={r.priority === 'high' ? 'danger' : r.priority === 'medium' ? 'warning' : 'primary'}>{r.priority}</Badge>
                </div>
                <div className="rec-item__content">
                  <h4 className="rec-item__title">{r.title}</h4>
                  <p className="rec-item__desc">{r.desc}</p>
                </div>
                <button className="rec-item__action">{r.action} →</button>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}

function Shell({ children }) {
  return (
    <div className="app-layout">
      <Navbar /><Sidebar />
      <main className="app-main">
        <div className="page-header"><div><h1 className="page-title">Risk Analysis</h1></div></div>
        {children}
      </main>
    </div>
  );
}
