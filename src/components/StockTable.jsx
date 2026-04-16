import { useState, useRef, useEffect, useMemo } from 'react';
import usePriceFlash from '../hooks/usePriceFlash';
import styles from '../styles/components/StockTable.module.css';

const SS_KEY = 'stockTableState';

function loadState() {
  try { return JSON.parse(sessionStorage.getItem(SS_KEY) || '{}'); } catch { return {}; }
}

function saveState(state) {
  try { sessionStorage.setItem(SS_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

// ── 한국어 초성 검색 ────────────────────────────────────────
const INITIALS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';

function extractInitials(str) {
  return [...str].map(ch => {
    const code = ch.codePointAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3)
      return INITIALS[Math.floor((code - 0xAC00) / 588)];
    return ch;
  }).join('');
}

function matchesInitial(name, query) {
  if (!/^[ㄱ-ㅎ]+$/.test(query)) return false;
  return extractInitials(name).includes(query);
}

const COLUMNS = [
  { key: 'srtnCd',  label: '종목코드', sortable: true  },
  { key: 'itmsNm',  label: '종목명',   sortable: true  },
  { key: 'mrktCtg', label: '시장',     sortable: true  },
  { key: 'mkp',     label: '시가',     sortable: true  },
  { key: 'clpr',    label: '종가',     sortable: true  },
  { key: 'hipr',    label: '고가',     sortable: true  },
  { key: 'lopr',    label: '저가',     sortable: true  },
  { key: 'trqu',    label: '거래량',   sortable: true  },
  { key: 'rate',    label: '등락',     sortable: true  },
  { key: 'watch',   label: '★',       sortable: false },
];

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];
const HISTORY_KEY = 'stockSearchHistory';
const MAX_HISTORY = 8;

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}

function saveHistory(term) {
  if (!term.trim()) return;
  const prev = getHistory().filter(t => t !== term);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([term, ...prev].slice(0, MAX_HISTORY)));
}

