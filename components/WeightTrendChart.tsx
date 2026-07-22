'use client';

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid,
} from 'recharts';
import type { WeightLog } from '@/lib/types';

interface Props {
  logs: WeightLog[];
  targetWeight?: number;
}

export default function WeightTrendChart({ logs, targetWeight }: Props) {
  const data = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-12)
    .map(l => ({
      date: new Date(l.date + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
      peso: l.weightKg,
    }));

  if (data.length < 2) return (
    <p className="text-xs text-gray-400 text-center py-3">Pocos registros para mostrar tendencia.</p>
  );

  const weights = data.map(d => d.peso);
  const min = Math.floor(Math.min(...weights) - 0.5);
  const max = Math.ceil(Math.max(...weights) + 0.5);

  return (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
        <YAxis domain={[min, max]} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}kg`} />
        <Tooltip
          formatter={(v: number) => [`${v} kg`, 'Peso']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
        />
        {targetWeight && (
          <ReferenceLine
            y={targetWeight}
            stroke="#22C55E"
            strokeDasharray="4 4"
            label={{ value: `Meta ${targetWeight}kg`, fontSize: 10, fill: '#22C55E', position: 'insideTopLeft' }}
          />
        )}
        <Line type="monotone" dataKey="peso" stroke="#7C3AED" strokeWidth={2} dot={{ fill: '#7C3AED', r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
