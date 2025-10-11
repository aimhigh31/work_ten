import React from 'react';
import { Card, CardContent, Box, Skeleton, Grid } from '@mui/material';

interface CardSkeletonProps {
  count?: number;
  height?: number;
}

/**
 * 카드 로딩 Skeleton UI
 * 대시보드 카드나 통계 카드 로딩 시 표시
 */
export default function CardSkeleton({ count = 4, height = 120 }: CardSkeletonProps) {
  return (
    <Grid container spacing={2}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid item xs={12} sm={6} md={3} key={`card-skeleton-${index}`}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Skeleton variant="text" width="60%" height={24} animation="wave" />
                <Skeleton variant="text" width="80%" height={40} animation="wave" />
                <Skeleton variant="text" width="40%" height={20} animation="wave" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
