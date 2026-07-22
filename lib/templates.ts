export interface NoteTemplate {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

const KEY = 'ctmx_note_templates';

export function loadTemplates(): NoteTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as NoteTemplate[]) : [];
  } catch { return []; }
}

export function saveTemplate(title: string, content: string): NoteTemplate {
  const t: NoteTemplate = {
    id: Date.now().toString(),
    title: title.trim(),
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify([t, ...loadTemplates()]));
  return t;
}

export function deleteTemplate(id: string) {
  localStorage.setItem(KEY, JSON.stringify(loadTemplates().filter(t => t.id !== id)));
}
