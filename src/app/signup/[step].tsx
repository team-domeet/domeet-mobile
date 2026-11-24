import { Redirect, useLocalSearchParams } from 'expo-router';

import { LoginDestinationScreen } from '@/features/auth/login-destination-screen';
import { isSignupDestination, signupDestinations } from '@/features/auth/login-preview';

export default function SignupStepScreen() {
  const { step } = useLocalSearchParams();
  if (!isSignupDestination(step)) return <Redirect href="/" />;

  return <LoginDestinationScreen {...signupDestinations[step]} />;
}
