import { Component } from 'react';
import styles from '../styles/components/ErrorBoundary.module.css';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleLogin = () => {
    window.location.href = '/login';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className={styles['eb-wrap']}>
        <div className={styles['eb-box']}>
          <div className={styles['eb-icon']}>⚠️</div>
          <h2 className={styles['eb-title']}>오류가 발생했습니다</h2>
          <p className={styles['eb-message']}>
            예기치 않은 오류가 발생했습니다. 페이지를 새로고침 하거나 로그인 페이지로 이동해주세요.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className={styles['eb-detail']}>
              {this.state.error.message}
            </pre>
          )}
          <div className={styles['eb-actions']}>
            <button className={styles['eb-btn']} onClick={this.handleReload}>
              재시도
            </button>
            <button className={`${styles['eb-btn']} ${styles['eb-btn-secondary']}`} onClick={this.handleLogin}>
              로그인 페이지
            </button>
          </div>
        </div>
      </div>
    );
  }
}
