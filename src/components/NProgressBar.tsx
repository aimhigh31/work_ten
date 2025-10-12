'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

/**
 * NProgress 로딩바 컴포넌트
 * 페이지 전환 시 상단에 로딩 바를 표시하여 즉각적인 피드백 제공
 * 체감 속도를 대폭 향상시킴
 */

// NProgress 설정
NProgress.configure({
  showSpinner: false, // 우측 하단 스피너 제거
  trickleSpeed: 200, // 자동 진행 속도
  minimum: 0.08, // 최소 진행률
  easing: 'ease', // 애니메이션 easing
  speed: 400 // 애니메이션 속도
});

export default function NProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 페이지 전환 시작
    NProgress.start();

    // 페이지 로드 완료
    const handleComplete = () => {
      NProgress.done();
    };

    // 약간의 지연 후 완료 처리 (데이터 로드 시간 고려)
    const timer = setTimeout(handleComplete, 100);

    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [pathname, searchParams]);

  return null;
}
