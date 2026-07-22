'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, MessageSquare, Save, X } from 'lucide-react';
import { loadTemplates, saveTemplate, deleteTemplate } from '@/lib/templates';
import { loadMsgTemplates, saveMsgTemplate, deleteMsgTemplate } from '@/lib/msgTemplates';
import { useToast } from '@/components/Toast';
import type { NoteTemplate } from '@/lib/templates';
import type { MessageTemplate } from '@/lib/msgTemplates';

type Tab = 'notes' | 'messages';

function TemplateForm({ onSave, onCancel, placeholder }: { onSave: (t: string, c: string) => void; onCancel: () => void; placeholder: string }) {
  const [title, setTitle] = useState('');
  const [body,  setBody]  = useState('');
  return (
    <div className="bg-white rounded-2xl border border-prof-200 p-5 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Nueva plantilla</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
      </div>
      <input
        type="text" value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Título (ej: Semana de descarga)"
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-prof-400"
      />
      <textarea
        value={body} onChange={e => setBody(e.target.value)} rows={4}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-y mb-3 focus:outline-none focus:ring-2 focus:ring-prof-400"
      />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm text-gray-600 bg-gray-100 hover:bg-gray-200">Cancelar</button>
        <button
          onClick={() => { if (title.trim() && body.trim()) onSave(title, body); }}
          disabled={!title.trim() || !body.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-prof-600 hover:bg-prof-700 disabled:opacity-50 transition-colors"
        >
          <Save size={14} /> Guardar
        </button>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const { toast } = useToast();
  const [tab,       setTab]       = useState<Tab>('notes');
  const [notes,     setNotes]     = useState<NoteTemplate[]>([]);
  const [msgs,      setMsgs]      = useState<MessageTemplate[]>([]);
  const [addingN,   setAddingN]   = useState(false);
  const [addingM,   setAddingM]   = useState(false);

  useEffect(() => { setNotes(loadTemplates()); setMsgs(loadMsgTemplates()); }, []);

  const handleSaveNote = (t: string, c: string) => {
    saveTemplate(t, c); setNotes(loadTemplates()); setAddingN(false); toast('Plantilla de indicaciones guardada', 'success');
  };
  const handleSaveMsg = (t: string, c: string) => {
    saveMsgTemplate(t, c); setMsgs(loadMsgTemplates()); setAddingM(false); toast('Plantilla de mensaje guardada', 'success');
  };
  const handleDeleteNote = (id: string) => {
    deleteTemplate(id); setNotes(loadTemplates()); toast('Plantilla eliminada', 'info');
  };
  const handleDeleteMsg = (id: string) => {
    deleteMsgTemplate(id); setMsgs(loadMsgTemplates()); toast('Plantilla eliminada', 'info');
  };

  const isNotes = tab === 'notes';
  const list    = isNotes ? notes : msgs;
  const isEmpty = list.length === 0;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plantillas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Indicaciones y mensajes reutilizables</p>
        </div>
        <button
          onClick={() => isNotes ? setAddingN(true) : setAddingM(true)}
          className="flex items-center gap-2 bg-prof-600 hover:bg-prof-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={16} /> Nueva plantilla
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5">
        <button
          onClick={() => setTab('notes')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'notes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText size={15} /> Indicaciones ({notes.length})
        </button>
        <button
          onClick={() => setTab('messages')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'messages' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageSquare size={15} /> Mensajes ({msgs.length})
        </button>
      </div>

      {/* Form */}
      {isNotes && addingN && (
        <TemplateForm
          placeholder="Ej: Paciente en fase de volumen. Priorizar proteína ≥150g/día…"
          onSave={handleSaveNote}
          onCancel={() => setAddingN(false)}
        />
      )}
      {!isNotes && addingM && (
        <TemplateForm
          placeholder="Ej: Hola, recuerda registrar tu alimentación de hoy…"
          onSave={handleSaveMsg}
          onCancel={() => setAddingM(false)}
        />
      )}

      {/* List */}
      {isEmpty ? (
        <div className="text-center py-16 text-gray-400">
          {isNotes ? <FileText size={40} className="mx-auto mb-3 opacity-30" /> : <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />}
          <p className="text-sm">No hay plantillas de {isNotes ? 'indicaciones' : 'mensajes'} guardadas.</p>
          <button
            onClick={() => isNotes ? setAddingN(true) : setAddingM(true)}
            className="mt-3 text-prof-600 text-sm font-medium underline hover:text-prof-700"
          >
            Crear primera plantilla
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(t => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-5 group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{t.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(t.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">{t.content}</p>
                </div>
                <button
                  onClick={() => isNotes ? handleDeleteNote(t.id) : handleDeleteMsg(t.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 transition-all flex-shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
