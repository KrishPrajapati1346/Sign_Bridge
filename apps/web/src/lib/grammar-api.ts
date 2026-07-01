import type { ApiResponse, LanguageCode } from '@signbridge/shared-types';
import { API_URL } from './auth-api';

type AuthFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function reconstructGrammar(
  authFetch: AuthFetch,
  words: string[],
  language: LanguageCode,
): Promise<string> {
  if (!words.length) return '';
  try {
    const res = await authFetch(`${API_URL}/api/grammar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words, language }),
    });
    const json = (await res.json()) as ApiResponse<{ sentence: string }>;
    if (!json.success) return words.join(' ');
    return json.data.sentence;
  } catch {
    return words.join(' ');
  }
}
