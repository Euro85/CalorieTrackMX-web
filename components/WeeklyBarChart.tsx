'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import type { DayLog } from '@/lib/types';

interface Props {
  logs: DayLog[];
  targetKcal?: number;
}

const DAY_SHORT: Record<number, string> = { 0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb' };

export default function WeeklyBarChart({ logs, targetKcal }: Props) {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date)).slice(-7);

  const data = sorted.map(d => {
    const date = new Date(d.date + 'T12:00:00');
    return {
      label: DAY_SHORT[date.getDay()],
      kcal: Math.round(d.totalKcal),
      date: d.date,
    };
  });

  const max = Math.max(...data.map(d => d.kcal), targetKcal ?? 0) * 1.15;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, max]} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v: number) => [`${v} kcal`, '']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
            labelStyle={{ fontWeight: 600 }}
            cursor={{ fill: '#F3F4F6' }}
          />
          {targetKcal && (
            <ReferenceLine y={targetKcal} stroke="#7C3AED" strokeDasharray="4 2" strokeOpacity={0.6} />
          )}
          <Bar dataKey="kcal" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.date}
                fill={entry.date === today ? '#7C3AED' : '#C4B5FD'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
