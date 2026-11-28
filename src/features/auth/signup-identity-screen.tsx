import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IdentityVerificationWindow, supportsIdentityVerification } from './identity-verification-window';
import { LoginDestinationScreen } from './login-destination-screen';
import { confirmIdentityVerification, startIdentityVerification, type IdentityAttempt, type IdentityConfirmation } from './signup-identity-api';
import { useSignupSession } from './signup-session';

const messages = {
  configuration: '가입 서버 주소를 확인해 주세요.',
  expired: '인증 시도가 만료됐어요. 본인인증을 다시 시작해 주세요.',
  incomplete: '인증이 아직 확인되지 않았어요. 결과를 다시 확인해 주세요.',
  conflict: '현재 가입 상태를 확인할 수 없어요. 로그인 화면에서 다시 시작해 주세요.',
  unavailable: '지금은 본인인증을 처리할 수 없어요. 잠시 후 다시 시도해 주세요.',
  network: '서버에 연결할 수 없어요. 연결을 확인하고 다시 시도해 주세요.',
  cancelled: '본인인증을 취소했어요. 다시 시작할 수 있어요.',
  failed: '인증창에서 본인인증을 완료하지 못했어요. 다시 시작해 주세요.',
};

export function SignupIdentityScreen() {
  const { session, setSession } = useSignupSession();
  const [windowAttempt, setWindowAttempt] = useState<IdentityAttempt | null>(null);
  const [confirmationAttempt, setConfirmationAttempt] = useState<IdentityAttempt | null>(null);
  const [confirmation, setConfirmation] = useState<IdentityConfirmation | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<keyof typeof messages | null>(null);
  const request = useRef<AbortController | null>(null);
  const activeWindow = useRef<IdentityAttempt | null>(null);

  useEffect(() => () => {
    request.current?.abort();
    request.current = null;
    activeWindow.current = null;
  }, [session]);

  if (!session) {
    return <LoginDestinationScreen title="Google 로그인이 필요해요" description="가입을 계속하려면 Google 계정을 다시 선택해 주세요." />;
  }
  if (session.type === 'preview' || !supportsIdentityVerification) {
    return <LoginDestinationScreen title="본인 인증" description="KG이니시스 본인인증 테스트는 Android 개발 빌드에서 진행해 주세요." />;
  }

  const sessionExpiresAt = session.expiresAt;
  const token = session.token;

  async function verify(attemptToConfirm?: IdentityAttempt) {
    if (request.current || activeWindow.current) return;
    if (Date.now() >= sessionExpiresAt) {
      setSession(null);
      return;
    }
    if (attemptToConfirm && Date.now() >= attemptToConfirm.expiresAt) {
      setConfirmationAttempt(null);
      setMessage('expired');
      return;
    }

    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setMessage(null);
    setConfirmationAttempt(attemptToConfirm ?? null);

    const result = attemptToConfirm
      ? await confirmIdentityVerification(token, attemptToConfirm.identityVerificationId, controller)
      : await startIdentityVerification(token, controller);

    if (request.current !== controller) return;
    request.current = null;
    setBusy(false);
    if (!result.ok) {
      if (result.error === 'invalidToken') {
        setSession(null);
      } else {
        if (result.error === 'expired' || result.error === 'conflict') setConfirmationAttempt(null);
        setMessage(result.error);
      }
      return;
    }

    if ('identityVerificationId' in result.data) {
      if (Date.now() >= result.data.expiresAt) {
        setMessage('expired');
        return;
      }
      activeWindow.current = result.data;
      setWindowAttempt(result.data);
    } else {
      setConfirmationAttempt(null);
      setConfirmation(result.data);
    }
  }

  function finishWindow(attempt: IdentityAttempt, result: 'cancelled' | 'failed' | 'completed') {
    if (activeWindow.current !== attempt) return;
    activeWindow.current = null;
    setWindowAttempt(null);
    if (result === 'completed') void verify(attempt);
    else setMessage(result);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>본인 인증</Text>
        <Text style={styles.description}>KG이니시스 테스트 채널에서 휴대폰 본인인증을 진행해요.</Text>
        {confirmation ? (
          <>
            <Text accessibilityRole="alert" style={styles.title}>본인인증 확인 완료</Text>
            <Text style={styles.description}>생년월일 제공 여부 {confirmation.birthDateAvailable ? '제공됨' : '제공되지 않음'}</Text>
            <Text style={styles.description}>중복 가입 확인용 식별자 제공 여부 {confirmation.ciAvailable ? '제공됨' : '제공되지 않음'}</Text>
          </>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: busy, busy }}
            disabled={busy}
            onPress={() => void verify(confirmationAttempt ?? undefined)}
            style={[styles.primary, busy && styles.busy]}>
            <Text style={styles.primaryLabel}>{busy ? '확인 중…' : confirmationAttempt ? '인증 결과 다시 확인' : '본인인증 시작'}</Text>
          </Pressable>
        )}
        {confirmationAttempt && !busy && (
          <Pressable accessibilityRole="button" onPress={() => void verify()} style={styles.back}>
            <Text style={styles.backLabel}>본인인증 다시 시작</Text>
          </Pressable>
        )}
        {message && <Text accessibilityRole="alert" style={styles.description}>{messages[message]}</Text>}
        <Pressable
          accessibilityRole="button"
          style={styles.back}
          onPress={() => { setSession(null); router.dismissTo('/'); }}>
          <Text style={styles.backLabel}>로그인으로 돌아가기</Text>
        </Pressable>
      </ScrollView>
      {windowAttempt && (
        <IdentityVerificationWindow
          attempt={windowAttempt}
          onClose={() => finishWindow(windowAttempt, 'cancelled')}
          onFailure={() => finishWindow(windowAttempt, 'failed')}
          onComplete={() => finishWindow(windowAttempt, 'completed')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', padding: 24, gap: 16 },
  title: { color: '#151B28', fontSize: 26, fontWeight: '700' },
  description: { color: '#525D6D', fontSize: 15, lineHeight: 23 },
  primary: { minHeight: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#17212E' },
  primaryLabel: { color: '#FFFFFF', fontWeight: '700' },
  busy: { opacity: 0.6 },
  back: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center' },
  backLabel: { color: '#304E74', fontWeight: '700' },
});
