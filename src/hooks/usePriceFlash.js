import { useRef, useEffect, useState } from 'react';

/**
 * 시세 tick 변동을 감지해 짧은 플래시 신호를 반환한다.
 *
 * @param {Array} stocks - { itemId, clpr } 필드를 가진 종목 배열
 * @param {number} duration - 플래시 유지 시간 (ms)
 * @returns {Map<itemId, 'up' | 'down'>} itemId → 방향
 */
export default function usePriceFlash(stocks, duration = 600) {
  const prevRef = useRef(new Map());
  const timersRef = useRef(new Map());
  const [flashMap, setFlashMap] = useState(() => new Map());

  useEffect(() => {
    if (!Array.isArray(stocks) || stocks.length === 0) return;

    const next = new Map(flashMap);
    let changed = false;

    for (const s of stocks) {
      const id = s.itemId;
      const curr = s.clpr;
      if (id == null || curr == null) continue;

      const prev = prevRef.current.get(id);
      if (prev != null && prev !== curr) {
        const dir = curr > prev ? 'up' : 'down';
        next.set(id, dir);
        changed = true;

        const existing = timersRef.current.get(id);
        if (existing) clearTimeout(existing);

        const t = setTimeout(() => {
          setFlashMap(m => {
            const m2 = new Map(m);
            m2.delete(id);
            return m2;
          });
          timersRef.current.delete(id);
        }, duration);
        timersRef.current.set(id, t);
      }
      prevRef.current.set(id, curr);
    }

    if (changed) setFlashMap(next);
  }, [stocks, duration]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
    };
  }, []);

  return flashMap;
}
