'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Brain, Send, Trash2, Save, CheckCircle, Loader2,
  AlertCircle, ChevronLeft, ChevronRight, Clock, X, MessageSquare, ChevronDown, ChevronUp
} from 'lucide-react';
import { apiCall } from '@/lib/api';
import { getToken } from '@/lib/auth';
import MacroBar from '@/components/MacroBar';
import KcalRing from '@/components/KcalRing';
import WeeklyBarChart from '@/components/WeeklyBarChart';
import CalendarHeatmap from '@/components/CalendarHeatmap';
import type { PatientFullData, DayLog } from '@/lib/types';

const GOAL_LABELS: Record<string, string> = {
  lose: 'Bajar de peso', maintain: 'Mantenimiento', gain: 'Ganar masa',
};
const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Sedentario', light: 'Ligero', moderate: 'Moderado',
  active: 'Activo', very_active: 'Muy activo',
};

interface NoteHistoryItem {
  id: number;
  content: string;
  savedAt: string;
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const patientUserId = Number(id);

  const [data, setData] = useState<PatientFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [noteHistory, setNoteHistory] = useState<NoteHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [msgModal, setMsgModal] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgSent, setMsgSent] = useState('');
  const [revoking, setRevoking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken()!;
      const result = await apiCall<PatientFullData>('get_patient_data', { patientUserId }, token);
      setData(result);
      setNotes(result.professionalNotes ?? '');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [patientUserId]);

  useEffect(() => { load(); }, [load]);

  // Note history from localStorage
  const noteHistoryKey = `ctmx_notes_history_${patientUserId}`;
  const loadNoteHistory = () => {
    try {
      const raw = localStorage.getItem(noteHistoryKey);
      return raw ? JSON.parse(raw) as NoteHistoryItem[] : [];
    } catch { return []; }
  };
  const saveNoteHistory = (content: string) => {
    const prev = loadNoteHistory();
    const next: NoteHistoryItem[] = [
      { id: Date.now(), content, savedAt: new Date().toISOString() },
      ...prev.slice(0, 19),
    ];
    localStorage.setItem(noteHistoryKey, JSON.stringify(next));
    setNoteHistory(next);
  };

  useEffect(() => { setNoteHistory(loadNoteHistory()); }, [patientUserId]);

  const handleSaveNotes = async () => {
    if (!notes.trim()) return;
    setSavingNotes(true);
    try {
      await apiCall('save_professional_notes', { patientUserId, notes }, getToken()!);
      saveNoteHistory(notes);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error al guardar notas');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSendMessage = async () => {
    if (!msgText.trim()) return;
    setSendingMsg(true);
    setMsgSent('');
    try {
      const res = await apiCall<{ sent: boolean }>('send_direct_message', {
        patientUserId, message: msgText.trim(),
      }, getToken()!);
      setMsgSent(res.sent ? `Mensaje enviado a ${data?.name.split(' ')[0]}` : 'Mensaje guardado (sin notificación push)');
      setMsgText('');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error al enviar mensaje');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm(`¿Quitar acceso a ${data?.name}? El paciente deberá generar un nuevo código.`)) return;
    setRevoking(true);
    try {
      await apiCall('revoke_professional_access', { targetUserId: patientUserId }, getToken()!);
      router.push('/patients');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error al revocar acceso');
      setRevoking(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full text-gray-400 gap-2">
      <Loader2 size={22} className="animate-spin" /> Cargando datos del paciente…
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
      <AlertCircle size={32} className="text-red-400" />
      <p className="text-sm">{error || 'Sin datos'}</p>
      <button onClick={load} className="text-prof-600 text-sm underline">Reintentar</button>
    </div>
  );

  const p = data.profile;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = data.recentLogs.find(l => l.date === todayStr);
  const targetKcal = p?.targetCalories ?? 0;

  const imc = (p?.weightKg && p?.heightCm)
    ? (p.weightKg / ((p.heightCm / 100) ** 2)).toFixed(1)
    : null;

  const imcCategory = imc
    ? parseFloat(imc) < 18.5 ? { label: 'Bajo peso', color: 'text-blue-600' }
      : parseFloat(imc) < 25 ? { label: 'Normal', color: 'text-green-600' }
      : parseFloat(imc) < 30 ? { label: 'Sobrepeso', color: 'text-yellow-600' }
      : { label: 'Obesidad', color: 'text-red-600' }
    : null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/patients" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{data.name}</h1>
          <p className="text-sm text-gray-400">{data.email}</p>
        </div>
        <Link
          href={`/patients/${id}/ai`}
          className="flex items-center gap-2 bg-prof-600 hover:bg-prof-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Brain size={16} />
          Consultar NutriIA
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left column */}
        <div className="col-span-2 space-y-4">

          {/* Hoy */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">
              Hoy — {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            {todayLog ? (
              <div className="flex gap-5 items-start">
                <KcalRing consumed={todayLog.totalKcal} target={targetKcal} size={88} />
                <div className="flex-1 space-y-2.5">
                  <MacroBar label="Proteína" value={todayLog.totalProteinG} goal={p?.proteinGoalG} color="#3B82F6" />
                  <MacroBar label="Carbohidratos" value={todayLog.totalCarbsG} goal={p?.carbGoalG} color="#F59E0B" />
                  <MacroBar label="Grasas" value={todayLog.totalFatG} goal={p?.fatGoalG} color="#EF4444" />
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Sin registros hoy.</p>
            )}
          </div>

          {/* Historial 7 días */}
          {data.recentLogs.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Últimos 7 días</h2>
              <WeeklyBarChart logs={data.recentLogs} targetKcal={targetKcal || undefined} />
              {targetKcal > 0 && (
                <p className="text-xs text-gray-400 text-center mt-1">— Meta: {Math.round(targetKcal)} kcal</p>
              )}
            </div>
          )}

          {/* Días registrados */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Calendario de adherencia</h2>
            <CalendarHeatmap
              logs={data.recentLogs}
              targetKcal={targetKcal || undefined}
              onDayClick={date => router.push(`/patients/${id}/day/${date}`)}
            />
          </div>

          {/* Días con registros */}
          {data.recentLogs.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Días registrados</h2>
              <div className="space-y-1">
                {[...data.recentLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map(d => {
                  const pct = targetKcal > 0 ? (d.totalKcal / targetKcal) * 100 : 0;
                  return (
                    <Link
                      key={d.date}
                      href={`/patients/${id}/day/${d.date}`}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-24 text-xs text-gray-500">
                        {new Date(d.date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </div>
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: pct >= 80 ? '#22C55E' : pct >= 50 ? '#F59E0B' : '#EF4444',
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-16 text-right">{Math.round(d.totalKcal)} kcal</span>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-prof-400 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notas + historial */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">Mis indicaciones</h2>
              <Link
                href={`/patients/${id}/ai`}
                className="flex items-center gap-1.5 text-xs text-prof-600 hover:text-prof-700 font-medium"
              >
                <Brain size={13} />
                Consultar NutriIA
              </Link>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Estas notas se envían como contexto a la IA del paciente: plan, restricciones, objetivos específicos.
            </p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={5}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 resize-y focus:outline-none focus:ring-2 focus:ring-prof-400"
              placeholder={`Ej: Paciente en fase de volumen, entrena 4 días/sem. Priorizar proteína ≥${p?.proteinGoalG ? Math.round(p.proteinGoalG) : 150}g/día.`}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">{notes.length} caracteres</span>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes || !notes.trim()}
                className="flex items-center gap-1.5 bg-prof-600 hover:bg-prof-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                {savingNotes ? <Loader2 size={12} className="animate-spin" /> : notesSaved ? <CheckCircle size={12} /> : <Save size={12} />}
                {notesSaved ? 'Guardado' : 'Guardar indicaciones'}
              </button>
            </div>

            {/* Historial de notas */}
            {noteHistory.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <button
                  onClick={() => setShowHistory(v => !v)}
                  className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-700"
                >
                  <Clock size={13} />
                  Historial de indicaciones ({noteHistory.length})
                  {showHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                {showHistory && (
                  <div className="mt-3 space-y-3">
                    {noteHistory.slice(0, 5).map(n => (
                      <div key={n.id} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] text-gray-400 mb-1">
                          {new Date(n.savedAt).toLocaleString('es-MX', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-3">{n.content}</p>
                        <button
                          onClick={() => { setNotes(n.content); setShowHistory(false); }}
                          className="mt-1.5 text-[10px] text-prof-600 hover:text-prof-700 font-medium"
                        >
                          Usar esta nota
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Perfil */}
          {p && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Perfil</h2>
              <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                {[
                  { label: 'Edad', value: p.age ? `${p.age} años` : '—' },
                  { label: 'Sexo', value: p.sex === 'male' ? 'Masc.' : p.sex === 'female' ? 'Fem.' : p.sex ? 'Otro' : '—' },
                  { label: 'Estatura', value: p.heightCm ? `${p.heightCm} cm` : '—' },
                  { label: 'Peso', value: p.weightKg ? `${p.weightKg} kg` : '—' },
                  { label: 'Objetivo', value: GOAL_LABELS[p.goal ?? ''] ?? '—' },
                  { label: 'Actividad', value: ACTIVITY_LABELS[p.activityLevel ?? ''] ?? '—' },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm font-medium text-gray-800">{item.value}</p>
                  </div>
                ))}
              </div>
              {imc && imcCategory && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">IMC</p>
                  <p className="text-sm font-bold text-gray-800">
                    {imc} <span className={`font-medium text-xs ${imcCategory.color}`}>— {imcCategory.label}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Metas nutricionales */}
          {p && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Metas nutricionales</h2>
              <div className="space-y-2.5">
                {[
                  { label: 'Mantenimiento', value: p.maintenanceCalories ? `${Math.round(p.maintenanceCalories)} kcal` : '—' },
                  { label: 'Meta diaria', value: p.targetCalories ? `${Math.round(p.targetCalories)} kcal` : '—' },
                  { label: 'Proteína meta', value: p.proteinGoalG ? `${Math.round(p.proteinGoalG)} g` : '—' },
                  { label: 'Carbohidratos', value: p.carbGoalG ? `${Math.round(p.carbGoalG)} g` : '—' },
                  { label: 'Grasas', value: p.fatGoalG ? `${Math.round(p.fatGoalG)} g` : '—' },
                ].map(m => (
                  <div key={m.label} className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{m.label}</span>
                    <span className="text-sm font-semibold text-prof-700">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plan de comidas */}
          {data.mealPlans.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Plan de comidas</h2>
              <div className="space-y-2">
                {data.mealPlans.map(mp => (
                  <div key={mp.id} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-prof-400" />
                    <span className="text-sm text-gray-700 flex-1">{mp.name}</span>
                    {mp.time && <span className="text-[10px] text-gray-400">{mp.time}</span>}
                    <span className="text-xs font-medium text-prof-600">{Math.round(mp.targetKcal)} kcal</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historial de peso */}
          {data.weightLogs.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Historial de peso</h2>
              <div className="space-y-2">
                {[...data.weightLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map((w, i, arr) => {
                  const prev = arr[i + 1];
                  const diff = prev ? +(w.weightKg - prev.weightKg).toFixed(1) : null;
                  return (
                    <div key={w.id} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(w.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-gray-800">{w.weightKg} kg</span>
                        {diff != null && diff !== 0 && (
                          <span className={`text-[10px] font-medium ${diff > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                            {diff > 0 ? '↑' : '↓'}{Math.abs(diff)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="space-y-2">
            <button
              onClick={() => setMsgModal(true)}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-prof-700 bg-prof-50 hover:bg-prof-100 border border-prof-200 py-2.5 rounded-xl transition-colors"
            >
              <MessageSquare size={16} />
              Enviar mensaje
            </button>
            <button
              onClick={handleRevoke}
              disabled={revoking}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 py-2.5 rounded-xl transition-colors"
            >
              {revoking ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              Eliminar acceso
            </button>
          </div>
        </div>
      </div>

      {/* Message modal */}
      {msgModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Mensaje para {data.name.split(' ')[0]}</h3>
              <button onClick={() => { setMsgModal(false); setMsgSent(''); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <p className="text-xs text-gray-400 mb-3">Se enviará como notificación push al paciente.</p>
            <textarea
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              rows={4}
              maxLength={300}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-prof-400"
              placeholder="Escribe tu mensaje…"
              autoFocus
            />
            <p className="text-xs text-gray-400 text-right mb-3">{msgText.length}/300</p>
            {msgSent && <p className="text-sm text-green-600 mb-3">{msgSent}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setMsgModal(false); setMsgSent(''); }} className="flex-1 py-2.5 rounded-xl text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Cancelar</button>
              <button
                onClick={handleSendMessage}
                disabled={sendingMsg || !msgText.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-prof-600 hover:bg-prof-700 disabled:opacity-50 transition-colors"
              >
                {sendingMsg ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
