import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Card from '../components/common/Card';
import RiskMeter from '../components/dashboard/RiskMeter';
import RiskPanel from '../components/dashboard/RiskPanel';
import LineChart from '../components/charts/LineChart';
import VolatilityChart from '../components/charts/VolatilityChart';
import Badge from '../components/common/Badge';
import { currentUser, riskAnalysis, performanceHistory, volatilityData, portfolioStats } from '../data/mockData';
import './Dashboard.css';
import './Analysis.css';

const recommendations = [
  {
    priority: 'high',
    title: 'Reduce Bitcoin Concentration',
    desc: 'Your Bitcoin allocation (57%) exceeds the recommended 30% limit for a balanced portfolio. Consider reallocating 20-25% into mid-cap assets.',
    action: 'Rebalance Portfolio',
  },
  {
    priority: 'medium',
    title: 'Add Stablecoin Exposure',
    desc: 'Adding 10-15% stablecoins (USDC, USDT) can reduce overall portfolio volatility and provide liquidity for buying opportunities.',
    action: 'Explore Stablecoins',
  },
  {
    priority: 'low',
    title: 'Consider DeFi Diversification',
    desc: 'Your portfolio has no DeFi exposure. Layer-1 and DeFi tokens often have low correlation with BTC and can improve risk-adjusted returns.',
    action: 'Explore DeFi',
  },
];

const histPerf = [
  { period: '1W', return: +4.2, riskScore: 71 },
  { period: '1M', return: +18.6, riskScore: 72 },
  { period: '3M', return: +31.4, riskScore: 69 },
  { period: '6M', return: +52.1, riskScore: 74 },
  { period: '1Y', return: +89.3, riskScore: 68 },
];

export default function Analysis() {
  return (
    <div className="app-layout">
      <Navbar user={currentUser} />
      <Sidebar />
      <main className="app-main">
        <div className="page-header">
          <div>
            <h1 className="page-title">Risk Analysis</h1>
            <p className="page-sub">Detailed risk report for your portfolio</p>
          </div>
          <div className="analysis-updated">
            <span>Last updated</span>
            <strong>Just now</strong>
          </div>
        </div>

        {/* Top row */}
        <div className="analysis-top">
          {/* Risk score */}
          <Card className="analysis-risk-card">
            <div className="section-header">
              <h2 className="section-title">Overall Risk Score</h2>
              <Badge variant="danger">High Risk</Badge>
            </div>
            <RiskMeter score={riskAnalysis.overallScore} />
            <p className="analysis-risk-note">
              Your portfolio is in the <strong>high-risk zone</strong>. This is primarily driven by high Bitcoin concentration and elevated market volatility.
            </p>
          </Card>

          {/* Historical performance */}
          <Card>
            <div className="section-header">
              <h2 className="section-title">Performance vs Risk</h2>
            </div>
            <table className="hist-perf-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Return</th>
                  <th>Risk Score</th>
                  <th>Risk/Return</th>
                </tr>
              </thead>
              <tbody>
                {histPerf.map((row) => (
                  <tr key={row.period}>
                    <td className="fw-600">{row.period}</td>
                    <td className={row.return >= 0 ? 'text-success fw-600' : 'text-danger fw-600'}>
                      {row.return >= 0 ? '+' : ''}{row.return}%
                    </td>
                    <td>{row.riskScore}/100</td>
                    <td>
                      <Badge variant={row.return / row.riskScore > 0.6 ? 'success' : 'warning'}>
                        {(row.return / row.riskScore).toFixed(2)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Performance chart */}
        <Card>
          <LineChart data={performanceHistory} title="30-Day Portfolio Performance Index" />
        </Card>

        {/* Risk factors + Volatility */}
        <div className="analysis-mid">
          <Card>
            <div className="section-header">
              <h2 className="section-title">Risk Factor Breakdown</h2>
            </div>
            <RiskPanel factors={riskAnalysis.factors} recommendation={riskAnalysis.recommendation} />
          </Card>
          <Card>
            <VolatilityChart data={volatilityData} title="30-Day Asset Volatility" />
            <div className="vol-legend">
              <div className="vol-legend__item vol-legend__item--high">
                <span className="vol-legend__dot" />
                <span>{'>'} 75: Very High</span>
              </div>
              <div className="vol-legend__item vol-legend__item--med">
                <span className="vol-legend__dot" />
                <span>50-75: High</span>
              </div>
              <div className="vol-legend__item vol-legend__item--low">
                <span className="vol-legend__dot" />
                <span>{'<'} 50: Moderate</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Recommendations */}
        <Card>
          <div className="section-header">
            <h2 className="section-title">Recommendations</h2>
            <span className="section-meta">{recommendations.length} suggestions</span>
          </div>
          <div className="recommendations">
            {recommendations.map((r) => (
              <div key={r.title} className="rec-item">
                <div className="rec-item__priority">
                  <Badge variant={r.priority === 'high' ? 'danger' : r.priority === 'medium' ? 'warning' : 'primary'}>
                    {r.priority}
                  </Badge>
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
