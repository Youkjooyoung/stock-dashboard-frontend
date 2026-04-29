import { useState, useMemo } from 'react';
import { useAlertsByTicker, useAddAlert, useDeleteAlert } from '../hooks/useQueries';
import styles from '../styles/components/AlertSetter.module.css';

export default function AlertSetter({ stock }) {
  const [targetPrice, setTargetPrice] = useState('');
  const [alertType, setAlertType]     = useState('ABOVE');
  const [msg, setMsg]                 = useState('');

  const { data: alerts = [] }    = useAlertsByTicker(stock.srtnCd);
  const addAlert                 = useAddAlert();
  const deleteAlert              = useDeleteAlert();

  const currentPrice = stock.clpr || 0;

  const distanceInfo = useMemo(() => {
    const target = Number(targetPrice);
    if (!target || !currentPrice) return null;
    const diff    = target - currentPrice;
    const pct     = (diff / currentPrice * 100).toFixed(2);
    const sign    = diff >= 0 ? '+' : '';
    const color   = diff >= 0 ? 'var(--up)' : 'var(--down)';
    return { label: `현재가 대비 ${sign}${pct}%`, color };
  }, [targetPrice, currentPrice]);

  const isDuplicate = useMemo(() => {
    const target = Number(targetPrice);
    if (!target) return false;
    return alerts.some(a => a.targetPrice === target && a.alertType === alertType);
  }, [targetPrice, alertType, alerts]);

  const handleAdd = async () => {
    if (!targetPrice) { setMsg('목표가를 입력해주세요.'); return; }
    if (isDuplicate)  { setMsg('동일한 조건의 알림이 이미 있습니다.'); return; }
    try {
      await addAlert.mutateAsync({
        ticker:      stock.srtnCd,
        stockName:   stock.itmsNm,
        itemId:      stock.itemId,
        targetPrice: Number(targetPrice),
        alertType,
      });
      setMsg('알림이 등록됐어요!');
      setTargetPrice('');
      setTimeout(() => setMsg(''), 2000);
    } catch {
      setMsg('알림 등록에 실패했습니다.');
    }
  };

  const handleDelete = async (alertId) => {
    try {
      await deleteAlert.mutateAsync(alertId);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={styles['alert-setter']}>
      <div className={styles['alert-setter-title']}>🔔 목표가 알림 설정</div>

      {currentPrice > 0 && (
        <div className={styles['alert-current-price']}>
          현재가 <strong>{currentPrice.toLocaleString()}원</strong>
        </div>
      )}

      <div className={styles['alert-form']}>
        <select
          className={styles['alert-type-select']}
          value={alertType}
          onChange={e => setAlertType(e.target.value)}>
          <option value="ABOVE">이상 (상승 알림)</option>
          <option value="BELOW">이하 (하락 알림)</option>
        </select>
        <input
          type="number"
          className={styles['alert-price-input']}
          placeholder="목표가 입력 (원)"
          value={targetPrice}
          onChange={e => setTargetPrice(e.target.value)}
        />
        <button
          className={styles['alert-add-btn']}
          onClick={handleAdd}
          disabled={addAlert.isPending}>
          {addAlert.isPending ? '등록 중...' : '등록'}
        </button>
      </div>

      {distanceInfo && (
        <div className={styles['alert-distance']} style={{ '--distance-color': distanceInfo.color }}>
          {distanceInfo.label}
          {isDuplicate && <span className={styles['alert-duplicate']}> · 이미 등록됨</span>}
        </div>
      )}

      {msg && <div className={styles['alert-msg']}>{msg}</div>}

      {alerts.length > 0 && (
        <div className={styles['alert-list']}>
          {alerts.map(a => (
            <div key={a.alertId} className={styles['alert-item']}>
              <div className={styles['alert-item-info']}>
                <span className={`${styles['alert-type-badge']} ${styles[a.alertType === 'ABOVE' ? 'above' : 'below']}`}>
                  {a.alertType === 'ABOVE' ? '▲ 이상' : '▼ 이하'}
                </span>
                <span>{a.targetPrice?.toLocaleString()}원</span>
                {a.isTriggered === 'Y' && (
                  <span className={styles['alert-triggered']}>✓ 도달</span>
                )}
              </div>
              <button
                className={styles['alert-delete-btn']}
                onClick={() => handleDelete(a.alertId)}
                disabled={deleteAlert.isPending}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
