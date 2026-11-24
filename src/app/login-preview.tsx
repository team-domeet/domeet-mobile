import { Redirect, useLocalSearchParams } from 'expo-router';

import { LoginDestinationScreen } from '@/features/auth/login-destination-screen';
import { isPreviewDestination, previewDestinations } from '@/features/auth/login-preview';

export default function LoginPreview() {
  const { step } = useLocalSearchParams();
  if (!__DEV__ || !isPreviewDestination(step)) return <Redirect href="/" />;

  return <LoginDestinationScreen {...previewDestinations[step]} />;
}
