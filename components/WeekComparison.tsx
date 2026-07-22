'use client';

import type { DayLog } from '@/lib/types';

interface Props {
  logs: DayLog[];
  targetKcal?: number;
}

function getWeekRange(offsetWeeks = 0) {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // Mon=0 … Sun=6
  const mon = new Date(now);
  mon.setDate(now.getDate() - dow + offsetWeeks * 7);
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    start: mon.toISOString().split('T')[0],
    end:   sun.toISOString().split('T')[0],
  };
}

function weekStats(logs: DayLog[], start: string, end: string) {
  const week = logs.filter(l => l.date >= start && l.date <= end);
  if (!week.length) return null;
  const days  = week.length;
  const kcal  = week.reduce((s, l) => s + l.totalKcal,    0) / days;
  const prot  = week.reduce((s, l) => s + l.totalProteinG,0) / days;
  const carbs = week.reduce((s, l) => s + l.totalCarbsG,  0) / days;
  const fat   = week.reduce((s, l) => s + l.totalFatG,    0) / days;
  return { days, kcal, prot, carbs, fat };
}

export default function WeekComparison({ logs, targetKcal }: Props) {
  const thisWeek = getWeekRange(0);
  const lastWeek = getWeekRange(-1);
  const cur  = weekStats(logs, thisWeek.start, thisWeek.end);
  const prev = weekStats(logs, lastWeek.start, lastWeek.end);

  if (!cur && !prev) return null;

  const delta = (a?: number, b?: number) => {
    if (a == null || b == null || b === 0) return null;
    return ((a - b) / b) * 100;
  };

  const DeltaBadge = ({ val }: { val: number | null }) => {
    if (val == null) return <span className="text-gray-300 text-[10px]">—</span>;
    const up = val >= 0;
    return (
      <span className={`text-[10px] font-semibold ${up ? 'text-green-500' : 'text-red-400'}`}>
        {up ? '↑' : '↓'}{Math.abs(val).toFixed(0)}%
      </span>
    );
  };

  const rows = [
    { label: 'Kcal promedio', cur: cur?.kcal,  prev: prev?.kcal,  fmt: (v: number) => `${Math.round(v)} kcal`, isKcal: true },
    { label: 'Proteína',      cur: cur?.prot,  prev: prev?.prot,  fmt: (v: number) => `${Math.round(v)} g` },
    { label: 'Carbohidratos', cur: cur?.carbs, prev: prev?.carbs, fmt: (v: number) => `${Math.round(v)} g` },
    { label: 'Grasas',        cur: cur?.fat,   prev: prev?.fat,   fmt: (v: number) => `${Math.round(v)} g` },
    { label: 'Días registrados', cur: cur?.days, prev: prev?.days, fmt: (v: number) => `${v} días` },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="font-semibold text-gray-800 mb-4">Esta semana vs. semana anterior</h2>
      <div className="grid grid-cols-3 gap-2 mb-3 text-xs font-semibold text-gray-400">
        <span>Métrica</span>
        <span className="text-center">Esta semana</span>
        <span className="text-center">Semana anterior</span>
      </div>
      <div className="space-y-2">
        {rows.map(r => (
          <div key={r.label} className="grid grid-cols-3 gap-2 py-2 border-b border-gray-50 last:border-0 items-center">
            <span className="text-xs text-gray-500">{r.label}</span>
            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold text-gray-800">
                {r.cur != null ? r.fmt(r.cur) : '—'}
              </span>
              {r.isKcal && targetKcal && r.cur != null && (
                <span className="text-[10px] text-gray-400">{Math.round((r.cur / targetKcal) * 100)}% meta</span>
              )}
              <DeltaBadge val={delta(r.cur, r.prev)} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-400">
                {r.prev != null ? r.fmt(r.prev) : '—'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
