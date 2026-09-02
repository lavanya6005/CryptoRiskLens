import { Link } from 'react-router-dom';
import Footer from '../components/layout/Footer';
import Button from '../components/common/Button';
import './Landing.css';

const features = [
  {
    icon: '📊',
    title: 'Real-Time Risk Scoring',
    desc: 'Our engine continuously evaluates portfolio volatility, concentration, and market conditions to give you an accurate risk score.',
  },
  {
    icon: '💼',
    title: 'Portfolio Tracking',
    desc: 'Add your holdings once and track performance, P&L, and allocation changes across all your crypto assets in one place.',
  },
  {
    icon: '🔔',
    title: 'Risk Alerts',
    desc: 'Get notified when your portfolio risk exceeds your threshold, or when a single asset dominates your exposure.',
  },
  {
    icon: '📈',
    title: 'Volatility Analysis',
    desc: 'Understand the 30-day volatility of each asset and how it contributes to your overall portfolio risk profile.',
  },
];

const steps = [
  { num: '01', title: 'Create your account', desc: 'Sign up in under 60 seconds. No credit card required for the free tier.' },
  { num: '02', title: 'Add your holdings', desc: 'Enter the cryptocurrency assets you own, quantity, and purchase price.' },
  { num: '03', title: 'Review your risk report', desc: 'Instantly see your portfolio risk score, diversification analysis, and recommendations.' },
];

export default function Landing() {
  return (
    <div className="landing">
      {/* Top nav */}
      <header className="landing-nav">
        <div className="landing-nav__inner">
          <div className="landing-nav__brand">
            <span className="landing-nav__logo-icon">₿</span>
            <span className="landing-nav__logo-text">CryptoRisk</span>
          </div>
          <nav className="landing-nav__links">
            <a href="#features">Features</a>
            <a href="#how">How it Works</a>
            <a href="#risk">Risk Analysis</a>
          </nav>
          <div className="landing-nav__cta">
            <Link to="/login"><Button variant="secondary" size="sm">Sign In</Button></Link>
            <Link to="/register"><Button size="sm">Get Started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero__inner">
          <div className="hero__badge">Trusted by 1,200+ crypto investors</div>
          <h1 className="hero__headline">
            Analyze your crypto portfolio risk<br />
            with real-time market insights
          </h1>
          <p className="hero__sub">
            CryptoRisk helps you understand concentration risk, volatility exposure, and diversification gaps — 
            so you make smarter investment decisions backed by data, not gut feeling.
          </p>
          <div className="hero__actions">
            <Link to="/register"><Button size="lg">Get Started — It's Free</Button></Link>
            <Link to="/dashboard"><Button size="lg" variant="secondary">View Dashboard</Button></Link>
          </div>
          <div className="hero__stats">
            <div className="hero__stat"><span className="hero__stat-num">$48M+</span><span className="hero__stat-label">Assets Tracked</span></div>
            <div className="hero__stat-divider" />
            <div className="hero__stat"><span className="hero__stat-num">892</span><span className="hero__stat-label">Active Portfolios</span></div>
            <div className="hero__stat-divider" />
            <div className="hero__stat"><span className="hero__stat-num">99.9%</span><span className="hero__stat-label">Uptime</span></div>
          </div>
        </div>

        {/* Hero visual */}
        <div className="hero__visual" aria-hidden>
          <div className="hero__card">
            <div className="hero__card-header">
              <span className="hero__card-title">Portfolio Risk Score</span>
              <span className="hero__card-badge hero__card-badge--high">High Risk</span>
            </div>
            <div className="hero__card-score">72</div>
            <div className="hero__card-bar">
              <div className="hero__card-fill" style={{ width: '72%' }} />
            </div>
            <div className="hero__card-assets">
              {[
                { sym: 'BTC', pct: '57%', color: '#f7931a' },
                { sym: 'ETH', pct: '22%', color: '#627eea' },
                { sym: 'SOL', pct: '10%', color: '#9945ff' },
              ].map((a) => (
                <div key={a.sym} className="hero__card-asset">
                  <span className="hero__card-dot" style={{ background: a.color }} />
                  <span>{a.sym}</span>
                  <span style={{ marginLeft: 'auto' }}>{a.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-section" id="features">
        <div className="landing-section__inner">
          <div className="landing-section__label">Features</div>
          <h2 className="landing-section__title">Everything you need to manage crypto risk</h2>
          <p className="landing-section__sub">
            Built for retail investors who want institutional-grade risk analysis without the complexity.
          </p>
          <div className="features-grid">
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-card__icon">{f.icon}</div>
                <h3 className="feature-card__title">{f.title}</h3>
                <p className="feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="landing-section landing-section--alt" id="how">
        <div className="landing-section__inner">
          <div className="landing-section__label">How It Works</div>
          <h2 className="landing-section__title">Up and running in 3 steps</h2>
          <div className="steps-grid">
            {steps.map((s) => (
              <div key={s.num} className="step-card">
                <div className="step-card__num">{s.num}</div>
                <h3 className="step-card__title">{s.title}</h3>
                <p className="step-card__desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk explanation */}
      <section className="landing-section" id="risk">
        <div className="landing-section__inner">
          <div className="landing-section__label">Risk Analysis</div>
          <h2 className="landing-section__title">How we calculate your risk score</h2>
          <div className="risk-explain-grid">
            <div className="risk-explain__text">
              <p>
                Our risk engine analyses four key dimensions of your portfolio to produce a single, 
                actionable risk score from 0 to 100.
              </p>
              <div className="risk-factors">
                {[
                  { label: 'Asset Concentration', desc: 'How much of your portfolio is in a single asset', score: 30, color: '#dc3545' },
                  { label: 'Market Volatility', desc: '30-day price standard deviation across holdings', score: 20, color: '#d97706' },
                  { label: 'Diversification', desc: 'Spread across sectors, market caps, and chains', score: 30, color: '#1a56db' },
                  { label: 'Liquidity', desc: 'Ability to exit positions without price impact', score: 20, color: '#0f9d58' },
                ].map((f) => (
                  <div key={f.label} className="risk-factor-row">
                    <div className="risk-factor-row__info">
                      <span className="risk-factor-row__label">{f.label}</span>
                      <span className="risk-factor-row__weight">{f.score}% weight</span>
                    </div>
                    <p className="risk-factor-row__desc">{f.desc}</p>
                    <div className="risk-factor-row__bar">
                      <div style={{ width: `${f.score * 2}%`, background: f.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="risk-explain__cta-box">
              <div className="risk-explain__score-label">Risk Score Scale</div>
              <div className="risk-explain__scale">
                <div className="risk-explain__zone risk-explain__zone--low">
                  <span>0 – 33</span><strong>Low Risk</strong>
                </div>
                <div className="risk-explain__zone risk-explain__zone--med">
                  <span>34 – 66</span><strong>Medium Risk</strong>
                </div>
                <div className="risk-explain__zone risk-explain__zone--high">
                  <span>67 – 100</span><strong>High Risk</strong>
                </div>
              </div>
              <Link to="/register" style={{ display: 'block', marginTop: '24px' }}>
                <Button fullWidth size="lg">Analyze My Portfolio</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
