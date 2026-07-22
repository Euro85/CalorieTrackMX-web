'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Brain, Send, Trash2, CheckCircle, Loader2,
  AlertCircle, ChevronRight, Clock, X, MessageSquare,
  ChevronDown, ChevronUp, Download, FileText, Tag, History,
} from 'lucide-react';
import { apiCall } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { loadTemplates } from '@/lib/templates';
import { loadMsgTemplates } from '@/lib/msgTemplates';
import { getPatientTags, setPatientTags, TAG_OPTIONS, TAG_COLORS } from '@/lib/tags';
import { getSentMessages, addSentMessage } from '@/lib/messageHistory';
import MacroBar from '@/components/MacroBar';
import WeekComparison from '@/components/WeekComparison';
import KcalTrendChart from '@/components/KcalTrendChart';
import KcalRing from '@/components/KcalRing';
import WeeklyBarChart from '@/components/WeeklyBarChart';
import CalendarHeatmap from '@/components/CalendarHeatmap';
import WeightTrendChart from '@/components/WeightTrendChart';
import MacroTrendChart from '@/components/MacroTrendChart';
import type { PatientFullData, DayLog } from '@/lib/types';
import type { NoteTemplate } from '@/lib/templates';
import type { SentMessage } from '@/lib/messageHistory';
import { type Indication, parseIndications, appendIndication, serializeIndications } from '@/lib/indications';

const GOAL_LABELS:     Record<string, string> = { lose: 'Bajar de peso', maintain: 'Mantenimiento', gain: 'Ganar masa' };
const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Sedentario', light: 'Ligero', moderate: 'Moderado', active: 'Activo', very_active: 'Muy activo',
};

