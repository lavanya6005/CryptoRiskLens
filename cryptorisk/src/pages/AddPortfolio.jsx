import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input, { Select } from '../components/common/Input';
import { currentUser, cryptoOptions } from '../data/mockData';
import './Dashboard.css';
import './AddPortfolio.css';

export default function AddPortfolio() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    crypto: '',
    quantity: '',
    purchasePrice: '',
    purchaseDate: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.crypto) errs.crypto = 'Please select a cryptocurrency';
    if (!form.quantity || isNaN(form.quantity) || +form.quantity <= 0) errs.quantity = 'Enter a valid quantity';
    if (!form.purchasePrice || isNaN(form.purchasePrice) || +form.purchasePrice <= 0) errs.purchasePrice = 'Enter a valid purchase price';
    if (!form.purchaseDate) errs.purchaseDate = 'Purchase date is required';
    return errs;
  };

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setErrors({ ...errors, [field]: '' });
  };

  const estimatedValue = form.quantity && form.purchasePrice
    ? (parseFloat(form.quantity) * parseFloat(form.purchasePrice)).toFixed(2)
    : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitted(true);
    setTimeout(() => navigate('/portfolio'), 1500);
  };

  if (submitted) {
    return (
      <div className="app-layout">
        <Navbar user={currentUser} />
        <Sidebar />
        <main className="app-main">
          <div className="add-success">
            <div className="add-success__icon">✓</div>
            <h2>Asset added successfully!</h2>
            <p>Redirecting to your portfolio…</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Navbar user={currentUser} />
      <Sidebar />
      <main className="app-main">
        <div className="page-header">
          <div>
            <h1 className="page-title">Add Asset</h1>
            <p className="page-sub">Add a new cryptocurrency to your portfolio</p>
          </div>
        </div>

        <div className="add-grid">
          {/* Form */}
          <Card>
            <h2 className="section-title" style={{ marginBottom: 'var(--spacing-6)' }}>Asset Details</h2>
            <form className="add-form" onSubmit={handleSubmit} noValidate>
              <Select
                id="ap-crypto"
                label="Cryptocurrency"
                value={form.crypto}
                onChange={set('crypto')}
                error={errors.crypto}
              >
                <option value="">Select cryptocurrency…</option>
                {cryptoOptions.map((c) => (
                  <option key={c.symbol} value={c.symbol}>{c.name} ({c.symbol})</option>
                ))}
              </Select>

              <div className="add-form__row">
                <Input
                  id="ap-qty"
                  label="Quantity"
                  type="number"
                  placeholder="e.g. 0.5"
                  min="0"
                  step="any"
                  value={form.quantity}
                  onChange={set('quantity')}
                  error={errors.quantity}
                  hint="Number of coins/tokens purchased"
                />
                <Input
                  id="ap-price"
                  label="Purchase Price (USD)"
                  type="number"
                  placeholder="e.g. 42000"
                  min="0"
                  step="any"
                  value={form.purchasePrice}
                  onChange={set('purchasePrice')}
                  error={errors.purchasePrice}
                  hint="Price per coin at time of purchase"
                />
              </div>

              <Input
                id="ap-date"
                label="Purchase Date"
                type="date"
                value={form.purchaseDate}
                onChange={set('purchaseDate')}
                error={errors.purchaseDate}
                max={new Date().toISOString().split('T')[0]}
              />

              <div className="add-form__group">
                <label className="form-label" htmlFor="ap-notes">Notes (optional)</label>
                <textarea
                  id="ap-notes"
                  className="form-input"
                  placeholder="e.g. DCA purchase, long term hold…"
                  value={form.notes}
                  onChange={set('notes')}
                  rows={3}
                />
              </div>

              <div className="add-form__actions">
                <Button type="button" variant="secondary" onClick={() => navigate('/portfolio')}>Cancel</Button>
                <Button type="submit">Add to Portfolio</Button>
              </div>
            </form>
          </Card>

          {/* Preview */}
          <div className="add-sidebar">
            <Card>
              <h3 className="section-title" style={{ marginBottom: 'var(--spacing-5)' }}>Preview</h3>
              {form.crypto ? (
                <div className="add-preview">
                  <div className="add-preview__row">
                    <span className="add-preview__label">Asset</span>
                    <span className="add-preview__val">{cryptoOptions.find(c => c.symbol === form.crypto)?.name || '—'} ({form.crypto})</span>
                  </div>
                  <div className="add-preview__row">
                    <span className="add-preview__label">Quantity</span>
                    <span className="add-preview__val">{form.quantity || '—'}</span>
                  </div>
                  <div className="add-preview__row">
                    <span className="add-preview__label">Purchase Price</span>
                    <span className="add-preview__val">{form.purchasePrice ? `$${parseFloat(form.purchasePrice).toLocaleString()}` : '—'}</span>
                  </div>
                  <div className="add-preview__row">
                    <span className="add-preview__label">Purchase Date</span>
                    <span className="add-preview__val">{form.purchaseDate || '—'}</span>
                  </div>
                  {estimatedValue && (
                    <div className="add-preview__total">
                      <span>Total Investment</span>
                      <span className="add-preview__total-val">${parseFloat(estimatedValue).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="add-preview__empty">Select a cryptocurrency to see the preview</p>
              )}
            </Card>

            <Card>
              <h3 className="section-title" style={{ marginBottom: 'var(--spacing-4)' }}>Tips</h3>
              <ul className="add-tips">
                <li>Enter the exact quantity you purchased, including decimals (e.g. 0.00123 BTC)</li>
                <li>Purchase price is used to calculate your profit &amp; loss</li>
                <li>For DCA strategies, add each purchase separately</li>
              </ul>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
