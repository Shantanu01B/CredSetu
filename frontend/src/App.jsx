import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import MemberDashboard from './pages/MemberDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LoanRequest from './pages/LoanRequest';
import Savings from './pages/Savings';
import Repayment from './pages/Repayment';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import BankDashboard from './pages/BankDashboard';
import Meetings from './pages/Meetings';
import RiskAlerts from './pages/RiskAlerts';
import FinancialHistory from './pages/FinancialHistory';
import AdminFinanceOverview from './pages/AdminFinanceOverview';
import AdminTransactionTable from './pages/AdminTransactionTable';
import MyLoans from './pages/MyLoans';
import Notifications from './pages/Notifications';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';

const getDefaultRoute = (role) => {
  if (role === 'admin') return '/admin';
  if (role === 'bank_viewer') return '/bank/dashboard';
  return '/dashboard';
};

function App() {
  const { user } = useAuth();
  const defaultRoute = user?.role ? getDefaultRoute(user.role) : '/dashboard';

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<DashboardLayout />}>

          {/* Common Routes */}
          <Route element={<ProtectedRoute allowedRoles={['member', 'admin', 'bank_viewer']} />}>
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/finance" element={<AdminFinanceOverview />} />
            <Route path="/admin/transactions" element={<AdminTransactionTable />} />
          </Route>

          {/* Bank Routes */}
          <Route element={<ProtectedRoute allowedRoles={['bank_viewer', 'admin']} />}>
            <Route path="/bank/dashboard" element={<BankDashboard />} />
          </Route>

          {/* Member Routes */}
          <Route element={<ProtectedRoute allowedRoles={['member', 'admin']} />}>
            <Route path="/dashboard" element={<MemberDashboard />} />
            <Route path="/history" element={<FinancialHistory />} />
            <Route path="/loans" element={<MyLoans />} />
            <Route path="/loans/request" element={<LoanRequest />} />
            <Route path="/savings" element={<Savings />} />
            <Route path="/repayment" element={<Repayment />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/alerts" element={<RiskAlerts />} />
          </Route>

        </Route>

        {/* Redirect root */}
        <Route path="/" element={<Navigate to={defaultRoute} replace />} />
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>
    </>
  );
}

export default App;
