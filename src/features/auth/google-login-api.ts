export type GoogleLoginFeedback =
  | 'buildRequired'
  | 'configuration'
  | 'failure'
  | 'lookupComplete'
  | 'network'
  | 'restricted'
  | 'serverUnavailable';

export type SignupNextStep = 'TERMS' | 'IDENTITY_VERIFICATION' | 'PROFILE';

export type GoogleLoginSuccess =
  | { result: 'LOGGED_IN' }
  | { result: 'SIGNUP_REQUIRED'; nextStep: SignupNextStep; signupToken: string; expiresAt: number };

export type GoogleLoginOutcome = GoogleLoginFeedback | GoogleLoginSuccess | 'cancelled';

function hasValue(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

const signupTokenLifetimeMs = 15 * 60 * 1000;

export function parseGoogleLoginSuccess(body: unknown, requestStartedAt: number): GoogleLoginSuccess | null {
  if (!body || typeof body !== 'object' || !('result' in body)) return null;

  if (
    body.result === 'LOGGED_IN' &&
    'accessToken' in body && hasValue(body.accessToken) &&
    'refreshToken' in body && hasValue(body.refreshToken) &&
    'accessTokenExpiresIn' in body &&
    typeof body.accessTokenExpiresIn === 'number' &&
    Number.isInteger(body.accessTokenExpiresIn) &&
    body.accessTokenExpiresIn > 0
  ) {
    return { result: 'LOGGED_IN' };
  }

  if (
    body.result === 'SIGNUP_REQUIRED' &&
    'signupToken' in body && hasValue(body.signupToken) &&
    'nextStep' in body &&
    (body.nextStep === 'TERMS' || body.nextStep === 'IDENTITY_VERIFICATION' || body.nextStep === 'PROFILE')
  ) {
    return {
      result: 'SIGNUP_REQUIRED',
      nextStep: body.nextStep,
      signupToken: body.signupToken,
      expiresAt: requestStartedAt + signupTokenLifetimeMs,
    };
  }

  return null;
}

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
): Promise<GoogleLoginFeedback | GoogleLoginSuccess> {
  const requestStartedAt = Date.now();
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
      case 200: {
        const body: unknown = await response.json().catch(() => null);
        return parseGoogleLoginSuccess(body, requestStartedAt) ?? 'serverUnavailable';
      }
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
