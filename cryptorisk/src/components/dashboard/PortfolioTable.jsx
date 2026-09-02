import './PortfolioTable.css';
import Badge from '../common/Badge';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

export default function PortfolioTable({ holdings }) {
  return (
    <div className="ptable-wrap">
      <table className="ptable">
        <thead>
          <tr>
            <th>Asset</th>
            <th className="text-right">Price</th>
            <th className="text-right">Holdings</th>
            <th className="text-right">Value</th>
            <th className="text-right">P&amp;L</th>
            <th>Allocation</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr key={h.id}>
              <td>
                <div className="ptable__asset">
                  <div className="ptable__asset-icon" style={{ background: h.color + '20', color: h.color }}>
                    {h.symbol[0]}
                  </div>
                  <div>
                    <div className="ptable__asset-name">{h.name}</div>
                    <div className="ptable__asset-symbol">{h.symbol}</div>
                  </div>
                </div>
              </td>
              <td className="text-right ptable__price">{fmt(h.currentPrice)}</td>
              <td className="text-right ptable__qty">{h.quantity} {h.symbol}</td>
              <td className="text-right ptable__value">{fmt(h.currentValue)}</td>
              <td className="text-right">
                <div className="ptable__pnl-wrap">
                  <span className={h.pnl >= 0 ? 'text-success' : 'text-danger'}>
                    {h.pnl >= 0 ? '+' : ''}{fmt(h.pnl)}
                  </span>
                  <Badge variant={h.pnlPct >= 0 ? 'success' : 'danger'}>
                    {h.pnlPct >= 0 ? '+' : ''}{h.pnlPct}%
                  </Badge>
                </div>
              </td>
              <td>
                <div className="ptable__alloc">
                  <div className="ptable__alloc-bar">
                    <div
                      className="ptable__alloc-fill"
                      style={{ width: `${h.allocation}%`, background: h.color }}
                    />
                  </div>
                  <span className="ptable__alloc-pct">{h.allocation}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
