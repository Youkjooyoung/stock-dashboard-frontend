import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function useAlertSocket(userId, onAlert) {
  const clientRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const token = localStorage.getItem('accessToken') || '';
    const client = new Client({
      webSocketFactory: () => new SockJS(import.meta.env.VITE_API_BASE_URL + '/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        client.subscribe(`/topic/alert/${userId}`, msg => {
          const data = JSON.parse(msg.body);
          onAlert(data);
        });
      },
      reconnectDelay: 5000,
    });

    client.activate();
    clientRef.current = client;
    return () => client.deactivate();
  }, [userId]);
}
