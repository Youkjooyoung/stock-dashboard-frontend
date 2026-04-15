import { useState } from 'react';
import api from '../api/axiosInstance';
import styles from '../styles/components/AiAnalysis.module.css';

/* ── 프롬프트 빌더 ─────────────────────────────────────── */
function buildStockPrompt(stock) {
  const changeSign = stock.vs > 0 ? '+' : '';
  return `다음 종목을 분석해주세요:

종목명: ${stock.itmsNm}
종목코드: ${stock.srtnCd}
현재 종가: ${(stock.clpr || 0).toLocaleString()}원
전일 대비: ${changeSign}${(stock.vs || 0).toLocaleString()}원 (${changeSign}${(stock.fltRt || 0)}%)
거래량: ${(stock.trqu || 0).toLocaleString()}주
시가총액: ${stock.mrktTotAmt ? Math.round(stock.mrktTotAmt / 100000000).toLocaleString() + '억원' : '정보 없음'}

위 정보를 바탕으로 다음을 분석해주세요:
1. 오늘 주가 흐름 해석
2. 거래량 수준 평가
3. 단기 투자 고려 사항
4. 리스크 요인`;
}

function buildPortfolioPrompt(portfolio, priceMap) {
  if (!portfolio.length) return null;

  let totalBuy = 0;
  let totalCur = 0;

  const items = portfolio.map(p => {
    const cur = priceMap[p.ticker] ?? p.buyPrice;
    const pnl = (cur - p.buyPrice) * p.quantity;
    const rate = p.buyPrice > 0 ? ((cur - p.buyPrice) / p.buyPrice * 100) : 0;
    totalBuy += p.buyPrice * p.quantity;
    totalCur += cur * p.quantity;
    return `  - ${p.stockName}(${p.ticker}): 매수가 ${p.buyPrice.toLocaleString()}원, 현재가 ${cur.toLocaleString()}원, ${p.quantity}주, 손익 ${pnl >= 0 ? '+' : ''}${Math.round(pnl).toLocaleString()}원 (${rate >= 0 ? '+' : ''}${rate.toFixed(2)}%)`;
  });

  const totalPnl = totalCur - totalBuy;
  const totalRate = totalBuy > 0 ? ((totalCur - totalBuy) / totalBuy * 100) : 0;

  return `다음 포트폴리오를 분석해주세요:

보유 종목 (${portfolio.length}개):
${items.join('\n')}

포트폴리오 요약:
  - 총 투자금액: ${Math.round(totalBuy).toLocaleString()}원
  - 총 평가금액: ${Math.round(totalCur).toLocaleString()}원
  - 총 손익: ${totalPnl >= 0 ? '+' : ''}${Math.round(totalPnl).toLocaleString()}원 (${totalRate >= 0 ? '+' : ''}${totalRate.toFixed(2)}%)

위 정보를 바탕으로 다음을 분석해주세요:
1. 포트폴리오 전체 성과 평가
2. 상위 손익 종목 코멘트
3. 분산 투자 관점에서의 조언
4. 리밸런싱 고려 사항`;
}

/* ── 텍스트 파싱 (빈 줄 → 단락 분리) ────────────────── */
function renderAnalysisText(text) {
  return text.split('\n\n').map((para, i) => {
    const lines = para.split('\n');
    return (
      <p key={i} className={styles['ai-para']}>
        {lines.map((line, j) => (
          <span key={j}>
            {line}
            {j < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    );
  });
}

/* ── 컴포넌트 ─────────────────────────────────────────── */
export default function AiAnalysis({ type, stock, portfolio, priceMap }) {
  const [analysis, setAnalysis] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const endpoint = '/ai/analyze';

  const buildPrompt = () => {
    if (type === 'stock') return buildStockPrompt(stock);
    return buildPortfolioPrompt(portfolio, priceMap || {});
  };

  const handleAnalyze = async () => {
    const prompt = buildPrompt();
    if (!prompt) {
      setError('분석할 데이터가 없습니다.');
      return;
    }
    setLoading(true);
    setAnalysis('');
    setError('');
    try {
      const res = await api.post(endpoint, { prompt }, { timeout: 60000 });
      setAnalysis(res.data.analysis || '');
    } catch (e) {
      const msg = e.response?.data?.error || e.message || 'AI 분석 요청에 실패했습니다.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const label = type === 'stock' ? '종목' : '포트폴리오';

  return (
    <div className={styles['ai-wrap']}>
      <div className={styles['ai-header']}>
        <div className={styles['ai-title']}>
          <span className={styles['ai-icon']}>✦</span>
          AI {label} 분석
        </div>
        <button
          className={styles['ai-btn']}
          onClick={handleAnalyze}
          disabled={loading}>
          {loading ? '분석 중...' : analysis ? '다시 분석' : 'AI 분석 시작'}
        </button>
      </div>

      {loading && (
        <div className={styles['ai-loading']}>
          <span className={styles['ai-dot']} />
          <span className={styles['ai-dot']} />
          <span className={styles['ai-dot']} />
          <span className={styles['ai-loading-text']}>Claude AI가 분석 중입니다</span>
        </div>
      )}

      {error && !loading && (
        <div className={styles['ai-error']}>{error}</div>
      )}

      {analysis && !loading && (
        <div className={styles['ai-result']}>
          {renderAnalysisText(analysis)}
        </div>
      )}

      {!loading && !analysis && !error && (
        <div className={styles['ai-placeholder']}>
          버튼을 눌러 AI 분석을 시작하세요.
        </div>
      )}
    </div>
  );
}
