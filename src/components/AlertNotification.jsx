import { useState, useEffect } from 'react';
import useAlertSocket from '../hooks/useAlertSocket';
import useAlertStore from '../store/alertStore';
import styles from '../styles/components/AlertNotification.module.css';

function buildNotificationText(data) {
  if (data.type === 'BIG_MOVE') {
    const sign = data.direction === '급등' ? '▲' : '▼';
    return {
      title: `${data.direction === '급등' ? '🚀' : '📉'} ${data.stockName} ${data.direction}`,
      body: `${sign} ${Math.abs(Number(data.rate)).toFixed(2)}% · 현재가 ${Number(data.close).toLocaleString()}원`,
    };
  }
  const isUp = data.alertType === 'ABOVE';
  return {
    title: `🔔 ${data.stockName} 목표가 도달`,
    body: `현재가 ${Number(data.currentPrice).toLocaleString()}원 (목표 ${Number(data.targetPrice).toLocaleString()}원 ${isUp ? '이상' : '이하'})`,
  };
}

export default function AlertNotification({ userId }) {
  const [alerts, setAlerts] = useState([]);
  const increment = useAlertStore(s => s.increment);

  // 브라우저 알림 권한 요청 (최초 마운트 시)
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useAlertSocket(userId, (data) => {
    const id = Date.now();
    increment();
    setAlerts(prev => [...prev, { ...data, id }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 6000);

    // 브라우저 알림 (탭이 백그라운드 상태일 때도 동작)
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      const { title, body } = buildNotificationText(data);
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  });

  const dismiss = (id) => setAlerts(prev => prev.filter(a => a.id !== id));

  if (alerts.length === 0) return null;

  return (
    <div className={styles['alert-notifications']}>
      {alerts.map(alert => {
        const isBigMove = alert.type === 'BIG_MOVE';
        const isUp = isBigMove ? alert.direction === '급등' : alert.alertType === 'ABOVE';

        return (
          <div key={alert.id} className={`${styles['alert-toast']} ${isUp ? 'up' : 'down'}`}>
            <button className={styles['alert-toast-close']} onClick={() => dismiss(alert.id)}>✕</button>

            {isBigMove ? (
              <>
                <div className={styles['alert-toast-title']}>
                  {isUp ? '🚀 급등 알림!' : '📉 급락 알림!'}
                </div>
                <div className={styles['alert-toast-body']}>
                  <span className={styles['alert-toast-highlight']}>{alert.stockName}</span>이(가) 전일 대비
                </div>
                <div className={`${styles['alert-toast-rate']} ${isUp ? 'up' : 'down'}`}>
                  {isUp ? '▲' : '▼'} {Math.abs(Number(alert.rate)).toFixed(2)}% 변동
                </div>
                <div className={styles['alert-toast-price']}>
                  현재가 {Number(alert.close).toLocaleString()}원
                </div>
              </>
            ) : (
              <>
                <div className={styles['alert-toast-title']}>🔔 목표가 도달!</div>
                <div className={styles['alert-toast-body']}>
                  <span className={styles['alert-toast-highlight']}>{alert.stockName}</span>이(가){' '}
                  {isUp ? '목표가 이상' : '목표가 이하'}으로
                </div>
                <div className={styles['alert-toast-body']} style={{ marginTop: 4 }}>
                  현재가{' '}
                  <span className={styles['alert-toast-highlight']}>
                    {Number(alert.currentPrice).toLocaleString()}원
                  </span>
                  {' '}(목표 {Number(alert.targetPrice).toLocaleString()}원)
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
