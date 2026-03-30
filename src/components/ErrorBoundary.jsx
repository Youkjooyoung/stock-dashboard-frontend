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

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // fallbackUrl이 있으면 이동, 없으면 현재 페이지 새로고침
    if (this.props.fallbackUrl) {
      window.location.href = this.props.fallbackUrl;
    } else {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { title = '오류가 발생했습니다', message } = this.props;

    return (
      <div className={styles['eb-wrap']}>
        <div className={styles['eb-box']}>
          <div className={styles['eb-icon']}>⚠️</div>
          <h2 className={styles['eb-title']}>{title}</h2>
          <p className={styles['eb-message']}>
            {message || '예기치 않은 오류가 발생했습니다. 페이지를 새로고침 해주세요.'}
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className={styles['eb-detail']}>
              {this.state.error.message}
            </pre>
          )}
          <button className={styles['eb-btn']} onClick={this.handleReset}>
            새로고침
          </button>
        </div>
      </div>
    );
  }
}
