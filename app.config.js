const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
const androidPackage = process.env.DOMEET_ANDROID_PACKAGE?.trim();
const iosBundleIdentifier = process.env.DOMEET_IOS_BUNDLE_IDENTIFIER?.trim();
const googleClientIdSuffix = '.apps.googleusercontent.com';

module.exports = ({ config }) => {
  const plugins = [...(config.plugins ?? [])];

  if (googleIosClientId?.endsWith(googleClientIdSuffix)) {
    const clientId = googleIosClientId.slice(0, -googleClientIdSuffix.length);
    plugins.push([
      'react-native-nitro-google-signin',
      { iosUrlScheme: `com.googleusercontent.apps.${clientId}` },
    ]);
  }

  return {
    ...config,
    plugins,
    android: { ...config.android, ...(androidPackage && { package: androidPackage }) },
    ios: { ...config.ios, ...(iosBundleIdentifier && { bundleIdentifier: iosBundleIdentifier }) },
  };
};
