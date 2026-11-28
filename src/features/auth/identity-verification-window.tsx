import type { IdentityAttempt } from './signup-identity-api';

export type IdentityVerificationWindowProps = {
  attempt: IdentityAttempt;
  onClose: () => void;
  onFailure: () => void;
  onComplete: () => void;
};

export const supportsIdentityVerification = false;

export function IdentityVerificationWindow(_props: IdentityVerificationWindowProps) {
  return null;
}
