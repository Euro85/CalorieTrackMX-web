'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { apiCall } from '@/lib/api';
import { saveSession, getToken } from '@/lib/auth';
import type { User } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (getToken()) router.replace('/patients');
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiCall<{ token: string; user: User }>('login', {
        email: email.trim().toLowerCase(),
        password,
      });
      if (data.user.role !== 'professional' && data.user.role !== 'admin') {
        setError('Esta cuenta no tiene acceso al portal profesional.');
        return;
      }
      saveSession(data.token, data.user);
      router.push('/patients');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-prof-900 via-prof-800 to-prof-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-white/10 backdrop-blur items-center justify-center mb-4">
            <BarChart2 size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">CalorieTrack MX</h1>
          <p className="text-prof-200 text-sm mt-1">Portal para profesionales de la salud</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Iniciar sesión</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-prof-500 focus:border-transparent transition"
                placeholder="profesional@ejemplo.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-prof-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-prof-600 hover:bg-prof-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Iniciando sesión…' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Necesitas una cuenta con rol <span className="font-medium text-prof-600">profesional</span> en la app móvil.
          </p>
        </div>
      </div>
    </div>
  );
}
