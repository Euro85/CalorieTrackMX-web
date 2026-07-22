import type { StoredSession, User } from './types';

const SESSION_KEY = 'ctmx_pro_session';

export function getSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return getSession()?.token ?? null;
}

export function getUser(): User | null {
  return getSession()?.user ?? null;
}

export function saveSession(token: string, user: User): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
