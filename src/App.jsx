import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Appointments from './pages/Appointments';
import Sessions from './pages/Sessions';
import Exercises from './pages/Exercises';
import Invoices from './pages/Invoices';
import Analytics from './pages/Analytics';
import PatientPortal from './pages/PatientPortal';
import SecretaryDashboard from './pages/SecretaryDashboard';
import Settings from './pages/Settings';
import PackagesAndFinance from './pages/PackagesAndFinance';
import DemoSeeder from './pages/DemoSeeder';

// Redirect patient role to portal automatically
function RootRedirect() {
  const { user } = useAuth();
  if (user?.role === 'patient') return <Navigate to="/portal" replace />;
  if (user?.role === 'secretary') return <Navigate to="/secretary" replace />;
  return <Dashboard />;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, authError } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') return <UserNotRegisteredError />;
  if (authError?.type === 'auth_required') return <Login />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patients/:id" element={<PatientDetail />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/exercises" element={<Exercises />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/portal" element={<PatientPortal />} />
        <Route path="/secretary" element={<SecretaryDashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/packages" element={<PackagesAndFinance />} />
        <Route path="/demo-seeder" element={<DemoSeeder />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
