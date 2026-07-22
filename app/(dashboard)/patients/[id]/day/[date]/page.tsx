'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle, Utensils } from 'lucide-react';
import { apiCall } from '@/lib/api';
import { getToken } from '@/lib/auth';
import MacroBar from '@/components/MacroBar';
import KcalRing from '@/components/KcalRing';
import type { PatientFullData } from '@/lib/types';

export default function PatientDayDetailPage() {
  const { id, date } = useParams<{ id: string; date: string }>();
  const patientUserId = Number(id);

  const [data, setData] = useState<PatientFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiCall<PatientFullData>('get_patient_data', { patientUserId }, getToken()!);
      setData(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [patientUserId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center h-full text-gray-400 gap-2">
      <Loader2 size={22} className="animate-spin" /> Cargando…
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
      <AlertCircle size={32} className="text-red-400" />
      <p className="text-sm">{error || 'Sin datos'}</p>
    </div>
  );

  const dayLog = data.recentLogs.find(l => l.date === date);
  const p = data.profile;
  const targetKcal = p?.targetCalories ?? 0;

  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  // Group items by meal plan
  const byMeal = new Map<string, NonNullable<typeof dayLog>['items']>();
  dayLog?.items.forEach(item => {
    const key = item.mealPlanName ?? 'Sin categoría';
    const existing = byMeal.get(key) ?? [];
    existing.push(item);
    byMeal.set(key, existing);
  });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/patients/${id}`} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900 capitalize">{displayDate}</h1>
          <p className="text-sm text-gray-400">{data.name}</p>
        </div>
      </div>

      {!dayLog ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <Utensils size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm">Sin registros para este día.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Resumen */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Resumen del día</h2>
            <div className="flex gap-5 items-start">
              <KcalRing consumed={dayLog.totalKcal} target={targetKcal} size={96} />
              <div className="flex-1 space-y-2.5">
                <MacroBar label="Proteína" value={dayLog.totalProteinG} goal={p?.proteinGoalG} color="#3B82F6" />
                <MacroBar label="Carbohidratos" value={dayLog.totalCarbsG} goal={p?.carbGoalG} color="#F59E0B" />
                <MacroBar label="Grasas" value={dayLog.totalFatG} goal={p?.fatGoalG} color="#EF4444" />
              </div>
            </div>
            {targetKcal > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Meta calórica</span>
                  <span className="font-semibold">{Math.round((dayLog.totalKcal / targetKcal) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min((dayLog.totalKcal / targetKcal) * 100, 100)}%`,
                      backgroundColor: dayLog.totalKcal > targetKcal ? '#EF4444' : '#7C3AED',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Items por comida */}
          {Array.from(byMeal.entries()).map(([mealName, items]) => (
            <div key={mealName} className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Utensils size={15} className="text-prof-400" />
                {mealName}
              </h3>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm text-gray-800">{item.foodName}</p>
                      <p className="text-xs text-gray-400">{item.servings} porción{item.servings !== 1 ? 'es' : ''} · P: {Math.round(item.proteinG)}g</p>
                    </div>
                    <span className="text-sm font-semibold text-prof-600">{Math.round(item.kcal)} kcal</span>
                  </div>
                ))}
                <div className="flex justify-between pt-1">
                  <span className="text-xs text-gray-400 font-medium">Total {mealName}</span>
                  <span className="text-xs font-bold text-gray-700">
                    {Math.round(items.reduce((s, i) => s + i.kcal, 0))} kcal
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
