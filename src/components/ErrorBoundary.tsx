import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('🔴 ErrorBoundary - getDerivedStateFromError:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔴 ErrorBoundary - componentDidCatch:', error, errorInfo);

    // Unhandled promise rejection 처리
    if (error.message.includes('[object Event]')) {
      console.error('🔴 Detected unhandled promise rejection');
      // 에러 상태를 리셋하여 앱이 계속 동작하도록 함
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 100);
    }
  }

  componentDidMount() {
    // 전역 unhandled promise rejection 핸들러 (강화된 Next.js 호환성)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Next.js 개발 환경 특정 오류들을 더 포괄적으로 필터링
      const reason = event.reason;

      // 1. Event 객체 오류 필터링
      if (
        reason &&
        (reason.constructor?.name === 'Event' ||
          reason.toString().includes('[object Event]') ||
          reason.toString().includes('[object MouseEvent]') ||
          reason.toString().includes('[object PointerEvent]') ||
          reason.toString().includes('[object FocusEvent]') ||
          reason.toString().includes('[object KeyboardEvent]'))
      ) {
        console.debug('🟡 Next.js Event 객체 오류 무시됨:', reason.constructor?.name);
        event.preventDefault();
        return;
      }

      // 2. ResizeObserver 오류 필터링
      if (reason && (reason.toString().includes('ResizeObserver') || reason.message?.includes('ResizeObserver'))) {
        console.debug('🟡 ResizeObserver 오류 무시됨');
        event.preventDefault();
        return;
      }

      // 3. Next.js 개발 오버레이 관련 오류 필터링
      if (
        reason &&
        (reason.toString().includes('react-dev-overlay') ||
          reason.toString().includes('webpack-internal') ||
          reason.message?.includes('react-dev-overlay') ||
          reason.message?.includes('webpack-internal'))
      ) {
        console.debug('🟡 Next.js 개발 오버레이 오류 무시됨');
        event.preventDefault();
        return;
      }

      // 4. 빈 오류나 null/undefined 필터링
      if (!reason || reason === null || reason === undefined) {
        console.debug('🟡 빈 오류 무시됨');
        event.preventDefault();
        return;
      }

      // 5. 빈 객체 {} 필터링
      if (
        typeof reason === 'object' &&
        reason !== null &&
        Object.keys(reason).length === 0 &&
        reason.constructor === Object
      ) {
        console.debug('🟡 빈 객체 오류 무시됨');
        event.preventDefault();
        return;
      }

      // 실제 애플리케이션 에러만 로깅
      console.error('🔴 Global Unhandled Promise Rejection:', reason);

      if (reason instanceof Error) {
        console.error('🔴 Actual application error:', reason.message);
        console.error('🔴 Stack:', reason.stack);
      }

      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      console.error('🔴 Global Error Event:', event.error || event.message);

      if (event.error && event.error.message && event.error.message.includes('[object Event]')) {
        event.preventDefault();
        return;
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // 정리 함수를 인스턴스 변수에 저장
    (this as any).cleanup = () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }

  componentWillUnmount() {
    if ((this as any).cleanup) {
      (this as any).cleanup();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', border: '1px solid #ff6b6b', borderRadius: '4px', margin: '20px' }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Error details</summary>
            {this.state.error?.message}
            <br />
            {this.state.error?.stack}
          </details>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
