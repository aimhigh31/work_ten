import React from 'react';
import { Box, Card, CardContent, Skeleton, Grid } from '@mui/material';

interface KanbanSkeletonProps {
  columns?: number;
  cardsPerColumn?: number;
}

/**
 * 칸반 보드 로딩 Skeleton UI
 * 칸반 뷰가 로딩 중일 때 표시
 */
export default function KanbanSkeleton({ columns = 4, cardsPerColumn = 3 }: KanbanSkeletonProps) {
  return (
    <Grid container spacing={2}>
      {Array.from({ length: columns }).map((_, columnIndex) => (
        <Grid item xs={12} sm={6} md={3} key={`kanban-column-${columnIndex}`}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* 컬럼 헤더 */}
            <Skeleton variant="text" width="60%" height={32} animation="wave" />

            {/* 카드들 */}
            {Array.from({ length: cardsPerColumn }).map((_, cardIndex) => (
              <Card key={`kanban-card-${columnIndex}-${cardIndex}`} sx={{ mb: 1 }}>
                <CardContent>
                  <Skeleton variant="text" width="80%" height={20} animation="wave" />
                  <Skeleton variant="text" width="60%" height={16} animation="wave" sx={{ mt: 1 }} />
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Skeleton variant="circular" width={32} height={32} animation="wave" />
                    <Skeleton variant="rectangular" width={60} height={24} animation="wave" />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}
