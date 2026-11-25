import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { GoogleLoginFeedback, GoogleLoginSuccess } from './google-login-api';
import { signInWithGoogle } from './google-sign-in';
import { loginScenarios, previewSuccess, signupRoutes, type LoginScenario } from './login-preview';
import { useSignupSession } from './signup-session';

const providers = [
  {
    id: 'kakao',
    label: '카카오로 로그인',
    background: '#FEE500',
    foreground: '#111111',
    logo: require('@/assets/images/auth/kakao.png'),
  },
  {
    id: 'google',
    label: 'Google로 로그인',
    background: '#FFFFFF',
    foreground: '#111111',
    logo: require('@/assets/images/auth/google.png'),
  },
  {
    id: 'apple',
    label: 'Apple로 로그인',
    background: '#000000',
    foreground: '#FFFFFF',
    logo: require('@/assets/images/auth/apple.png'),
  },
] as const;

const feedbackMessages = {
  buildRequired: 'Google 로그인은 Android 또는 iOS 개발 빌드에서 확인해 주세요.',
  configuration: 'Google 로그인 설정 또는 서버 주소를 확인해 주세요.',
  failure: 'Google 인증에 실패했어요. 다시 시도해 주세요.',
  lookupComplete: '서버 확인을 마쳤어요. 두밋 로그인은 준비 중이에요.',
  network: '서버에 연결할 수 없어요. 연결을 확인하고 다시 시도해 주세요.',
  restricted: '현재 이 계정은 서비스를 이용할 수 없어요.',
  serverUnavailable: '지금은 서버에서 로그인을 처리할 수 없어요.',
  unavailable: '이 로그인 방식은 준비 중이에요.',
} satisfies Record<GoogleLoginFeedback | 'unavailable', string>;

