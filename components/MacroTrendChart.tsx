'use client';

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, CartesianGrid, ReferenceLine,
} from 'recharts';
import type { DayLog, UserProfile } from '@/lib/types';

interface Props {
  logs: DayLog[];
  profile?: UserProfile;
}

export default function MacroTrendChart({ logs, profile }: Props) {
  const showPct = !!(profile?.proteinGoalG && profile?.carbGoalG && profile?.fatGoalG);

  const data = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map(l => ({
      date: new Date(l.date + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
      Proteína: showPct
        ? Math.round((l.totalProteinG / profile!.proteinGoalG!) * 100)
        : Math.round(l.totalProteinG),
      Carbs: showPct
        ? Math.round((l.totalCarbsG / profile!.carbGoalG!) * 100)
        : Math.round(l.totalCarbsG),
      Grasas: showPct
        ? Math.round((l.totalFatG / profile!.fatGoalG!) * 100)
        : Math.round(l.totalFatG),
    }));

  if (data.length < 2) return null;

  return (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} tickFormatter={v => showPct ? `${v}%` : `${v}g`} />
        <Tooltip
          formatter={(v: number, name: string) => [showPct ? `${v}%` : `${v}g`, name]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
        />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
        {showPct && <ReferenceLine y={100} stroke="#E5E7EB" strokeDasharray="4 4" />}
        <Line type="monotone" dataKey="Proteína" stroke="#3B82F6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Carbs"    stroke="#F59E0B" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Grasas"   stroke="#EF4444" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
