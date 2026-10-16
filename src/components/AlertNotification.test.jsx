import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AlertNotification from './AlertNotification';

// 웹소켓 대신, 컴포넌트가 넘긴 콜백을 잡아 두었다가 테스트에서 직접 알림을 보낸다.
let pushAlert;
vi.mock('../hooks/useAlertSocket', () => ({
  default: (_userId, onAlert) => { pushAlert = onAlert; },
}));

describe('AlertNotification', () => {
  it('서버가 보낸 direction=UP 급등 알림을 급등으로 표시한다', () => {
    render(<AlertNotification userId="1" />);

    act(() => pushAlert({
      type: 'BIG_MOVE', ticker: '005930', stockName: '삼성전자',
      rate: '12.50', direction: 'UP', close: 90000,
    }));

    expect(screen.getByText('급등 알림!')).toBeInTheDocument();
    expect(screen.getByText(/▲ 12.50% 변동/)).toBeInTheDocument();
  });

  it('direction=DOWN 은 급락으로 표시한다', () => {
    render(<AlertNotification userId="1" />);

    act(() => pushAlert({
      type: 'BIG_MOVE', ticker: '005930', stockName: '삼성전자',
      rate: '-11.00', direction: 'DOWN', close: 70000,
    }));

    expect(screen.getByText('급락 알림!')).toBeInTheDocument();
    expect(screen.getByText(/▼ 11.00% 변동/)).toBeInTheDocument();
  });
});
