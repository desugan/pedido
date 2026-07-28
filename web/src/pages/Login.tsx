import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      await authService.login(usuario, senha);
      navigate('/');
    } catch (err) {
      setError('Usuário ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/70 bg-white/90 p-7 shadow-xl backdrop-blur-sm">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Buteco do TI</p>
          <h1 className="text-3xl font-bold mt-1 text-slate-900">Acessar sistema</h1>
          <p className="text-sm text-slate-600 mt-1">Entre com seu usuario e senha para continuar.</p>
        </div>

        {error && <div className="text-red-600 mb-3 rounded-md bg-red-50 px-3 py-2">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full border rounded-lg p-3"
            placeholder="Usuário"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            maxLength={255}
            required
          />
          <input
            className="w-full border rounded-lg p-3"
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            maxLength={255}
            required
          />
          <button className="w-full bg-blue-600 text-white rounded-lg p-3 font-semibold" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
