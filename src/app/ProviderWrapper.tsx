'use client';

import { ReactElement, useEffect, useLayoutEffect } from 'react';

// next
import { SessionProvider } from 'next-auth/react';

// project-imports
import ThemeCustomization from 'themes';
import { ConfigProvider } from 'contexts/ConfigContext';
import { CommonDataProvider } from 'contexts/CommonDataContext'; // ⭐ 공용 창고
import RTLLayout from 'components/RTLLayout';
import Locales from 'components/Locales';
import ScrollTop from 'components/ScrollTop';

import Notistack from 'components/third-party/Notistack';
import Customization from 'components/customization';
import Snackbar from 'components/@extended/Snackbar';
import ErrorBoundary from 'components/ErrorBoundary';
import NProgressBar from 'components/NProgressBar';

// ==============================|| PROVIDER WRAPPER  ||============================== //

export default function ProviderWrapper({ children }: { children: ReactElement }) {
  // 전역 오류 처리 훅 (Next.js 내부 핸들러보다 먼저 실행)
  useLayoutEffect(() => {
    // Next.js 개발 오버레이에서 발생하는 [object Event] 오류 처리
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;

      // Next.js 개발 환경 관련 오류들을 포괄적으로 필터링
      if (
        reason &&
        // Event 객체들 (모든 DOM 이벤트 타입)
        (reason.constructor?.name === 'Event' ||
          reason.constructor?.name === 'MouseEvent' ||
          reason.constructor?.name === 'PointerEvent' ||
          reason.constructor?.name === 'FocusEvent' ||
          reason.constructor?.name === 'KeyboardEvent' ||
          reason.constructor?.name === 'TouchEvent' ||
          reason.constructor?.name === 'WheelEvent' ||
          reason.constructor?.name === 'DragEvent' ||
          reason.constructor?.name === 'ClipboardEvent' ||
          reason.constructor?.name === 'InputEvent' ||
          // 문자열 검사 (모든 Event 객체)
          reason.toString().includes('[object Event]') ||
          reason.toString().includes('[object MouseEvent]') ||
          reason.toString().includes('[object PointerEvent]') ||
          reason.toString().includes('[object FocusEvent]') ||
          reason.toString().includes('[object KeyboardEvent]') ||
          reason.toString().includes('[object TouchEvent]') ||
          reason.toString().includes('[object WheelEvent]') ||
          reason.toString().includes('[object DragEvent]') ||
          reason.toString().includes('[object ClipboardEvent]') ||
          reason.toString().includes('[object InputEvent]') ||
          // Next.js 개발 환경 관련
          reason.toString().includes('react-dev-overlay') ||
          reason.toString().includes('webpack-internal') ||
          reason.toString().includes('ResizeObserver') ||
          reason.toString().includes('_next/static') ||
          reason.toString().includes('hot-reload') ||
          reason.toString().includes('fast-refresh') ||
          reason.message?.includes('react-dev-overlay') ||
          reason.message?.includes('webpack-internal') ||
          reason.message?.includes('ResizeObserver') ||
          reason.message?.includes('_next/static') ||
          reason.message?.includes('hot-reload') ||
          reason.message?.includes('fast-refresh') ||
          // 빈 오류나 의미없는 오류들
          reason === null ||
          reason === undefined ||
          reason === '' ||
          (typeof reason === 'string' && reason.trim() === ''))
      ) {
        // 개발 환경에서만 디버그 로그
        if (process.env.NODE_ENV === 'development') {
          console.debug(`🔇 Next.js 개발환경 오류 무시됨: ${reason.constructor?.name || reason.toString()}`);
        }
        event.preventDefault();
        return;
      }

      // 빈 객체 {} 필터링
      if (typeof reason === 'object' && reason !== null && Object.keys(reason).length === 0 && reason.constructor === Object) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('🔇 빈 객체 오류 무시됨');
        }
        event.preventDefault();
        return;
      }

      // 실제 애플리케이션 오류만 로깅
      console.error('🔴 실제 애플리케이션 오류:', reason);
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      // 개발 오버레이 관련 오류 필터링
      if (
        event.filename?.includes('react-dev-overlay') ||
        event.filename?.includes('webpack-internal') ||
        event.message?.includes('react-dev-overlay') ||
        event.message?.includes('webpack-internal') ||
        event.message?.includes('ResizeObserver loop limit exceeded') ||
        event.message?.includes('Script error') ||
        (!event.message && !event.error && event.filename?.includes('chrome-extension')) ||
        (!event.message && !event.error && !event.filename) // undefined 에러 필터링
      ) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('🔇 Next.js 개발환경 Error 무시됨:', event.message || 'No message');
        }
        event.preventDefault();
        return;
      }

      // 에러 상세 정보 수집
      let errorDetails = 'Unknown error';
      if (event.error) {
        errorDetails = event.error.toString();
      } else if (event.message) {
        errorDetails = event.message;
      } else if (event.filename || event.lineno !== undefined || event.colno !== undefined) {
        errorDetails = `Unknown error at ${event.filename || 'unknown'}:${event.lineno || 'unknown'}:${event.colno || 'unknown'}`;
      }

      // 개발 환경에서만 상세 로그 출력
      if (process.env.NODE_ENV === 'development') {
        console.debug('🔍 글로벌 Error 상세:', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
          stack: event.error?.stack
        });
      }

      console.error('🔴 실제 글로벌 Error:', errorDetails);
    };

    // 전역 이벤트 리스너 등록 (capture 단계에서 최우선으로 처리)
    window.addEventListener('unhandledrejection', handleUnhandledRejection, { capture: true });
    window.addEventListener('error', handleError, { capture: true });

    // 즉시 기존 콘솔 메서드를 패치하여 [object Event] 오류 억제
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      // 빈 객체 {} 필터링
      if (
        args.length === 1 &&
        typeof args[0] === 'object' &&
        args[0] !== null &&
        Object.keys(args[0]).length === 0 &&
        args[0].constructor === Object
      ) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('🔇 빈 객체 콘솔 오류 무시됨');
        }
        return;
      }

      // [object Event] 관련 오류 필터링
      const errorString = args.join(' ');
      if (errorString.includes('[object Event]') || errorString.includes('react-dev-overlay') || errorString.includes('webpack-internal')) {
        // 개발 환경에서만 디버그로 표시
        if (process.env.NODE_ENV === 'development') {
          console.debug('🔇 콘솔 오류 무시됨:', ...args);
        }
        return;
      }
      originalConsoleError(...args);
    };

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, { capture: true });
      window.removeEventListener('error', handleError, { capture: true });
      // 콘솔 패치 복원
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <ErrorBoundary>
      <div style={{ height: '100vh', overflow: 'hidden' }}>
        <NProgressBar />
        <ConfigProvider>
          <ThemeCustomization>
            <RTLLayout>
              <Locales>
                <ScrollTop>
                  <SessionProvider refetchInterval={0}>
                    <CommonDataProvider>
                      {/* 🏪 공용 창고: 모든 페이지에서 users, departments, masterCodes 공유 */}
                      <Notistack>
                        <Snackbar />
                        {children}
                      </Notistack>
                    </CommonDataProvider>
                  </SessionProvider>
                </ScrollTop>
              </Locales>
            </RTLLayout>
          </ThemeCustomization>
        </ConfigProvider>
      </div>
    </ErrorBoundary>
  );
}
