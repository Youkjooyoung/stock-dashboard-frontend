import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../api/axiosInstance', () => ({
	default: {
		post: vi.fn().mockResolvedValue({ data: {} }),
	},
}));

describe('authStore', () => {
	let useAuthStore;
	let api;

	beforeEach(async () => {
		vi.resetModules();
		const apiModule = await import('../api/axiosInstance');
		api = apiModule.default;
		api.post.mockClear();
		const mod = await import('./authStore');
		useAuthStore = mod.default;
	});

	describe('초기 상태', () => {
		it('localStorage가 비어 있으면 token/user는 null, role은 USER 기본값', () => {
			const state = useAuthStore.getState();
			expect(state.token).toBeNull();
			expect(state.user).toBeNull();
			expect(state.role).toBe('USER');
		});

		it('localStorage에 값이 있으면 초기 상태로 복원된다', async () => {
			localStorage.setItem('accessToken', 'persisted-access-token');
			localStorage.setItem('userEmail', 'persist@example.com');
			localStorage.setItem('userRole', 'ADMIN');

			vi.resetModules();
			const mod = await import('./authStore');
			const state = mod.default.getState();

			expect(state.token).toBe('persisted-access-token');
			expect(state.user).toBe('persist@example.com');
			expect(state.role).toBe('ADMIN');
		});
	});

	describe('setAuth', () => {
		it('스토어 상태와 localStorage를 동시에 갱신한다', () => {
			useAuthStore.getState().setAuth(
				'user@example.com',
				'access-token-123',
				'refresh-token-456',
				42,
				'USER'
			);

			const state = useAuthStore.getState();
			expect(state.user).toBe('user@example.com');
			expect(state.token).toBe('access-token-123');
			expect(state.role).toBe('USER');

			expect(localStorage.getItem('accessToken')).toBe('access-token-123');
			expect(localStorage.getItem('refreshToken')).toBe('refresh-token-456');
			expect(localStorage.getItem('userEmail')).toBe('user@example.com');
			expect(localStorage.getItem('userId')).toBe('42');
			expect(localStorage.getItem('userRole')).toBe('USER');
		});

		it('role 인자를 생략하면 USER로 저장된다', () => {
			useAuthStore.getState().setAuth(
				'default@example.com',
				'a',
				'r',
				1
			);
			expect(useAuthStore.getState().role).toBe('USER');
			expect(localStorage.getItem('userRole')).toBe('USER');
		});

		it('ADMIN 권한도 그대로 저장된다', () => {
			useAuthStore.getState().setAuth(
				'admin@example.com',
				'a',
				'r',
				1,
				'ADMIN'
			);
			expect(useAuthStore.getState().role).toBe('ADMIN');
			expect(localStorage.getItem('userRole')).toBe('ADMIN');
		});

		it('userId가 falsy(0, undefined)이면 localStorage에 userId를 쓰지 않는다', () => {
			useAuthStore.getState().setAuth('x@y.com', 'a', 'r', 0, 'USER');
			expect(localStorage.getItem('userId')).toBeNull();
		});
	});

	describe('logout', () => {
		it('refreshToken이 있으면 /auth/logout POST 호출 후 storage를 정리한다', async () => {
			useAuthStore.getState().setAuth('u@ex.com', 'at', 'rt', 7, 'USER');

			await useAuthStore.getState().logout();

			expect(api.post).toHaveBeenCalledWith('/auth/logout', {
				refreshToken: 'rt',
			});
			expect(localStorage.getItem('accessToken')).toBeNull();
			expect(localStorage.getItem('refreshToken')).toBeNull();
			expect(localStorage.getItem('userEmail')).toBeNull();
			expect(localStorage.getItem('userId')).toBeNull();
			expect(localStorage.getItem('userRole')).toBeNull();

			const state = useAuthStore.getState();
			expect(state.token).toBeNull();
			expect(state.user).toBeNull();
			expect(state.role).toBe('USER');
		});

		it('refreshToken이 없으면 API를 호출하지 않고도 storage를 비운다', async () => {
			useAuthStore.setState({ token: 'at', user: 'u@x.com', role: 'USER' });

			await useAuthStore.getState().logout();

			expect(api.post).not.toHaveBeenCalled();
			expect(useAuthStore.getState().token).toBeNull();
			expect(useAuthStore.getState().user).toBeNull();
		});

		it('API가 실패해도 로컬 storage/state는 반드시 정리된다', async () => {
			api.post.mockRejectedValueOnce(new Error('network down'));
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			useAuthStore.getState().setAuth('x@y.com', 'at', 'rt', 1, 'USER');

			await expect(useAuthStore.getState().logout()).resolves.toBeUndefined();

			expect(localStorage.getItem('accessToken')).toBeNull();
			expect(useAuthStore.getState().token).toBeNull();
			consoleSpy.mockRestore();
		});
	});
});
