'use client';

import Link from 'next/link';
import { ChevronRight, Activity } from 'lucide-react';
import { TAG_COLORS } from '@/lib/tags';
import type { PatientSummary } from '@/lib/types';

interface Props {
  patients: PatientSummary[];
  tagsMap: Record<number, string[]>;
  today: string;
}

export default function PatientTable({ patients, tagsMap, today }: Props) {
  const daysSince = (date?: string) => {
    if (!date) return '—';
    const d = Math.floor((Date.now() - new Date(date + 'T12:00:00').getTime()) / 86400000);
    if (d === 0) return 'Hoy';
    if (d === 1) return 'Ayer';
    return `${d} días`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Paciente', 'Último registro', 'Kcal hoy', 'Prom. semana', 'Peso', 'Etiquetas', ''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {patients.map(p => {
              const pct     = p.targetKcal && p.todayKcal != null ? (p.todayKcal / p.targetKcal) * 100 : null;
              const wkPct   = p.targetKcal && p.weeklyAvgKcal    ? (p.weeklyAvgKcal / p.targetKcal) * 100 : null;
              const isToday = p.lastLogDate === today;
              const ptags   = tagsMap[p.userId] ?? [];

              return (
                <tr key={p.userId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-prof-100 flex items-center justify-center text-prof-700 font-bold text-sm flex-shrink-0">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                          {isToday && (
                            <span className="flex items-center gap-0.5 text-[9px] font-medium text-green-600 bg-green-50 px-1 py-0.5 rounded-full">
                              <Activity size={8} /> Hoy
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{daysSince(p.lastLogDate)}</td>
                  <td className="px-4 py-3">
                    {pct != null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pct >= 80 ? '#22C55E' : pct >= 50 ? '#F59E0B' : '#EF4444' }} />
                        </div>
                        <span className="text-xs text-gray-600 whitespace-nowrap">{Math.round(p.todayKcal ?? 0)}</span>
                      </div>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {wkPct != null ? (
                      <span className={`font-semibold ${wkPct >= 80 ? 'text-green-600' : wkPct >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {Math.round(wkPct)}%
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                    {p.currentWeightKg ? `${p.currentWeightKg} kg` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap max-w-[140px]">
                      {ptags.slice(0, 2).map(tag => (
                        <span key={tag} className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600'}`}>
                          {tag}
                        </span>
                      ))}
                      {ptags.length > 2 && <span className="text-[9px] text-gray-400">+{ptags.length - 2}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/patients/${p.userId}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={15} className="text-prof-400" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
