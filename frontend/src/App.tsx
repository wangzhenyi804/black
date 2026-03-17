import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Media from './pages/Media';
import CodeSlots from './pages/CodeSlots';
import Users from './pages/Users';
import Account from './pages/Account';
import DataOverview from './pages/DataOverview';

import CodeSlotData from './pages/CodeSlotData';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return isAdmin ? children : <Navigate to="/dashboard" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="media" element={<AdminRoute><Media /></AdminRoute>} />
        <Route path="codeslots" element={<AdminRoute><CodeSlots /></AdminRoute>} />
        <Route path="data-overview" element={<DataOverview />} />
        <Route path="codeslot-data" element={<CodeSlotData />} />
        <Route path="account" element={<Account />} />
        <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
