import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalsApi } from '../api/approvals';
import { fmt } from '../utils';

export default function ApprovalsPage() {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['approvals'],
    queryFn: approvalsApi.list,
  });

  const approve = useMutation({
    mutationFn: (id: string) => approvalsApi.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals'] }),
  });

  const reject = useMutation({
    mutationFn: (id: string) => approvalsApi.reject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals'] }),
  });

  const busy = approve.isPending || reject.isPending;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Approval Queue</h1>
      </div>

      {(approve.error || reject.error) && (
        <div className="alert alert-error">Action failed — you may lack the APPROVER role, or the request is already decided.</div>
      )}

      <div className="card">
        {isLoading && <div className="loading"><span className="spinner" /> Loading…</div>}
        {error    && <div className="alert alert-error card-body">Failed to load approvals.</div>}
        {data && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Initiator</th>
                  <th>Card ID</th>
                  <th>Requested</th>
                  <th>Decided</th>
                  <th style={{ minWidth: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && (
                  <tr><td colSpan={8} className="empty">No pending approvals.</td></tr>
                )}
                {data.map((req) => (
                  <tr key={req.id}>
                    <td className="mono">{fmt.id(req.id)}</td>
                    <td><span className={`badge badge-${req.type}`}>{req.type.replace('_', ' ')}</span></td>
                    <td><span className={`badge badge-${req.status}`}>{req.status}</span></td>
                    <td className="mono">{fmt.id(req.initiatorUserId)}</td>
                    <td className="mono">{fmt.id((req.payload as { cardId?: string }).cardId ?? '')}</td>
                    <td className="text-muted">{fmt.datetime(req.createdAt)}</td>
                    <td className="text-muted">{fmt.datetime(req.decidedAt)}</td>
                    <td>
                      {req.status === 'PENDING' ? (
                        <div className="action-bar">
                          <button
                            className="btn btn-success btn-sm"
                            disabled={busy}
                            onClick={() => approve.mutate(req.id)}
                          >Approve</button>
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={busy}
                            onClick={() => reject.mutate(req.id)}
                          >Reject</button>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
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
