import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cardProductsApi, type CreateCardProductBody } from '../api/card-products';
import type { CardProduct } from '../types';
import { fmt } from '../utils';

const EMPTY: CreateCardProductBody = {
  name: '', network: 'VISA', productType: 'DEBIT',
  dailyLimitMinorUnits: 500000, perTxnLimitMinorUnits: 100000,
  velocityCount: 10, velocityWindowSeconds: 3600,
  atmEnabled: true, posEnabled: true, ecomEnabled: true, intlEnabled: false,
};

function ProductModal({ initial, onClose }: { initial: Partial<CreateCardProductBody> & { id?: string }; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<CreateCardProductBody>({ ...EMPTY, ...initial });
  const [error, setError] = useState('');

  const set = (k: keyof CreateCardProductBody, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => initial.id
      ? cardProductsApi.update(initial.id!, form)
      : cardProductsApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['card-products'] }); onClose(); },
    onError: () => setError('Save failed — check that you have ADMIN role.'),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{initial.id ? 'Edit' : 'New'} Card Product</div>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label>Name</label>
          <input className="form-control" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label>Network</label>
            <select className="form-control" value={form.network} onChange={(e) => set('network', e.target.value)}>
              {['VISA','MASTERCARD','AMEX'].map((v) => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Product Type</label>
            <select className="form-control" value={form.productType} onChange={(e) => set('productType', e.target.value)}>
              {['DEBIT','CREDIT','PREPAID'].map((v) => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Daily Limit (minor units)</label>
            <input className="form-control" type="number" value={form.dailyLimitMinorUnits} onChange={(e) => set('dailyLimitMinorUnits', +e.target.value)} />
          </div>
          <div className="form-group">
            <label>Per-Txn Limit (minor units)</label>
            <input className="form-control" type="number" value={form.perTxnLimitMinorUnits} onChange={(e) => set('perTxnLimitMinorUnits', +e.target.value)} />
          </div>
          <div className="form-group">
            <label>Velocity Count</label>
            <input className="form-control" type="number" value={form.velocityCount} onChange={(e) => set('velocityCount', +e.target.value)} />
          </div>
          <div className="form-group">
            <label>Velocity Window (seconds)</label>
            <input className="form-control" type="number" value={form.velocityWindowSeconds} onChange={(e) => set('velocityWindowSeconds', +e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.875rem' }}>
          {(['atmEnabled','posEnabled','ecomEnabled','intlEnabled'] as const).map((k) => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!form[k]} onChange={(e) => set(k, e.target.checked)} />
              {k.replace('Enabled', '').toUpperCase()}
            </label>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CardProductsPage() {
  const [modal, setModal] = useState<null | Partial<CreateCardProductBody> & { id?: string }>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['card-products'],
    queryFn: cardProductsApi.list,
  });

  const openNew  = () => setModal({});
  const openEdit = (p: CardProduct) => setModal({ id: p.id, name: p.name, network: p.network, productType: p.productType, dailyLimitMinorUnits: +p.dailyLimitMinorUnits, perTxnLimitMinorUnits: +p.perTxnLimitMinorUnits, velocityCount: p.velocityCount, velocityWindowSeconds: p.velocityWindowSeconds, atmEnabled: p.atmEnabled, posEnabled: p.posEnabled, ecomEnabled: p.ecomEnabled, intlEnabled: p.intlEnabled });

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Card Products</h1>
        <button className="btn btn-primary" onClick={openNew}>+ New Product</button>
      </div>

      <div className="card">
        {isLoading && <div className="loading"><span className="spinner" /> Loading…</div>}
        {data && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Network</th>
                  <th>Type</th>
                  <th>Daily Limit</th>
                  <th>Per-Txn Limit</th>
                  <th>Velocity</th>
                  <th>Channels</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && <tr><td colSpan={8} className="empty">No card products yet.</td></tr>}
                {data.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td>{p.network}</td>
                    <td>{p.productType}</td>
                    <td>{fmt.money(p.dailyLimitMinorUnits)}</td>
                    <td>{fmt.money(p.perTxnLimitMinorUnits)}</td>
                    <td className="text-muted">{p.velocityCount} / {p.velocityWindowSeconds}s</td>
                    <td className="mono" style={{ fontSize: 11 }}>
                      {[p.atmEnabled && 'ATM', p.posEnabled && 'POS', p.ecomEnabled && 'ECOM', p.intlEnabled && 'INTL'].filter(Boolean).join(' ')}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal !== null && <ProductModal initial={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
