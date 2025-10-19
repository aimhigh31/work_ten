import type { Metadata } from 'next';

import './globals.css';

// project-imports
import ProviderWrapper from './ProviderWrapper';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Next.js 관리자 시스템',
  description: 'Next.js와 Material-UI로 구축된 현대적이고 강력한 관리자 대시보드 시스템입니다.'
};

export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactElement }) {
  return (
    <html lang="en" style={{ height: '100%', overflow: 'hidden' }}>
      <head>
        {/* 가장 먼저 실행되는 전역 오류 처리 스크립트 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // 즉시 실행하여 모든 것보다 먼저 오류 핸들러 등록
                const handleUnhandledRejection = function(event) {
                  const reason = event.reason;

                  // Event 객체 및 Next.js 개발환경 오류 필터링
                  if (reason && (
                    (reason.constructor && (
                      reason.constructor.name === 'Event' ||
                      reason.constructor.name === 'MouseEvent' ||
                      reason.constructor.name === 'PointerEvent' ||
                      reason.constructor.name === 'FocusEvent' ||
                      reason.constructor.name === 'KeyboardEvent' ||
                      reason.constructor.name === 'TouchEvent' ||
                      reason.constructor.name === 'WheelEvent' ||
                      reason.constructor.name === 'DragEvent'
                    )) ||
                    reason.toString().includes('[object Event]') ||
                    reason.toString().includes('react-dev-overlay') ||
                    reason.toString().includes('webpack-internal') ||
                    reason.toString().includes('ResizeObserver') ||
                    reason.toString().includes('_next/static') ||
                    (reason.message && (
                      reason.message.includes('react-dev-overlay') ||
                      reason.message.includes('webpack-internal') ||
                      reason.message.includes('ResizeObserver')
                    ))
                  )) {
                    // 개발 환경에서만 디버그 로그
                    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
                      console.debug('🔇 즉시 실행: Next.js 개발환경 오류 무시됨:', reason.constructor ? reason.constructor.name : reason.toString());
                    }
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    return true;
                  }
                  return false;
                };

                // 즉시 리스너 등록 (capture 단계, passive: false로 preventDefault 허용)
                window.addEventListener('unhandledrejection', handleUnhandledRejection, {
                  capture: true,
                  passive: false
                });

                // 전역 변수로 핸들러 저장 (나중에 접근 가능하도록)
                window.__nexworkErrorHandler = handleUnhandledRejection;
              })();
            `
          }}
        />
      </head>
      <body style={{ height: '100%', overflow: 'hidden', margin: 0, padding: 0, backgroundColor: '#ffffff' }}>
        <ProviderWrapper>{children}</ProviderWrapper>
      </body>
    </html>
  );
}
