'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';

/**
 * 페이지 전환 애니메이션 Wrapper
 * pathname 변경 시 fade in 효과를 적용
 */

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <Box
      key={pathname}
      sx={{
        flex: 1,
        overflow: 'hidden',
        minHeight: 0,
        animation: 'pageTransitionFadeIn 0.3s ease-out',
        '@keyframes pageTransitionFadeIn': {
          '0%': {
            opacity: 0,
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)'
          }
        }
      }}
    >
      {children}
    </Box>
  );
}
