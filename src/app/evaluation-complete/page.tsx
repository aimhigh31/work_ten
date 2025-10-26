import { Box, Container, Paper, Typography, Button } from '@mui/material';
import Link from 'next/link';

export const metadata = {
  title: '평가 제출 완료',
  description: '평가가 성공적으로 제출되었습니다.'
};

export default function EvaluationCompletePage() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 6, textAlign: 'center' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h3" sx={{ mb: 2, color: '#4caf50', fontWeight: 600 }}>
            ✓
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            평가가 제출되었습니다
          </Typography>
          <Typography variant="body1" color="text.secondary">
            소중한 의견 감사합니다. 평가가 성공적으로 제출되었습니다.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            이 창을 닫으셔도 됩니다.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
