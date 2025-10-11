'use client';

import { useState } from 'react';

// material-ui
import Button from '@mui/material/Button';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid2';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

// third-party
import { CopyToClipboard } from 'react-copy-to-clipboard';

// project-imports
import { openSnackbar } from 'api/snackbar';
import IconButton from 'components/@extended/IconButton';
import MainCard from 'components/MainCard';
import { GRID_COMMON_SPACING } from 'config';

// types
import { SnackbarProps } from 'types/snackbar';

// assets
import { Copy, Scissor } from '@wandersonalwes/iconsax-react';

// ==============================|| PLUGIN - CLIPBOARD ||============================== //

export default function ClipboardPage() {
  const [text1, setText1] = useState('https://ableproadmin.com/');
  const [text2, setText2] = useState(
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
  );
  const [text3] = useState(
    'Lorem ipsum cacilds, vidis litro abertis. Consetis adipiscings elitis. Pra lá , depois divoltis porris, paradis. Paisis, filhis, espiritis santis. Mé faiz elementum girarzis, nisi eros vermeio, in elementis mé pra quem é amistosis quis leo. Manduma pindureta quium dia nois paga.'
  );

  return (
    <Grid container spacing={GRID_COMMON_SPACING}>
      <Grid size={12}>
        <MainCard title="Copy from TextField">
          <Stack sx={{ gap: 1 }}>
            <InputLabel>Enter Website</InputLabel>
            <TextField
              fullWidth
              placeholder="Website"
              type="text"
              value={text1}
              onChange={(e) => {
                setText1(e.target.value);
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <CopyToClipboard
                        text={text1}
                        onCopy={() =>
                          openSnackbar({
                            open: true,
                            message: 'Text Copied',
                            variant: 'alert',
                            alert: {
                              color: 'success'
                            },
                            anchorOrigin: { vertical: 'top', horizontal: 'right' },
                            transition: 'SlideLeft'
                          } as SnackbarProps)
                        }
                      >
                        <Tooltip title="Copy">
                          <IconButton aria-label="Copy from another element" color="secondary" edge="end" size="large">
                            <Copy />
                          </IconButton>
                        </Tooltip>
                      </CopyToClipboard>
                    </InputAdornment>
                  )
                }
              }}
            />
          </Stack>
        </MainCard>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <MainCard title="Copy from TextArea">
          <Stack sx={{ gap: 1 }}>
            <InputLabel>Enter Text to Copy</InputLabel>
            <TextField
              multiline
              rows={4}
              fullWidth
              placeholder="Copy text"
              onChange={(e) => setText2(e.target.value)}
              value={text2}
              sx={{ mb: 2 }}
            />
          </Stack>
          <Stack sx={{ gap: 1.5, width: 'fit-content', flexDirection: 'row' }}>
            <CopyToClipboard
              text={text2}
              onCopy={() =>
                openSnackbar({
                  open: true,
                  message: 'Text Copied',
                  variant: 'alert',
                  alert: {
                    color: 'success'
                  },
                  anchorOrigin: { vertical: 'top', horizontal: 'right' },
                  transition: 'SlideLeft'
                } as SnackbarProps)
              }
            >
              <Button disabled={Boolean(!text2)} variant="contained" size="small" startIcon={<Copy />}>
                Copy
              </Button>
            </CopyToClipboard>
            <CopyToClipboard
              text={text2}
              onCopy={() => {
                setText2('');
                openSnackbar({
                  open: true,
                  message: 'Text Cut',
                  variant: 'alert',
                  alert: {
                    color: 'success'
                  },
                  anchorOrigin: { vertical: 'top', horizontal: 'right' },
                  transition: 'SlideLeft'
                } as SnackbarProps);
              }}
            >
              <Button disabled={Boolean(!text2)} variant="contained" size="small" color="error" startIcon={<Scissor />}>
                Cut
              </Button>
            </CopyToClipboard>
          </Stack>
        </MainCard>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <MainCard
          title="Copy from Container"
          secondary={
            <CopyToClipboard
              text={text3}
              onCopy={() =>
                openSnackbar({
                  open: true,
                  message: 'Text Copied',
                  variant: 'alert',
                  alert: {
                    color: 'success'
                  },
                  anchorOrigin: { vertical: 'top', horizontal: 'right' },
                  transition: 'SlideLeft'
                } as SnackbarProps)
              }
            >
              <Tooltip title="Copy">
                <IconButton size="large">
                  <Copy />
                </IconButton>
              </Tooltip>
            </CopyToClipboard>
          }
        >
          <CardContent sx={{ p: 0, pb: 2.5 }}>{text3}</CardContent>
        </MainCard>
      </Grid>
    </Grid>
  );
}
