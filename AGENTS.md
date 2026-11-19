# 두밋 모바일 Codex 작업 지침

## 실행 명령

저장소의 `pnpm-lock.yaml`을 기준으로 pnpm을 사용한다. Windows PowerShell에서 실행 정책이 `pnpm.ps1`을 차단하면 `pnpm.cmd`로 실행한다.

```sh
pnpm install --frozen-lockfile      # 잠금 파일 기준 설치
pnpm start                          # Expo 개발 서버
pnpm android                        # Android 개발 서버 실행
pnpm ios                            # iOS 개발 서버 실행
pnpm web                            # 웹 실행
pnpm lint                           # Expo 린트
pnpm exec tsc --noEmit              # TypeScript 타입 검사
pnpm exec expo install <패키지>      # SDK 호환 의존성 설치
pnpm exec expo install --fix         # 호환되지 않는 의존성 수정
pnpm dlx expo-doctor                 # 설정 및 의존성 진단
```

작업을 마치기 전에 린트, 타입 검사, `git diff --check`를 실행하고 결과를 보고한다. Expo CLI가 ESLint 초기 설정을 요구하면 현재 작업 범위를 확인한다. 문서만 변경하는 작업에서는 자동 설정으로 의존성을 추가하지 않는다.

## 요구사항 확인

두밋은 친구 그룹끼리 다른 그룹을 탐색하고, 양쪽 그룹의 찬반 투표를 거쳐 공식 채팅을 시작하는 서비스다. 이 저장소는 Expo, React Native, Expo Router, TypeScript strict를 사용하는 모바일 앱이다.

