import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isPreviewDestination, previewDestinations } from '@/features/auth/login-preview';

export default function LoginPreview() {
  const { step } = useLocalSearchParams();
  if (!__DEV__ || !isPreviewDestination(step)) return <Redirect href="/" />;

  const { title, description } = previewDestinations[step];

  return (
    <SafeAreaView style={styles.screen}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => router.dismissTo('/')}>
        <Text style={styles.buttonLabel}>로그인으로 돌아가기</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 14, backgroundColor: '#FFFFFF' },
  title: { textAlign: 'center', fontSize: 25, fontWeight: '700', color: '#111111' },
  description: { textAlign: 'center', fontSize: 16, color: '#434B5B' },
  button: { minHeight: 44, justifyContent: 'center', marginTop: 12, paddingHorizontal: 20, backgroundColor: '#111111', borderRadius: 10 },
  buttonLabel: { color: '#FFFFFF', fontWeight: '700' },
});
