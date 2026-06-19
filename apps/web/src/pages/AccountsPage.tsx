import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '../api/accounts';
import { fmt } from '../utils';

function CreateAccountModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ customerId: '', currency: 'USD' });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => accountsApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); onClose(); },
    onError: () => setError('Failed to create account — verify the customer ID exists.'),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">New Account</div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group">
          <label>Customer ID (UUID)</label>
          <input className="form-control" placeholder="xxxxxxxx-xxxx-…" value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Currency</label>
          <select className="form-control" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
            {['USD','EUR','GBP','AED','SAR'].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.list,
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Accounts</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Account</button>
      </div>

      <div className="card">
        {isLoading && <div className="loading"><span className="spinner" /> Loading…</div>}
        {data && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Account Number</th>
                  <th>Customer ID</th>
                  <th>Currency</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && <tr><td colSpan={7} className="empty">No accounts yet.</td></tr>}
                {data.map((a) => (
                  <tr key={a.id}>
                    <td className="mono">{fmt.id(a.id)}</td>
                    <td className="mono">{a.accountNumber}</td>
                    <td className="mono">{fmt.id(a.customerId)}</td>
                    <td>{a.currency}</td>
                    <td style={{ fontWeight: 500 }}>{fmt.money(a.balanceMinorUnits, a.currency)}</td>
                    <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                    <td className="text-muted">{fmt.date(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <CreateAccountModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
