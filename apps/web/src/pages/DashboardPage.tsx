import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { approvalsApi } from '../api/approvals';
import { cardsApi } from '../api/cards';
import { customersApi } from '../api/customers';
import { accountsApi } from '../api/accounts';

export default function DashboardPage() {
  const approvals = useQuery({ queryKey: ['approvals'], queryFn: approvalsApi.list });
  const cards     = useQuery({ queryKey: ['cards'],     queryFn: () => cardsApi.list() });
  const customers = useQuery({ queryKey: ['customers'], queryFn: customersApi.list });
  const accounts  = useQuery({ queryKey: ['accounts'],  queryFn: accountsApi.list });

  const pendingCount = approvals.data?.length ?? '—';
  const activeCards  = cards.data?.filter((c) => c.status === 'ACTIVE').length ?? '—';
  const customerCount = customers.data?.length ?? '—';
  const accountCount  = accounts.data?.length ?? '—';

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="stats-grid">
        <Link to="/approvals" className="stat-link">
          <div className="stat-card">
            <div className="stat-label">Pending Approvals</div>
            <div className="stat-value" style={{ color: (approvals.data?.length ?? 0) > 0 ? '#d97706' : undefined }}>
              {pendingCount}
            </div>
          </div>
        </Link>
        <Link to="/cards" className="stat-link">
          <div className="stat-card">
            <div className="stat-label">Active Cards</div>
            <div className="stat-value">{activeCards}</div>
          </div>
        </Link>
        <Link to="/customers" className="stat-link">
          <div className="stat-card">
            <div className="stat-label">Customers</div>
            <div className="stat-value">{customerCount}</div>
          </div>
        </Link>
        <Link to="/accounts" className="stat-link">
          <div className="stat-card">
            <div className="stat-label">Accounts</div>
            <div className="stat-value">{accountCount}</div>
          </div>
        </Link>
      </div>

      <div className="card">
        <div className="card-body" style={{ color: '#6b7280', fontSize: 13 }}>
          <strong>Quick links:</strong>{' '}
          <Link to="/cards">Cards</Link> · <Link to="/approvals">Approval queue</Link> ·{' '}
          <Link to="/card-products">Card products</Link> · <Link to="/customers">Customers</Link>
        </div>
      </div>
    </div>
  );
}
