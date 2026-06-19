import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../api/customers';
import { fmt } from '../utils';

function CreateCustomerModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => customersApi.create({ ...form, phone: form.phone || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); onClose(); },
    onError: () => setError('Failed to create customer.'),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">New Customer</div>
        {error && <div className="alert alert-error">{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label>First Name</label>
            <input className="form-control" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input className="form-control" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
          </div>
        </div>
        <div className="form-group">
          <label>Email</label>
          <input className="form-control" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Phone (optional)</label>
          <input className="form-control" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
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

export default function CustomersPage() {
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.list,
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Customers</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Customer</button>
      </div>

      <div className="card">
        {isLoading && <div className="loading"><span className="spinner" /> Loading…</div>}
        {data && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && <tr><td colSpan={5} className="empty">No customers yet.</td></tr>}
                {data.map((c) => (
                  <tr key={c.id}>
                    <td className="mono">{fmt.id(c.id)}</td>
                    <td style={{ fontWeight: 500 }}>{c.firstName} {c.lastName}</td>
                    <td>{c.email}</td>
                    <td className="text-muted">{c.phone ?? '—'}</td>
                    <td className="text-muted">{fmt.date(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <CreateCustomerModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
