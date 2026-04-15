import { useState, useRef, useEffect } from 'react';
import api from '../api/axiosInstance';
import styles from '../styles/components/FloatingAiChat.module.css';

const FAQ_LIST = [
  {
    category: '계정 · 로그인',
    items: [
      {
        q: '로그인이 안 돼요.',
        a: '이메일과 비밀번호를 확인해주세요.\n로그인 5회 실패 시 계정이 잠기며, 잠긴 경우 관리자 해제가 필요합니다.\n이메일 인증을 완료하지 않은 경우에도 로그인이 차단됩니다.',
      },
      {
        q: '이메일 인증 메일이 안 왔어요.',
        a: '로그인 페이지에서 이메일 입력 후 "인증 메일 재발송" 버튼을 클릭해주세요.\n스팸 메일함도 확인해보세요. 재발송은 60초 간격으로 가능합니다.',
      },
      {
        q: '비밀번호를 잊어버렸어요.',
        a: '로그인 페이지 하단의 "비밀번호 찾기"를 클릭하세요.\n가입한 이메일로 재설정 링크가 발송되며, 링크는 1시간 동안 유효합니다.',
      },
      {
        q: '비밀번호는 어디서 변경하나요?',
        a: '프로필 페이지 > 계정 정보 탭 하단의 "비밀번호 변경" 섹션에서 변경할 수 있습니다.',
      },
      {
        q: '카카오 · 구글로 가입하면 비밀번호가 없나요?',
        a: '소셜 로그인으로 가입한 경우 별도의 비밀번호가 없습니다.\n소셜 계정을 통해서만 로그인할 수 있습니다.',
      },
      {
        q: '소셜 계정 연동은 어디서 하나요?',
        a: '프로필 페이지 > 계정 정보 탭의 "소셜 계정 연동" 섹션에서 카카오 · 구글 연동 및 해제가 가능합니다.',
      },
      {
        q: '프로필 사진은 어떻게 변경하나요?',
        a: '프로필 페이지 상단의 아바타 이미지를 클릭하면 사진을 업로드할 수 있습니다.\nJPG · PNG · GIF 형식을 지원합니다.',
      },
      {
        q: '회원 탈퇴는 어떻게 하나요?',
        a: '프로필 페이지 > 계정 정보 탭 하단의 "회원 탈퇴" 버튼을 클릭하면 됩니다.\n탈퇴 시 즐겨찾기 · 포트폴리오 · 알림 등 모든 데이터가 영구 삭제됩니다.',
      },
    ],
  },
  {
    category: '주식 · 대시보드',
    items: [
      {
        q: '실시간 시세는 어디서 확인하나요?',
        a: '화면 상단의 스크롤 티커에서 실시간 시세를 확인할 수 있습니다.\n대시보드 메인 테이블에서도 현재가 · 등락률을 실시간으로 볼 수 있습니다.',
      },
      {
        q: '종목 상세 정보는 어떻게 보나요?',
        a: '대시보드의 종목 테이블에서 원하는 종목을 클릭하면 상세 모달이 열립니다.\n차트 · 뉴스 · 즐겨찾기 · 목표가 알림 · AI 분석 기능을 모두 이용할 수 있습니다.',
      },
      {
        q: '캔들차트는 어디서 볼 수 있나요?',
        a: '종목 상세 모달 내 차트 탭에서 캔들스틱 차트를 확인할 수 있습니다.',
      },
      {
        q: '종목 관련 뉴스는 어디서 보나요?',
        a: '종목 상세 모달의 뉴스 탭에서 해당 종목의 최신 뉴스를 확인할 수 있습니다.\n대시보드 우측 패널에서도 실시간 주요 뉴스를 볼 수 있습니다.',
      },
      {
        q: '즐겨찾기는 어떻게 추가하나요?',
        a: '종목 상세 모달 상단의 ★ 아이콘을 클릭하면 즐겨찾기에 추가됩니다.\n추가된 종목은 프로필 > 즐겨찾기 탭에서 확인할 수 있습니다.',
      },
      {
        q: '종목 비교는 어디서 하나요?',
        a: '상단 네비게이션의 "종목 비교" 메뉴에서 최대 3개 종목의 주가를 동시에 비교할 수 있습니다.',
      },
      {
        q: '자동 새로고침은 어떻게 켜나요?',
        a: '상단 헤더 우측의 "갱신 ON / OFF" 버튼을 클릭하면 시세 자동 새로고침이 활성화됩니다.',
      },
    ],
  },
  {
    category: '포트폴리오 · 알림',
    items: [
      {
        q: '포트폴리오는 어디서 관리하나요?',
        a: '프로필 페이지 > 포트폴리오 탭에서 종목 추가 · 수정 · 삭제가 가능합니다.\n매수가 · 수량 · 매수일을 입력하면 현재 수익률이 자동 계산됩니다.',
      },
      {
        q: '포트폴리오 수익률은 어떻게 계산되나요?',
        a: '(현재가 - 매수가) × 보유수량으로 손익이 계산됩니다.\n현재가는 실시간 시세 데이터를 기준으로 합니다.',
      },
      {
        q: '포트폴리오 종목을 수정 · 삭제하려면?',
        a: '프로필 > 포트폴리오 탭에서 각 종목 우측의 수정 · 삭제 버튼을 클릭하면 됩니다.',
      },
      {
        q: '목표가 알림은 어떻게 설정하나요?',
        a: '종목 상세 모달 하단의 "목표가 알림" 섹션에서 목표가와 조건(이상 / 이하)을 설정합니다.\n목표가 도달 시 화면 상단에 토스트 알림이 표시됩니다.',
      },
      {
        q: '설정한 알림은 어디서 확인 · 삭제하나요?',
        a: '프로필 페이지 > 알림 관리 탭에서 등록된 목표가 알림 목록을 확인하고 삭제할 수 있습니다.',
      },
    ],
  },
  {
    category: 'AI 분석',
    items: [
      {
        q: 'AI 분석은 어떻게 사용하나요?',
        a: '두 가지 방법이 있습니다.\n① 종목 상세 모달 하단의 AI 분석 버튼 클릭\n② 이 채팅창의 "AI 종목 분석" 탭에서 종목코드와 질문 입력',
      },
      {
        q: 'AI 분석에서 어떤 정보를 알 수 있나요?',
        a: '주가 흐름 해석 · 거래량 평가 · 단기 투자 고려사항 · 리스크 요인 등을 분석해드립니다.\n포트폴리오 전체 분석도 지원합니다.',
      },
      {
        q: 'AI 분석 결과가 오래 걸려요.',
        a: 'AI 분석은 Claude AI를 통해 실시간으로 생성되어 10~30초 정도 소요될 수 있습니다.\n네트워크 상태에 따라 더 걸릴 수 있으니 잠시 기다려주세요.',
      },
    ],
  },
];

