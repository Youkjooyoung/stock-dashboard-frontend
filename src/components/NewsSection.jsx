import { useState } from 'react';
import { useNews } from '../hooks/useQueries';
import { formatNewsDate } from '../utils/dateUtils';
import styles from '../styles/components/NewsSection.module.css';

function NewsSkeleton() {
  return (
    <div className={styles['news-skeleton']}>
      {[...Array(5)].map((_, i) => (
        <div key={i} className={styles['news-skeleton-item']}>
          <div className={`skeleton ${styles['news-skeleton-title']}`} />
          <div className={`skeleton ${styles['news-skeleton-desc']}`} />
          <div className={`skeleton ${styles['news-skeleton-desc']} ${styles.short}`} />
        </div>
      ))}
    </div>
  );
}

export default function NewsSection({ stockName }) {
  const [query, setQuery] = useState(stockName || '코스피');
  const [inputVal, setInputVal] = useState(query);

  const { data: news = [], isLoading } = useNews(query);

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(inputVal.trim() || '코스피');
  };

  return (
    <div className={styles['news-box']}>
      <div className={styles['news-header']}>
        <h2 className={styles['news-title']}>주식 뉴스</h2>
        <form className={styles['news-search-form']} onSubmit={handleSearch}>
          <input
            className={styles['news-search-input']}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="종목명 또는 키워드"
          />
          <button type="submit" className={styles['news-search-btn']}>검색</button>
        </form>
      </div>

      {isLoading ? (
        <NewsSkeleton />
      ) : (
        <div className={styles['news-list']}>
          {news.length > 0 ? news.map((n, i) => (
            <a key={i}
              href={n.originallink || n.link}
              target="_blank"
              rel="noreferrer"
              className={styles['news-item']}>
              <div className={styles['news-item-header']}>
                <span className={styles['news-item-title']}>{n.title}</span>
                <span className={styles['news-item-date']}>{formatNewsDate(n.pubDate)}</span>
              </div>
              <p className={styles['news-item-desc']}>{n.description}</p>
            </a>
          )) : (
            <div className={styles['news-empty']}>뉴스가 없습니다.</div>
          )}
        </div>
      )}
    </div>
  );
}
