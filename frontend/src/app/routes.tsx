import { createBrowserRouter } from 'react-router';
import { Home } from './pages/Home';
import { SearchResults } from './pages/SearchResults';
import { Institutions } from './pages/Institutions';
import { ProgramDetail } from './pages/ProgramDetail';
import { InstitutionProfile } from './pages/InstitutionProfile';
import { Compare } from './pages/Compare';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { FirstLogin } from './pages/FirstLogin';
import { CandidateDashboard } from './pages/CandidateDashboard';
import { InstitutionDashboard } from './pages/InstitutionDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Home,
  },
  {
    path: '/search',
    Component: SearchResults,
  },
  {
    path: '/institutions',
    Component: Institutions,
  },
  {
    path: '/program/:id',
    Component: ProgramDetail,
  },
  {
    path: '/institution/:slug',
    Component: InstitutionProfile,
  },
  {
    path: '/compare',
    Component: Compare,
  },
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/signup',
    Component: Signup,
  },
  {
    path: '/first-login',
    Component: FirstLogin,
  },
  {
    path: '/dashboard/candidate',
    element: (
      <ProtectedRoute requiredRole="candidat">
        <CandidateDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/institution',
    element: (
      <ProtectedRoute requiredRole="institut">
        <InstitutionDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/admin',
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    Component: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-[var(--edu-text-primary)] mb-4">404</h1>
          <p className="text-xl text-[var(--edu-text-secondary)]">Page not found</p>
        </div>
      </div>
    ),
  },
]);
