export const previewDestinations = {
  terms: { title: '이용약관', description: '이용약관 확인부터 가입을 시작해요.' },
  identity: { title: '본인 인증', description: '아직 완료하지 않은 본인 인증을 이어서 진행해요.' },
  profile: { title: '프로필 설정', description: '아직 완료하지 않은 프로필 설정을 이어서 진행해요.' },
  restricted: { title: '서비스 이용 제한', description: '현재 이 계정은 서비스를 이용할 수 없어요.' },
  temporary: { title: '서비스 이용 안내', description: '현재 일부 서비스 이용이 일시적으로 제한돼요.' },
};

export function isPreviewDestination(value: unknown): value is keyof typeof previewDestinations {
  return typeof value === 'string' && Object.hasOwn(previewDestinations, value);
}

export const loginScenarios = [
  { id: 'home', label: '기존 회원' },
  { id: 'terms', label: '신규 회원' },
  { id: 'identity', label: '가입 미완료 · 본인 인증' },
  { id: 'profile', label: '가입 미완료 · 프로필' },
  { id: 'restricted', label: '이용 제한' },
  { id: 'temporary', label: '일시 이용 제한' },
  { id: 'failure', label: '인증 실패' },
  { id: 'cancel', label: '인증 취소' },
] as const;

export type LoginScenario = (typeof loginScenarios)[number]['id'];
