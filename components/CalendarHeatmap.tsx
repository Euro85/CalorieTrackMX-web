'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DayLog } from '@/lib/types';

interface Props {
  logs: DayLog[];
  targetKcal?: number;
  onDayClick?: (date: string) => void;
}

const DAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

function adherenceColor(kcal: number, target: number): string {
  const pct = kcal / target;
  if (pct >= 0.8) return '#22C55E';
  if (pct >= 0.5) return '#F59E0B';
  return '#EF4444';
}

export default function CalendarHeatmap({ logs, targetKcal, onDayClick }: Props) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const year = month.getFullYear();
  const mon = month.getMonth();
  const monthStr = month.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, mon, 1).getDay();
  const daysCount = new Date(year, mon + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const kcalMap = new Map<string, number>(
    logs.map(l => [l.date, l.totalKcal])
  );

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ];

  const prevMonth = () => setMonth(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; });
  const nextMonth = () => {
    const next = new Date(month);
    next.setMonth(next.getMonth() + 1);
    if (next <= new Date()) setMonth(next);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft size={18} className="text-gray-500" />
        </button>
        <span className="text-sm font-semibold text-gray-700 capitalize">{monthStr}</span>
        <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronRight size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const dateStr = `${year}-${String(mon + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const kcal = kcalMap.get(dateStr);
          const isToday = dateStr === today;
          const isFuture = dateStr > today;
          const color = kcal != null && targetKcal ? adherenceColor(kcal, targetKcal) : undefined;

          return (
            <button
              key={day}
              disabled={isFuture}
              onClick={() => !isFuture && onDayClick?.(dateStr)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-colors relative
                ${isFuture ? 'opacity-30 cursor-default' : 'cursor-pointer hover:ring-2 hover:ring-prof-300'}
                ${isToday ? 'ring-2 ring-prof-500' : ''}
              `}
              style={color && !isToday ? { backgroundColor: color + '30' } : undefined}
            >
              <span className={`font-medium ${isToday ? 'text-prof-700 font-bold' : 'text-gray-700'}`}>
                {day}
              </span>
              {kcal != null && (
                <div
                  className="w-1.5 h-1.5 rounded-full mt-0.5"
                  style={{ backgroundColor: color ?? '#9CA3AF' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-1">
        {[{ color: '#22C55E', label: '≥80%' }, { color: '#F59E0B', label: '50–79%' }, { color: '#EF4444', label: '<50%' }].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
            <span>{l.label} meta</span>
          </div>
        ))}
      </div>
    </div>
  );
}
