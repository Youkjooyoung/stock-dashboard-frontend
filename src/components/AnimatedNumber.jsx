import React, { useEffect, useRef } from 'react';
import { animate } from 'motion';

/**
 * AnimatedNumber - 숫자 카운트업/다운 애니메이션 컴포넌트
 * 
 * @param {number} value - 표시할 숫자 값
 * @param {number} duration - 애니메이션 지속 시간 (초, 기본값: 0.6)
 * @param {number} decimals - 소수점 자릿수 (기본값: 0)
 * @param {string} className - CSS 클래스
 * @param {function} formatter - 커스텀 포맷터 함수 (예: toLocaleString)
 */
export default function AnimatedNumber({ 
  value, 
  duration = 0.6, 
  decimals = 0, 
  className = '',
  formatter = null 
}) {
  const ref = useRef(null);
  const prevValue = useRef(value);

  useEffect(() => {
    if (!ref.current) return;
    
    const node = ref.current;
    const from = prevValue.current || 0;
    const to = value || 0;

    // 값이 동일하면 애니메이션 skip
    if (from === to) {
      node.textContent = formatter ? formatter(to) : to.toFixed(decimals);
      return;
    }

    // Motion을 사용한 부드러운 카운트업/다운
    const controls = animate(from, to, {
      duration,
      onUpdate: (latest) => {
        if (node) {
          const formatted = formatter 
            ? formatter(latest) 
            : latest.toFixed(decimals);
          node.textContent = formatted;
        }
      }
    });

    prevValue.current = to;

    return () => controls.stop();
  }, [value, duration, decimals, formatter]);

  // 초기값 설정
  const initialValue = formatter 
    ? formatter(value || 0) 
    : (value || 0).toFixed(decimals);

  return <span ref={ref} className={className}>{initialValue}</span>;
}

/**
 * 미리 정의된 포맷터
 */
// eslint-disable-next-line react-refresh/only-export-components
export const formatters = {
  // 천 단위 구분 쉼표
  comma: (val) => Math.round(val).toLocaleString(),
  
  // 소수점 2자리 + 쉼표
  decimal2: (val) => val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
  
  // 퍼센트 (소수점 2자리)
  percent: (val) => `${val.toFixed(2)}%`,
  
  // 원화 표시
  won: (val) => `${Math.round(val).toLocaleString()}원`,
};
