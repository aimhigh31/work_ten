// material-ui
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project-imports
import AnimateButton from 'components/@extended/AnimateButton';
import MainCard from 'components/MainCard';

// ==============================|| DRAWER CONTENT - NAV CARD ||============================== //

export default function NavCard() {
  return (
    <MainCard sx={{ bgcolor: 'secondary.lighter', m: 3 }}>
      <Stack sx={{ gap: 2.5, alignItems: 'center' }}>
        <Typography sx={{ fontSize: '48px' }}>📖</Typography>
        <Stack sx={{ alignItems: 'center' }}>
          <Typography variant="h5">시스템 매뉴얼</Typography>
          <Typography variant="h6" color="secondary">
            Manual 바로가기
          </Typography>
        </Stack>
        <AnimateButton>
          <Button variant="shadow" size="small" disabled>
            Manual 바로가기
          </Button>
        </AnimateButton>
      </Stack>
    </MainCard>
  );
}
