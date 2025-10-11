import React from 'react';
import { Box, Card, CardContent, Skeleton } from '@mui/material';

interface ChartSkeletonProps {
  height?: number;
  showTitle?: boolean;
}

/**
 * 차트 로딩 Skeleton UI
 * 대시보드 차트가 로딩 중일 때 표시
 */
export default function ChartSkeleton({ height = 300, showTitle = true }: ChartSkeletonProps) {
  return (
    <Card>
      <CardContent>
        {showTitle && (
          <Skeleton variant="text" width="40%" height={28} animation="wave" sx={{ mb: 2 }} />
        )}
        <Skeleton variant="rectangular" width="100%" height={height} animation="wave" />
      </CardContent>
    </Card>
  );
}
