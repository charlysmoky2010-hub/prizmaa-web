import type { NextRequest } from 'next/server';

// Compare with the validated HTTP Host header seen by the server, rather than
// NextURL's canonical origin (which can differ from a loopback/preview host).
// Fail closed for missing, malformed, cross-site, or non-HTTPS public Origins.
export function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host || request.headers.get('sec-fetch-site') === 'cross-site') return false;
  try {
    const parsed = new URL(origin);
    const local = parsed.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
    return parsed.origin === origin &&
      parsed.host === host &&
      (parsed.protocol === 'https:' || local);
  } catch {
    return false;
  }
}
