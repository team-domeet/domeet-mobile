# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Google 로그인 개발 빌드

프로젝트 루트의 `.env.local`에 아래 공개 설정을 입력합니다.

```dotenv
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<Google 웹 OAuth 클라이언트 ID>
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<iOS OAuth 클라이언트 ID>
EXPO_PUBLIC_API_BASE_URL=https://<기기에서 접근 가능한 백엔드 호스트>
DOMEET_ANDROID_PACKAGE=<등록한 Android 패키지 이름>
DOMEET_IOS_BUNDLE_IDENTIFIER=<등록한 iOS 번들 ID>
```

- 웹 OAuth 클라이언트 ID는 서버의 `DOMEET_GOOGLE_CLIENT_ID`와 동일해야 합니다.
- Android OAuth 클라이언트에는 개발 빌드의 패키지 이름과 서명 인증서 SHA-1을 등록합니다. iOS는 iOS OAuth 클라이언트 ID와 번들 ID를 사용하며 앱 설정이 역순 URL 스킴을 등록합니다.
- `8080`에서 HTTP로 실행하는 로컬 서버를 쓸 때는 기기에서 신뢰하는 인증서가 있는 HTTPS 개발 주소를 연결합니다. 환경 변수에는 OAuth 클라이언트 비밀키를 넣지 않습니다.
- Android 로컬 빌드는 `pnpm exec expo run:android`, iOS 로컬 빌드는 macOS에서 `pnpm exec expo run:ios`로 실행합니다. Expo Go에서는 네이티브 Google 인증을 실행할 수 없고, 웹 개발 모드에서는 기존 화면 전환 테스트 메뉴를 사용할 수 있습니다.
- 개발 빌드에서 계정 선택과 취소를 확인합니다. 현재 서버가 토큰 검증 및 회원 조회를 마치면 `501`을 반환하며, 앱은 두밋 로그인 준비 중 안내를 표시합니다.

## Get a fresh project


When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
