import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

type SignupSession = { type: 'authenticated'; token: string; expiresAt: number } | { type: 'preview' };

const SignupSessionContext = createContext<{
  session: SignupSession | null;
  setSession: (session: SignupSession | null) => void;
} | null>(null);

export function SignupSessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<SignupSession | null>(null);

  useEffect(() => {
    if (session?.type !== 'authenticated') return;
    const timer = setTimeout(() => {
      setSession((current) => current === session ? null : current);
    }, Math.max(0, session.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [session]);

  return <SignupSessionContext.Provider value={{ session, setSession }}>{children}</SignupSessionContext.Provider>;
}

export function useSignupSession() {
  const signup = useContext(SignupSessionContext);
  if (!signup) throw new Error('Missing signup session provider');
  return signup;
}
