'use client';

import { useState, MouseEvent, ReactNode } from 'react';

// material-ui
import Grid from '@mui/material/Grid2';
import ListItemButton from '@mui/material/ListItemButton';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project-imports
import MainCard from 'components/MainCard';
import Avatar from 'components/@extended/Avatar';
import IconButton from 'components/@extended/IconButton';
import MoreIcon from 'components/@extended/MoreIcon';

// types
import { ColorProps } from 'types/extended';

interface Props {
  title: string;
  count: string;
  percentage: ReactNode;
  iconPrimary: ReactNode;
  children: any;
  color?: ColorProps;
}

// ==============================|| CHART WIDGET - ECOMMERCE CARD  ||============================== //

export default function EcommerceDataCard({ title, count, percentage, color, iconPrimary, children }: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <MainCard>
      <Grid container spacing={2}>
        <Grid size={12}>
          <Stack direction="row" sx={{ gap: 2, alignItems: 'center' }}>
            <Avatar variant="rounded" color={color}>
              {iconPrimary}
            </Avatar>
            <Typography variant="subtitle1">{title}</Typography>
          </Stack>
        </Grid>
        <Grid size={12}>
          <MainCard content={false} border={false} sx={{ bgcolor: 'background.default', boxShadow: 'none' }}>
            <Box sx={{ p: 1.5, py: 1 }}>
              {children ? (
                <Grid container spacing={3}>
                  <Grid size={7}>{children}</Grid>
                  <Grid size={5}>
                    <Stack sx={{ gap: 1 }}>
                      <Typography variant="h5">{count}</Typography>
                      {percentage}
                    </Stack>
                  </Grid>
                </Grid>
              ) : (
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {count}
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                    |
                  </Typography>
                  {percentage}
                </Stack>
              )}
            </Box>
          </MainCard>
        </Grid>
      </Grid>
    </MainCard>
  );
}
