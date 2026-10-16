// 로그인할 때 localStorage 에 저장하는 값들.
// 로그아웃과 토큰 갱신 실패 두 곳에서 같은 목록을 지워야 해서 한곳에 모았다.
const AUTH_STORAGE_KEYS = [
  'accessToken',
  'refreshToken',
  'userEmail',
  'userRole',
  'userId',
  'kakaoNickname',
  'provider',
];

export function clearStoredAuth() {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}
