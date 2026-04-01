import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const MudarSenha: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setErro('Usuário não autenticado');
      return;
    }

    try {
      setLoading(true);
      setErro(null);
      setSucesso(null);

      await authService.alterarSenha(senhaAtual, novaSenha, confirmarSenha);
      setSucesso('Senha alterada com sucesso. Faça login novamente.');

      setTimeout(() => {
        authService.logout();
        navigate('/login');
      }, 1500);
    } catch {
      setErro('Não foi possível alterar a senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <h1 className="text-3xl font-bold mb-4">Mudar Senha</h1>
      {erro && <div className="text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-3">{erro}</div>}
      {sucesso && <div className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 mb-3">{sucesso}</div>}

      <form onSubmit={submit} className="bg-white p-5 rounded-2xl shadow space-y-3 border border-slate-100">
        <input
          className="w-full border rounded-xl p-2.5"
          type="password"
          placeholder="Senha atual"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
          required
        />
        <input
          className="w-full border rounded-xl p-2.5"
          type="password"
          placeholder="Nova senha"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          required
        />
        <input
          className="w-full border rounded-xl p-2.5"
          type="password"
          placeholder="Confirmar nova senha"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          required
        />

        <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-2.5 w-full font-semibold" type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Alterar senha'}
        </button>
      </form>
    </div>
  );
};

export default MudarSenha;
