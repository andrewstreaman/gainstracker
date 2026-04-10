import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/log', label: 'Log Today', icon: '📝' },
  { to: '/progress', label: 'Progress', icon: '📈' },
  { to: '/goal', label: 'Goal', icon: '🎯' },
  { to: '/challenges', label: 'Challenges', icon: '🏆' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight text-white">💪 GainsTracker</span>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm hidden sm:block">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="w-16 sm:w-52 bg-gray-800 border-r border-gray-700 flex flex-col py-4">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 sm:px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-700 text-brand-400'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-gray-100'
                }`
              }
            >
              <span className="text-lg">{icon}</span>
              <span className="hidden sm:block">{label}</span>
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 overflow-auto bg-gray-900">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
