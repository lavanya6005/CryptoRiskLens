import './Footer.css';
import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__brand">
          <div className="footer__logo">
            <span className="footer__logo-icon">₿</span>
            <span className="footer__logo-text">CryptoRisk</span>
          </div>
          <p className="footer__tagline">Professional cryptocurrency portfolio risk analysis. Make smarter investment decisions.</p>
        </div>

        <div className="footer__links">
          <div className="footer__col">
            <h4 className="footer__col-title">Product</h4>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/portfolio">Portfolio</Link>
            <Link to="/analysis">Risk Analysis</Link>
            <Link to="/add-portfolio">Add Asset</Link>
          </div>
          <div className="footer__col">
            <h4 className="footer__col-title">Company</h4>
            <a href="#">About</a>
            <a href="#">Blog</a>
            <a href="#">Careers</a>
            <a href="#">Contact</a>
          </div>
          <div className="footer__col">
            <h4 className="footer__col-title">Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <p>© {year} CryptoRisk. All rights reserved.</p>
        <p className="footer__disclaimer">
          Not financial advice. Cryptocurrency investments carry risk. Past performance is not indicative of future results.
        </p>
      </div>
    </footer>
  );
}
