import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL } from '../config/env';

const EMPTY_HEADERS = {};

export default function useStomp(topic, { connectHeaders = EMPTY_HEADERS, onMessage, onConnect, onDisconnect, reconnectDelay = 5000, sockjsOptions } = {}) {
  const clientRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
  }, [onMessage, onConnect, onDisconnect]);

  useEffect(() => {
    if (!topic || !onMessage) return;
    const client = new Client({
      webSocketFactory: () => new SockJS(API_BASE_URL + '/ws', null, sockjsOptions),
      connectHeaders,
      reconnectDelay,
      onConnect: () => {
        onConnectRef.current?.();
        client.subscribe(topic, msg => onMessageRef.current?.(msg));
      },
      onDisconnect: (...args) => onDisconnectRef.current?.(...args),
    });
    client.activate();
    clientRef.current = client;
    return () => client.deactivate();
  }, [connectHeaders, onMessage, reconnectDelay, sockjsOptions, topic]);

  return clientRef;
}
