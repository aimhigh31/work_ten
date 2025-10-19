// material-ui
import { Theme } from '@mui/material/styles';
import CardMedia from '@mui/material/CardMedia';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project-imports
import MainCard from 'components/MainCard';

// assets
const cardBack = '/assets/images/widget/img-dropbox-bg.svg';
const WelcomeImage = '/assets/images/analytics/welcome-banner.png';

// ==============================|| ANALYTICS - WELCOME ||============================== //

export default function WelcomeBanner() {
  return (
    <MainCard
      border={false}
      sx={(theme: Theme) => ({
        color: 'background.paper',
        bgcolor: 'primary.darker',
        ...theme.applyStyles('dark', { color: 'text.primary', bgcolor: 'primary.400' }),
        '&:after': {
          content: '""',
          background: `url("${cardBack}") 100% 100% / cover no-repeat`,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          opacity: 0.5
        }
      })}
    >
      <Grid container>
        <Grid size={{ md: 6, sm: 6, xs: 12 }}>
          <Stack sx={{ gap: 2, padding: 3 }}>
            <Typography variant="h2">일상의 업무가 모여, 지속적인 혁신으로</Typography>
            <Typography variant="h6">NEXWORK는 더 쉽고 편하게, 한눈에 보이는 One-Platform 을 만들어 갑니다.</Typography>
            <Typography variant="h6">팀워크 시너지는 자신의 업무를 디테일하게 관리하는데서 시작합니다</Typography>
          </Stack>
        </Grid>
        <Grid sx={{ display: { xs: 'none', sm: 'initial' } }} size={{ sm: 6, xs: 12 }}>
          <Stack sx={{ justifyContent: 'center', alignItems: 'flex-end', position: 'relative', pr: { sm: 3, md: 8 }, zIndex: 2 }}>
            <CardMedia component="img" sx={{ width: 200 }} src={WelcomeImage} alt="Welcome" />
          </Stack>
        </Grid>
      </Grid>
    </MainCard>
  );
}
