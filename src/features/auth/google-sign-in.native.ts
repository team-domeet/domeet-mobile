import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import { getGoogleLoginEndpoint, submitGoogleIdToken, type GoogleLoginOutcome } from './google-login-api';

let configured = false;

export async function signInWithGoogle(): Promise<GoogleLoginOutcome> {
  if (isRunningInExpoGo()) return 'buildRequired';

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  const endpoint = getGoogleLoginEndpoint(process.env.EXPO_PUBLIC_API_BASE_URL);

  if (!webClientId || !endpoint || (Platform.OS === 'ios' && !iosClientId)) {
    return 'configuration';
  }

  try {
    const {
      GoogleOneTapSignIn,
      isCancelledResponse,
      isSuccessResponse,
    } = await import('react-native-nitro-google-signin');

    if (!configured) {
      GoogleOneTapSignIn.configure({ webClientId, iosClientId });
      configured = true;
    }

    if (Platform.OS === 'android') await GoogleOneTapSignIn.checkPlayServices();

    const result = await GoogleOneTapSignIn.presentExplicitSignIn();
    if (isCancelledResponse(result)) return 'cancelled';
    if (!isSuccessResponse(result) || !result.data.idToken) return 'failure';

    return submitGoogleIdToken(endpoint, result.data.idToken);
  } catch {
    return 'failure';
  }
}
