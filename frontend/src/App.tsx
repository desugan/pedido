import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Clientes from './pages/Clientes';
import Pedidos from './pages/Pedidos';
import Pagamentos from './pages/Pagamentos';
import Relatorios from './pages/Relatorios';
import Login from './pages/Login';
import Produtos from './pages/Produtos';
import Usuarios from './pages/Usuarios';
import Fornecedores from './pages/Fornecedores';
import Lancamentos from './pages/Lancamentos';
import MudarSenha from './pages/MudarSenha';
import { authService, AUTH_CHANGED_EVENT } from './services/authService';

type HealthResponse = {
  api?: boolean;
  database?: boolean;
};

type ProtectedProps = {
  children: React.ReactNode;
  adminOnly?: boolean;
};

function ProtectedRoute({ children, adminOnly = false }: ProtectedProps): React.ReactElement {
  const user = authService.getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.id_perfil !== 1) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppContent(): React.ReactElement {
  const [user, setUser] = useState(authService.getCurrentUser());
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [apiOnline, setApiOnline] = useState(false);
  const [databaseOnline, setDatabaseOnline] = useState(false);

  useEffect(() => {
    const syncUser = () => setUser(authService.getCurrentUser());

    window.addEventListener(AUTH_CHANGED_EVENT, syncUser);
    window.addEventListener('storage', syncUser);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  // Expire session after 2 minutes of inactivity
  useEffect(() => {
    if (!user) return;

    const TIMEOUT_MS = 2 * 60 * 1000;
    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        authService.logout();
        navigate('/login', { replace: true });
      }, TIMEOUT_MS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [user, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get('q') || '');
  }, [location.search]);

  useEffect(() => {
    let active = true;

    const loadHealth = async () => {
      try {
        const response = await fetch('/api/health');
        if (!active) return;

        const data = (await response.json()) as HealthResponse;
        const apiStatus = response.ok || data.api === true;
        const dbStatus = data.database === true;

        setApiOnline(apiStatus);
        setDatabaseOnline(dbStatus);
      } catch {
        if (!active) return;
        setApiOnline(false);
        setDatabaseOnline(false);
      }
    };

    void loadHealth();
    const interval = window.setInterval(() => {
      void loadHealth();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    const params = new URLSearchParams(location.search);

    if (value.trim()) {
      params.set('q', value);
    } else {
      params.delete('q');
    }

    const queryString = params.toString();
    navigate(`${location.pathname}${queryString ? `?${queryString}` : ''}`, { replace: true });
  };

  const shouldShowSearch = user && location.pathname !== '/mudar-senha';
  const connectionLevel = !apiOnline && !databaseOnline
    ? 'offline'
    : apiOnline && databaseOnline
      ? 'online'
      : 'partial';

  const connectionColorClass = connectionLevel === 'online'
    ? 'bg-emerald-500'
    : connectionLevel === 'partial'
      ? 'bg-amber-500'
      : 'bg-red-500';
  const appVersion = 'V1.3';
  const monthYear = `${new Date().getMonth() + 1}/${new Date().getFullYear()}`;

  return (
    <div className="min-h-screen">
      {user && (
        <nav className="sticky top-0 z-30 border-b border-slate-200/80 bg-slate-100/95 backdrop-blur-md">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 shadow flex items-center justify-center text-2xl select-none">🍺</div>
                  <div>
                    <h1 className="text-[28px] md:text-[30px] font-black text-emerald-600 leading-none tracking-tight">BUTECO TI</h1>
                    <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-400 shadow-sm">
                      <span>{appVersion} | {monthYear}</span>
                      <span
                        className={`inline-flex h-2.5 w-2.5 rounded-full ${connectionColorClass}`}
                        aria-label="status"
                      />
                    </div>
                  </div>
                </div>
                {shouldShowSearch && (
                  <div className="app-search hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 min-w-[320px] lg:min-w-[420px]">
                    <span className="text-slate-400">⌕</span>
                    <input
                      className="app-search-input w-full border-0 p-0 text-sm bg-transparent"
                      placeholder="Pesquisar nesta página..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                    Usuario ativo: {user.usuario}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link to="/pedidos" className="app-chip">Pedidos</Link>
                  <Link to="/pagamentos" className="app-chip">Pagamentos</Link>
                  {user.id_perfil === 1 && (
                    <Link to="/clientes" className="app-chip">Clientes</Link>
                  )}
                  {user.id_perfil === 1 && (
                    <Link to="/produtos" className="app-chip">Produtos</Link>
                  )}
                  {user.id_perfil === 1 && (
                    <Link to="/fornecedores" className="app-chip">Fornecedores</Link>
                  )}
                  {user.id_perfil === 1 && (
                    <Link to="/usuarios" className="app-chip">Usuarios</Link>
                  )}
                  <Link to="/relatorios" className="app-chip">Relatorios</Link>
                  {user.id_perfil === 1 && (
                    <Link to="/lancamentos" className="app-chip">Lancamentos</Link>
                  )}
                  <Link to="/mudar-senha" className="app-chip">Mudar Senha</Link>
                  <button
                    type="button"
                    className="app-chip app-chip-danger"
                    onClick={() => {
                      authService.logout();
                      window.location.href = '/login';
                    }}
                  >
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className="max-w-[1500px] mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/pedidos" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <ProtectedRoute adminOnly>
                <Clientes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/produtos"
            element={
              <ProtectedRoute adminOnly>
                <Produtos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fornecedores"
            element={
              <ProtectedRoute adminOnly>
                <Fornecedores />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute adminOnly>
                <Usuarios />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pedidos"
            element={
              <ProtectedRoute>
                <Pedidos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meus-pedidos"
            element={
              <ProtectedRoute>
                <Navigate to="/pedidos" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pagamentos"
            element={
              <ProtectedRoute>
                <Pagamentos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meus-pagamentos"
            element={
              <ProtectedRoute>
                <Navigate to="/pagamentos" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lancamentos"
            element={
              <ProtectedRoute adminOnly>
                <Lancamentos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mudar-senha"
            element={
              <ProtectedRoute>
                <MudarSenha />
              </ProtectedRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <ProtectedRoute>
                <Relatorios />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to={user ? '/pedidos' : '/login'} replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App(): React.ReactElement {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
