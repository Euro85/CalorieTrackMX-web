'use client';

import {
  ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Legend,
} from 'recharts';
import type { DayLog } from '@/lib/types';

interface Props {
  logs: DayLog[];
  targetKcal?: number;
}

function linReg(pts: { x: number; y: number }[]) {
  const n = pts.length;
  if (n < 3) return null;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  const num = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
  const den = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  if (den === 0) return null;
  const slope = num / den;
  return { slope, intercept: my - slope * mx };
}

export default function KcalTrendChart({ logs, targetKcal }: Props) {
  const sorted = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-21);

  if (sorted.length < 3) return null;

  const points = sorted.map((l, i) => ({ x: i, y: l.totalKcal }));
  const reg = linReg(points);

  const actual = sorted.map((l, i) => ({
    date: new Date(l.date + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
    real: Math.round(l.totalKcal),
    tendencia: reg ? Math.max(0, Math.round(reg.slope * i + reg.intercept)) : undefined,
    proyeccion: undefined as number | undefined,
  }));

  // Project 7 days forward
  if (reg) {
    const n = sorted.length;
    for (let i = 1; i <= 7; i++) {
      const projDate = new Date(sorted[n - 1].date + 'T12:00:00');
      projDate.setDate(projDate.getDate() + i);
      actual.push({
        date: projDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
        real: undefined as unknown as number,
        tendencia: undefined,
        proyeccion: Math.max(0, Math.round(reg.slope * (n - 1 + i) + reg.intercept)),
      });
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="font-semibold text-gray-800 mb-1">Tendencia calórica + proyección 7 días</h2>
      <p className="text-xs text-gray-400 mb-3">Basada en regresión lineal de los últimos {sorted.length} días</p>
      <ResponsiveContainer width="100%" height={170}>
        <ComposedChart data={actual} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9CA3AF' }} tickLine={false} axisLine={false} interval={2} />
          <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}`} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
            formatter={(v: number, name: string) => [`${v} kcal`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {targetKcal && (
            <ReferenceLine y={targetKcal} stroke="#22C55E" strokeDasharray="4 4"
              label={{ value: 'Meta', fontSize: 10, fill: '#22C55E', position: 'insideTopRight' }} />
          )}
          <Line type="monotone" dataKey="real"       name="Real"       stroke="#7C3AED" strokeWidth={2} dot={false} connectNulls={false} />
          <Line type="monotone" dataKey="tendencia"  name="Tendencia"  stroke="#A78BFA" strokeWidth={1.5} dot={false} strokeDasharray="4 2" connectNulls />
          <Line type="monotone" dataKey="proyeccion" name="Proyección" stroke="#F59E0B" strokeWidth={1.5} dot={{ r: 3, fill: '#F59E0B' }} strokeDasharray="5 3" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
