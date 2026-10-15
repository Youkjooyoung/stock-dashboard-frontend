import { describe, it, expect } from 'vitest';
import { authConnectHeaders } from './useStomp';

describe('authConnectHeaders (웹소켓 CONNECT 헤더)', () => {
	it('로그인 상태면 접속 시점의 최신 액세스 토큰을 넣는다', () => {
		localStorage.setItem('accessToken', 'old-token');
		localStorage.setItem('accessToken', 'refreshed-token');

		expect(authConnectHeaders()).toEqual({ Authorization: 'Bearer refreshed-token' });
	});

	it('비로그인 상태면 Authorization 헤더를 넣지 않는다', () => {
		expect(authConnectHeaders()).toEqual({});
	});

	it('기존 헤더는 유지하고 원본 객체는 바꾸지 않는다', () => {
		localStorage.setItem('accessToken', 't');
		const base = { 'x-client': 'dashboard' };

		expect(authConnectHeaders(base)).toEqual({ 'x-client': 'dashboard', Authorization: 'Bearer t' });
		expect(base).toEqual({ 'x-client': 'dashboard' });
	});
});
