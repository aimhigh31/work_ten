import { useState } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid2';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project-imports
import MainCard from 'components/MainCard';
import { GRID_COMMON_SPACING } from 'config';

// styles & constant
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = { PaperProps: { style: { maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP } } };

// ==============================|| ACCOUNT PROFILE - MY ACCOUNT ||============================== //

export default function TabAccount() {
  const [signing, setSigning] = useState('facebook');

  const handleChange = (event: SelectChangeEvent<string>) => {
    setSigning(event.target.value);
  };

  const [checked, setChecked] = useState(['sb', 'ln', 'la']);

  const handleToggle = (value: string) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
  };

  return (
    <Grid container spacing={GRID_COMMON_SPACING}>
      <Grid size={12}>
        <MainCard title="일반 설정">
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack sx={{ gap: 1 }}>
                <InputLabel htmlFor="my-account-username">사용자명</InputLabel>
                <TextField fullWidth defaultValue="kimcs_16" id="my-account-username" placeholder="사용자명" autoFocus />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack sx={{ gap: 1 }}>
                <InputLabel htmlFor="my-account-email">계정 이메일</InputLabel>
                <TextField fullWidth defaultValue="kimcs@company.co.kr" id="my-account-email" placeholder="계정 이메일" />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack sx={{ gap: 1 }}>
                <InputLabel htmlFor="my-account-lang">언어</InputLabel>
                <TextField fullWidth defaultValue="한국어" id="my-account-lang" placeholder="언어" />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack sx={{ gap: 1 }}>
                <InputLabel htmlFor="my-account-signing">로그인 방법</InputLabel>
                <Select fullWidth id="my-account-signing" value={signing} onChange={handleChange} MenuProps={MenuProps}>
                  <MenuItem value="form">기본 폼</MenuItem>
                  <MenuItem value="firebase">Firebase - 인증</MenuItem>
                  <MenuItem value="facebook">페이스북</MenuItem>
                  <MenuItem value="twitter">트위터</MenuItem>
                  <MenuItem value="gmail">Gmail</MenuItem>
                  <MenuItem value="jwt">JWT</MenuItem>
                  <MenuItem value="auth0">AUTH0</MenuItem>
                </Select>
              </Stack>
            </Grid>
          </Grid>
        </MainCard>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <MainCard title="고급 설정" content={false}>
          <List sx={{ p: 0 }}>
            <ListItem divider>
              <ListItemText id="switch-list-label-sb" primary="보안 브라우징" secondary="필요한 경우 안전하게 브라우징 (https)" />
              <Switch
                edge="end"
                onChange={handleToggle('sb')}
                checked={checked.indexOf('sb') !== -1}
                inputProps={{
                  'aria-labelledby': 'switch-list-label-sb'
                }}
              />
            </ListItem>
            <ListItem divider>
              <ListItemText id="switch-list-label-ln" primary="로그인 알림" secondary="다른 장소에서 로그인 시도 시 알림" />
              <Switch
                edge="end"
                onChange={handleToggle('ln')}
                checked={checked.indexOf('ln') !== -1}
                inputProps={{
                  'aria-labelledby': 'switch-list-label-ln'
                }}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                id="switch-list-label-la"
                primary="로그인 승인"
                secondary="인식되지 않은 기기에서 로그인 시 승인이 필요하지 않습니다."
              />
              <Switch
                edge="end"
                onChange={handleToggle('la')}
                checked={checked.indexOf('la') !== -1}
                inputProps={{
                  'aria-labelledby': 'switch-list-label-la'
                }}
              />
            </ListItem>
          </List>
        </MainCard>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <MainCard title="인식된 기기" content={false}>
          <List sx={{ p: 0 }}>
            <ListItem divider>
              <ListItemText primary="센트 데스크톱" secondary="서울특별시 강남구 테헤란로 123" />
              <Stack direction="row" sx={{ gap: 0.75, alignItems: 'center' }}>
                <Box sx={{ width: 6, height: 6, bgcolor: 'success.main', borderRadius: '50%' }} />
                <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>활성</Typography>
              </Stack>
            </ListItem>
            <ListItem divider>
              <ListItemText primary="이모 태블릿" secondary="서울특별시 서초구 강남대로 456" />
              <Stack direction="row" sx={{ gap: 0.75, alignItems: 'center' }}>
                <Box sx={{ width: 6, height: 6, bgcolor: 'secondary.main', borderRadius: '50%' }} />
                <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>5일 전 활성</Typography>
              </Stack>
            </ListItem>
            <ListItem>
              <ListItemText primary="앨버스 모바일" secondary="부산광역시 해운대구 마린시티 789" />
              <Stack direction="row" sx={{ gap: 0.75, alignItems: 'center' }}>
                <Box sx={{ width: 6, height: 6, bgcolor: 'secondary.main', borderRadius: '50%' }} />
                <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>1달 전 활성</Typography>
              </Stack>
            </ListItem>
          </List>
        </MainCard>
      </Grid>
      <Grid size={12}>
        <MainCard title="활성 세션" content={false}>
          <List sx={{ p: 0 }}>
            <ListItem divider>
              <ListItemText primary={<Typography variant="h5">센트 데스크톱</Typography>} secondary="서울특별시 강남구 테헤란로 123" />
              <Button>로그아웃</Button>
            </ListItem>
            <ListItem>
              <ListItemText primary={<Typography variant="h5">문 태블릿</Typography>} secondary="서울특별시 서초구 강남대로 456" />
              <Button>로그아웃</Button>
            </ListItem>
          </List>
        </MainCard>
      </Grid>
      <Grid size={12}>
        <Stack direction="row" sx={{ gap: 2, justifyContent: 'flex-end', alignItems: 'center' }}>
          <Button variant="outlined" color="secondary">
            취소
          </Button>
          <Button variant="contained">프로필 업데이트</Button>
        </Stack>
      </Grid>
    </Grid>
  );
}
