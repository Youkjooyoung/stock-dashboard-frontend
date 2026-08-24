import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PageState, { RouteLoading } from './PageState';

describe('PageState', () => {
  it('오류 상태와 다시 시도 동작을 접근 가능한 형태로 제공한다', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(
      <PageState
        tone="error"
        title="시세 정보를 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        actionLabel="다시 시도"
        onAction={onAction}
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('라우트 로딩 상태를 스크린 리더에 알린다', () => {
    render(<RouteLoading />);
    expect(screen.getByRole('status')).toHaveTextContent('화면을 불러오는 중입니다.');
  });
});
