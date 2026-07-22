export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

const KEY = 'ctmx_msg_templates';

export function loadMsgTemplates(): MessageTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MessageTemplate[]) : [];
  } catch { return []; }
}

export function saveMsgTemplate(title: string, content: string): MessageTemplate {
  const t: MessageTemplate = {
    id: Date.now().toString(),
    title: title.trim(),
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify([t, ...loadMsgTemplates()]));
  return t;
}

export function deleteMsgTemplate(id: string) {
  localStorage.setItem(KEY, JSON.stringify(loadMsgTemplates().filter(t => t.id !== id)));
}
