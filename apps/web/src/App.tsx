import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CardsPage from './pages/CardsPage';
import CardDetailPage from './pages/CardDetailPage';
import ApprovalsPage from './pages/ApprovalsPage';
import CardProductsPage from './pages/CardProductsPage';
import CustomersPage from './pages/CustomersPage';
import AccountsPage from './pages/AccountsPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                <Route index element={<DashboardPage />} />
                <Route path="cards" element={<CardsPage />} />
                <Route path="cards/:id" element={<CardDetailPage />} />
                <Route path="approvals" element={<ApprovalsPage />} />
                <Route path="card-products" element={<CardProductsPage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="accounts" element={<AccountsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
