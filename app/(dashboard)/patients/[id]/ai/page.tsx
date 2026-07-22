'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, Trash2, Brain, AlertCircle, Settings } from 'lucide-react';
import { apiCall } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { streamChat, loadAISettings } from '@/lib/aiService';
import { buildPatientSystemPrompt } from '@/lib/buildAIPrompt';
import ChatBubble from '@/components/ChatBubble';
import type { PatientFullData, ChatMessage } from '@/lib/types';

const INITIAL_GREETING = (name: string) =>
  `Hola, estoy aquí para ayudarte a analizar el caso de **${name}**. Puedo revisar su adherencia calórica, sugerir ajustes al plan, interpretar su historial de peso, o responder cualquier pregunta nutricional. ¿En qué quieres enfocarnos?`;

export default function PatientAIPage() {
  const { id } = useParams<{ id: string }>();
  const patientUserId = Number(id);

  const [patient, setPatient] = useState<PatientFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [aiError, setAiError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const systemPrompt = patient ? buildPatientSystemPrompt(patient) : '';

  const load = useCallback(async () => {
    try {
      const result = await apiCall<PatientFullData>('get_patient_data', { patientUserId }, getToken()!);
      setPatient(result);
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: INITIAL_GREETING(result.name),
      }]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos del paciente');
    } finally {
      setLoading(false);
    }
  }, [patientUserId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || !patient) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text };
    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '' }]);
    setInput('');
    setSending(true);
    setAiError('');

    const settings = loadAISettings();
    let fullText = '';

    await streamChat(
      [...messages, userMsg],
      systemPrompt,
      settings,
      (chunk) => {
        fullText += chunk;
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m)
        );
      },
      () => { setSending(false); },
      (err) => {
        setAiError(err);
        setMessages(prev => prev.filter(m => m.id !== assistantId));
        setSending(false);
      },
    );
  }, [input, sending, patient, messages, systemPrompt]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const QUICK_PROMPTS = [
    'Analiza su adherencia calórica esta semana',
    '¿Está cumpliendo su meta de proteína?',
    'Sugiere ajustes a su plan actual',
    'Evalúa su progreso de peso',
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-full text-gray-400 gap-2">
      <Loader2 size={22} className="animate-spin" /> Cargando contexto del paciente…
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
      <AlertCircle size={32} className="text-red-400" />
      <p className="text-sm">{error}</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-white">
        <Link href={`/patients/${id}`} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="w-8 h-8 rounded-full bg-prof-100 flex items-center justify-center">
          <Brain size={16} className="text-prof-700" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">NutriIA</p>
          <p className="text-xs text-gray-400">Consultando sobre {patient?.name}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Link href="/settings" className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors" title="Configurar API Key">
            <Settings size={16} />
          </Link>
          <button
            onClick={() => patient && setMessages([{ id: 'greeting', role: 'assistant', content: INITIAL_GREETING(patient.name) }])}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
            title="Limpiar conversación"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Context badge */}
      <div className="px-6 py-2 bg-prof-50 border-b border-prof-100">
        <p className="text-xs text-prof-600">
          <span className="font-semibold">Contexto activo:</span>{' '}
          {patient?.name} · {patient?.recentLogs.length} días de historial · {patient?.weightLogs.length} registros de peso
          {patient?.professionalNotes ? ' · Con indicaciones tuyas' : ''}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map(msg => (
          msg.content || msg.role === 'user' ? (
            <ChatBubble key={msg.id} message={msg} />
          ) : (
            <div key={msg.id} className="flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 size={15} className="animate-spin" />
              <span>NutriIA pensando…</span>
            </div>
          )
        ))}

        {aiError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{aiError}</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 2 && (
        <div className="px-6 pb-2 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map(q => (
            <button
              key={q}
              onClick={() => { setInput(q); textareaRef.current?.focus(); }}
              className="text-xs px-3 py-1.5 rounded-full border border-prof-200 text-prof-600 hover:bg-prof-50 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-100 bg-white">
        <div className="flex items-end gap-3 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-3 focus-within:border-prof-400 focus-within:ring-1 focus-within:ring-prof-300 transition">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-gray-800 focus:outline-none max-h-32 leading-relaxed"
            placeholder="Pregunta sobre el paciente… (Enter para enviar)"
            style={{ minHeight: '24px' }}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-prof-600 hover:bg-prof-700 disabled:opacity-40 text-white transition-colors flex-shrink-0"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          Shift+Enter para nueva línea · Enter para enviar
        </p>
      </div>
    </div>
  );
}
