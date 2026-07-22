'use client';

import { useState, useMemo } from 'react';
import { Sigma } from 'lucide-react';

type Sex      = 'male' | 'female';
type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type Goal     = 'lose' | 'maintain' | 'gain';

const ACTIVITY_MULT: Record<Activity, number> = {
  sedentary:  1.2,
  light:      1.375,
  moderate:   1.55,
  active:     1.725,
  very_active: 1.9,
};

const ACTIVITY_LABELS: Record<Activity, string> = {
  sedentary:   'Sedentario (sin ejercicio)',
  light:       'Ligero (1-3 días/sem)',
  moderate:    'Moderado (3-5 días/sem)',
  active:      'Activo (6-7 días/sem)',
  very_active: 'Muy activo (2x al día)',
};

const GOAL_LABELS: Record<Goal, string> = {
  lose:     'Bajar de peso (-500 kcal)',
  maintain: 'Mantenimiento',
  gain:     'Ganar masa (+300 kcal)',
};

export default function CalculatorPage() {
  const [sex,      setSex]      = useState<Sex>('female');
  const [age,      setAge]      = useState('');
  const [weight,   setWeight]   = useState('');
  const [height,   setHeight]   = useState('');
  const [activity, setActivity] = useState<Activity>('moderate');
  const [goal,     setGoal]     = useState<Goal>('maintain');

  const results = useMemo(() => {
    const a = Number(age);
    const w = Number(weight);
    const h = Number(height);
    if (!a || !w || !h || a < 10 || a > 100 || w < 20 || w > 300 || h < 100 || h > 250) return null;

    const bmr = sex === 'male'
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161;

    const tdee   = Math.round(bmr * ACTIVITY_MULT[activity]);
    const target = goal === 'lose' ? tdee - 500 : goal === 'gain' ? tdee + 300 : tdee;
    const imc    = +(w / ((h / 100) ** 2)).toFixed(1);
    const imcCat = imc < 18.5 ? { label: 'Bajo peso', color: 'text-blue-600' }
                 : imc < 25   ? { label: 'Normal',    color: 'text-green-600' }
                 : imc < 30   ? { label: 'Sobrepeso', color: 'text-yellow-600' }
                 : { label: 'Obesidad', color: 'text-red-600' };

    const proteinG = goal === 'lose'  ? Math.round(w * 2.2)
                   : goal === 'gain'  ? Math.round(w * 2.0)
                   : Math.round(w * 1.8);
    const fatG     = Math.round((target * 0.25) / 9);
    const protKcal = proteinG * 4;
    const fatKcal  = fatG * 9;
    const carbG    = Math.round((target - protKcal - fatKcal) / 4);

    return { bmr: Math.round(bmr), tdee, target, imc, imcCat, proteinG, carbG, fatG };
  }, [sex, age, weight, height, activity, goal]);

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-prof-400 bg-white";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-prof-50 flex items-center justify-center">
          <Sigma size={18} className="text-prof-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calculadora nutricional</h1>
          <p className="text-sm text-gray-500">TDEE · IMC · Macronutrientes · Mifflin-St Jeor</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          {/* Sex */}
          <div>
            <label className={labelCls}>Sexo biológico</label>
            <div className="grid grid-cols-2 gap-2">
              {(['female', 'male'] as Sex[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSex(s)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    sex === s ? 'border-prof-500 bg-prof-50 text-prof-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {s === 'female' ? 'Femenino' : 'Masculino'}
                </button>
              ))}
            </div>
          </div>

          {/* Age / Weight / Height */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Edad (años)', key: 'age',    val: age,    set: setAge,    ph: '28' },
              { label: 'Peso (kg)',   key: 'weight', val: weight, set: setWeight, ph: '65' },
              { label: 'Talla (cm)',  key: 'height', val: height, set: setHeight, ph: '165' },
            ].map(f => (
              <div key={f.key}>
                <label className={labelCls}>{f.label}</label>
                <input
                  type="number" value={f.val} onChange={e => f.set(e.target.value)}
                  placeholder={f.ph} className={inputCls} min={0}
                />
              </div>
            ))}
          </div>

          {/* Activity */}
          <div>
            <label className={labelCls}>Nivel de actividad física</label>
            <select
              value={activity} onChange={e => setActivity(e.target.value as Activity)}
              className={inputCls}
            >
              {(Object.keys(ACTIVITY_LABELS) as Activity[]).map(k => (
                <option key={k} value={k}>{ACTIVITY_LABELS[k]}</option>
              ))}
            </select>
          </div>

          {/* Goal */}
          <div>
            <label className={labelCls}>Objetivo</label>
            <div className="space-y-2">
              {(Object.keys(GOAL_LABELS) as Goal[]).map(g => (
                <button
                  key={g}
                  onClick={() => setGoal(g)}
                  className={`w-full text-left py-2.5 px-3 rounded-xl text-sm border transition-colors ${
                    goal === g ? 'border-prof-500 bg-prof-50 text-prof-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {GOAL_LABELS[g]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          {!results ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-3">
              <Sigma size={48} strokeWidth={1} />
              <p className="text-sm">Completa los datos para ver los resultados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* IMC */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">IMC</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-gray-900">{results.imc}</p>
                  <p className={`text-sm font-semibold ${results.imcCat.color}`}>{results.imcCat.label}</p>
                </div>
              </div>

              {/* Calories */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Calorías</p>
                {[
                  { label: 'Metabolismo basal (BMR)',  value: results.bmr,    note: 'En reposo absoluto' },
                  { label: 'Gasto total (TDEE)',        value: results.tdee,   note: 'Con tu actividad' },
                  { label: 'Meta calórica diaria',      value: results.target, note: GOAL_LABELS[goal], highlight: true },
                ].map(r => (
                  <div key={r.label} className={`flex justify-between items-center ${r.highlight ? 'pt-2 border-t border-gray-100' : ''}`}>
                    <div>
                      <p className={`text-sm ${r.highlight ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{r.label}</p>
                      <p className="text-[10px] text-gray-400">{r.note}</p>
                    </div>
                    <p className={`font-bold ${r.highlight ? 'text-prof-600 text-lg' : 'text-gray-700 text-sm'}`}>
                      {r.value} <span className="text-xs font-normal text-gray-400">kcal</span>
                    </p>
                  </div>
                ))}
              </div>

              {/* Macros */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Macronutrientes sugeridos</p>
                {[
                  { label: 'Proteína',      g: results.proteinG, color: '#3B82F6', pct: Math.round((results.proteinG * 4 / results.target) * 100) },
                  { label: 'Carbohidratos', g: results.carbG,    color: '#F59E0B', pct: Math.round((results.carbG    * 4 / results.target) * 100) },
                  { label: 'Grasas',        g: results.fatG,     color: '#EF4444', pct: Math.round((results.fatG     * 9 / results.target) * 100) },
                ].map(m => (
                  <div key={m.label} className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{m.label}</span>
                      <span className="font-semibold text-gray-800">{m.g} g <span className="text-gray-400 font-normal">({m.pct}%)</span></span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-gray-400 mt-2">Basado en {results.target} kcal · proteína {goal === 'lose' ? 2.2 : goal === 'gain' ? 2.0 : 1.8}g/kg peso corporal</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
