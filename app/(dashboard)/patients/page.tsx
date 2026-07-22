'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Search, RefreshCw, UserPlus, X, Loader2,
  Activity, AlertCircle, Clock, ChevronRight, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { apiCall } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { PatientSummary } from '@/lib/types';

const GOAL_ICONS: Record<string, React.ReactNode> = {
  lose:     <TrendingDown size={12} className="text-green-500" />,
  maintain: <Minus size={12} className="text-blue-500" />,
  gain:     <TrendingUp size={12} className="text-orange-500" />,
};

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [linkModal, setLinkModal] = useState(false);
  const [linkCode, setLinkCode] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken()!;
      const data = await apiCall<{ patients: PatientSummary[] }>('get_professional_patients', {}, token);
      setPatients(data.patients ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return patients;
    const q = search.toLowerCase();
    return patients.filter(p =>
      p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    );
  }, [patients, search]);

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const activeToday = patients.filter(p => p.lastLogDate === today).length;
  const activeWeek = patients.filter(p => p.lastLogDate && p.lastLogDate >= weekAgo && p.lastLogDate < today).length;
  const inactive = patients.filter(p => !p.lastLogDate || p.lastLogDate < weekAgo).length;

  const handleLink = async () => {
    if (!linkCode.trim()) return;
    setLinking(true);
    setLinkError('');
    setLinkSuccess('');
    try {
      const token = getToken()!;
      const data = await apiCall<{ patientName: string }>('redeem_professional_code', {
        code: linkCode.toUpperCase().trim(),
        profession: 'Profesional de salud',
      }, token);
      setLinkSuccess(`¡Vinculado con ${data.patientName}!`);
      setLinkCode('');
      await load();
    } catch (e: unknown) {
      setLinkError(e instanceof Error ? e.message : 'Código inválido o vencido.');
    } finally {
      setLinking(false);
    }
  };

  const daysSince = (date?: string) => {
    if (!date) return null;
    const d = Math.floor((Date.now() - new Date(date + 'T12:00:00').getTime()) / 86400000);
    if (d === 0) return 'Hoy';
    if (d === 1) return 'Ayer';
    return `hace ${d} días`;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis pacientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{patients.length} pacientes vinculados</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
            title="Actualizar"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setLinkModal(true)}
            className="flex items-center gap-2 bg-prof-600 hover:bg-prof-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <UserPlus size={16} />
            Vincular paciente
          </button>
        </div>
      </div>

      {/* Dashboard stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Activos hoy', value: activeToday, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
          { label: 'Esta semana', value: activeWeek, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Sin actividad', value: inactive, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-100' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-xl border p-4 ${stat.bg}`}>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar paciente…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-prof-500 focus:border-transparent bg-white"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Content */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-4">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 size={24} className="animate-spin mr-2" />
          Cargando pacientes…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">{search ? 'Sin resultados para esa búsqueda' : 'Aún no tienes pacientes vinculados'}</p>
          {!search && (
            <button
              onClick={() => setLinkModal(true)}
              className="mt-4 text-prof-600 hover:text-prof-700 text-sm font-medium underline"
            >
              Vincular primer paciente
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const pct = p.targetKcal && p.todayKcal != null ? (p.todayKcal / p.targetKcal) * 100 : null;
            const lastStr = daysSince(p.lastLogDate);
            const isActiveToday = p.lastLogDate === today;

            return (
              <Link
                key={p.userId}
                href={`/patients/${p.userId}`}
                className="flex items-center gap-4 bg-white border border-gray-100 rounded-xl p-4 hover:border-prof-200 hover:shadow-sm transition-all group"
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-prof-100 flex items-center justify-center text-prof-700 font-bold text-base flex-shrink-0">
                  {p.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                    {p.profile?.goal && GOAL_ICONS[p.profile.goal]}
                    {isActiveToday && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                        <Activity size={9} />
                        Activo hoy
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{p.email}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {pct != null && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(pct, 100)}%`,
                              backgroundColor: pct >= 80 ? '#22C55E' : '#7C3AED',
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400">{Math.round(p.todayKcal ?? 0)} kcal</span>
                      </div>
                    )}
                    {lastStr && (
                      <span className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Clock size={9} />
                        {lastStr}
                      </span>
                    )}
                    {p.currentWeightKg && (
                      <span className="text-[10px] text-gray-400">{p.currentWeightKg} kg</span>
                    )}
                  </div>
                </div>

                <ChevronRight size={16} className="text-gray-300 group-hover:text-prof-400 transition-colors" />
              </Link>
            );
          })}
        </div>
      )}

      {/* Link modal */}
      {linkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Vincular paciente</h3>
              <button onClick={() => { setLinkModal(false); setLinkError(''); setLinkSuccess(''); setLinkCode(''); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Pide al paciente que genere un código de acceso en su app (Configuración → Vincular profesional).
            </p>
            <input
              type="text"
              value={linkCode}
              onChange={e => setLinkCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={8}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-prof-500 uppercase mb-3"
            />
            {linkError && <p className="text-sm text-red-600 mb-3">{linkError}</p>}
            {linkSuccess && <p className="text-sm text-green-600 mb-3">{linkSuccess}</p>}
            <button
              onClick={handleLink}
              disabled={linking || !linkCode.trim()}
              className="w-full bg-prof-600 hover:bg-prof-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {linking && <Loader2 size={15} className="animate-spin" />}
              {linking ? 'Vinculando…' : 'Vincular'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
