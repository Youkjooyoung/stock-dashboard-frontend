import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL } from '../config/env';

export default function useStomp(topic, { connectHeaders = {}, onMessage, onConnect, onDisconnect, reconnectDelay = 5000, sockjsOptions } = {}) {
  const clientRef = useRef(null);

  useEffect(() => {
    if (!topic || !onMessage) return;
    const client = new Client({
      webSocketFactory: () => new SockJS(API_BASE_URL + '/ws', null, sockjsOptions),
      connectHeaders,
      reconnectDelay,
      onConnect: () => {
        onConnect?.();
        client.subscribe(topic, onMessage);
      },
      onDisconnect,
    });
    client.activate();
    clientRef.current = client;
    return () => client.deactivate();
  }, [topic]);

  return clientRef;
}
