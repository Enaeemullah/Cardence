import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const NAV = [
  { to: '/',              label: '⬡ Dashboard'     },
  { to: '/cards',        label: '▣ Cards'          },
  { to: '/approvals',    label: '✓ Approvals'      },
  { to: '/card-products',label: '◈ Card Products'  },
  { to: '/customers',    label: '♟ Customers'       },
  { to: '/accounts',     label: '⊞ Accounts'       },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">CARDENCE</div>
        <nav className="sidebar-nav">
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">{user?.email}</div>
          <div style={{ textTransform: 'uppercase', fontSize: 10, marginBottom: 6 }}>{user?.role}</div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <div className="main">
        <Outlet />
      </div>
    </div>
  );
}
