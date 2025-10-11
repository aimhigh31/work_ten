'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClearCookiesPage() {
  const router = useRouter();

  useEffect(() => {
    // 모든 쿠키 삭제
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // localStorage 삭제
    localStorage.clear();

    // sessionStorage 삭제
    sessionStorage.clear();

    alert('모든 쿠키와 저장소가 삭제되었습니다. 로그인 페이지로 이동합니다.');

    // 로그인 페이지로 리다이렉션
    setTimeout(() => {
      router.push('/login');
    }, 500);
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '24px'
    }}>
      쿠키 삭제 중...
    </div>
  );
}
