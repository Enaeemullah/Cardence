import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cardsApi } from '../api/cards';
import type { CardStatus } from '../types';
import { fmt } from '../utils';

const STATUSES: CardStatus[] = ['REQUESTED','ISSUED','ACTIVE','BLOCKED','HOTLISTED','EXPIRED','CLOSED'];

export default function CardsPage() {
  const [accountId, setAccountId] = useState('');
  const [status, setStatus] = useState<CardStatus | ''>('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['cards', accountId, status],
    queryFn: () => cardsApi.list({
      accountId: accountId || undefined,
      status: (status || undefined) as CardStatus | undefined,
    }),
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Cards</h1>
      </div>

      <div className="filters">
        <div className="form-group">
          <label>Account ID</label>
          <input className="form-control" placeholder="filter by account UUID" value={accountId} onChange={(e) => setAccountId(e.target.value)} style={{ minWidth: 280 }} />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value as CardStatus | '')}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        {isLoading && <div className="loading"><span className="spinner" /> Loading…</div>}
        {error   && <div className="alert alert-error card-body">Failed to load cards.</div>}
        {data && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Masked PAN</th>
                  <th>Status</th>
                  <th>Expiry</th>
                  <th>Account ID</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && (
                  <tr><td colSpan={6} className="empty">No cards found.</td></tr>
                )}
                {data.map((card) => (
                  <tr key={card.id}>
                    <td>
                      <Link to={`/cards/${card.id}`} className="table-link">{fmt.id(card.id)}</Link>
                    </td>
                    <td className="mono">{card.panMasked}</td>
                    <td><span className={`badge badge-${card.status}`}>{card.status}</span></td>
                    <td>{fmt.expiry(card.expiryMonth, card.expiryYear)}</td>
                    <td className="mono">{fmt.id(card.accountId)}</td>
                    <td className="text-muted">{fmt.date(card.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
