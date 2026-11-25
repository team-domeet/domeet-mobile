import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoginDestinationScreen } from './login-destination-screen';
import { useSignupSession } from './signup-session';
import { signupTerms, type SignupTerm } from './signup-terms';

type TermId = SignupTerm['id'];

export function SignupTermsScreen() {
  const { session, setSession } = useSignupSession();
  const [accepted, setAccepted] = useState<Partial<Record<TermId, boolean>>>({});
  const [document, setDocument] = useState<SignupTerm | null>(null);
  const [submissionUnavailable, setSubmissionUnavailable] = useState(false);
  const allRequiredAccepted = signupTerms.every(({ id }) => accepted[id] === true);

  if (!session) {
    return (
      <LoginDestinationScreen
        title="Google 로그인이 필요해요"
        description="가입을 시작하거나 계속하려면 Google 계정을 다시 선택해 주세요."
      />
    );
  }

  function toggleTerm(id: TermId) {
    setAccepted((current) => ({ ...current, [id]: !current[id] }));
  }

  function continueSignup() {
    if (!allRequiredAccepted || !session) return;
    if (session.type === 'preview') {
      router.push({ pathname: '/signup/[step]', params: { step: 'identity' } });
      return;
    }
    if (Date.now() >= session.expiresAt) {
      setSession(null);
      return;
    }
    setSubmissionUnavailable(true);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => { setSession(null); router.dismissTo('/'); }} style={styles.back}>
          <Text style={styles.link}>로그인으로 돌아가기</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>약관에 동의해 주세요</Text>
        <Text style={styles.secondary}>두밋 가입에 필요한 약관을 확인해 주세요. 현재 표시된 내용은 검토용 초안이에요.</Text>

        <View style={styles.terms}>
          {signupTerms.map((term) => (
            <View key={term.id} style={styles.row}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: accepted[term.id] === true }}
                onPress={() => toggleTerm(term.id)}
                style={styles.term}>
                <View style={[styles.checkbox, accepted[term.id] && styles.checked]}>
                  {accepted[term.id] && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.label}>[필수] {term.title}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={term.title + ' 본문 보기'}
                onPress={() => setDocument(term)}
                style={styles.details}>
                <Text style={styles.link}>보기</Text>
              </Pressable>
            </View>
          ))}
        </View>
        {submissionUnavailable && (
          <Text accessibilityRole="alert" style={styles.secondary}>약관 동의 제출은 준비 중이에요.</Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !allRequiredAccepted }}
          disabled={!allRequiredAccepted}
          onPress={continueSignup}
          style={[styles.next, !allRequiredAccepted && styles.disabled]}>
          <Text style={[styles.nextLabel, !allRequiredAccepted && styles.disabledLabel]}>다음</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={document !== null} animationType="slide" onRequestClose={() => setDocument(null)}>
        <SafeAreaView style={styles.screen} accessibilityViewIsModal>
          <ScrollView contentContainerStyle={styles.content}>
            <Pressable accessibilityRole="button" onPress={() => setDocument(null)} style={styles.back}>
              <Text style={styles.link}>닫기</Text>
            </Pressable>
            <Text accessibilityRole="header" style={styles.title}>{document?.title}</Text>
            <Text style={styles.secondary}>검토용 초안</Text>
            {document?.paragraphs.map((paragraph) => <Text key={paragraph} style={styles.body}>{paragraph}</Text>)}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', padding: 24, gap: 16 },
  back: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  title: { color: '#151B28', fontSize: 27, fontWeight: '700' },
  secondary: { color: '#525D6D', fontSize: 15, lineHeight: 23 },
  body: { color: '#202632', fontSize: 16, lineHeight: 25 },
  terms: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#D5DAE1', marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#D5DAE1' },
  term: { flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  checkbox: { width: 22, height: 22, borderWidth: 1, borderColor: '#687587', borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  checked: { borderColor: '#17212E', backgroundColor: '#17212E' },
  checkmark: { color: '#FFFFFF', fontWeight: '700' },
  label: { flexShrink: 1, color: '#202632', fontWeight: '600' },
  details: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center' },
  link: { color: '#304E74', fontWeight: '700' },
  next: { minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: '#17212E' },
  disabled: { backgroundColor: '#E4E8EE' },
  nextLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  disabledLabel: { color: '#525D6D' },
});
