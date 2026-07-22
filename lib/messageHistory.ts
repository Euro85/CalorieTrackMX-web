export interface SentMessage {
  id: string;
  message: string;
  sentAt: string;
}

export function getSentMessages(patientUserId: number): SentMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`ctmx_msgs_${patientUserId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addSentMessage(patientUserId: number, message: string) {
  const prev = getSentMessages(patientUserId);
  const next: SentMessage[] = [
    { id: Date.now().toString(), message, sentAt: new Date().toISOString() },
    ...prev.slice(0, 19),
  ];
  localStorage.setItem(`ctmx_msgs_${patientUserId}`, JSON.stringify(next));
}
