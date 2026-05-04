import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL } from '../config/env';

export default function useAlertSocket(userId, onAlert) {
  const clientRef = useRef(null);
  const onAlertRef = useRef(onAlert);

  useEffect(() => {
    onAlertRef.current = onAlert;
  }, [onAlert]);

  useEffect(() => {
    if (!userId) return;

    const token = localStorage.getItem('accessToken') || '';
    const client = new Client({
      webSocketFactory: () => new SockJS(API_BASE_URL + '/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        client.subscribe(`/topic/alert/${userId}`, msg => {
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