- 작업할 기능 ID를 [두밋 전체 기능 명세서](https://app.notion.com/p/40bf7bfe3aab80eb900ae85eb762d2f6)에서 찾아 MVP·후속 구분과 우선순위를 확인한다. 화면 동작과 예외는 [UI/UX 설계서](https://app.notion.com/p/414f7bfe3aab8148ad8cd138fe4f3f28), 처리 규칙은 [기술 설계서](https://app.notion.com/p/414f7bfe3aab8188bcbcf81a855142d3)의 같은 ID를 참고한다.
- 명세와 설계가 충돌하면 기능 명세의 확정 정책을 기준으로 삼고, 사용자 동작이나 API 계약에 영향을 주는 차이를 작업 결과에 남긴다. 미정 정책과 후속 기능을 현재 작업에 임의로 추가하지 않는다.
- API 연동은 [API 명세서](https://app.notion.com/p/40bf7bfe3aab806bafc9daeecab2c3c8)와 확인 가능한 백엔드 계약을 기준으로 한다. 경로, 응답 스키마, 오류 코드를 추정해 확정하지 않는다. 목 데이터를 쓰는 경우 실제 API 연결 상태를 명시한다.
- 저장소의 실제 경로와 설치된 패키지를 먼저 확인한다. [앱 기술 문서](https://app.notion.com/p/f68f7bfe3aab833f8f5d01e31aad4b26)에 적힌 Zustand와 TanStack Query는 도입 시점에 필요성과 SDK 호환성을 검토한다.

## Expo와 앱 구현

- Expo, EAS, React Native API를 변경하기 전에 `package.json`에서 Expo 메이저 버전을 확인한다. 현재 SDK는 58이다. [SDK 58 공식 레퍼런스](https://docs.expo.dev/versions/v58.0.0/)에서 해당 버전의 API를 확인하고, 나머지 주제는 [Expo 문서 인덱스](https://docs.expo.dev/llms.txt)에서 관련 공식 문서를 찾아 읽는다.
- 화면과 `_layout.tsx`는 `src/app/`에 둔다. 이동과 라우트 파라미터에는 `expo-router`의 `Link`, `router`, `useLocalSearchParams` 등 해당 API를 사용한다. 컴포넌트·훅·API 호출·도메인 로직은 라우트 밖에 두고, 신규 기능에 별도 구조가 필요하면 `src/features/<기능>/`에 필요한 파일부터 추가한다. [Expo Router 문서](https://docs.expo.dev/router/introduction/)
- 기존 공통 컴포넌트와 테마를 우선 재사용한다. 모바일 터치, 안전 영역, 키보드와 뒤로 가기 동작을 확인하고 플랫폼별 API는 지원 범위를 확인한다. 탐색·채팅 목록은 명세의 페이지네이션을 유지하고 로딩·빈 상태·오류·재시도를 처리한다.
- Expo 권장 모듈을 우선 검토하고, 의존성은 `expo install`로 추가한다. 새 의존성의 도입 이유를 작업 결과에 기록한다. Expo Go에 포함되지 않은 네이티브 모듈은 개발 빌드로 검증한다.
- `ios/`와 `android/`가 없는 CNG 프로젝트의 네이티브 변경은 `app.json`과 설정 플러그인으로 관리한다. 로컬 개발 빌드는 환경에 맞춰 `pnpm exec expo run:android` 또는 `pnpm exec expo run:ios`를 사용한다. 클라우드 빌드, 스토어 제출, OTA 업데이트는 설정과 작업 범위를 확인한 뒤 각각 `pnpm dlx eas-cli@latest build`, `submit`, `update`를 사용한다. [EAS 문서](https://docs.expo.dev/eas/)

## 두밋 도메인에서 지킬 규칙

- 인증은 카카오·Google·Apple 소셜 로그인과 기기별 세션을 기준으로 한다. 최초 가입의 성인 본인확인과 필수 프로필 완료 상태를 구분한다. 토큰, OAuth 비밀값, 본인확인 원본 정보는 코드·로그·커밋에 남기지 않는다.
- 일반 그룹 공유 링크, 가입용 초대 링크, 그룹 간 참여 신청을 각각의 진입 흐름으로 처리한다. 참여 신청에는 마이페이지에서 선택한 내 그룹을 사용한다. 그룹은 1~6명이며, 매칭 신청은 양쪽 그룹 모두 최소 2명 조건과 서버가 확인한 유효 투표자 조건을 충족해야 한다.
- 투표 자격·마감 시각·매칭 결과는 서버 상태를 기준으로 한다. 그룹별 찬성 집계와 본인의 선택만 노출하고 다른 사용자의 개별 선택은 공개하지 않는다. 그룹원 변동, 만료 및 종료 후 재진입을 확인한다.
- 우리 그룹 채팅과 공식 매칭 채팅은 같은 목록에서 구분한다. 그룹 탈퇴, 채팅방 나가기, 채팅 종료는 각 기능의 정책을 적용한다. 딥링크·푸시로 들어올 때도 인증·접근 권한과 종료 상태를 다시 확인한다.
- 서버가 권한과 비즈니스 규칙을 최종 검증한다. 앱은 중복 요청을 줄이고 실패·권한 변경을 처리하며, 사용자에게 공개하도록 명세된 데이터만 화면에 표시한다.

## 협업과 지침 관리

- 브랜치 작업 시 `develop`에서 `feat/*`, `fix/*`, `chore/*`를 분기한다. 리뷰 후 PR로 병합하고 `main`과 `develop`에 직접 푸시하지 않는다. 긴급 수정과 병합 방식은 [브랜치 · Merge 전략](https://app.notion.com/p/418f7bfe3aab8127a7b6c44d07ad312d)을 따른다.
- 커밋 메시지는 `type: 변경 내용` 형식의 한국어로 작성한다. PR에는 변경 사항, 관련 기능 ID 또는 이슈, 검증 결과를 남긴다.
- 사용자와의 작업 진행 및 결과 공유는 한국어로 작성한다. 코드 식별자와 명령어는 원래 표기를 유지한다.
- 저장소 공통 지침은 이 파일에서 관리한다. 500줄 미만으로 유지하고 세부 명세는 링크로 참조한다. 경로나 명령이 바뀌면 실제 설정을 확인해 이 파일도 갱신한다.
