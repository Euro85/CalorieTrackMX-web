export const API_URL =
  'https://0xysdofiye.execute-api.us-east-2.amazonaws.com/default/calorietrack-api';

export async function apiCall<T = unknown>(
  action: string,
  params: Record<string, unknown> = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, ...params }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Error en el servidor');
  return data as T;
}