function renderText(text) {
  return text.split('\n\n').map((para, i) => {
    const lines = para.split('\n');
    return (
      <p key={i} className={styles.para}>
        {lines.map((line, j) => (
          <span key={j}>{line}{j < lines.length - 1 && <br />}</span>
        ))}
      </p>
    );
  });
}

export default function FloatingAiChat() {
  const [open,        setOpen]        = useState(false);
  const [mode,        setMode]        = useState('faq');
  const [openCat,     setOpenCat]     = useState(0);
  const [ticker,      setTicker]      = useState('');
  const [input,       setInput]       = useState('');
  const [faqMessages, setFaqMessages] = useState([]);
  const [aiMessages,  setAiMessages]  = useState([]);
  const [loading,     setLoading]     = useState(false);
  const bottomRef = useRef(null);

  const messages    = mode === 'faq' ? faqMessages : aiMessages;
  const setMessages = mode === 'faq' ? setFaqMessages : setAiMessages;

  const toggleCat = (i) => setOpenCat(prev => prev === i ? null : i);

  const findFaqAnswer = (text) => {
    const normalize = (s) => s.replace(/[?？.。\s은는이가을를에서으로의하나요어디서어떻게]/g, '').toLowerCase();
    const t = normalize(text);
    if (!t) return null;

    let bestItem  = null;
    let bestScore = 0;

    for (const cat of FAQ_LIST) {
      for (const item of cat.items) {
        const q = normalize(item.q);
        if (q.includes(t) || t.includes(q)) return item.a;

        let score = 0;
        for (let i = 0; i <= t.length - 2; i++) {
          for (let len = 2; len <= Math.min(6, t.length - i); len++) {
            if (q.includes(t.slice(i, i + len))) { score += len; break; }
          }
        }
        const ratio = score / (t.length * 3);
        if (ratio > bestScore) { bestScore = ratio; bestItem = item; }
      }
    }

    if (bestScore >= 0.3 && bestItem) return bestItem.a;
    return '죄송합니다. 해당 질문에 대한 답변을 준비 중입니다.\nAI 종목 분석 탭에서 더 자세한 분석을 받아보세요.';
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleFaqClick = (item) => {
    setMessages(prev => [
      ...prev,
      { role: 'user', text: item.q },
      { role: 'ai',   text: item.a },
    ]);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!ticker.trim() || !input.trim() || loading) return;
    const userText = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: `[${ticker.toUpperCase()}] ${userText}` }]);
    setInput('');
    setLoading(true);
    try {
      const prompt = `종목코드 또는 종목명: ${ticker}\n\n질문: ${userText}`;
      const res = await api.post('/ai/analyze', { prompt }, { timeout: 60000 });
      setMessages(prev => [...prev, { role: 'ai', text: res.data.analysis || '분석 결과를 가져오지 못했습니다.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'AI 분석 요청에 실패했습니다. 잠시 후 다시 시도해주세요.', error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleClear = () => setMessages([]);

  const handleClose = () => {
    setOpen(false);
    setFaqMessages([]);
    setAiMessages([]);
    setTicker('');
    setInput('');
    setMode('faq');
  };

  return (
    <div className={styles.container}>
      {open && (
        <div className={styles.panel}>

          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <span className={styles.headerIcon}>✦</span>
              {mode === 'faq' ? '도움말' : 'AI 주식 분석'}
            </div>
            <div className={styles.headerActions}>
              {messages.length > 0 && (
                <button className={styles.clearBtn} onClick={handleClear}>초기화</button>
              )}
              <button className={styles.closeBtn} onClick={handleClose}>✕</button>
            </div>
          </div>

          <div className={styles.modeTabs}>
            <button
              className={`${styles.modeTab} ${mode === 'faq' ? styles.modeTabActive : ''}`}
              onClick={() => setMode('faq')}>
              자주 묻는 질문
            </button>
            <button
              className={`${styles.modeTab} ${mode === 'ai' ? styles.modeTabActive : ''}`}
              onClick={() => setMode('ai')}>
              AI 종목 분석
            </button>
          </div>

          <div className={styles.messages}>

            {mode === 'faq' && (
              <div className={styles.faqSection}>
                {messages.length === 0 && (
                  <div className={styles.faqEmpty}>
                    <p className={styles.faqEmptyTitle}>무엇이 궁금하신가요?</p>
                    <p className={styles.faqEmptyHint}>아래 카테고리를 클릭해 질문을 선택하세요.</p>
                  </div>
                )}
                <div className={styles.faqList}>
                  {FAQ_LIST.map((cat, ci) => (
                    <div key={ci} className={styles.faqCategory}>
                      <button
                        className={`${styles.faqCategoryBtn} ${openCat === ci ? styles.faqCategoryOpen : ''}`}
                        onClick={() => toggleCat(ci)}>
                        <span>{cat.category}</span>
                        <span className={styles.faqArrow}>{openCat === ci ? '▲' : '▼'}</span>
                      </button>
                      {openCat === ci && (
                        <div className={styles.faqItems}>
                          {cat.items.map((item, ii) => (
                            <button key={ii} className={styles.faqBtn} onClick={() => handleFaqClick(item)}>
                              {item.q}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {messages.length === 0 && mode === 'ai' && (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>✦</span>
                <p>종목을 입력하고 궁금한 점을 물어보세요.</p>
                <p className={styles.emptyHint}>예: "현재 매수 타이밍인가요?", "리스크 요인 분석해줘"</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`${styles.msg} ${msg.role === 'user' ? styles.userMsg : styles.aiMsg} ${msg.error ? styles.errorMsg : ''}`}>
                {msg.role === 'ai' && <span className={styles.aiLabel}>✦ AI</span>}
                <div className={styles.bubble}>
                  {msg.role === 'ai' ? renderText(msg.text) : <p>{msg.text}</p>}
                </div>
              </div>
            ))}

            {loading && (
              <div className={`${styles.msg} ${styles.aiMsg}`}>
                <span className={styles.aiLabel}>✦ AI</span>
                <div className={styles.bubble}>
                  <div className={styles.dots}><span /><span /><span /></div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {mode === 'ai' && (
            <>
              <div className={styles.tickerBar}>
                <input
                  className={styles.tickerInput}
                  placeholder="종목명 또는 코드 (예: 삼성전자, 005930)"
                  value={ticker}
                  onChange={e => setTicker(e.target.value)}
                />
              </div>
              <div className={styles.inputBar}>
                <textarea
                  className={styles.input}
                  placeholder="질문을 입력하세요... (Enter 전송, Shift+Enter 줄바꿈)"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  disabled={loading}
                />
                <button
                  className={styles.sendBtn}
                  onClick={handleSend}
                  disabled={loading || !ticker.trim() || !input.trim()}>
                  전송
                </button>
              </div>
            </>
          )}

          {mode === 'faq' && (
            <div className={styles.faqInputBar}>
              <input
                className={styles.faqInput}
                placeholder="직접 질문을 입력하세요..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && input.trim()) {
                    handleFaqClick({ q: input.trim(), a: findFaqAnswer(input) });
                    setInput('');
                  }
                }}
              />
              <button
                className={styles.sendBtn}
                onClick={() => {
                  if (!input.trim()) return;
                  handleFaqClick({ q: input.trim(), a: findFaqAnswer(input) });
                  setInput('');
                }}
                disabled={!input.trim()}>
                전송
              </button>
            </div>
          )}

        </div>
      )}

      <button
        className={`${styles.fab} ${open ? styles.fabOpen : ''}`}
        onClick={() => setOpen(p => !p)}
        title="도움말 / AI 분석">
        {open ? '✕' : '✦'}
      </button>
    </div>
  );
}
