import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usuarioService, Usuario, Perfil, CreateUsuarioData } from '../services/usuarioService';
import { clienteService } from '../services/clienteService';
import { Cliente } from '../types';
import api from '../services/api';

interface LoginLogEntry {
  timestamp: string;
  usuario: string;
  status: 'success' | 'failed';
  reason: string;
  id_usuario?: number;
  ip?: string;
}

const Usuarios: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateUsuarioData>({ id_cliente: 0, id_perfil: 0, usuario: '', senha: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [loginLog, setLoginLog] = useState<LoginLogEntry[]>([]);
  const [showLog, setShowLog] = useState(false);
  const query = (searchParams.get('q') || '').trim().toLowerCase();
  const filteredUsuarios = usuarios.filter((usuario) => {
    if (!query) return true;
    return [
      String(usuario.id_usuario),
      usuario.usuario,
      String(usuario.id_cliente),
      String(usuario.id_perfil),
      usuario.cliente_nome || '',
      usuario.perfil_nome || '',
    ].some((value) => value.toLowerCase().includes(query));
  });

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredUsuarios.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pagedUsuarios = filteredUsuarios.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const load = async () => {
    try {
      const [u, p, c] = await Promise.all([
        usuarioService.getAll(),
        usuarioService.getPerfis(),
        clienteService.getAllClientes(),
      ]);
      setUsuarios(u);
      setPerfis(p);
      setClientes(c);
      setCurrentPage(1);
      setErro(null);
    } catch {
      setErro('Erro ao carregar dados de usuários');
    }
  };

  const loadLoginLog = async () => {
    try {
      const res = await api.get('/api/auth/login-log');
      setLoginLog(res.data);
      setShowLog(true);
    } catch {
      setErro('Erro ao carregar log de login');
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        const updatePayload: Partial<CreateUsuarioData> = {
          id_cliente: form.id_cliente,
          id_perfil: form.id_perfil,
          usuario: form.usuario,
        };

        if (form.senha.trim()) {
          updatePayload.senha = form.senha;
        }

        await usuarioService.update(editId, updatePayload);
      } else {
        if (!form.senha.trim()) {
          setErro('Senha é obrigatória para novo usuário');
          return;
        }

        await usuarioService.create(form);
      }
      setForm({ id_cliente: 0, id_perfil: 0, usuario: '', senha: '' });
      setEditId(null);
      await load();
    } catch (err: any) {
      setErro(err?.response?.data?.error || 'Erro ao salvar usuário');
    }
  };

  const editar = (u: Usuario) => {
    setEditId(u.id_usuario);
    setForm({ id_cliente: u.id_cliente, id_perfil: u.id_perfil, usuario: u.usuario, senha: '' });
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Usuários</h1>
      {erro && <div className="text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-3">{erro}</div>}

      <form onSubmit={submit} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6 grid grid-cols-1 md:grid-cols-4 gap-2">
        <input className="border rounded-xl p-2" placeholder="Usuário" value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} required />
        <input
          className="border rounded-xl p-2"
          type="password"
          placeholder={editId ? 'Nova senha (opcional)' : 'Senha'}
          value={form.senha}
          onChange={(e) => setForm({ ...form, senha: e.target.value })}
          required={!editId}
        />

        <select className="border rounded-xl p-2" value={form.id_cliente} onChange={(e) => setForm({ ...form, id_cliente: Number(e.target.value) })} required>
          <option value={0}>Selecione cliente</option>
          {clientes.map((c) => (
            <option key={c.id_cliente} value={c.id_cliente}>{c.nome}</option>
          ))}
        </select>

        <select className="border rounded-xl p-2" value={form.id_perfil} onChange={(e) => setForm({ ...form, id_perfil: Number(e.target.value) })} required>
          <option value={0}>Selecione perfil</option>
          {perfis.map((p) => (
            <option key={p.id_perfil} value={p.id_perfil}>{p.perfil}</option>
          ))}
        </select>

        <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-2 md:col-span-4 font-semibold" type="submit">{editId ? 'Atualizar' : 'Salvar'}</button>
      </form>

      <div className="bg-white rounded-2xl shadow overflow-x-auto border border-slate-100">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Usuário</th>
              <th className="px-4 py-2 text-left">Cliente</th>
              <th className="px-4 py-2 text-left">Perfil</th>
              <th className="px-4 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pagedUsuarios.map((u) => (
              <tr key={u.id_usuario} className="border-t">
                <td className="px-4 py-2">{u.id_usuario}</td>
                <td className="px-4 py-2">{u.usuario}</td>
                <td className="px-4 py-2">{u.cliente_nome || u.id_cliente}</td>
                <td className="px-4 py-2">{u.perfil_nome || u.id_perfil}</td>
                <td className="px-4 py-2 space-x-2">
                  <button className="bg-green-600 hover:bg-green-600 text-white px-3 py-1 rounded-lg font-semibold" onClick={() => editar(u)}>Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="page-indicator-card text-sm font-medium">Página {currentPage} de {totalPages}</p>
        <div className="space-x-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl border bg-white disabled:opacity-50 font-semibold"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl border bg-white disabled:opacity-50 font-semibold"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima
          </button>
        </div>
      </div>

      {/* Login Log Section */}
      <div className="mt-8">
        <button
          type="button"
          className="bg-green-600 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-semibold mb-4"
          onClick={() => showLog ? setShowLog(false) : loadLoginLog()}
        >
          {showLog ? 'Ocultar Log de Login' : 'Ver Log de Tentativas de Login'}
        </button>

        {showLog && (
          <div className="bg-white rounded-2xl shadow border border-slate-100 overflow-x-auto">
            <div className="px-5 py-3 border-b font-semibold text-slate-700 flex items-center gap-3">
              Log de Tentativas de Login
              <button type="button" className="ml-auto text-xs text-blue-600 hover:underline" onClick={loadLoginLog}>Atualizar</button>
            </div>
            {loginLog.length === 0 ? (
              <div className="px-5 py-4 text-slate-400 text-sm">Nenhuma tentativa registrada ainda.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Data/Hora</th>
                    <th className="px-4 py-2 text-left">Usuário</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Motivo</th>
                    <th className="px-4 py-2 text-left">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {loginLog.map((entry, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">{new Date(entry.timestamp).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-2 font-mono font-semibold">{entry.usuario}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${entry.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {entry.status === 'success' ? 'SUCESSO' : 'FALHOU'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-600">{entry.reason}</td>
                      <td className="px-4 py-2 text-xs text-slate-400">{entry.ip || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Usuarios;
