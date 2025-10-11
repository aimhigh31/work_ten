// material-ui
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// project-imports
import Avatar from 'components/@extended/Avatar';
import IconButton from 'components/@extended/IconButton';
import MoreIcon from 'components/@extended/MoreIcon';
import MainCard from 'components/MainCard';

// table data
function createData(name: string, avatar: string, email: string, role: number, status: boolean) {
  return { name, avatar, email, role, status };
}

const avatarImage = '/assets/images/users';

const rows = [
  createData('김철수', 'avatar-1.png', 'owner@company.co.kr', 1, true),
  createData('이영희', 'avatar-3.png', 'manager@company.co.kr', 2, true),
  createData('박민수', 'avatar-2.png', 'pm@company.co.kr', 3, false),
  createData('정다은', 'avatar-4.png', 'je@company.co.kr', 3, true),
  createData('최준호', 'avatar-5.png', 'cj@company.co.kr', 0, false)
];

// ==============================|| ACCOUNT PROFILE - ROLE ||============================== //

export default function TabRole() {
  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <MainCard title="팀 멤버 초대" content={false}>
          <Stack sx={{ gap: 2.5, p: 2.5 }}>
            <Typography variant="h4">
              5/10{' '}
              <Typography variant="subtitle1" component="span">
                명의 멤버가 귀하의 플랜에서 사용 가능합니다.
              </Typography>
            </Typography>
            <Divider />
            <Stack
              direction="row"
              sx={{ gap: 3, justifyContent: 'space-between', alignItems: 'flex-end', width: { xs: 1, md: '80%', lg: '60%' } }}
            >
              <Stack sx={{ gap: 1, width: `calc(100% - 110px)` }}>
                <InputLabel htmlFor="outlined-email">이메일 주소</InputLabel>
                <TextField fullWidth id="outlined-email" variant="outlined" placeholder="이메일 주소를 입력하세요" />
              </Stack>
              <Button variant="contained" size="large">
                전송
              </Button>
            </Stack>
          </Stack>
          <TableContainer>
            <Table sx={{ minWidth: 350 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 3 }}>멤버</TableCell>
                  <TableCell>역할</TableCell>
                  <TableCell align="right">상태</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow hover key={row.name}>
                    <TableCell sx={{ pl: 3 }} component="th">
                      <Stack direction="row" sx={{ gap: 1.25, alignItems: 'center' }}>
                        <Avatar alt="Avatar 1" src={`${avatarImage}/${row.avatar}`} />
                        <Stack>
                          <Typography variant="subtitle1">{row.name}</Typography>
                          <Typography variant="caption" color="secondary">
                            {row.email}
                          </Typography>
                        </Stack>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {row.role === 1 && <Chip size="small" color="primary" label="소유자" />}
                      {row.role === 2 && <Chip size="small" variant="light" color="info" label="관리자" />}
                      {row.role === 3 && <Chip size="small" variant="light" color="warning" label="직원" />}
                      {row.role === 0 && <Chip size="small" variant="light" color="success" label="고객" />}
                    </TableCell>
                    <TableCell align="right">
                      {!row.status && (
                        <Stack direction="row" sx={{ gap: 1.25, alignItems: 'center', justifyContent: 'flex-end' }}>
                          <Button size="small" color="error">
                            재전송
                          </Button>
                          <Chip size="small" color="info" variant="outlined" label="초대됨" />
                        </Stack>
                      )}
                      {row.status && <Chip size="small" color="success" label="참여함" />}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="secondary">
                        <MoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </MainCard>
      </Grid>
      <Grid size={12}>
        <Stack direction="row" sx={{ gap: 2, justifyContent: 'flex-end', alignItems: 'center' }}>
          <Button color="error">취소</Button>
          <Button variant="contained">프로필 업데이트</Button>
        </Stack>
      </Grid>
    </Grid>
  );
}
