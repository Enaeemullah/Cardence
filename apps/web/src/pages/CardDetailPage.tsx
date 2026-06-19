import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cardsApi } from '../api/cards';
import type { CardStatus } from '../types';
import { fmt } from '../utils';

type Action = 'activate'|'block'|'unblock'|'hotlist'|'renew'|'replace'|'close';

const ACTIONS: Record<CardStatus, Array<{ label: string; action: Action; cls: string }>> = {
  REQUESTED: [],
  ISSUED:    [{ label: 'Activate', action: 'activate', cls: 'btn-success' }],
  ACTIVE:    [
    { label: 'Block',   action: 'block',   cls: 'btn-warning'   },
    { label: 'Hotlist', action: 'hotlist', cls: 'btn-danger'    },
    { label: 'Renew',   action: 'renew',   cls: 'btn-primary'   },
    { label: 'Replace', action: 'replace', cls: 'btn-secondary' },
    { label: 'Close',   action: 'close',   cls: 'btn-danger'    },
  ],
  BLOCKED:   [
    { label: 'Unblock', action: 'unblock', cls: 'btn-success' },
    { label: 'Hotlist', action: 'hotlist', cls: 'btn-danger'  },
    { label: 'Close',   action: 'close',   cls: 'btn-danger'  },
  ],
  HOTLISTED: [{ label: 'Close', action: 'close', cls: 'btn-danger' }],
  EXPIRED:   [{ label: 'Close', action: 'close', cls: 'btn-danger' }],
  CLOSED:    [],
};

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'info'|'txns'>('info');
  const [msg, setMsg] = useState('');

  const { data: card, isLoading } = useQuery({
    queryKey: ['card', id],
    queryFn: () => cardsApi.get(id!),
    enabled: !!id,
  });

  const { data: txns, isLoading: txnsLoading } = useQuery({
    queryKey: ['card-txns', id],
    queryFn: () => cardsApi.transactions(id!),
    enabled: !!id && tab === 'txns',
  });

  const mutation = useMutation({
    mutationFn: (action: Action) => {
      if (action === 'replace') return cardsApi.replace(id!).then((r) => r.card);
      return cardsApi[action](id!);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['card', id] });
      qc.invalidateQueries({ queryKey: ['cards'] });
      setMsg('Action completed.');
      setTimeout(() => setMsg(''), 3000);
    },
    onError: () => setMsg('Action failed — check console.'),
  });

  if (isLoading) return <div className="loading"><span className="spinner" /> Loading…</div>;
  if (!card) return <div className="page-content"><div className="alert alert-error">Card not found.</div></div>;

  const actions = ACTIONS[card.status] ?? [];

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>
            <Link to="/cards">Cards</Link> › <span className="mono">{fmt.id(card.id)}</span>
          </div>
          <h1 className="mono">{card.panMasked}</h1>
        </div>
        <span className={`badge badge-${card.status}`} style={{ fontSize: 13 }}>{card.status}</span>
      </div>

      {msg && <div className={`alert ${msg.includes('fail') ? 'alert-error' : 'alert-success'}`}>{msg}</div>}

      {actions.length > 0 && (
        <div className="card mb-2">
          <div className="card-header">Lifecycle Actions</div>
          <div className="card-body">
            <div className="action-bar">
              {actions.map(({ label, action, cls }) => (
                <button
                  key={action}
                  className={`btn ${cls} btn-sm`}
                  onClick={() => mutation.mutate(action)}
                  disabled={mutation.isPending}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="tabs" style={{ padding: '0 1.25rem' }}>
          <span className={`tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>Details</span>
          <span className={`tab ${tab === 'txns' ? 'active' : ''}`} onClick={() => setTab('txns')}>Transactions</span>
        </div>

        {tab === 'info' && (
          <div className="card-body">
            <dl className="detail-grid">
              <div className="detail-item"><dt>Card ID</dt><dd>{card.id}</dd></div>
              <div className="detail-item"><dt>Masked PAN</dt><dd>{card.panMasked}</dd></div>
              <div className="detail-item"><dt>Expiry</dt><dd>{fmt.expiry(card.expiryMonth, card.expiryYear)}</dd></div>
              <div className="detail-item"><dt>Account ID</dt><dd>{card.accountId}</dd></div>
              <div className="detail-item"><dt>Product ID</dt><dd>{card.cardProductId}</dd></div>
              <div className="detail-item"><dt>Status</dt><dd><span className={`badge badge-${card.status}`}>{card.status}</span></dd></div>
              <div className="detail-item"><dt>Daily Limit</dt><dd>{fmt.money(card.dailyLimitMinorUnits) || <span className="text-muted">from product</span>}</dd></div>
              <div className="detail-item"><dt>Per-Txn Limit</dt><dd>{fmt.money(card.perTxnLimitMinorUnits) || <span className="text-muted">from product</span>}</dd></div>
              <div className="detail-item"><dt>Parent Card</dt><dd>{card.parentCardId ? fmt.id(card.parentCardId) : '—'}</dd></div>
              <div className="detail-item"><dt>ATM</dt><dd>{card.atmEnabled == null ? 'inherit' : card.atmEnabled ? 'Yes' : 'No'}</dd></div>
              <div className="detail-item"><dt>POS</dt><dd>{card.posEnabled  == null ? 'inherit' : card.posEnabled  ? 'Yes' : 'No'}</dd></div>
              <div className="detail-item"><dt>ECOM</dt><dd>{card.ecomEnabled == null ? 'inherit' : card.ecomEnabled ? 'Yes' : 'No'}</dd></div>
              <div className="detail-item"><dt>INTL</dt><dd>{card.intlEnabled == null ? 'inherit' : card.intlEnabled ? 'Yes' : 'No'}</dd></div>
              <div className="detail-item"><dt>Created</dt><dd>{fmt.datetime(card.createdAt)}</dd></div>
              <div className="detail-item"><dt>Closed</dt><dd>{fmt.datetime(card.closedAt)}</dd></div>
            </dl>
          </div>
        )}

        {tab === 'txns' && (
          <div className="table-wrap">
            {txnsLoading && <div className="loading"><span className="spinner" /> Loading…</div>}
            {txns && (
              <table>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Channel</th>
                    <th>Merchant</th>
                    <th>Status</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {txns.length === 0 && (
                    <tr><td colSpan={7} className="empty">No transactions yet.</td></tr>
                  )}
                  {txns.map((t) => (
                    <tr key={t.id}>
                      <td className="mono">{t.referenceNumber}</td>
                      <td className="text-muted">{fmt.datetime(t.postedAt)}</td>
                      <td style={{ fontWeight: 500 }}>{fmt.money(t.amountMinorUnits, t.currency)}</td>
                      <td>{t.channel}</td>
                      <td>{t.merchantName ?? '—'}</td>
                      <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                      <td className="text-muted">{t.declineReason ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
