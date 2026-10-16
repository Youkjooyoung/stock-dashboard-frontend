import React, { useState, useEffect } from 'react';
import useAlertSocket from '../hooks/useAlertSocket';
import useAlertStore from '../store/alertStore';
import styles from '../styles/components/AlertNotification.module.css';

// 서버가 보내는 알림은 두 종류다.
// - BIG_MOVE   : 관심 종목이 시가 대비 10% 이상 움직임. direction 은 'UP' 또는 'DOWN'
// - PRICE_ALERT: 사용자가 정한 목표가 도달. alertType 은 'ABOVE'(이상) 또는 'BELOW'(이하)
const isUpAlert = (data) =>
  data.type === 'BIG_MOVE' ? data.direction === 'UP' : data.alertType === 'ABOVE';

// 브라우저 알림(창이 숨겨져 있을 때)에 쓸 제목과 내용
function buildNotificationText(data) {
  if (data.type === 'BIG_MOVE') {
    const isUp = isUpAlert(data);
    const sign = isUp ? '▲' : '▼';
    return {
      title: `${isUp ? '급등' : '급락'} ${data.stockName}`,
      body: `${sign} ${Math.abs(Number(data.rate)).toFixed(2)}% · 현재가 ${Number(data.close).toLocaleString()}원`,
    };
  }

  const isUp = isUpAlert(data);
  return {
    title: `${data.stockName} 목표가 도달`,
    body: `현재가 ${Number(data.currentPrice).toLocaleString()}원 (목표 ${Number(data.targetPrice).toLocaleString()}원 ${isUp ? '이상' : '이하'})`,
  };
}

export default function AlertNotification({ userId }) {
  const [alerts, setAlerts] = useState([]);
  const increment = useAlertStore((s) => s.increment);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 알림을 받으면 헤더 배지 수를 올리고, 화면 오른쪽에 6초 동안 띄운다.
  // 다른 탭을 보고 있으면(document.hidden) 브라우저 알림도 보낸다.
  useAlertSocket(userId, (data) => {
    const id = Date.now();
    increment();
    setAlerts((prev) => [...prev, { ...data, id }]);
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 6000);

    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      const { title, body } = buildNotificationText(data);
      new Notification(title, { body, icon: '/stock-logo.png' });
    }
  });

  const dismiss = (id) => setAlerts((prev) => prev.filter((a) => a.id !== id));

  if (alerts.length === 0) return null;

  return (
    <div className={styles['alert-notifications']}>
      {alerts.map((alert) => {
        const isBigMove = alert.type === 'BIG_MOVE';
        const isUp = isUpAlert(alert);

        return (
          <div key={alert.id} className={`${styles['alert-toast']} ${isUp ? 'up' : 'down'}`}>
            <button className={styles['alert-toast-close']} onClick={() => dismiss(alert.id)}>×</button>

            {isBigMove ? (
              <>
                <div className={styles['alert-toast-title']}>
                  {isUp ? '급등 알림!' : '급락 알림!'}
                </div>
                <div className={styles['alert-toast-body']}>
                  <span className={styles['alert-toast-highlight']}>{alert.stockName}</span>이(가) 시가 대비
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
                <div className={styles['alert-toast-title']}>목표가 도달!</div>
                <div className={styles['alert-toast-body']}>
                  <span className={styles['alert-toast-highlight']}>{alert.stockName}</span>이(가){' '}
                  {isUp ? '목표가 이상' : '목표가 이하'}으로
                </div>
                <div className={`${styles['alert-toast-body']} ${styles['alert-toast-body-mt']}`}>
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
