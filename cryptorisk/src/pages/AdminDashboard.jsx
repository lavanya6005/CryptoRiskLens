import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import StatCard from '../components/dashboard/StatCard';
import { currentUser, adminUsers, systemStats } from '../data/mockData';
import './Dashboard.css';
import './AdminDashboard.css';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(n);

export default function AdminDashboard() {
  return (
    <div className="app-layout">
      <Navbar user={currentUser} />
      <Sidebar />
      <main className="app-main">
        <div className="page-header">
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-sub">System management and monitoring</p>
          </div>
          <Badge variant="primary">Admin Access</Badge>
        </div>

        {/* System stats */}
        <div className="stats-grid">
          <StatCard title="Total Users" value={systemStats.totalUsers.toLocaleString()} subtitle="registered accounts" accent="primary"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
          />
          <StatCard title="Active Portfolios" value={systemStats.activePortfolios.toLocaleString()} subtitle="portfolios tracked" accent="success"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8"/></svg>}
          />
          <StatCard title="Assets Under Management" value={fmt(systemStats.totalAUM)} subtitle="total tracked value" accent="primary"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
          />
          <StatCard title="Avg Risk Score" value={`${systemStats.avgRiskScore}/100`} subtitle="platform average" accent="warning"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>}
          />
        </div>

        <div className="admin-grid">
          {/* API Status */}
          <Card>
            <div className="section-header" style={{ marginBottom: 'var(--spacing-5)' }}>
              <h2 className="section-title">API Status</h2>
              <span className="live-badge">
                <span className="live-badge__dot" />
                Live
              </span>
            </div>
            <div className="api-status-list">
              {systemStats.apiStatus.map((api) => (
                <div key={api.name} className="api-status-row">
                  <div className="api-status-info">
                    <div className={`api-status-indicator ${api.status}`} />
                    <span className="api-status-name">{api.name}</span>
                  </div>
                  <div className="api-status-right">
                    <span className="api-status-latency">{api.latency}</span>
                    <Badge variant={api.status === 'operational' ? 'success' : 'warning'}>
                      {api.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick stats */}
          <Card>
            <h2 className="section-title" style={{ marginBottom: 'var(--spacing-5)' }}>Platform Health</h2>
            <div className="health-grid">
              {[
                { label: 'Server Uptime', value: '99.98%', color: 'var(--color-success)' },
                { label: 'API Response Avg', value: '261ms', color: 'var(--color-primary)' },
                { label: 'Error Rate (24h)', value: '0.02%', color: 'var(--color-success)' },
                { label: 'Data Freshness', value: '< 60s', color: 'var(--color-primary)' },
              ].map((m) => (
                <div key={m.label} className="health-metric">
                  <span className="health-metric__val" style={{ color: m.color }}>{m.value}</span>
                  <span className="health-metric__label">{m.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* User management */}
        <Card padding={false}>
          <div className="section-header" style={{ padding: '20px 20px 0' }}>
            <h2 className="section-title">User Management</h2>
            <span className="section-meta">{adminUsers.length} users shown</span>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th className="text-right">Portfolio Value</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-avatar">{u.name.split(' ').map(n=>n[0]).join('')}</div>
                        <div>
                          <div className="admin-user-name">{u.name}</div>
                          <div className="admin-user-email">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><Badge variant={u.role === 'admin' ? 'primary' : 'neutral'}>{u.role}</Badge></td>
                    <td><Badge variant={u.status === 'active' ? 'success' : 'neutral'}>{u.status}</Badge></td>
                    <td className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>{u.joined}</td>
                    <td className="text-right fw-600" style={{ fontSize: 'var(--font-size-sm)' }}>
                      {u.portfolioValue > 0 ? `$${u.portfolioValue.toLocaleString()}` : '—'}
                    </td>
                    <td className="text-right">
                      <div className="admin-actions">
                        <button className="admin-action-btn">View</button>
                        <button className="admin-action-btn admin-action-btn--danger">
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
