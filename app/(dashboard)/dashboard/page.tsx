'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Users, AlertTriangle, TrendingUp, Activity, RefreshCw,
  ChevronRight, Loader2, AlertCircle,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { apiCall } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { PatientSummary } from '@/lib/types';

export default function DashboardPage() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const today   = new Date().toISOString().split('T')[0];
  const d3ago   = new Date(Date.now() - 3  * 86400000).toISOString().split('T')[0];
  const d7ago   = new Date(Date.now() - 7  * 86400000).toISOString().split('T')[0];
  const d14ago  = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall<{ patients: PatientSummary[] }>('get_professional_patients', {}, getToken()!);
      setPatients(data.patients ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeToday  = patients.filter(p => p.lastLogDate === today);
  const activeWeek   = patients.filter(p => p.lastLogDate && p.lastLogDate >= d7ago && p.lastLogDate < today);
  const alert3       = patients.filter(p => !p.lastLogDate || p.lastLogDate < d3ago);
  const critical7    = patients.filter(p => !p.lastLogDate || p.lastLogDate < d7ago);
  const never        = patients.filter(p => !p.lastLogDate);

  const avgCompliance = (() => {
    const with7 = patients.filter(p => p.weeklyAvgKcal && p.targetKcal);
    if (!with7.length) return null;
    return with7.reduce((s, p) => s + (p.weeklyAvgKcal! / p.targetKcal!) * 100, 0) / with7.length;
  })();

  const adherenceDist = [
    { label: '≥80%',   count: patients.filter(p => p.weeklyAvgKcal && p.targetKcal && (p.weeklyAvgKcal / p.targetKcal) >= 0.8).length, color: '#22C55E' },
    { label: '50-79%', count: patients.filter(p => p.weeklyAvgKcal && p.targetKcal && (p.weeklyAvgKcal / p.targetKcal) >= 0.5 && (p.weeklyAvgKcal / p.targetKcal) < 0.8).length, color: '#F59E0B' },
    { label: '<50%',   count: patients.filter(p => p.weeklyAvgKcal && p.targetKcal && (p.weeklyAvgKcal / p.targetKcal) < 0.5).length, color: '#EF4444' },
    { label: 'Sin datos', count: patients.filter(p => !p.weeklyAvgKcal || !p.targetKcal).length, color: '#D1D5DB' },
  ];

  const topCompliers = [...patients]
    .filter(p => p.weeklyAvgKcal && p.targetKcal)
    .sort((a, b) => (b.weeklyAvgKcal! / b.targetKcal!) - (a.weeklyAvgKcal! / a.targetKcal!))
    .slice(0, 5);

  const inactiveSorted = [...alert3]
    .sort((a, b) => (a.lastLogDate ?? '').localeCompare(b.lastLogDate ?? ''));

  if (loading) return (
    <div className="flex items-center justify-center h-full text-gray-400 gap-2">
      <Loader2 size={22} className="animate-spin" /> Cargando dashboard…
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
      <AlertCircle size={32} className="text-red-400" />
      <p className="text-sm">{error}</p>
      <button onClick={load} className="text-prof-600 text-sm underline">Reintentar</button>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard global</h1>
          <p className="text-sm text-gray-500 mt-0.5">{patients.length} pacientes · {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total pacientes',   value: patients.length,     icon: Users,         color: 'text-prof-600',  bg: 'bg-prof-50 border-prof-100' },
          { label: 'Activos hoy',       value: activeToday.length,  icon: Activity,      color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
          { label: 'Activos esta sem.', value: activeWeek.length,   icon: TrendingUp,    color: 'text-blue-600',  bg: 'bg-blue-50 border-blue-100' },
          { label: 'Requieren atención',value: alert3.length,       icon: AlertTriangle, color: 'text-orange-600',bg: 'bg-orange-50 border-orange-100' },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border p-4 ${k.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <k.icon size={16} className={k.color} />
              <p className="text-xs text-gray-500">{k.label}</p>
            </div>
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Adherencia promedio */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center justify-center">
          <p className="text-xs text-gray-400 mb-2">Adherencia promedio semanal</p>
          {avgCompliance != null ? (
            <>
              <p className={`text-4xl font-bold ${avgCompliance >= 80 ? 'text-green-600' : avgCompliance >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                {Math.round(avgCompliance)}%
              </p>
              <p className="text-xs text-gray-400 mt-1">de la meta calórica</p>
            </>
          ) : <p className="text-sm text-gray-400">Sin datos suficientes</p>}
        </div>

        {/* Distribución adherencia */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-semibold text-gray-800 mb-3">Distribución de adherencia semanal</p>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={adherenceDist} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip formatter={(v: number) => [`${v} pacientes`, '']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {adherenceDist.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Alertas */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-orange-500" />
            <h2 className="font-semibold text-gray-800">Pacientes que requieren atención</h2>
          </div>
          {inactiveSorted.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">¡Todos los pacientes están activos!</p>
          ) : (
            <div className="space-y-2">
              {inactiveSorted.slice(0, 8).map(p => {
                const daysAgo = p.lastLogDate
                  ? Math.floor((Date.now() - new Date(p.lastLogDate + 'T12:00:00').getTime()) / 86400000)
                  : null;
                const severity = !daysAgo || daysAgo > 7
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : daysAgo > 4
                  ? 'border-orange-200 bg-orange-50 text-orange-700'
                  : 'border-yellow-200 bg-yellow-50 text-yellow-700';
                return (
                  <Link
                    key={p.userId}
                    href={`/patients/${p.userId}`}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${severity} hover:shadow-sm transition-shadow`}
                  >
                    <span className="font-semibold truncate">{p.name}</span>
                    <span className="ml-2 flex-shrink-0">
                      {daysAgo == null ? 'Nunca registró' : `${daysAgo}d sin actividad`}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Top performers */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-green-500" />
            <h2 className="font-semibold text-gray-800">Mayor cumplimiento esta semana</h2>
          </div>
          {topCompliers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin datos de adherencia</p>
          ) : (
            <div className="space-y-3">
              {topCompliers.map((p, i) => {
                const pct = Math.round((p.weeklyAvgKcal! / p.targetKcal!) * 100);
                return (
                  <Link key={p.userId} href={`/patients/${p.userId}`} className="flex items-center gap-3 group">
                    <span className="w-5 text-xs font-bold text-gray-400">#{i + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-prof-100 flex items-center justify-center text-prof-700 font-bold text-xs flex-shrink-0">
                      {p.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-prof-600">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-green-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-green-600">{pct}%</span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-prof-400 transition-colors" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
