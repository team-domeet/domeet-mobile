export type GoogleLoginFeedback =
  | 'buildRequired'
  | 'configuration'
  | 'failure'
  | 'lookupComplete'
  | 'network'
  | 'restricted'
  | 'serverUnavailable';

export type GoogleLoginOutcome = GoogleLoginFeedback | 'cancelled';

export function getGoogleLoginEndpoint(baseUrl: string | undefined): string | null {
  if (!baseUrl) return null;

  try {
    const url = new URL(baseUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
      return null;
    }
    return `${url.href.replace(/\/+$/, '')}/api/v1/auth/social-logins`;
  } catch {
    return null;
  }
}

export async function submitGoogleIdToken(
  endpoint: string,
  idToken: string,
): Promise<GoogleLoginFeedback> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'GOOGLE', idToken }),
      signal: controller.signal,
      redirect: 'error',
    });

    switch (response.status) {
      // Current AUTH-002 prototype returns 501 after verification and member lookup.
      case 501:
        return 'lookupComplete';
      case 400:
      case 401:
        return 'failure';
      case 403:
        return 'restricted';
      default:
        return 'serverUnavailable';
    }
  } catch {
    return 'network';
  } finally {
    clearTimeout(timeout);
  }
}
