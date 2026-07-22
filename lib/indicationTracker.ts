const KEY = 'ctmx_last_ind';

type TrackerMap = Record<string, string>; // patientUserId → ISO timestamp

function readMap(): TrackerMap {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function writeMap(map: TrackerMap): void {
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch {}
}

export function recordIndicationSent(patientUserId: number): void {
  const map = readMap();
  map[String(patientUserId)] = new Date().toISOString();
  writeMap(map);
}

export function getLastIndicationDate(patientUserId: number): Date | null {
  const map = readMap();
  const iso = map[String(patientUserId)];
  return iso ? new Date(iso) : null;
}

export function daysSinceIndication(patientUserId: number): number | null {
  const d = getLastIndicationDate(patientUserId);
  if (!d) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}
