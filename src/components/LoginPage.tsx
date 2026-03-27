import { useState } from 'react';
import { api } from '@/lib/api';
import { type User } from '@/lib/auth';

interface Props {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(login, password);
      if (res.error) {
        setError(res.error);
      } else {
        onLogin(res);
      }
    } catch {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#1a1a1a] rounded-xl mb-5">
            <span className="text-white text-xl">Ж</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#1a1a1a] tracking-tight">Электронный журнал</h1>
          <p className="text-sm text-[#888] mt-1">Введите данные для входа</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[#e8e8e8] rounded-2xl p-8 shadow-sm">
          <div className="mb-5">
            <label className="block text-xs font-medium text-[#555] mb-2 uppercase tracking-wide">Логин</label>
            <input
              type="text"
              value={login}
              onChange={e => setLogin(e.target.value)}
              className="w-full border border-[#e0e0e0] rounded-lg px-4 py-3 text-[#1a1a1a] text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors bg-[#fafafa]"
              placeholder="Введите логин"
              autoComplete="username"
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-medium text-[#555] mb-2 uppercase tracking-wide">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-[#e0e0e0] rounded-lg px-4 py-3 text-[#1a1a1a] text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors bg-[#fafafa]"
              placeholder="Введите пароль"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1a1a1a] text-white rounded-lg py-3 text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
          >
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
