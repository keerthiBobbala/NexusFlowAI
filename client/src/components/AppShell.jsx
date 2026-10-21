import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, FolderOpen, LayoutDashboard, Moon, Sun, Sparkles } from 'lucide-react';
import Button from './Button';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

export default function AppShell() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return (
    <div className="app-shell">
      <header className="app-header sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-teal-500 text-white shadow-md">
              <Sparkles size={19} />
            </span>
            <span>NexusFlow <span className="brand-accent">AI</span></span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <NavLink to="/" className={({ isActive }) => `nav-link rounded-lg px-3 py-2 ${isActive ? 'bg-indigo-50 text-indigo-800' : 'text-slate-700 hover:bg-slate-100'}`}>
              <span className="inline-flex items-center gap-2"><LayoutDashboard size={16} />Dashboard</span>
            </NavLink>
            <NavLink to="/workspaces" className={({ isActive }) => `nav-link rounded-lg px-3 py-2 ${isActive ? 'bg-indigo-50 text-indigo-800' : 'text-slate-700 hover:bg-slate-100'}`}>
              <span className="inline-flex items-center gap-2"><FolderOpen size={16} />Workspaces</span>
            </NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-sm text-slate-600 sm:block">{user?.name || user?.email || ''}</div>
            <Button
              variant="secondary"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              onClick={toggleTheme}
            >
              {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
              <span className="hidden sm:inline">{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <LogOut size={16} />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <Outlet />
      </main>
    </div>
  );
}