/* 검색 자동완성 + 검색 히스토리 */
function AutocompleteSearch({ stocks, value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory]         = useState([]);
  const [show, setShow]               = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) setShow(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleChange = (val) => {
    onChange(val);
    if (val.trim().length < 1) {
      setSuggestions([]);
      const h = getHistory();
      setHistory(h);
      setShow(h.length > 0);
      return;
    }
    const matched = stocks
      .filter(s =>
        s.itmsNm?.includes(val) ||
        s.srtnCd?.includes(val) ||
        matchesInitial(s.itmsNm || '', val)
      )
      .slice(0, 8);
    setSuggestions(matched);
    setHistory([]);
    setShow(matched.length > 0);
  };

  const handleFocus = () => {
    if (!value.trim()) {
      const h = getHistory();
      setHistory(h);
      setShow(h.length > 0);
    }
  };

  const handleSelect = (stock) => {
    onChange(stock.itmsNm);
    saveHistory(stock.itmsNm);
    setSuggestions([]);
    setHistory([]);
    setShow(false);
  };

  const handleHistorySelect = (term) => {
    onChange(term);
    saveHistory(term);
    setShow(false);
  };

  const clearHistory = (e) => {
    e.stopPropagation();
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
    setShow(false);
  };

  const showHistorySection = history.length > 0 && !value.trim();
  const showSuggestSection = suggestions.length > 0;

  return (
    <div ref={wrapRef} className={styles['search-wrap']}>
      <span className={styles['search-icon']} aria-hidden="true">
        <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7" cy="7" r="5"/>
          <path d="m14 14-3.5-3.5"/>
        </svg>
      </span>
      <input
        className={styles['search-input']}
        placeholder="종목명 또는 코드 검색"
        value={value}
        onChange={e => handleChange(e.target.value)}
        onFocus={handleFocus}
        autoComplete="off"
      />
      {show && (showHistorySection || showSuggestSection) && (
        <div className={styles['autocomplete-dropdown']}>
          {showHistorySection && (
            <>
              <div className={styles['autocomplete-section-header']}>
                <span>최근 검색</span>
                <button className={styles['autocomplete-clear-btn']} onMouseDown={clearHistory}>지우기</button>
              </div>
              {history.map((term, i) => (
                <div
                  key={i}
                  className={`${styles['autocomplete-item']} ${styles['history-item']}`}
                  onMouseDown={() => handleHistorySelect(term)}>
                  <span className={styles['autocomplete-name']}>
                    <span className={styles['autocomplete-history-icon']} aria-hidden="true">
                      <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="8" cy="8" r="6"/>
                        <path d="M8 4.5V8l2.5 1.5"/>
                      </svg>
                    </span>
                    {term}
                  </span>
                </div>
              ))}
            </>
          )}
          {showSuggestSection && suggestions.map((s, i) => (
            <div
              key={i}
              className={styles['autocomplete-item']}
              onMouseDown={() => handleSelect(s)}>
              <span className={styles['autocomplete-name']}>{s.itmsNm}</span>
              <span className={styles['autocomplete-code']}>{s.srtnCd}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* CSV 내보내기 */
function exportCSV(data) {
  const headers = ['종목코드', '종목명', '시장', '시가', '종가', '고가', '저가', '거래량', '등락률(%)'];
  const rows = data.map(d => [
    d.srtnCd, d.itmsNm, d.mrktCtg || 'KOSPI',
    d.mkp || 0, d.clpr || 0, d.hipr || 0, d.lopr || 0, d.trqu || 0,
    d.rate?.toFixed(2) || '0.00'
  ]);
  const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stock_data_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function StockTable({
  stocks, watchlist, tab, search,
  onTabChange, onSearchChange, onRowClick, onToggleWatch
}) {
  const _s = loadState();
  const [sortKey, setSortKey]           = useState(_s.sortKey    ?? 'trqu');
  const [sortDir, setSortDir]           = useState(_s.sortDir    ?? 'desc');
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState(_s.pageSize   ?? 10);
  const [filterOpen, setFilterOpen]     = useState(false);
  const [filterMarket, setFilterMarket] = useState(_s.filterMarket   ?? 'all');
  const [filterRateMin, setFilterRateMin] = useState(_s.filterRateMin ?? '');
  const [filterRateMax, setFilterRateMax] = useState(_s.filterRateMax ?? '');
  const [filterVolMin, setFilterVolMin]   = useState(_s.filterVolMin  ?? '');

  // 상태 변경 시 sessionStorage에 저장
  useEffect(() => {
    saveState({ sortKey, sortDir, pageSize, filterMarket, filterRateMin, filterRateMax, filterVolMin });
  }, [sortKey, sortDir, pageSize, filterMarket, filterRateMin, filterRateMax, filterVolMin]);

  const handleSort = (key) => {
    if (!key || key === 'watch') return;
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  };

  const handleSearch    = (val) => { onSearchChange(val); setPage(1); };
  const handleTabChange = (t)   => { onTabChange(t);      setPage(1); };
  const handlePageSize  = (e)   => { setPageSize(Number(e.target.value)); setPage(1); };

  const resetFilters = () => {
    setFilterMarket('all');
    setFilterRateMin('');
    setFilterRateMax('');
    setFilterVolMin('');
    setPage(1);
  };

  const hasActiveFilter = filterMarket !== 'all' || filterRateMin !== '' || filterRateMax !== '' || filterVolMin !== '';

  // 성능 최적화: 검색, 필터링, 정렬 로직 메모이제이션 (입력 지연 방지)
  const filtered = useMemo(() => {
    return stocks
      .filter(d => {
        const matchSearch =
          (d.itmsNm || '').includes(search) ||
          (d.srtnCd || '').includes(search) ||
          matchesInitial(d.itmsNm || '', search);
        return tab === 'watch' ? matchSearch && watchlist.includes(d.itemId) : matchSearch;
      })
      .map(d => {
        const open  = d.mkp  || 0;
        const close = d.clpr || 0;
        const rate  = open > 0 ? ((close - open) / open * 100) : 0;
        return { ...d, rate };
      })
      .filter(d => {
        const market = d.mrktCtg || 'KOSPI';
        if (filterMarket !== 'all' && market !== filterMarket) return false;
        if (filterRateMin !== '' && d.rate < Number(filterRateMin)) return false;
        if (filterRateMax !== '' && d.rate > Number(filterRateMax)) return false;
        if (filterVolMin  !== '' && (d.trqu || 0) < Number(filterVolMin)) return false;
        return true;
      })
      .sort((a, b) => {
        let av = a[sortKey], bv = b[sortKey];
        if (typeof av === 'string') av = av.toLowerCase();
        if (typeof bv === 'string') bv = bv.toLowerCase();
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ?  1 : -1;
        return 0;
      });
  }, [stocks, watchlist, tab, search, filterMarket, filterRateMin, filterRateMax, filterVolMin, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  const paginated = useMemo(() => {
    return filtered.slice((page - 1) * pageSize, page * pageSize);
  }, [filtered, page, pageSize]);

  const flashMap = usePriceFlash(paginated);

  const getPageNumbers = () => {
    const delta = 2;
    const left  = Math.max(1, page - delta);
    const right = Math.min(totalPages, page + delta);
    const pages = [];
    for (let i = left; i <= right; i++) pages.push(i);
    return pages;
  };

  const SortIcon = ({ colKey }) => {
    if (!COLUMNS.find(c => c.key === colKey)?.sortable) return null;
    if (sortKey !== colKey) return <span className={styles['sort-icon']}>⇅</span>;
    return <span className={`${styles['sort-icon']} ${styles.active}`}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className={styles['table-box']}>

      {/* 툴바 */}
      <div className={styles['table-toolbar']}>
        <div className={styles['table-toolbar-left']}>
          <div className={styles['stock-tab-group']}>
            <button
              className={`${styles['stock-tab-btn']} ${tab === 'all' ? styles.active : ''}`}
              onClick={() => handleTabChange('all')}>
              전체
            </button>
            <button
              className={`${styles['stock-tab-btn']} ${tab === 'watch' ? styles.active : ''}`}
              onClick={() => handleTabChange('watch')}>
              즐겨찾기 ★
            </button>
          </div>
          <button
            className={`${styles['filter-toggle-btn']} ${filterOpen ? styles.active : ''} ${hasActiveFilter ? styles['has-filter'] : ''}`}
            onClick={() => setFilterOpen(p => !p)}>
            필터{hasActiveFilter ? ' ●' : ''}
          </button>
        </div>
        <div className={styles['table-toolbar-right']}>
          <button
            className={styles['csv-export-btn']}
            onClick={() => exportCSV(filtered)}
            title="현재 목록 CSV 다운로드">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8 2v9"/>
              <path d="M4.5 7.5 8 11l3.5-3.5"/>
              <path d="M2.5 13.5h11"/>
            </svg>
            CSV
          </button>
          <div className={styles['page-size-wrap']}>
            <span className={styles['page-size-label']}>페이지당</span>
            <select
              className={styles['page-size-select']}
              value={pageSize}
              onChange={handlePageSize}>
              {PAGE_SIZE_OPTIONS.map(n => (
                <option key={n} value={n}>{n}개</option>
              ))}
            </select>
          </div>
          <AutocompleteSearch
            stocks={stocks}
            value={search}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* 필터 패널 */}
      {filterOpen && (
        <div className={styles['filter-panel']}>
          <div className={styles['filter-panel-inner']}>
            <div className={styles['filter-group']}>
              <label className={styles['filter-label']}>시장</label>
              <div className={styles['filter-btn-group']}>
                {['all', 'KOSPI', 'KOSDAQ'].map(m => (
                  <button
                    key={m}
                    className={`${styles['filter-chip']} ${filterMarket === m ? styles.active : ''}`}
                    onClick={() => { setFilterMarket(m); setPage(1); }}>
                    {m === 'all' ? '전체' : m}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles['filter-group']}>
              <label className={styles['filter-label']}>등락률 (%)</label>
              <div className={styles['filter-range']}>
                <input
                  type="number"
                  className={styles['filter-input']}
                  placeholder="최소"
                  value={filterRateMin}
                  onChange={e => { setFilterRateMin(e.target.value); setPage(1); }}
                />
                <span className={styles['filter-range-sep']}>~</span>
                <input
                  type="number"
                  className={styles['filter-input']}
                  placeholder="최대"
                  value={filterRateMax}
                  onChange={e => { setFilterRateMax(e.target.value); setPage(1); }}
                />
              </div>
            </div>
            <div className={styles['filter-group']}>
              <label className={styles['filter-label']}>거래량 최소</label>
              <input
                type="number"
                className={`${styles['filter-input']} ${styles.wide}`}
                placeholder="예: 100000"
                value={filterVolMin}
                onChange={e => { setFilterVolMin(e.target.value); setPage(1); }}
              />
            </div>
            {hasActiveFilter && (
              <button className={styles['filter-reset-btn']} onClick={resetFilters}>초기화</button>
            )}
          </div>
        </div>
      )}

      {/* 테이블 (데스크톱) */}
      <table className={styles['stock-table']}>
        <thead>
          <tr>
            {COLUMNS.map(col => (
              <th
                key={col.key}
                className={col.sortable ? styles.sortable : ''}
                onClick={() => col.sortable && handleSort(col.key)}>
                {col.label}
                <SortIcon colKey={col.key} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginated.length === 0 ? (
            <tr>
              <td colSpan={10} className={styles['table-empty']}>
                {tab === 'watch' ? '즐겨찾기한 종목이 없습니다.' : '검색 결과가 없습니다.'}
              </td>
            </tr>
          ) : paginated.map((d, i) => {
            const open      = d.mkp  || 0;
            const close     = d.clpr || 0;
            const rate      = d.rate;
            const diff      = close - open;
            const cls       = rate > 0 ? 'up' : rate < 0 ? 'down' : 'zero';
            const sign      = rate > 0 ? '▲' : rate < 0 ? '▼' : '-';
            const isWatched = watchlist.includes(d.itemId);
            const flash     = flashMap.get(d.itemId);
            const flashCls  = flash === 'up' ? styles['flash-up'] : flash === 'down' ? styles['flash-down'] : '';
            return (
              <tr key={i} onClick={() => onRowClick(d)} className={flashCls}>
                <td><span className={styles['stock-code']}>{d.srtnCd}</span></td>
                <td><span className={styles['stock-name']}>{d.itmsNm}</span></td>
                <td>
                  <span className="market-badge">{d.mrktCtg || 'KOSPI'}</span>
                </td>
                <td>{open.toLocaleString()}</td>
                <td className={cls} style={{ fontWeight: 700 }}>{close.toLocaleString()}</td>
                <td>{(d.hipr || 0).toLocaleString()}</td>
                <td>{(d.lopr || 0).toLocaleString()}</td>
                <td style={{ color: 'var(--text-3)' }}>{(d.trqu || 0).toLocaleString()}</td>
                <td className={cls}>
                  <div className={styles['change-cell']}>
                    <span className={styles['change-diff']}>{sign} {Math.abs(diff).toLocaleString()}</span>
                    <span className={styles['change-rate']}>({rate.toFixed(2)}%)</span>
                  </div>
                </td>
                <td onClick={e => { e.stopPropagation(); onToggleWatch(d.itemId); }}>
                  <span className={`${styles['watch-star']} ${isWatched ? styles.active : styles.inactive}`}>
                    {isWatched ? '★' : '☆'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 모바일 카드 뷰 */}
      <div className={styles['stock-cards']}>
        {paginated.length === 0 ? (
          <div className={styles['stock-cards-empty']}>
            {tab === 'watch' ? '즐겨찾기한 종목이 없습니다.' : '검색 결과가 없습니다.'}
          </div>
        ) : paginated.map((d, i) => {
          const open      = d.mkp  || 0;
          const close     = d.clpr || 0;
          const rate      = d.rate;
          const diff      = close - open;
          const cls       = rate > 0 ? 'up' : rate < 0 ? 'down' : 'zero';
          const sign      = rate > 0 ? '▲' : rate < 0 ? '▼' : '-';
          const isWatched = watchlist.includes(d.itemId);
          const flash     = flashMap.get(d.itemId);
          const flashCls  = flash === 'up' ? styles['flash-up'] : flash === 'down' ? styles['flash-down'] : '';
          return (
            <div key={i} className={`${styles['stock-card']} ${flashCls}`} onClick={() => onRowClick(d)}>
              <div className={styles['stock-card-top']}>
                <div className={styles['stock-card-info']}>
                  <span className={styles['stock-name']}>{d.itmsNm}</span>
                  <span className={styles['stock-code']}>{d.srtnCd}</span>
                  <span className="market-badge">{d.mrktCtg || 'KOSPI'}</span>
                </div>
                <span
                  className={`${styles['watch-star']} ${isWatched ? styles.active : styles.inactive}`}
                  onClick={e => { e.stopPropagation(); onToggleWatch(d.itemId); }}>
                  {isWatched ? '★' : '☆'}
                </span>
              </div>
              <div className={styles['stock-card-bottom']}>
                <div className={styles['stock-card-price']}>
                  <span className={`${styles['stock-card-close']} ${cls}`}>{close.toLocaleString()}원</span>
                  <span className={`${styles['stock-card-rate']} ${cls}`}>
                    {sign} {Math.abs(diff).toLocaleString()} ({rate.toFixed(2)}%)
                  </span>
                </div>
                <div className={styles['stock-card-vol']}>거래량 {(d.trqu || 0).toLocaleString()}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 푸터 (페이지네이션) */}
      {filtered.length > 0 && (
        <div className={styles['table-footer']}>
          <span className={styles['table-count']}>
            총 {filtered.length}개 ·&nbsp;
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} 표시
          </span>
          <div className={styles.pagination}>
            <button className={styles['page-btn']} onClick={() => setPage(1)}                          disabled={page === 1}>«</button>
            <button className={styles['page-btn']} onClick={() => setPage(p => Math.max(1, p - 1))}   disabled={page === 1}>‹</button>
            {getPageNumbers().map(n => (
              <button key={n} className={`${styles['page-btn']} ${n === page ? styles.active : ''}`} onClick={() => setPage(n)}>{n}</button>
            ))}
            <button className={styles['page-btn']} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
            <button className={styles['page-btn']} onClick={() => setPage(totalPages)}                 disabled={page === totalPages}>»</button>
          </div>
        </div>
      )}
    </div>
  );
}
