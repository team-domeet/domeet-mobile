import { getAuthEndpoint } from './auth-endpoint';

export type IdentityAttempt = {
  identityVerificationId: string;
  storeId: string;
  channelKey: string;
  expiresAt: number;
};

export type IdentityConfirmation = { birthDateAvailable: boolean; ciAvailable: boolean };
type IdentityError = 'configuration' | 'invalidToken' | 'expired' | 'incomplete' | 'conflict' | 'unavailable' | 'network';
type IdentityResult<T> = { ok: true; data: T } | { ok: false; error: IdentityError };

function parseAttempt(body: unknown): IdentityAttempt | null {
  if (!body || typeof body !== 'object') return null;
  if (
    !('identityVerificationId' in body) || typeof body.identityVerificationId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.identityVerificationId) ||
    !('storeId' in body) || typeof body.storeId !== 'string' || !body.storeId.trim() ||
    !('channelKey' in body) || typeof body.channelKey !== 'string' || !body.channelKey.trim() ||
    !('expiresAt' in body) || typeof body.expiresAt !== 'string'
  ) return null;

  const expiresAt = Date.parse(body.expiresAt);
  if (!Number.isFinite(expiresAt)) return null;
  return { identityVerificationId: body.identityVerificationId, storeId: body.storeId, channelKey: body.channelKey, expiresAt };
}

function parseConfirmation(body: unknown): IdentityConfirmation | null {
  if (!body || typeof body !== 'object' || !('status' in body) || body.status !== 'VERIFIED') return null;
  if (!('birthDateAvailable' in body) || typeof body.birthDateAvailable !== 'boolean') return null;
  if (!('ciAvailable' in body) || typeof body.ciAvailable !== 'boolean') return null;
  return { birthDateAvailable: body.birthDateAvailable, ciAvailable: body.ciAvailable };
}

async function requestIdentity<T>(
  path: string,
  token: string,
  controller: AbortController,
  successStatus: number,
  parse: (body: unknown) => T | null,
): Promise<IdentityResult<T>> {
  const endpoint = getAuthEndpoint(process.env.EXPO_PUBLIC_API_BASE_URL, path);
  if (!endpoint) return { ok: false, error: 'configuration' };

  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
      redirect: 'error',
    });
    if (response.status === 401) return { ok: false, error: 'invalidToken' };
    const body: unknown = await response.json().catch(() => null);
    if (response.status === successStatus) {
      const data = parse(body);
      return data ? { ok: true, data } : { ok: false, error: 'unavailable' };
    }
    const code = body && typeof body === 'object' && 'code' in body ? body.code : null;
    if (response.status === 404 && code === 'IDENTITY_VERIFICATION_ATTEMPT_NOT_FOUND') {
      return { ok: false, error: 'expired' };
    }
    if (response.status === 409) {
      if (code === 'IDENTITY_VERIFICATION_ATTEMPT_EXPIRED') return { ok: false, error: 'expired' };
      if (code === 'IDENTITY_VERIFICATION_NOT_COMPLETED') return { ok: false, error: 'incomplete' };
      return { ok: false, error: 'conflict' };
    }
    return { ok: false, error: 'unavailable' };
  } catch {
    return { ok: false, error: 'network' };
  } finally {
    clearTimeout(timeout);
  }
}

const identityPath = 'signup/identity-verifications';

export function startIdentityVerification(token: string, controller: AbortController) {
  return requestIdentity(identityPath, token, controller, 201, parseAttempt);
}

export function confirmIdentityVerification(token: string, id: string, controller: AbortController) {
  return requestIdentity(`${identityPath}/${encodeURIComponent(id)}/confirm`, token, controller, 200, parseConfirmation);
}
