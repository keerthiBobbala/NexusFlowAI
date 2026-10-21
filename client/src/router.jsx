import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AppShell from './components/AppShell';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import WorkspacesPage from './pages/WorkspacesPage';
import WorkspaceDetailsPage from './pages/WorkspaceDetailsPage';
import RunDetailsPage from './pages/RunDetailsPage';
import LoadingState from './components/LoadingState';
import { authApi } from './api';
import { queryKeys } from './utils/queryKeys';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

function RequireAuth() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const logout = useAuthStore((state) => state.logout);
  const sessionQuery = useQuery({
    queryKey: queryKeys.authUser,
    queryFn: authApi.me,
    enabled: Boolean(token && !user),
    retry: false
  });

  useEffect(() => {
    if (sessionQuery.data?.user) {
      setSession({ token, user: sessionQuery.data.user });
    } else if (sessionQuery.isError) {
      logout();
    }
  }, [logout, sessionQuery.data, sessionQuery.isError, setSession, token]);

  if (!token) return <Navigate to="/login" replace />;
  if (!user) {
    if (sessionQuery.isLoading) return <LoadingState label="Restoring your session…" />;
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export default function Router() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/workspaces" element={<WorkspacesPage />} />
          <Route path="/workspaces/:workspaceId" element={<WorkspaceDetailsPage />} />
          <Route path="/runs/:runId" element={<RunDetailsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
