import { ReactNode, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// material-ui
import { alpha } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import AppBar, { AppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';

// project-imports
import AppBarStyled from './AppBarStyled';
import HeaderContent from './HeaderContent';
import IconButton from 'components/@extended/IconButton';

import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';
import { DRAWER_WIDTH, MINI_DRAWER_WIDTH, MenuOrientation } from 'config';
import useConfig from 'hooks/useConfig';

// assets
import { HambergerMenu, Messages1 } from '@wandersonalwes/iconsax-react';

// ==============================|| MAIN LAYOUT - HEADER ||============================== //

export default function Header() {
  const router = useRouter();
  const downLG = useMediaQuery((theme) => theme.breakpoints.down('lg'));

  const { menuOrientation } = useConfig();
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downLG;

  // header content
  const headerContent = useMemo(() => <HeaderContent />, []);

  // common header
  const mainHeader: ReactNode = (
    <Toolbar sx={{ px: { xs: 2, sm: 2.5, md: 4.5, lg: 8 }, display: 'flex', justifyContent: 'space-between' }}>
      {/* 왼쪽: 축소하기 버튼과 AI-Chat 버튼 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {!isHorizontal ? (
          <IconButton
            aria-label="open drawer"
            onClick={() => handlerDrawerOpen(!drawerOpen)}
            edge="start"
            color="secondary"
            variant="light"
            size="large"
            sx={(theme) => ({
              color: 'secondary.main',
              ...(drawerOpen
                ? { bgcolor: 'secondary.100', ...theme.applyStyles('dark', { bgcolor: 'background.default' }) }
                : { bgcolor: 'secondary.200', ...theme.applyStyles('dark', { bgcolor: 'background.paper' }) }),
              ml: { xs: 0, lg: -2 },
              p: 1
            })}
          >
            <HambergerMenu />
          </IconButton>
        ) : (
          <div />
        )}

        {/* AI-Chat 버튼 */}
        <IconButton
          aria-label="AI Chat"
          onClick={() => router.push('/apps/chat')}
          color="secondary"
          variant="light"
          size="large"
          sx={(theme) => ({
            color: 'secondary.main',
            bgcolor: 'secondary.200',
            ...theme.applyStyles('dark', { bgcolor: 'background.paper' }),
            p: 1
          })}
        >
          <Messages1 />
        </IconButton>
      </Box>

      {/* 오른쪽: 나머지 모든 컨텐츠 */}
      {headerContent}
    </Toolbar>
  );

  // app-bar params
  const appBar: AppBarProps = {
    position: 'fixed',
    elevation: 0,
    sx: (theme) => ({
      bgcolor: alpha(theme.palette.background.default, 0.8),
      backdropFilter: 'blur(8px)',
      zIndex: 1200,
      width: isHorizontal
        ? '100%'
        : { xs: '100%', lg: drawerOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : `calc(100% - ${MINI_DRAWER_WIDTH}px)` }
    })
  };

  return (
    <>
      {!downLG ? (
        <AppBarStyled open={drawerOpen} {...appBar}>
          {mainHeader}
        </AppBarStyled>
      ) : (
        <AppBar {...appBar}>{mainHeader}</AppBar>
      )}
    </>
  );
}
