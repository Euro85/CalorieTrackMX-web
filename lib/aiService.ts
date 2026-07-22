import type { AISettings, ChatMessage } from './types';

const AI_SETTINGS_KEY = 'ctmx_pro_ai';

export function loadAISettings(): AISettings {
  if (typeof window === 'undefined') return defaultSettings();
  try {
    const raw = localStorage.getItem(AI_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : defaultSettings();
  } catch {
    return defaultSettings();
  }
}

export function saveAISettings(s: AISettings): void {
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(s));
}

function defaultSettings(): AISettings {
  return { provider: 'anthropic', apiKey: '', model: 'claude-haiku-4-5-20251001' };
}

// ─── Streaming chat ───────────────────────────────────────────────────────────

export async function streamChat(
  messages: ChatMessage[],
  systemPrompt: string,
  settings: AISettings,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
): Promise<void> {
  const { provider, apiKey, model } = settings;
  if (!apiKey) { onError('Configura tu API Key en Ajustes → NutriIA antes de chatear.'); return; }

  try {
    if (provider === 'anthropic') {
      await streamAnthropic(messages, systemPrompt, model, apiKey, onChunk, onDone, onError);
    } else if (provider === 'openai') {
      await streamOpenAI(messages, systemPrompt, model, apiKey, onChunk, onDone, onError);
    } else {
      await streamGemini(messages, systemPrompt, model, apiKey, onChunk, onDone, onError);
    }
  } catch (e: unknown) {
    onError(e instanceof Error ? e.message : 'Error desconocido');
  }
}

// ─── Anthropic ────────────────────────────────────────────────────────────────

async function streamAnthropic(
  messages: ChatMessage[],
  system: string,
  model: string,
  apiKey: string,
  onChunk: (t: string) => void,
  onDone: () => void,
  onError: (m: string) => void,
) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system,
      stream: true,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    onError(buildError('Anthropic', res.status, err));
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (!json || json === '[DONE]') continue;
      try {
        const ev = JSON.parse(json);
        if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
          onChunk(ev.delta.text);
        }
      } catch {}
    }
  }
  onDone();
}

// ─── OpenAI ───────────────────────────────────────────────────────────────────

async function streamOpenAI(
  messages: ChatMessage[],
  system: string,
  model: string,
  apiKey: string,
  onChunk: (t: string) => void,
  onDone: () => void,
  onError: (m: string) => void,
) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        { role: 'system', content: system },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    onError(buildError('OpenAI', res.status, err));
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (!json || json === '[DONE]') continue;
      try {
        const ev = JSON.parse(json);
        const text = ev.choices?.[0]?.delta?.content;
        if (text) onChunk(text);
      } catch {}
    }
  }
  onDone();
}

// ─── Gemini ───────────────────────────────────────────────────────────────────

async function streamGemini(
  messages: ChatMessage[],
  system: string,
  model: string,
  apiKey: string,
  onChunk: (t: string) => void,
  onDone: () => void,
  onError: (m: string) => void,
) {
  const gemModel = model || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${gemModel}:streamGenerateContent?key=${apiKey}&alt=sse`;

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    onError(buildError('Gemini', res.status, err));
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (!json) continue;
      try {
        const ev = JSON.parse(json);
        const text = ev.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) onChunk(text);
      } catch {}
    }
  }
  onDone();
}

// ─── Error builder ────────────────────────────────────────────────────────────

function buildError(provider: string, status: number, body: unknown): string {
  const msg: string =
    (body as Record<string, { message?: string }>)?.error?.message ?? '';
  if (status === 401) return `API Key de ${provider} inválida o vencida.`;
  if (status === 429) return `Límite de ${provider} alcanzado. Intenta en unos minutos.`;
  if (status === 403) return `Sin permisos para este modelo de ${provider}.`;
  if (status >= 500) return `Servidores de ${provider} con problemas. Intenta después.`;
  return msg || `Error ${status} de ${provider}`;
}
