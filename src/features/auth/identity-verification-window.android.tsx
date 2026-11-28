import { IdentityVerification } from '@portone/react-native-sdk';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { IdentityVerificationWindowProps } from './identity-verification-window';

export const supportsIdentityVerification = true;

function isCancellation(code: unknown) {
  return typeof code === 'string' && /cancel|closed/i.test(code);
}

export function IdentityVerificationWindow({ attempt, onClose, onFailure, onComplete }: IdentityVerificationWindowProps) {
  return (
    <Modal onRequestClose={onClose} animationType="slide">
      <SafeAreaView style={styles.screen}>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.close}>
          <Text style={styles.closeLabel}>인증창 닫기</Text>
        </Pressable>
        <IdentityVerification
          request={{
            storeId: attempt.storeId,
            channelKey: attempt.channelKey,
            identityVerificationId: attempt.identityVerificationId,
            bypass: { inicisUnified: { flgFixedUser: 'N' } },
          }}
          onComplete={(response) => {
            if (isCancellation(response.code)) onClose();
            else if (response.code || response.identityVerificationId !== attempt.identityVerificationId) onFailure();
            else onComplete();
          }}
          onError={(error) => {
            if (isCancellation(error.code)) onClose();
            else onFailure();
          }}
          onHttpError={onFailure}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  close: { alignSelf: 'flex-end', minHeight: 48, paddingHorizontal: 20, justifyContent: 'center' },
  closeLabel: { color: '#304E74', fontWeight: '700' },
});