export function LoginScreen() {
  const { setSession } = useSignupSession();
  const [choosingScenario, setChoosingScenario] = useState(false);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<keyof typeof feedbackMessages | null>(null);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signingIn = useRef(false);

  useEffect(() => () => {
    if (pendingTimer.current !== null) clearTimeout(pendingTimer.current);
  }, []);

  function openGoogleLoginDestination(outcome: GoogleLoginSuccess | (typeof previewSuccess)[keyof typeof previewSuccess]) {
    if (outcome.result === 'LOGGED_IN') {
      setSession(null);
      router.replace('/home');
      return;
    }

    setSession('signupToken' in outcome
      ? { type: 'authenticated', token: outcome.signupToken, expiresAt: outcome.expiresAt }
      : { type: 'preview' });
    router.push({
      pathname: '/signup/[step]',
      params: { step: signupRoutes[outcome.nextStep] },
    });
  }

  function startPreview(scenario: LoginScenario) {
    if (pendingTimer.current !== null) return;
    setChoosingScenario(false);
    if (scenario === 'cancel') return;

    setPending(true);
    pendingTimer.current = setTimeout(() => {
      pendingTimer.current = null;
      setPending(false);
      if (scenario === 'failure') {
        setFeedback('failure');
      } else if (scenario === 'restricted' || scenario === 'temporary') {
        router.push({ pathname: '/login-preview', params: { step: scenario } });
      } else {
        openGoogleLoginDestination(previewSuccess[scenario]);
      }
    }, 450);
  }

  async function signIn(provider: (typeof providers)[number]['id']) {
    if (pendingTimer.current !== null || signingIn.current) return;
    setFeedback(null);
    if (provider !== 'google') {
      setFeedback('unavailable');
      return;
    }
    setSession(null);
    if (__DEV__ && Platform.OS === 'web') {
      setChoosingScenario(true);
      return;
    }

    signingIn.current = true;
    setPending(true);
    try {
      const result = await signInWithGoogle();
      if (typeof result === 'object') {
        openGoogleLoginDestination(result);
      } else if (result !== 'cancelled') {
        setFeedback(result);
      }
    } finally {
      signingIn.current = false;
      setPending(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} alwaysBounceVertical={false}>
        <View style={styles.intro}>
          <View style={styles.wordmark}>
            <Text accessibilityRole="header" style={styles.logo}>두밋</Text>
            <View style={[styles.accent, styles.accentUp]} />
            <View style={[styles.accent, styles.accentRight]} />
          </View>
          <Text style={styles.headline}>친구 그룹과 함께,</Text>
          <Text style={styles.subtitle}>새로운 인연을 만나보세요</Text>
        </View>

        <View style={styles.actions}>
          <View style={styles.providerList}>
            {providers.map(({ id, label, background, foreground, logo }) => {
              const isLoading = pending && id === 'google';

              return (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{ disabled: pending, busy: isLoading }}
                  disabled={pending}
                  onPress={() => signIn(id)}
                  style={({ pressed }) => [
                    styles.provider,
                    { backgroundColor: background, borderColor: id === 'google' ? '#DADCE0' : background },
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.providerContent}>
                    <View style={styles.providerIcon}>
                      {isLoading ? (
                        <ActivityIndicator color={foreground} size="small" />
                      ) : (
                        <Image
                          accessible={false}
                          source={logo}
                          contentFit="contain"
                          style={id === 'apple' ? styles.appleLogo : styles.providerLogo}
                        />
                      )}
                    </View>
                    <Text style={[styles.providerLabel, { color: foreground }]}>
                      {isLoading ? '로그인 중…' : label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          {feedback && (
            <View style={styles.feedback}>
              <Text accessibilityRole="alert" style={styles.feedbackText}>
                {feedbackMessages[feedback]}
              </Text>
              {(feedback === 'failure' || feedback === 'network' || feedback === 'serverUnavailable') && (
                <Pressable accessibilityRole="button" hitSlop={8} onPress={() => signIn('google')}>
                  <Text style={styles.retry}>다시 시도</Text>
                </Pressable>
              )}
            </View>
          )}
          <View style={styles.notice}>
            <SymbolView accessible={false} name={{ ios: 'shield', android: 'shield', web: 'shield' }} size={15} tintColor="#69717D" />
            <Text style={styles.noticeText}>본인 인증을 마친 그룹만 매칭에 참여해요</Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={choosingScenario}
        transparent
        animationType="fade"
        onRequestClose={() => setChoosingScenario(false)}>
        <View style={styles.scrim}>
          <View style={styles.dialog} accessibilityViewIsModal>
            <ScrollView>
              <Text accessibilityRole="header" style={styles.dialogTitle}>Google 로그인 테스트</Text>
              {loginScenarios.map(({ id, label }) => (
                <Pressable key={id} accessibilityRole="button" style={styles.scenario} onPress={() => startPreview(id)}>
                  <Text style={styles.scenarioLabel}>{label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: 22, paddingVertical: 34, gap: 46 },
  intro: { alignItems: 'center', gap: 6 },
  wordmark: { position: 'relative', marginBottom: 24, paddingTop: 14 },
  logo: { color: '#080808', fontSize: 68, fontWeight: '900', letterSpacing: -3 },
  accent: { position: 'absolute', width: 21, height: 7, borderRadius: 4, backgroundColor: '#FF6100' },
  accentUp: { right: -12, top: 11, transform: [{ rotate: '-72deg' }] },
  accentRight: { right: -34, top: 24, transform: [{ rotate: '-26deg' }] },
  headline: { color: '#151B28', textAlign: 'center', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#434B5B', textAlign: 'center', fontSize: 20 },
  actions: { width: '100%', maxWidth: 400, gap: 10 },
  providerList: { gap: 6 },
  provider: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 6 },
  providerContent: { flexDirection: 'row', alignItems: 'center', gap: 14, width: '44%', minWidth: 140, maxWidth: '100%' },
  providerIcon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  providerLabel: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
  providerLogo: { width: 16, height: 16 },
  appleLogo: { position: 'absolute', height: 42, width: 42 * (72 / 132) },
  pressed: { opacity: 0.72 },
  notice: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14 },
  noticeText: { color: '#69717D', fontSize: 13, textAlign: 'center', flexShrink: 1 },
  feedback: { alignItems: 'center', gap: 8 },
  feedbackText: { textAlign: 'center', color: '#454D5C', fontSize: 14 },
  retry: { color: '#134C98', fontWeight: '700', paddingVertical: 8 },
  scrim: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#00000066' },
  dialog: { width: '100%', maxWidth: 360, maxHeight: '100%', padding: 18, backgroundColor: '#FFFFFF', borderRadius: 16 },
  dialogTitle: { fontSize: 19, fontWeight: '700', color: '#111111', marginBottom: 10 },
  scenario: { minHeight: 44, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#DADCE0' },
  scenarioLabel: { fontSize: 15, color: '#202632' },
});
