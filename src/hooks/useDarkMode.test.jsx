import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useDarkMode from './useDarkMode';

function mockSystemPrefersDark(prefersDark) {
	window.matchMedia = vi.fn().mockImplementation((query) => ({
		matches: prefersDark,
		media: query,
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		addListener: vi.fn(),
		removeListener: vi.fn(),
		dispatchEvent: vi.fn(),
	}));
}

describe('useDarkMode', () => {
	beforeEach(() => {
		mockSystemPrefersDark(false);
	});

	it('저장된 값이 없고 시스템이 light이면 dark=false로 시작한다', () => {
		mockSystemPrefersDark(false);
		const { result } = renderHook(() => useDarkMode());
		expect(result.current[0]).toBe(false);
		expect(document.documentElement.getAttribute('data-theme')).toBe('light');
	});

	it('저장된 값이 없고 시스템이 dark이면 dark=true로 시작한다', () => {
		mockSystemPrefersDark(true);
		const { result } = renderHook(() => useDarkMode());
		expect(result.current[0]).toBe(true);
		expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
	});

	it('localStorage.theme=dark이면 시스템 선호와 무관하게 dark로 시작한다', () => {
		localStorage.setItem('theme', 'dark');
		mockSystemPrefersDark(false);

		const { result } = renderHook(() => useDarkMode());

		expect(result.current[0]).toBe(true);
		expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
	});

	it('localStorage.theme=light이면 시스템이 dark여도 light로 시작한다', () => {
		localStorage.setItem('theme', 'light');
		mockSystemPrefersDark(true);

		const { result } = renderHook(() => useDarkMode());

		expect(result.current[0]).toBe(false);
	});

	it('setDark(true) 호출 시 data-theme 속성과 localStorage가 즉시 반영된다', () => {
		const { result } = renderHook(() => useDarkMode());

		act(() => {
			result.current[1](true);
		});

		expect(result.current[0]).toBe(true);
		expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
		expect(localStorage.getItem('theme')).toBe('dark');
	});

	it('dark → light 토글 시 DOM과 storage가 함께 갱신된다', () => {
		localStorage.setItem('theme', 'dark');
		const { result } = renderHook(() => useDarkMode());

		act(() => {
			result.current[1](false);
		});

		expect(result.current[0]).toBe(false);
		expect(document.documentElement.getAttribute('data-theme')).toBe('light');
		expect(localStorage.getItem('theme')).toBe('light');
	});
});
