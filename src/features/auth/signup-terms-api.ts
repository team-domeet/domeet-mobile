import { getAuthEndpoint } from './auth-endpoint';
import type { SignupTerm } from './signup-terms';

export type SignupTermsResult =
  | 'accepted'
  | 'configuration'
  | 'invalidConsents'
  | 'invalidToken'
  | 'conflict'
  | 'unavailable'
  | 'network';

export async function submitSignupTerms(
  token: string,
  consents: readonly Pick<SignupTerm, 'id' | 'version'>[],
  controller: AbortController,
): Promise<SignupTermsResult> {
  const endpoint = getAuthEndpoint(process.env.EXPO_PUBLIC_API_BASE_URL, 'signup/terms-consents');
  if (!endpoint) return 'configuration';

  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ consents }),
      signal: controller.signal,
      redirect: 'error',
    });

    switch (response.status) {
      case 200: {
        const body: unknown = await response.json().catch(() => null);
        return body && typeof body === 'object' && 'nextStep' in body && body.nextStep === 'IDENTITY_VERIFICATION'
          ? 'accepted'
          : 'unavailable';
      }
      case 400:
        return 'invalidConsents';
      case 401:
        return 'invalidToken';
      case 409:
        return 'conflict';
      default:
        return 'unavailable';
    }
  } catch {
    return 'network';
  } finally {
    clearTimeout(timeout);
  }
}
