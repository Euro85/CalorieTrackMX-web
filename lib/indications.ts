export interface Indication {
  id: string;
  content: string;
  createdAt: string;
}

const EPOCH_ISO = new Date(0).toISOString();

export function parseIndications(raw?: string | null): Indication[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(e => typeof e?.content === 'string')) {
      return parsed as Indication[];
    }
  } catch { /* not JSON */ }
  // Legacy plain-text — wrap as a single entry
  return [{ id: '0', content: raw.trim(), createdAt: EPOCH_ISO }];
}

export function serializeIndications(list: Indication[]): string {
  return JSON.stringify(list);
}

export function appendIndication(existing: Indication[], content: string): Indication[] {
  return [
    { id: Date.now().toString(), content: content.trim(), createdAt: new Date().toISOString() },
    ...existing,
  ];
}

export function isLegacyDate(createdAt: string): boolean {
  return createdAt === EPOCH_ISO;
}
