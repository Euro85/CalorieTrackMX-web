export const TAG_OPTIONS = [
  'Control de peso', 'Diabetes', 'Deportista', 'Embarazo',
  'Hipertensión', 'Vegetariano', 'VIP', 'Nuevo',
];

export const TAG_COLORS: Record<string, string> = {
  'Control de peso': 'bg-blue-100 text-blue-700',
  'Diabetes':        'bg-red-100 text-red-700',
  'Deportista':      'bg-green-100 text-green-700',
  'Embarazo':        'bg-pink-100 text-pink-700',
  'Hipertensión':    'bg-orange-100 text-orange-700',
  'Vegetariano':     'bg-emerald-100 text-emerald-700',
  'VIP':             'bg-yellow-100 text-yellow-700',
  'Nuevo':           'bg-prof-100 text-prof-700',
};

type PatientTagsMap = Record<number, string[]>;

function loadAllTags(): PatientTagsMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('ctmx_patient_tags');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function getPatientTags(userId: number): string[] {
  return loadAllTags()[userId] ?? [];
}

export function setPatientTags(userId: number, tags: string[]) {
  const all = loadAllTags();
  all[userId] = tags;
  localStorage.setItem('ctmx_patient_tags', JSON.stringify(all));
}

export function loadAllTagsMap(): PatientTagsMap {
  return loadAllTags();
}
