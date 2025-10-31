'use client';

// material-ui
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// project-imports
import { GRID_COMMON_SPACING } from 'config';
import { useMenuPermission } from 'hooks/usePermissions';

import NewOrders from 'sections/widget/chart/NewOrders';
import NewUsers from 'sections/widget/chart/NewUsers';
import Visitors from 'sections/widget/chart/Visitors';

import DropboxStorage from 'sections/widget/statistics/DropboxStorage';
import SwitchBalanace from 'sections/widget/statistics/SwitchBalanace';

import ProjectAnalytics from 'sections/widget/chart/ProjectAnalytics';

import EcommerceIncome from 'sections/widget/chart/EcommerceIncome';
import LanguagesSupport from 'sections/widget/chart/LanguagesSupport';

import ProductOverview from 'sections/widget/chart/ProductOverview';

import PaymentHistory from 'sections/widget/data/PaymentHistory';
import EcommerceRadial from 'sections/widget/chart/EcommerceRadial';

// ==============================|| DASHBOARD - ANALYTICS ||============================== //

export default function DashboardAnalytics() {
  const { canViewCategory, canReadData, canCreateData, canEditOwn, canEditOthers, loading: permissionLoading } = useMenuPermission('/dashboard/analytics');

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 3 }}>
      {/* 권한 체크: 카테고리 보기만 있는 경우 */}
      {canViewCategory && !canReadData ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
            py: 8
          }}
        >
          <Typography variant="h5" color="text.secondary">
            이 페이지에 대한 데이터 조회 권한이 없습니다.
          </Typography>
          <Typography variant="body2" color="text.disabled">
            관리자에게 권한을 요청하세요.
          </Typography>
        </Box>
      ) : (
        <>
          {/* 기존 컨텐츠 시작 */}
          <Grid container spacing={GRID_COMMON_SPACING}>
            {/* row 1 */}
      <Grid size={{ xs: 12, md: 4, lg: 3 }}>
        <NewOrders />
      </Grid>
      <Grid size={{ xs: 12, md: 4, lg: 3 }}>
        <NewUsers />
      </Grid>
      <Grid size={{ xs: 12, md: 4, lg: 3 }}>
        <Visitors />
      </Grid>
      <Grid size={{ xs: 12, md: 4, lg: 3 }}>
        <Grid container spacing={GRID_COMMON_SPACING}>
          <Grid size={12}>
            <DropboxStorage />
          </Grid>
          <Grid size={12}>
            <SwitchBalanace />
          </Grid>
        </Grid>
      </Grid>
      {/* row 2 */}
      <Grid size={12}>
        <ProjectAnalytics />
      </Grid>
      {/* row 3 */}
      <Grid size={{ xs: 12, lg: 3 }}>
        <Grid container spacing={GRID_COMMON_SPACING}>
          <Grid size={{ xs: 12, md: 6, lg: 12 }}>
            <EcommerceIncome />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 12 }}>
            <LanguagesSupport />
          </Grid>
        </Grid>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <ProductOverview />
      </Grid>
      <Grid size={{ xs: 12, lg: 3 }}>
        <Grid container spacing={GRID_COMMON_SPACING}>
          <Grid size={{ xs: 12, md: 6, lg: 12 }}>
            <PaymentHistory />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 12 }}>
            <Stack sx={{ gap: GRID_COMMON_SPACING }}>
              <EcommerceRadial color="primary.main" />
              <EcommerceRadial color="error.dark" />
            </Stack>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
          {/* 기존 컨텐츠 끝 */}
        </>
      )}
    </Box>
  );
}
