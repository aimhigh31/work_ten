// material-ui
import { Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { PatternFormat } from 'react-number-format';

// project-imports
import Avatar from 'components/@extended/Avatar';
import LinearWithLabel from 'components/@extended/progress/LinearWithLabel';
import MainCard from 'components/MainCard';
import { GRID_COMMON_SPACING } from 'config';

// assets
import { CallCalling, Gps, Link1, Sms } from '@wandersonalwes/iconsax-react';

const avatarImage = '/assets/images/users';

// ==============================|| ACCOUNT PROFILE - BASIC ||============================== //

export default function TabProfile() {
  const downMD = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));

  return (
    <Grid container spacing={GRID_COMMON_SPACING}>
      <Grid size={{ xs: 12, sm: 5, md: 4, xl: 3 }}>
        <Grid container spacing={GRID_COMMON_SPACING}>
          <Grid size={12}>
            <MainCard>
              <Grid container spacing={3}>
                <Grid size={12}>
                  <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
                    <Chip label="프로" size="small" color="primary" />
                  </Stack>
                  <Stack sx={{ gap: 2.5, alignItems: 'center' }}>
                    <Avatar alt="Avatar 1" size="xl" src={`${avatarImage}/default.png`} />
                    <Stack sx={{ gap: 0.5, alignItems: 'center' }}>
                      <Typography variant="h5">김철수</Typography>
                      <Typography color="secondary">프로젝트 매니저</Typography>
                    </Stack>
                  </Stack>
                </Grid>
                <Grid size={12}>
                  <Divider />
                </Grid>
                <Grid size={12}>
                  <Stack direction="row" sx={{ justifyContent: 'space-around', alignItems: 'center' }}>
                    <Stack sx={{ gap: 0.5, alignItems: 'center' }}>
                      <Typography variant="h5">86</Typography>
                      <Typography color="secondary">게시물</Typography>
                    </Stack>
                    <Divider orientation="vertical" flexItem />
                    <Stack sx={{ gap: 0.5, alignItems: 'center' }}>
                      <Typography variant="h5">40</Typography>
                      <Typography color="secondary">프로젝트</Typography>
                    </Stack>
                    <Divider orientation="vertical" flexItem />
                    <Stack sx={{ gap: 0.5, alignItems: 'center' }}>
                      <Typography variant="h5">4.5K</Typography>
                      <Typography color="secondary">구성원</Typography>
                    </Stack>
                  </Stack>
                </Grid>
                <Grid size={12}>
                  <Divider />
                </Grid>
                <Grid size={12}>
                  <List component="nav" aria-label="main mailbox folders" sx={{ py: 0, '& .MuiListItem-root': { p: 0, py: 1 } }}>
                    <ListItem secondaryAction={<Typography align="right">kimcs@company.co.kr</Typography>}>
                      <ListItemIcon>
                        <Sms size={18} />
                      </ListItemIcon>
                    </ListItem>
                    <ListItem secondaryAction={<Typography align="right">(+82) 02-1234-5678</Typography>}>
                      <ListItemIcon>
                        <CallCalling size={18} />
                      </ListItemIcon>
                    </ListItem>
                    <ListItem secondaryAction={<Typography align="right">서울</Typography>}>
                      <ListItemIcon>
                        <Gps size={18} />
                      </ListItemIcon>
                    </ListItem>
                    <ListItem
                      secondaryAction={
                        <Link align="right" href="https://google.com" target="_blank">
                          https://kimcs.company.co.kr
                        </Link>
                      }
                    >
                      <ListItemIcon>
                        <Link1 size={18} />
                      </ListItemIcon>
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </MainCard>
          </Grid>
          <Grid size={12}>
            <MainCard title="기술">
              <Grid container spacing={1.25}>
                <Grid size={6}>
                  <Typography color="secondary">주니어</Typography>
                </Grid>
                <Grid size={6}>
                  <LinearWithLabel value={30} />
                </Grid>
                <Grid size={6}>
                  <Typography color="secondary">UX 리서처</Typography>
                </Grid>
                <Grid size={6}>
                  <LinearWithLabel value={80} />
                </Grid>
                <Grid size={6}>
                  <Typography color="secondary">워드프레스</Typography>
                </Grid>
                <Grid size={6}>
                  <LinearWithLabel value={90} />
                </Grid>
                <Grid size={6}>
                  <Typography color="secondary">HTML</Typography>
                </Grid>
                <Grid size={6}>
                  <LinearWithLabel value={30} />
                </Grid>
                <Grid size={6}>
                  <Typography color="secondary">그래픽 디자인</Typography>
                </Grid>
                <Grid size={6}>
                  <LinearWithLabel value={95} />
                </Grid>
                <Grid size={6}>
                  <Typography color="secondary">코딩 스타일</Typography>
                </Grid>
                <Grid size={6}>
                  <LinearWithLabel value={75} />
                </Grid>
              </Grid>
            </MainCard>
          </Grid>
        </Grid>
      </Grid>
      <Grid size={{ xs: 12, sm: 7, md: 8, xl: 9 }}>
        <Grid container spacing={GRID_COMMON_SPACING}>
          <Grid size={12}>
            <MainCard title="자기소개">
              <Typography color="secondary">
                안녕하세요. 저는 김철수입니다. 웹사이트 기반의 창의적인 그래픽 디자이너 및 사용자 경험 디자이너입니다. 저는 더 아름답고
                사용하기 쉬운 디지털 제품을 만들어 더 나은 공간을 창조합니다.
              </Typography>
            </MainCard>
          </Grid>
          <Grid size={12}>
            <MainCard title="개인정보">
              <List sx={{ py: 0 }}>
                <ListItem divider={!downMD}>
                  <Grid container spacing={3} size={12}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Stack sx={{ gap: 0.5 }}>
                        <Typography color="secondary">성명</Typography>
                        <Typography>김철수</Typography>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Stack sx={{ gap: 0.5 }}>
                        <Typography color="secondary">부친성함</Typography>
                        <Typography>김영호</Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </ListItem>
                <ListItem divider={!downMD}>
                  <Grid container spacing={3} size={12}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Stack sx={{ gap: 0.5 }}>
                        <Typography color="secondary">전화번호</Typography>
                        <Typography>
                          (+82) <PatternFormat value="0212345678" displayType="text" type="text" format="##-####-####" />
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Stack sx={{ gap: 0.5 }}>
                        <Typography color="secondary">국가</Typography>
                        <Typography>대한민국</Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </ListItem>
                <ListItem divider={!downMD}>
                  <Grid container spacing={3} size={12}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Stack sx={{ gap: 0.5 }}>
                        <Typography color="secondary">이메일</Typography>
                        <Typography>kimcs@company.co.kr</Typography>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Stack sx={{ gap: 0.5 }}>
                        <Typography color="secondary">우편번호</Typography>
                        <Typography>06292</Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </ListItem>
                <ListItem>
                  <Stack sx={{ gap: 0.5 }}>
                    <Typography color="secondary">주소</Typography>
                    <Typography>서울특별시 강남구 테헤란로 123, 456호</Typography>
                  </Stack>
                </ListItem>
              </List>
            </MainCard>
          </Grid>
          <Grid size={12}>
            <MainCard title="학력">
              <List sx={{ py: 0 }}>
                <ListItem divider>
                  <Grid container spacing={{ xs: 0.5, md: 3 }} size={12}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Stack sx={{ gap: 0.5 }}>
                        <Typography color="secondary">석사 학위 (연도)</Typography>
                        <Typography>2014-2017</Typography>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Stack sx={{ gap: 0.5 }}>
                        <Typography color="secondary">교육기관</Typography>
                        <Typography>서울대학교</Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </ListItem>
                <ListItem divider>
                  <Grid container spacing={{ xs: 0.5, md: 3 }} size={12}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Stack sx={{ gap: 0.5 }}>
                        <Typography color="secondary">학사 학위 (연도)</Typography>
                        <Typography>2011-2013</Typography>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Stack sx={{ gap: 0.5 }}>
                        <Typography color="secondary">교육기관</Typography>
                        <Typography>연세대학교</Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </ListItem>
                <ListItem>
                  <Grid container spacing={{ xs: 0.5, md: 3 }} size={12}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Stack sx={{ gap: 0.5 }}>
                        <Typography color="secondary">고등학교 (연도)</Typography>
                        <Typography>2009-2011</Typography>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Stack sx={{ gap: 0.5 }}>
                        <Typography color="secondary">교육기관</Typography>
                        <Typography>강남고등학교</Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </ListItem>
              </List>
            </MainCard>
          </Grid>
          <Grid size={12}>
            <MainCard title="경력">
              <List sx={{ py: 0 }}>
                <ListItem divider>
                  <Grid container spacing={{ xs: 0.5, md: 3 }} size={12}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Stack sx={{ gap: 0.5 }}>
                        <Typography color="secondary">수석 UI/UX 디자이너 (연도)</Typography>
                        <Typography>2019-현재</Typography>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Stack sx={{ gap: 0.5 }}>
                        <Typography color="secondary">직무책임</Typography>
                        <Typography>
                          100명 이상의 팀을 관리하며 프로젝트 매니저 관련 업무를 수행합니다. 팀 관리가 이 회사에서의 핵심 역할입니다.
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </ListItem>
                <ListItem>
                  <Grid container spacing={{ xs: 0.5, md: 3 }} size={12}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Stack sx={{ gap: 0.5 }}>
                        <Typography color="secondary">인턴 겸 프로젝트 매니저 (연도)</Typography>
                        <Typography>2017-2019</Typography>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Stack sx={{ gap: 0.5 }}>
                        <Typography color="secondary">직무책임</Typography>
                        <Typography>이 회사에서 팀 관리가 핵심 역할입니다.</Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </ListItem>
              </List>
            </MainCard>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
