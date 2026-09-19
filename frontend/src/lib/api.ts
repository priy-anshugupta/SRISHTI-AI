const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
    credentials: 'include',
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(typeof body?.detail === 'string' ? body.detail : `Request failed (${response.status})`, response.status);
  }
  return response.json() as Promise<T>;
}

export async function uploadDocument(file: File) {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch(`${API_URL}/api/documents/upload`, { method: 'POST', body: form, credentials: 'include' });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(typeof body?.detail === 'string' ? body.detail : `Upload failed (${response.status})`, response.status);
  }
  return response.json();
}
