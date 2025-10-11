'use client';

// material-ui
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project-imports
import EcommerceDataCard from 'components/cards/statistics/EcommerceDataCard';
import { GRID_COMMON_SPACING } from 'config';

import WelcomeBanner from 'sections/dashboard/default/WelcomeBanner';
import ProjectRelease from 'sections/dashboard/default/ProjectRelease';
import EcommerceDataChart from 'sections/widget/chart/EcommerceDataChart';
import TotalIncome from 'sections/widget/chart/TotalIncome';
import RepeatCustomerRate from 'sections/widget/chart/RepeatCustomerRate';
import ProjectOverview from 'sections/widget/chart/ProjectOverview';
import Transactions from 'sections/widget/data/Transactions';
import AssignUsers from 'sections/widget/statistics/AssignUsers';

// assets
import { ArrowUp2, Profile2User, Activity, Monitor, TrendUp } from '@wandersonalwes/iconsax-react';

// ==============================|| DASHBOARD - ADMIN ||============================== //

export default function DashboardDefault() {
  const theme = useTheme();

  return (
    <Grid container spacing={GRID_COMMON_SPACING}>
      <Grid size={12}>
        <WelcomeBanner />
      </Grid>
      {/* row 1 - Admin 통계 카드 */}
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <EcommerceDataCard
          title="총 사용자"
          count="1,234"
          iconPrimary={<Profile2User />}
          percentage={
            <Typography color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ArrowUp2 size={16} style={{ transform: 'rotate(45deg)' }} /> 12.5%
            </Typography>
          }
        >
          <EcommerceDataChart color={theme.palette.primary.main} />
        </EcommerceDataCard>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <EcommerceDataCard
          title="일일 방문자"
          count="856"
          color="warning"
          iconPrimary={<Activity />}
          percentage={
            <Typography sx={{ color: 'warning.dark', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ArrowUp2 size={16} style={{ transform: 'rotate(45deg)' }} /> 8.2%
            </Typography>
          }
        >
          <EcommerceDataChart color={theme.palette.warning.dark} />
        </EcommerceDataCard>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <EcommerceDataCard
          title="시스템 업타임"
          count="99.9%"
          color="success"
          iconPrimary={<Monitor />}
          percentage={
            <Typography sx={{ color: 'success.darker', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ArrowUp2 size={16} style={{ transform: 'rotate(45deg)' }} /> 0.1%
            </Typography>
          }
        >
          <EcommerceDataChart color={theme.palette.success.darker} />
        </EcommerceDataCard>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <EcommerceDataCard
          title="월간 성장률"
          count="15.3%"
          color="error"
          iconPrimary={<TrendUp />}
          percentage={
            <Typography sx={{ color: 'success.dark', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ArrowUp2 size={16} style={{ transform: 'rotate(45deg)' }} /> 2.1%
            </Typography>
          }
        >
          <EcommerceDataChart color={theme.palette.success.dark} />
        </EcommerceDataCard>
      </Grid>
      {/* row 2 - 차트 및 통계 */}
      <Grid size={{ xs: 12, md: 8, lg: 9 }}>
        <Grid container spacing={GRID_COMMON_SPACING}>
          <Grid size={12}>
            <RepeatCustomerRate />
          </Grid>
          <Grid size={12}>
            <ProjectOverview />
          </Grid>
        </Grid>
      </Grid>
      <Grid size={{ xs: 12, md: 4, lg: 3 }}>
        <Stack sx={{ gap: GRID_COMMON_SPACING }}>
          <ProjectRelease />
          <AssignUsers />
        </Stack>
      </Grid>
      {/* row 3 - 활동 및 수익 */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Transactions />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TotalIncome />
      </Grid>
    </Grid>
  );
}
