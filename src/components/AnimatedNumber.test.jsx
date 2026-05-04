import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnimatedNumber, { formatters } from './AnimatedNumber';

vi.mock('motion', () => ({
	animate: vi.fn(() => ({ stop: vi.fn() })),
}));

describe('AnimatedNumber - formatters', () => {
	describe('comma', () => {
		it('천 단위 구분 쉼표를 넣는다', () => {
			expect(formatters.comma(1234567)).toBe('1,234,567');
		});

		it('소수는 반올림한다', () => {
			expect(formatters.comma(1234.7)).toBe('1,235');
		});

		it('0도 "0"으로 반환한다', () => {
			expect(formatters.comma(0)).toBe('0');
		});
	});

	describe('decimal2', () => {
		it('소수점 2자리 + 쉼표 포맷', () => {
			expect(formatters.decimal2(1234.5)).toBe('1,234.50');
		});

		it('작은 숫자는 그대로 소수 2자리', () => {
			expect(formatters.decimal2(3.1)).toBe('3.10');
		});
	});

	describe('percent', () => {
		it('소수 2자리 + % 기호', () => {
			expect(formatters.percent(12.3456)).toBe('12.35%');
		});

		it('음수도 그대로 표시', () => {
			expect(formatters.percent(-1.5)).toBe('-1.50%');
		});
	});

	describe('won', () => {
		it('반올림한 금액 + "원"', () => {
			expect(formatters.won(1234567.89)).toBe('1,234,568원');
		});
	});
});

describe('AnimatedNumber - component', () => {
	it('formatter 없이 value만 주면 decimals 기본값(0)으로 렌더한다', () => {
		const { container } = render(<AnimatedNumber value={1234} />);
		expect(container.querySelector('span')).toHaveTextContent('1234');
	});

	it('formatter가 주어지면 초기 렌더부터 포맷된 값이 나온다', () => {
		const { container } = render(
			<AnimatedNumber value={1234567} formatter={formatters.comma} />
		);
		expect(container.querySelector('span')).toHaveTextContent('1,234,567');
	});

	it('decimals 지정 시 소수점 자릿수를 맞춘다', () => {
		const { container } = render(<AnimatedNumber value={3.14159} decimals={2} />);
		expect(container.querySelector('span')).toHaveTextContent('3.14');
	});

	it('className이 span에 그대로 전달된다', () => {
		render(<AnimatedNumber value={100} className="stock-price" />);
		const span = screen.getByText('100');
		expect(span).toHaveClass('stock-price');
	});

	it('value가 null/undefined여도 크래시하지 않고 0을 표시한다', () => {
		const { container } = render(<AnimatedNumber value={null} />);
		expect(container.querySelector('span')).toHaveTextContent('0');
	});
});
