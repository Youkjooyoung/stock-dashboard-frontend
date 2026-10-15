import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL } from '../config/env';
import { authConnectHeaders } from './useStomp';

// 서버가 로그인한 본인에게만 보내는 개인 알림 큐.
// 예전 주소(/topic/alert/{userId})는 userId 만 알면 누구나 구독할 수 있었다.
const ALERT_QUEUE = '/user/queue/alert';

export default function useAlertSocket(userId, onAlert) {
  const clientRef = useRef(null);
  const onAlertRef = useRef(onAlert);

  useEffect(() => {
    onAlertRef.current = onAlert;
  }, [onAlert]);

  useEffect(() => {
    if (!userId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(API_BASE_URL + '/ws'),
      beforeConnect: () => {
        client.connectHeaders = authConnectHeaders();
      },
      onConnect: () => {
        client.subscribe(ALERT_QUEUE, msg => {
          const data = JSON.parse(msg.body);
          onAlertRef.current?.(data);
        });
      },
      reconnectDelay: 5000,
    });

    client.activate();
    clientRef.current = client;
    return () => client.deactivate();
  }, [userId]);
}
