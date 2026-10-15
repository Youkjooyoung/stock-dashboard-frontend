import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL } from '../config/env';

const EMPTY_HEADERS = {};

// 접속(재접속 포함) 직전에 최신 액세스 토큰을 읽어 CONNECT 헤더에 넣는다.
// 토큰이 갱신된 뒤 재접속할 때 예전(만료된) 토큰을 보내지 않기 위해서다.
// 서버는 CONNECT 때 인증한 사용자로 채팅 보낸 사람과 개인 알림 대상을 정한다.
export function authConnectHeaders(baseHeaders = EMPTY_HEADERS) {
  const token = localStorage.getItem('accessToken');
  return token ? { ...baseHeaders, Authorization: `Bearer ${token}` } : { ...baseHeaders };
}

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
      reconnectDelay,
      beforeConnect: () => {
        client.connectHeaders = authConnectHeaders(connectHeaders);
      },
      onConnect: () => {
        onConnectRef.current?.();
        client.subscribe(topic, msg => onMessageRef.current?.(msg));
      },
      onDisconnect: (...args) => onDisconnectRef.current?.(...args),
      onWebSocketClose: (...args) => onDisconnectRef.current?.(...args),
    });
    client.activate();
    clientRef.current = client;
    return () => client.deactivate();
  }, [connectHeaders, onMessage, reconnectDelay, sockjsOptions, topic]);

  return clientRef;
}
