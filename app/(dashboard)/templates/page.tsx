'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Save, X } from 'lucide-react';
import { loadTemplates, saveTemplate, deleteTemplate } from '@/lib/templates';
import { useToast } from '@/components/Toast';
import type { NoteTemplate } from '@/lib/templates';

export default function TemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [newTitle,  setNewTitle]  = useState('');
  const [newBody,   setNewBody]   = useState('');
  const [adding,    setAdding]    = useState(false);

  useEffect(() => { setTemplates(loadTemplates()); }, []);

  const handleSave = () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    saveTemplate(newTitle, newBody);
    setTemplates(loadTemplates());
    setNewTitle('');
    setNewBody('');
    setAdding(false);
    toast('Plantilla guardada', 'success');
  };

  const handleDelete = (id: string) => {
    deleteTemplate(id);
    setTemplates(loadTemplates());
    toast('Plantilla eliminada', 'info');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plantillas de indicaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">Guarda textos frecuentes para reutilizarlos rápidamente</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 bg-prof-600 hover:bg-prof-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={16} /> Nueva plantilla
        </button>
      </div>

      {/* New template form */}
      {adding && (
        <div className="bg-white rounded-2xl border border-prof-200 p-5 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Nueva plantilla</h3>
            <button onClick={() => setAdding(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Título (ej: Fase de volumen)"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-prof-400"
          />
          <textarea
            value={newBody}
            onChange={e => setNewBody(e.target.value)}
            rows={5}
            placeholder="Contenido de la plantilla…"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-y mb-3 focus:outline-none focus:ring-2 focus:ring-prof-400"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="px-4 py-2 rounded-xl text-sm text-gray-600 bg-gray-100 hover:bg-gray-200">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!newTitle.trim() || !newBody.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-prof-600 hover:bg-prof-700 disabled:opacity-50 transition-colors"
            >
              <Save size={14} /> Guardar
            </button>
          </div>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay plantillas guardadas.</p>
          <button onClick={() => setAdding(true)} className="mt-3 text-prof-600 text-sm font-medium underline hover:text-prof-700">
            Crear primera plantilla
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map(t => (
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
                  onClick={() => handleDelete(t.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 transition-all flex-shrink-0"
                  title="Eliminar plantilla"
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
