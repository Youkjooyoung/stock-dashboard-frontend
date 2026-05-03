/* eslint-disable react-refresh/only-export-components */
import { useState, useRef, useEffect } from 'react';
import styles from '../styles/components/StockTable.module.css';

const INITIALS    = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const HISTORY_KEY = 'stockSearchHistory';
const MAX_HISTORY = 8;

export function matchesInitial(name, query) {
  if (!/^[ㄱ-ㅎ]+$/.test(query)) return false;
  const initials = [...name].map(ch => {
    const code = ch.codePointAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) return INITIALS[Math.floor((code - 0xAC00) / 588)];
    return ch;
  }).join('');
  return initials.includes(query);
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}

function saveHistory(term) {
  if (!term.trim()) return;
  const prev = getHistory().filter(t => t !== term);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([term, ...prev].slice(0, MAX_HISTORY)));
}

export default function AutocompleteSearch({ stocks, value, onChange }) {
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
