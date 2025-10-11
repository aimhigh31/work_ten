import { useEffect, useState, ChangeEvent } from 'react';

// material-ui
import Button from '@mui/material/Button';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid2';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// third-party
import { PatternFormat } from 'react-number-format';

// project-imports
import Avatar from 'components/@extended/Avatar';
import MainCard from 'components/MainCard';
import { GRID_COMMON_SPACING, facebookColor, linkedInColor } from 'config';

// assets
import { Apple, Camera, Facebook, Google } from '@wandersonalwes/iconsax-react';

const avatarImage = '/assets/images/users';

// styles & constant
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP
    }
  }
};

// ==============================|| ACCOUNT PROFILE - PERSONAL ||============================== //

export default function TabPersonal() {
  const [selectedImage, setSelectedImage] = useState<File | undefined>(undefined);
  const [avatar, setAvatar] = useState<string | undefined>(`${avatarImage}/default.png`);

  useEffect(() => {
    if (selectedImage) {
      setAvatar(URL.createObjectURL(selectedImage));
    }
  }, [selectedImage]);

  const [experience, setExperience] = useState('0');

  const handleChange = (event: SelectChangeEvent<string>) => {
    setExperience(event.target.value);
  };

  return (
    <Grid container spacing={GRID_COMMON_SPACING}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <MainCard title="개인정보">
          <Grid container spacing={3}>
            <Grid size={12}>
              <Stack sx={{ gap: 2.5, alignItems: 'center', m: 3 }}>
                <FormLabel
                  htmlFor="change-avatar"
                  sx={{
                    position: 'relative',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    '&:hover .MuiBox-root': { opacity: 1 },
                    cursor: 'pointer'
                  }}
                >
                  <Avatar alt="Avatar 1" src={avatar} sx={{ width: 76, height: 76 }} />
                  <Box
                    sx={(theme) => ({
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bgcolor: 'rgba(0,0,0,.65)',
                      ...theme.applyStyles('dark', { bgcolor: 'rgba(255, 255, 255, .75)' }),
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    })}
                  >
                    <Stack sx={{ gap: 0.5, alignItems: 'center', color: 'secondary.lighter' }}>
                      <Camera style={{ fontSize: '1.5rem' }} />
                      <Typography variant="caption">업로드</Typography>
                    </Stack>
                  </Box>
                </FormLabel>
                <TextField
                  type="file"
                  id="change-avatar"
                  placeholder="Outlined"
                  variant="outlined"
                  sx={{ display: 'none' }}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSelectedImage(e.target.files?.[0])}
                />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack sx={{ gap: 1 }}>
                <InputLabel htmlFor="personal-first-name">이름</InputLabel>
                <TextField fullWidth defaultValue="철수" id="personal-first-name" placeholder="이름" autoFocus />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack sx={{ gap: 1 }}>
                <InputLabel htmlFor="personal-last-name">성</InputLabel>
                <TextField fullWidth defaultValue="김" id="personal-last-name" placeholder="성" />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack sx={{ gap: 1 }}>
                <InputLabel htmlFor="personal-location">국가</InputLabel>
                <TextField fullWidth defaultValue="대한민국" id="personal-location" placeholder="국가" />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack sx={{ gap: 1 }}>
                <InputLabel htmlFor="personal-zipcode">우편번호</InputLabel>
                <TextField fullWidth defaultValue="06292" id="personal-zipcode" placeholder="우편번호" />
              </Stack>
            </Grid>
            <Grid size={12}>
              <Stack sx={{ gap: 1 }}>
                <InputLabel htmlFor="personal-bio">소개</InputLabel>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  defaultValue="안녕하세요. 저는 김철수입니다. 웹사이트 기반의 창의적인 그래픽 디자이너 및 사용자 경험 디자이너입니다. 저는 더 아름답고 사용하기 쉬운 디지털 제품을 만들어 더 나은 공간을 창조합니다."
                  id="personal-bio"
                  placeholder="소개"
                />
              </Stack>
            </Grid>
            <Grid size={12}>
              <Stack sx={{ gap: 1 }}>
                <InputLabel htmlFor="personal-experience">경력</InputLabel>
                <Select fullWidth id="personal-experience" value={experience} onChange={handleChange} MenuProps={MenuProps}>
                  <MenuItem value="0">신입</MenuItem>
                  <MenuItem value="0.5">6개월</MenuItem>
                  <MenuItem value="1">1년</MenuItem>
                  <MenuItem value="2">2년</MenuItem>
                  <MenuItem value="3">3년</MenuItem>
                  <MenuItem value="4">4년</MenuItem>
                  <MenuItem value="5">5년</MenuItem>
                  <MenuItem value="6">6년</MenuItem>
                  <MenuItem value="10">10년 이상</MenuItem>
                </Select>
              </Stack>
            </Grid>
          </Grid>
        </MainCard>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Grid container spacing={GRID_COMMON_SPACING}>
          <Grid size={12}>
            <MainCard title="소셜 네트워크">
              <Stack sx={{ gap: 1 }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button
                    size="small"
                    startIcon={<Google variant="Bold" />}
                    sx={{ color: 'error.main', '&:hover': { bgcolor: 'transparent' } }}
                  >
                    구글
                  </Button>
                  <Button color="error">연결</Button>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button
                    size="small"
                    startIcon={<Facebook variant="Bold" style={{ color: facebookColor }} />}
                    sx={{ color: facebookColor, '&:hover': { bgcolor: 'transparent' } }}
                  >
                    페이스북
                  </Button>
                  <Typography variant="subtitle1" sx={{ color: facebookColor }}>
                    김철수
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button
                    size="small"
                    startIcon={<Apple variant="Bold" style={{ color: linkedInColor }} />}
                    sx={{ color: linkedInColor, '&:hover': { bgcolor: 'transparent' } }}
                  >
                    애플
                  </Button>
                  <Button color="error">연결</Button>
                </Stack>
              </Stack>
            </MainCard>
          </Grid>
          <Grid size={12}>
            <MainCard title="연락처 정보">
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack sx={{ gap: 1 }}>
                    <InputLabel htmlFor="personal-phone">전화번호</InputLabel>
                    <Stack direction="row" sx={{ gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                      <Select defaultValue="+82">
                        <MenuItem value="+82">+82</MenuItem>
                        <MenuItem value="91">+91</MenuItem>
                        <MenuItem value="1-671">1-671</MenuItem>
                        <MenuItem value="36">+36</MenuItem>
                        <MenuItem value="225">(255)</MenuItem>
                        <MenuItem value="39">+39</MenuItem>
                        <MenuItem value="1-876">1-876</MenuItem>
                        <MenuItem value="7">+7</MenuItem>
                        <MenuItem value="254">(254)</MenuItem>
                        <MenuItem value="373">(373)</MenuItem>
                        <MenuItem value="1-664">1-664</MenuItem>
                        <MenuItem value="95">+95</MenuItem>
                        <MenuItem value="264">(264)</MenuItem>
                      </Select>
                      <PatternFormat
                        format="+82 (###) ###-####"
                        mask="_"
                        fullWidth
                        customInput={TextField}
                        placeholder="전화번호"
                        defaultValue="02-1234-5678"
                        onBlur={() => {}}
                        onChange={() => {}}
                      />
                    </Stack>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack sx={{ gap: 1 }}>
                    <InputLabel htmlFor="personal-email">이메일 주소</InputLabel>
                    <TextField type="email" fullWidth defaultValue="kimcs@company.co.kr" id="personal-email" placeholder="이메일 주소" />
                  </Stack>
                </Grid>
                <Grid size={12}>
                  <Stack sx={{ gap: 1 }}>
                    <InputLabel htmlFor="personal-url">포트폴리오 URL</InputLabel>
                    <TextField fullWidth defaultValue="https://kimcs.company.co.kr" id="personal-url" placeholder="포트폴리오 URL" />
                  </Stack>
                </Grid>
                <Grid size={12}>
                  <Stack sx={{ gap: 1 }}>
                    <InputLabel htmlFor="personal-address">주소</InputLabel>
                    <TextField fullWidth defaultValue="서울특별시 강남구 테헤란로 123, 456호" id="personal-address" placeholder="주소" />
                  </Stack>
                </Grid>
              </Grid>
            </MainCard>
          </Grid>
        </Grid>
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
