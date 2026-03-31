import { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '../api/axiosInstance';
import styles from '../styles/components/StockChat.module.css';

export default function StockChat({ ticker, stockName }) {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);
  const bottomRef = useRef(null);

  const email    = localStorage.getItem('userEmail') || '';
  const nickname = localStorage.getItem('kakaoNickname') || email.split('@')[0] || '익명';
  const token    = localStorage.getItem('accessToken') || '';

  useEffect(() => {
    api.get(`/chat/${ticker}`)
      .then(res => setMessages(res.data))
      .catch(() => {});
  }, [ticker]);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(import.meta.env.VITE_API_BASE_URL + '/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/chat/${ticker}`, msg => {
          const data = JSON.parse(msg.body);
          setMessages(prev => [...prev, data]);
        });
      },
      onDisconnect: () => setConnected(false),
      reconnectDelay: 3000,
    });
    client.activate();
    clientRef.current = client;
    return () => client.deactivate();
  }, [ticker]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const content = input.trim();
    if (!content || !clientRef.current?.connected) return;
    clientRef.current.publish({
      destination: `/app/chat/${ticker}`,
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nickname, content }),
    });
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const isMyMessage = (msg) => msg.userEmail === email;

  return (
    <div className={styles['chat-wrap']}>
      <div className={styles['chat-header']}>
        <span className={styles['chat-title']}>💬 {stockName} 토론</span>
        <span className={`${styles['chat-status-dot']} ${connected ? styles.connected : styles.disconnected}`} />
        <span className={styles['chat-status-text']}>{connected ? '연결됨' : '연결 중..'}</span>
      </div>

      <div className={styles['chat-message-list']}>
        {messages.length === 0 && (
          <div className={styles['chat-empty']}>첫 번째 의견을 남겨보세요!</div>
        )}
        {messages.map((msg, i) => {
          const isMine = isMyMessage(msg);
          return (
            <div key={i} className={`${styles['chat-msg-row']} ${isMine ? styles.mine : styles.other}`}>
              {!isMine && (
                <div className={styles['chat-avatar']}>
                  {msg.nickname?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={styles['chat-msg-body']}>
                {!isMine && <p className={styles['chat-msg-nickname']}>{msg.nickname}</p>}
                <div className={`${styles['chat-bubble']} ${isMine ? styles.mine : styles.other}`}>
                  {msg.content}
                </div>
                <p className={`${styles['chat-msg-time']} ${isMine ? styles.mine : styles.other}`}>
                  {formatTime(msg.createdAt)}
                </p>
              </div>
              {isMine && (
                <div className={`${styles['chat-avatar']} ${styles.mine}`}>
                  {nickname?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className={styles['chat-input-row']}>
        <input
          className={styles['chat-input']}
          placeholder="의견을 입력하세요.. (Enter로 전송)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={200}
          disabled={!connected}
        />
        <button
          className={styles['chat-send-btn']}
          onClick={sendMessage}
          disabled={!connected || !input.trim()}>
          전송
        </button>
      </div>
    </div>
  );
}
