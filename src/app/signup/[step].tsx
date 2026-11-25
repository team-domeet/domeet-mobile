import { Redirect, useLocalSearchParams } from 'expo-router';

import { LoginDestinationScreen } from '@/features/auth/login-destination-screen';
import { isSignupDestination, signupDestinations } from '@/features/auth/login-preview';
import { SignupTermsScreen } from '@/features/auth/signup-terms-screen';

export default function SignupStepScreen() {
  const { step } = useLocalSearchParams();
  if (!isSignupDestination(step)) return <Redirect href="/" />;
  if (step === 'terms') return <SignupTermsScreen />;

  return <LoginDestinationScreen {...signupDestinations[step]} />;
}