function exportCSV(data: PatientFullData) {
  const rows: (string | number)[][] = [
    ['Fecha', 'Kcal', 'Proteína (g)', 'Carbs (g)', 'Grasas (g)'],
    ...[...data.recentLogs]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(l => [l.date, Math.round(l.totalKcal), Math.round(l.totalProteinG), Math.round(l.totalCarbsG), Math.round(l.totalFatG)]),
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${data.name.replace(/\s+/g, '_')}_historial.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const patientUserId = Number(id);

  const [data,          setData]         = useState<PatientFullData | null>(null);
  const [loading,       setLoading]      = useState(true);
  const [error,         setError]        = useState('');
  const [indications,   setIndications]  = useState<Indication[]>([]);
  const [newNote,       setNewNote]      = useState('');
  const [savingNote,    setSavingNote]   = useState(false);
  const [noteSaved,     setNoteSaved]    = useState(false);
  const [msgModal,      setMsgModal]     = useState(false);
  const [msgText,       setMsgText]      = useState('');
  const [sendingMsg,    setSendingMsg]   = useState(false);
  const [revoking,      setRevoking]     = useState(false);

  // Templates
  const [templates,     setTemplates]    = useState<NoteTemplate[]>([]);
  const [showTemplates, setShowTemplates]= useState(false);
  const [msgTemplates,  setMsgTemplates] = useState<ReturnType<typeof loadMsgTemplates>>([]);
  const [showMsgTpls,   setShowMsgTpls]  = useState(false);

  // Tags
  const [tags,          setTags]         = useState<string[]>([]);
  const [showTagEdit,   setShowTagEdit]  = useState(false);

  // Message history
  const [msgHistory,    setMsgHistory]   = useState<SentMessage[]>([]);
  const [showMsgHist,   setShowMsgHist]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await apiCall<PatientFullData>('get_patient_data', { patientUserId }, getToken()!);
      setData(result);
      setIndications(parseIndications(result.professionalNotes));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [patientUserId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    setTemplates(loadTemplates());
    setMsgTemplates(loadMsgTemplates());
    setTags(getPatientTags(patientUserId));
    setMsgHistory(getSentMessages(patientUserId));
  }, [patientUserId]);

  const handleAddIndication = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const updated = appendIndication(indications, newNote);
      const serialized = serializeIndications(updated);
      await apiCall('save_professional_notes', { patientUserId, notes: serialized }, getToken()!);
      setIndications(updated);
      setNewNote('');
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
      toast('Indicación enviada al paciente', 'success');
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Error al guardar indicación', 'error');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteIndication = async (id: string) => {
    const updated = indications.filter(i => i.id !== id);
    const serialized = serializeIndications(updated);
    try {
      await apiCall('save_professional_notes', { patientUserId, notes: serialized }, getToken()!);
      setIndications(updated);
      toast('Indicación eliminada', 'success');
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Error al eliminar indicación', 'error');
    }
  };

  const handleSendMessage = async () => {
    if (!msgText.trim()) return;
    setSendingMsg(true);
    try {
      const res = await apiCall<{ sent: boolean }>('send_direct_message', {
        patientUserId, message: msgText.trim(),
      }, getToken()!);
      addSentMessage(patientUserId, msgText.trim());
      setMsgHistory(getSentMessages(patientUserId));
      setMsgModal(false);
      setMsgText('');
      toast(res.sent ? `Mensaje enviado a ${data?.name.split(' ')[0]}` : 'Mensaje guardado (sin push)', 'success');
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Error al enviar mensaje', 'error');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm(`¿Quitar acceso a ${data?.name}? El paciente deberá generar un nuevo código.`)) return;
    setRevoking(true);
    try {
      await apiCall('revoke_professional_access', { targetUserId: patientUserId }, getToken()!);
      toast('Acceso revocado', 'success');
      router.push('/patients');
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Error al revocar acceso', 'error');
      setRevoking(false);
    }
  };

  const toggleTag = (tag: string) => {
    const next = tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag];
    setTags(next);
    setPatientTags(patientUserId, next);
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

  const p          = data.profile;
  const todayStr   = new Date().toISOString().split('T')[0];
  const todayLog   = data.recentLogs.find(l => l.date === todayStr);
  const targetKcal = p?.targetCalories ?? 0;

  const imc = (p?.weightKg && p?.heightCm)
    ? (p.weightKg / ((p.heightCm / 100) ** 2)).toFixed(1)
    : null;
  const imcCat = imc
    ? parseFloat(imc) < 18.5 ? { label: 'Bajo peso', color: 'text-blue-600' }
      : parseFloat(imc) < 25  ? { label: 'Normal',    color: 'text-green-600' }
      : parseFloat(imc) < 30  ? { label: 'Sobrepeso', color: 'text-yellow-600' }
      : { label: 'Obesidad', color: 'text-red-600' }
    : null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center gap-4 mb-4">
        <Link href="/patients" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">{data.name}</h1>
          <p className="text-sm text-gray-400">{data.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Tags toggle */}
          <button
            onClick={() => setShowTagEdit(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 text-xs font-medium transition-colors"
          >
            <Tag size={14} /> Etiquetas
          </button>
          {/* Export CSV */}
          <button
            onClick={() => exportCSV(data)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 text-xs font-medium transition-colors"
            title="Exportar historial CSV"
          >
            <Download size={14} /> CSV
          </button>
          {/* PDF print */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 text-xs font-medium transition-colors"
            title="Imprimir / guardar PDF"
          >
            <FileText size={14} /> PDF
          </button>
          <Link
            href={`/patients/${id}/ai`}
            className="flex items-center gap-2 bg-prof-600 hover:bg-prof-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Brain size={16} /> NutriIA
          </Link>
        </div>
      </div>

      {/* Tags panel */}
      {showTagEdit && (
        <div className="mb-4 bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-600 mb-2">Etiquetas del paciente</p>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  tags.includes(tag)
                    ? `${TAG_COLORS[tag] ?? 'bg-prof-100 text-prof-700'} border-transparent`
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          {tags.length > 0 && (
            <p className="text-[10px] text-gray-400 mt-2">Seleccionadas: {tags.join(', ')}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* ── Left column ── */}
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
                  <MacroBar label="Proteína"      value={todayLog.totalProteinG} goal={p?.proteinGoalG} color="#3B82F6" />
                  <MacroBar label="Carbohidratos" value={todayLog.totalCarbsG}   goal={p?.carbGoalG}    color="#F59E0B" />
                  <MacroBar label="Grasas"        value={todayLog.totalFatG}     goal={p?.fatGoalG}     color="#EF4444" />
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Sin registros hoy.</p>
            )}
          </div>

          {/* Últimos 7 días */}
          {data.recentLogs.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Calorías — últimos 7 días</h2>
              <WeeklyBarChart logs={data.recentLogs} targetKcal={targetKcal || undefined} />
              {targetKcal > 0 && <p className="text-xs text-gray-400 text-center mt-1">— Meta: {Math.round(targetKcal)} kcal</p>}
            </div>
          )}

          {/* Semana actual vs anterior */}
          {data.recentLogs.length >= 3 && (
            <WeekComparison logs={data.recentLogs} />
          )}

          {/* Tendencia calórica con proyección 7 días */}
          {data.recentLogs.length >= 5 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Tendencia calórica — proyección 7 días</h2>
              <KcalTrendChart logs={data.recentLogs} targetKcal={targetKcal || undefined} />
            </div>
          )}

          {/* Tendencia de macros */}
          {data.recentLogs.length >= 2 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">
                Tendencia de macros
                {p?.proteinGoalG && <span className="text-xs text-gray-400 font-normal ml-2">% del objetivo</span>}
              </h2>
              <MacroTrendChart logs={data.recentLogs} profile={p} />
            </div>
          )}

          {/* Calendario */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Calendario de adherencia</h2>
            <CalendarHeatmap
              logs={data.recentLogs}
              targetKcal={targetKcal || undefined}
              onDayClick={date => router.push(`/patients/${id}/day/${date}`)}
            />
          </div>

          {/* Días registrados */}
          {data.recentLogs.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Días registrados</h2>
              <div className="space-y-1">
                {([...data.recentLogs] as DayLog[]).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map(d => {
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
                        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pct >= 80 ? '#22C55E' : pct >= 50 ? '#F59E0B' : '#EF4444' }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-16 text-right">{Math.round(d.totalKcal)} kcal</span>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-prof-400 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mis indicaciones */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="font-semibold text-gray-800">Mis indicaciones</h2>
                {indications.length > 0 && (
                  <p className="text-[10px] text-gray-400">{indications.length} indicación{indications.length !== 1 ? 'es' : ''} en el historial del paciente</p>
                )}
              </div>
              <Link href={`/patients/${id}/ai`} className="flex items-center gap-1.5 text-xs text-prof-600 hover:text-prof-700 font-medium">
                <Brain size={13} /> Consultar NutriIA
              </Link>
            </div>
            <p className="text-xs text-gray-400 mb-3">Cada indicación se agrega al historial visible del paciente en su app.</p>

            {/* Plantillas */}
            {templates.length > 0 && (
              <div className="mb-3">
                <button
                  onClick={() => setShowTemplates(v => !v)}
                  className="flex items-center gap-1.5 text-xs text-prof-600 hover:text-prof-700 font-medium mb-2"
                >
                  <FileText size={13} /> Usar plantilla {showTemplates ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {showTemplates && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {templates.slice(0, 6).map(t => (
                      <button
                        key={t.id}
                        onClick={() => { setNewNote(t.content); setShowTemplates(false); }}
                        className="text-left p-2.5 rounded-xl bg-prof-50 border border-prof-100 hover:border-prof-300 transition-colors"
                      >
                        <p className="text-xs font-semibold text-prof-700 truncate">{t.title}</p>
                        <p className="text-[10px] text-prof-500 truncate">{t.content}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Compositor */}
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 resize-y focus:outline-none focus:ring-2 focus:ring-prof-400"
              placeholder={`Nueva indicación para ${data.name.split(' ')[0]}…`}
            />
            <div className="flex items-center justify-between mt-2 mb-5">
              <span className="text-xs text-gray-400">{newNote.length} caracteres</span>
              <button
                onClick={handleAddIndication}
                disabled={savingNote || !newNote.trim()}
                className="flex items-center gap-1.5 bg-prof-600 hover:bg-prof-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                {savingNote ? <Loader2 size={12} className="animate-spin" /> : noteSaved ? <CheckCircle size={12} /> : <Send size={12} />}
                {noteSaved ? 'Enviada ✓' : 'Enviar al paciente'}
              </button>
            </div>

            {/* Historial de indicaciones */}
            {indications.length > 0 && (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-xs font-medium text-gray-500">Historial de indicaciones</p>
                {indications.map((ind, idx) => (
                  <div key={ind.id} className="bg-gray-50 rounded-xl p-3 group">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-[10px] text-gray-400">
                        {ind.createdAt === new Date(0).toISOString()
                          ? 'Indicación anterior'
                          : new Date(ind.createdAt).toLocaleString('es-MX', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                        }
                        {idx === 0 && <span className="ml-1.5 text-prof-600 font-semibold">· Más reciente</span>}
                      </p>
                      <button
                        onClick={() => handleDeleteIndication(ind.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                        title="Eliminar esta indicación"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap">{ind.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-4">
          {/* Perfil */}
          {p && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Perfil</h2>
              <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                {[
                  { label: 'Edad',      value: p.age       ? `${p.age} años`  : '—' },
                  { label: 'Sexo',      value: p.sex === 'male' ? 'Masc.' : p.sex === 'female' ? 'Fem.' : p.sex ? 'Otro' : '—' },
                  { label: 'Estatura',  value: p.heightCm  ? `${p.heightCm} cm`  : '—' },
                  { label: 'Peso',      value: p.weightKg  ? `${p.weightKg} kg`  : '—' },
                  { label: 'Objetivo',  value: GOAL_LABELS[p.goal ?? ''] ?? '—' },
                  { label: 'Actividad', value: ACTIVITY_LABELS[p.activityLevel ?? ''] ?? '—' },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm font-medium text-gray-800">{item.value}</p>
                  </div>
                ))}
              </div>
              {imc && imcCat && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">IMC</p>
                  <p className="text-sm font-bold text-gray-800">
                    {imc} <span className={`font-medium text-xs ${imcCat.color}`}>— {imcCat.label}</span>
                  </p>
                </div>
              )}
              {/* Tags display */}
              {tags.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
                  {tags.map(tag => (
                    <span key={tag} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600'}`}>
                      {tag}
                    </span>
                  ))}
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
                  { label: 'Meta diaria',   value: p.targetCalories      ? `${Math.round(p.targetCalories)} kcal`      : '—' },
                  { label: 'Proteína',      value: p.proteinGoalG        ? `${Math.round(p.proteinGoalG)} g`           : '—' },
                  { label: 'Carbohidratos', value: p.carbGoalG           ? `${Math.round(p.carbGoalG)} g`              : '—' },
                  { label: 'Grasas',        value: p.fatGoalG            ? `${Math.round(p.fatGoalG)} g`               : '—' },
                ].map(m => (
                  <div key={m.label} className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{m.label}</span>
                    <span className="text-sm font-semibold text-prof-700">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tendencia de peso */}
          {data.weightLogs.length >= 2 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Tendencia de peso</h2>
              <WeightTrendChart logs={data.weightLogs} />
              {/* Latest entries */}
              <div className="mt-3 space-y-1.5">
                {[...data.weightLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).map((w, i, arr) => {
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

          {/* Acciones */}
          <div className="space-y-2">
            <button
              onClick={() => setMsgModal(true)}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-prof-700 bg-prof-50 hover:bg-prof-100 border border-prof-200 py-2.5 rounded-xl transition-colors"
            >
              <MessageSquare size={16} /> Enviar mensaje
            </button>

            {/* Message history */}
            {msgHistory.length > 0 && (
              <button
                onClick={() => setShowMsgHist(v => !v)}
                className="w-full flex items-center justify-center gap-2 text-xs font-medium text-gray-500 hover:bg-gray-50 border border-gray-200 py-2 rounded-xl transition-colors"
              >
                <History size={14} /> Historial de mensajes ({msgHistory.length}) {showMsgHist ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            )}
            {showMsgHist && (
              <div className="space-y-2">
                {msgHistory.slice(0, 5).map(m => (
                  <div key={m.id} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 mb-1">
                      {new Date(m.sentAt).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-gray-600">{m.message}</p>
                  </div>
                ))}
              </div>
            )}

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
              <h3 className="text-lg font-bold text-gray-900">Mensaje para {data.name.split(' ')[0]}</h3>
              <button onClick={() => { setMsgModal(false); setMsgText(''); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <p className="text-xs text-gray-400 mb-3">Se enviará como notificación push al paciente.</p>
            {msgTemplates.length > 0 && (
              <div className="mb-3">
                <button
                  onClick={() => setShowMsgTpls(v => !v)}
                  className="flex items-center gap-1.5 text-xs text-prof-600 hover:text-prof-700 font-medium mb-2"
                >
                  <FileText size={12} /> Usar plantilla {showMsgTpls ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>
                {showMsgTpls && (
                  <div className="grid grid-cols-2 gap-2">
                    {msgTemplates.slice(0, 4).map(t => (
                      <button
                        key={t.id}
                        onClick={() => { setMsgText(t.content); setShowMsgTpls(false); }}
                        className="text-left p-2 rounded-xl bg-prof-50 border border-prof-100 hover:border-prof-300 transition-colors"
                      >
                        <p className="text-xs font-semibold text-prof-700 truncate">{t.title}</p>
                        <p className="text-[10px] text-prof-500 truncate">{t.content}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <textarea
              value={msgText} onChange={e => setMsgText(e.target.value)}
              rows={4} maxLength={300}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-prof-400"
              placeholder="Escribe tu mensaje…"
              autoFocus
            />
            <p className="text-xs text-gray-400 text-right mb-3">{msgText.length}/300</p>
            <div className="flex gap-2">
              <button onClick={() => { setMsgModal(false); setMsgText(''); }} className="flex-1 py-2.5 rounded-xl text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Cancelar</button>
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
