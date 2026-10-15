import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';

const navigate = vi.fn();

vi.mock('react-router-dom', () => ({
	useNavigate: () => navigate,
}));

vi.mock('../api/axiosInstance', () => ({
	default: {
		post: vi.fn(),
		get: vi.fn(),
	},
}));

describe('OAuthLinkCallbackPage (소셜 계정 연동 콜백)', () => {
	let api;
	let OAuthLinkCallbackPage;

	beforeEach(async () => {
		navigate.mockClear();
		api = (await import('../api/axiosInstance')).default;
		api.post.mockReset();
		api.get.mockReset();
		OAuthLinkCallbackPage = (await import('./OAuthLinkCallbackPage')).default;
	});

	it('code/state 만 POST 로 보내고 토큰은 URL 에 싣지 않는다', async () => {
		localStorage.setItem('accessToken', 'secret-access-token');
		window.history.replaceState(null, '', '/oauth/link?code=abc&state=xyz');
		api.post.mockResolvedValue({ data: { success: true, provider: 'kakao' } });

		render(<OAuthLinkCallbackPage />);

		await waitFor(() => expect(navigate).toHaveBeenCalledWith('/profile?linked=kakao'));
		expect(api.post).toHaveBeenCalledWith('/auth/link/callback', { code: 'abc', state: 'xyz' });
		expect(api.get).not.toHaveBeenCalled();
		expect(JSON.stringify(api.post.mock.calls)).not.toContain('secret-access-token');
		// 주소창에서 code/state 를 지운다.
		expect(window.location.search).toBe('');
	});

	it('code 나 state 가 없으면 서버를 부르지 않고 오류 화면으로 보낸다', async () => {
		window.history.replaceState(null, '', '/oauth/link?error=access_denied');

		render(<OAuthLinkCallbackPage />);

		await waitFor(() => expect(navigate).toHaveBeenCalledWith('/profile?linkError=true'));
		expect(api.post).not.toHaveBeenCalled();
	});
});
