import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import LogPage from './pages/LogPage';
import ProgressPage from './pages/ProgressPage';
import GoalPage from './pages/GoalPage';
import ProfilePage from './pages/ProfilePage';
import ChallengesPage from './pages/ChallengesPage';
import ChallengeDetailPage from './pages/ChallengeDetailPage';

// '/' → LandingPage if not logged in, /dashboard if logged in
function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-gray-900" />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

// Redirect logged-in users away from login/register
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// Redirect unauthenticated users to landing page
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-gray-900" />;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/log" element={<LogPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/goal" element={<GoalPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/challenges" element={<ChallengesPage />} />
            <Route path="/challenges/:id" element={<ChallengeDetailPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
