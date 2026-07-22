'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Users, Search, RefreshCw, UserPlus, X, AlertCircle,
  Clock, ChevronRight, TrendingUp, TrendingDown, Minus, Activity, Tag, LayoutGrid, List, Send,
} from 'lucide-react';
import { apiCall } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { loadAllTagsMap, TAG_COLORS } from '@/lib/tags';
import { daysSinceIndication } from '@/lib/indicationTracker';
import { PatientCardSkeleton } from '@/components/Skeleton';
import PatientTable from '@/components/PatientTable';
import type { PatientSummary } from '@/lib/types';

const GOAL_ICONS: Record<string, React.ReactNode> = {
  lose:     <TrendingDown size={12} className="text-green-500" />,
  maintain: <Minus        size={12} className="text-blue-500" />,
  gain:     <TrendingUp   size={12} className="text-orange-500" />,
};

type FilterType = 'all' | 'today' | 'week' | 'inactive';
type SortBy     = 'lastActivity' | 'name' | 'kcalPct';

export default function PatientsPage() {
  const [patients,    setPatients]    = useState<PatientSummary[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState<FilterType>('all');
  const [sortBy,      setSortBy]      = useState<SortBy>('lastActivity');
  const [tagsMap,     setTagsMap]     = useState<Record<number, string[]>>({});
  const [viewMode,    setViewMode]    = useState<'cards' | 'table'>('cards');
  const [linkModal,   setLinkModal]   = useState(false);
  const [linkCode,    setLinkCode]    = useState('');
  const [linking,     setLinking]     = useState(false);
  const [linkError,   setLinkError]   = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');

  const today   = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiCall<{ patients: PatientSummary[] }>('get_professional_patients', {}, getToken()!);
      setPatients(data.patients ?? []);
      setTagsMap(loadAllTagsMap());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [load]);

  const displayed = useMemo(() => {
    let list = [...patients];
    if (filter === 'today')    list = list.filter(p => p.lastLogDate === today);
    else if (filter === 'week')     list = list.filter(p => p.lastLogDate && p.lastLogDate >= weekAgo && p.lastLogDate < today);
    else if (filter === 'inactive') list = list.filter(p => !p.lastLogDate || p.lastLogDate < weekAgo);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'kcalPct') {
        const pA = a.targetKcal && a.todayKcal != null ? a.todayKcal / a.targetKcal : 0;
        const pB = b.targetKcal && b.todayKcal != null ? b.todayKcal / b.targetKcal : 0;
        return pB - pA;
      }
      return (b.lastLogDate ?? '').localeCompare(a.lastLogDate ?? '');
    });
    return list;
  }, [patients, filter, search, sortBy, today, weekAgo]);

  const activeToday = patients.filter(p => p.lastLogDate === today).length;
  const activeWeek  = patients.filter(p => p.lastLogDate && p.lastLogDate >= weekAgo && p.lastLogDate < today).length;
  const inactive    = patients.filter(p => !p.lastLogDate || p.lastLogDate < weekAgo).length;

  const handleLink = async () => {
    if (!linkCode.trim()) return;
    setLinking(true); setLinkError(''); setLinkSuccess('');
    try {
      const data = await apiCall<{ patientName: string }>('redeem_professional_code', {
        code: linkCode.toUpperCase().trim(), profession: 'Profesional de salud',
      }, getToken()!);
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

  const FILTERS: { key: FilterType; label: string; count: number }[] = [
    { key: 'all',      label: 'Todos',         count: patients.length },
    { key: 'today',    label: 'Activos hoy',   count: activeToday },
    { key: 'week',     label: 'Esta semana',   count: activeWeek },
    { key: 'inactive', label: 'Sin actividad', count: inactive },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis pacientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{patients.length} pacientes · actualización automática cada 5 min</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 transition-colors ${viewMode === 'cards' ? 'bg-prof-50 text-prof-600' : 'text-gray-400 hover:bg-gray-50'}`}
              title="Vista tarjetas"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-prof-50 text-prof-600' : 'text-gray-400 hover:bg-gray-50'}`}
              title="Vista tabla"
            >
              <List size={16} />
            </button>
          </div>
          <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors" title="Actualizar">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setLinkModal(true)}
            className="flex items-center gap-2 bg-prof-600 hover:bg-prof-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <UserPlus size={16} /> Vincular paciente
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Activos hoy',   value: activeToday, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
          { label: 'Esta semana',   value: activeWeek,  color: 'text-blue-600',  bg: 'bg-blue-50 border-blue-100' },
          { label: 'Sin actividad', value: inactive,    color: 'text-gray-500',  bg: 'bg-gray-50 border-gray-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f.key ? 'bg-prof-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label} {f.count > 0 && <span className="opacity-70">({f.count})</span>}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar paciente…"
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-prof-500 bg-white"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
        <select
          value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-prof-500 bg-white"
        >
          <option value="lastActivity">Última actividad</option>
          <option value="name">Nombre A–Z</option>
          <option value="kcalPct">Cumplimiento kcal</option>
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-4">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <PatientCardSkeleton key={i} />)}</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">{search || filter !== 'all' ? 'Sin resultados para ese filtro' : 'Aún no tienes pacientes vinculados'}</p>
          {!search && filter === 'all' && (
            <button onClick={() => setLinkModal(true)} className="mt-4 text-prof-600 hover:text-prof-700 text-sm font-medium underline">
              Vincular primer paciente
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <PatientTable patients={displayed} tagsMap={tagsMap} today={today} />
      ) : (
        <div className="space-y-2">
          {displayed.map(p => {
            const pct     = p.targetKcal && p.todayKcal != null ? (p.todayKcal / p.targetKcal) * 100 : null;
            const lastStr = daysSince(p.lastLogDate);
            const isToday = p.lastLogDate === today;
            const ptags   = tagsMap[p.userId] ?? [];

            return (
              <Link
                key={p.userId}
                href={`/patients/${p.userId}`}
                className="flex items-center gap-4 bg-white border border-gray-100 rounded-xl p-4 hover:border-prof-200 hover:shadow-sm transition-all group"
              >
                <div className="w-11 h-11 rounded-full bg-prof-100 flex items-center justify-center text-prof-700 font-bold text-base flex-shrink-0">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                    {p.profile?.goal && GOAL_ICONS[p.profile.goal]}
                    {isToday && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                        <Activity size={9} /> Activo hoy
                      </span>
                    )}
                    {ptags.slice(0, 2).map(tag => (
                      <span key={tag} className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{p.email}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {(() => {
                      const days = daysSinceIndication(p.userId);
                      if (days === null) return null;
                      if (days === 0) return (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-prof-600 bg-prof-50 px-1.5 py-0.5 rounded-full">
                          <Send size={9} /> Ind. hoy
                        </span>
                      );
                      if (days <= 7) return (
                        <span className="text-[10px] text-prof-500">Ind. hace {days}d</span>
                      );
                      return (
                        <span className="text-[10px] text-orange-500">Ind. hace {days}d</span>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {pct != null && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pct >= 80 ? '#22C55E' : '#7C3AED' }} />
                        </div>
                        <span className="text-[10px] text-gray-400">{Math.round(p.todayKcal ?? 0)} kcal</span>
                      </div>
                    )}
                    {lastStr && <span className="flex items-center gap-1 text-[10px] text-gray-400"><Clock size={9} /> {lastStr}</span>}
                    {p.currentWeightKg && <span className="text-[10px] text-gray-400">{p.currentWeightKg} kg</span>}
                    {ptags.length > 2 && <span className="flex items-center gap-1 text-[10px] text-gray-400"><Tag size={9} /> +{ptags.length - 2}</span>}
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
            <p className="text-sm text-gray-500 mb-4">Pide al paciente que genere un código en su app (Configuración → Vincular profesional).</p>
            <input
              type="text" value={linkCode} onChange={e => setLinkCode(e.target.value.toUpperCase())}
              placeholder="ABC123" maxLength={8}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-prof-500 uppercase mb-3"
            />
            {linkError   && <p className="text-sm text-red-600 mb-3">{linkError}</p>}
            {linkSuccess && <p className="text-sm text-green-600 mb-3">{linkSuccess}</p>}
            <button
              onClick={handleLink} disabled={linking || !linkCode.trim()}
              className="w-full bg-prof-600 hover:bg-prof-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {linking && <RefreshCw size={15} className="animate-spin" />}
              {linking ? 'Vinculando…' : 'Vincular'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
