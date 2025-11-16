'use client';

import React, { useState, useMemo, useEffect } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Pagination from '@mui/material/Pagination';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import InputLabel from '@mui/material/InputLabel';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

// project-imports
import MainCard from 'components/MainCard';
import { createClient } from '@/lib/supabase/client';
import { useSupabaseMenuManagement } from 'hooks/useSupabaseMenuManagement';
import { useMenuPermission } from 'hooks/usePermissions';

// icons
import { DocumentText } from '@wandersonalwes/iconsax-react';

// ==============================|| 변경로그 타입 정의 ||============================== //

interface ChangeLog {
  id: string;
  dateTime: string;
  createdAt?: string; // 필터링용
  page: string;
  title: string;
  code: string;
  action: string;
  location: string;
  changedField?: string;
  beforeValue?: string;
  afterValue?: string;
  description: string;
  team: string;
  user: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`changelog-tabpanel-${index}`}
      aria-labelledby={`changelog-tab-${index}`}
      {...other}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      {value === index && <Box sx={{ p: 0, height: '100%', overflow: 'hidden' }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `changelog-tab-${index}`,
    'aria-controls': `changelog-tabpanel-${index}`
  };
}

// ==============================|| 종합 변경로그 페이지 ||============================== //

export default function ChangeLogPage() {
  // 권한 체크
  const { canViewCategory, canReadData, loading: permissionLoading } = useMenuPermission('/admin-panel/change-log');

  // 메뉴 데이터 (Database -> 페이지명 매핑용)
  const { menus } = useSupabaseMenuManagement();

  // 탭 상태
  const [value, setValue] = useState(0);

  // 페이지네이션 상태
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState('');

  // 필터 상태
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [selectedPage, setSelectedPage] = useState('전체');
  const [selectedAction, setSelectedAction] = useState('전체');
  const [selectedTeam, setSelectedTeam] = useState('전체');
  const [selectedUser, setSelectedUser] = useState('전체');

  // 데이터 로딩 상태
  const [loading, setLoading] = useState(false);
  const [dbData, setDbData] = useState<any[]>([]);

  // Database명 -> 한글 페이지명 매핑
  const pageNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    menus.forEach((menu) => {
      if (menu.database && menu.page) {
        map[menu.database] = menu.page;
      }
    });
    return map;
  }, [menus]);

  // 탭 변경 핸들러
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // Supabase 데이터 로드
  useEffect(() => {
    const fetchChangeLogs = async () => {
      console.log('🚀 종합 변경로그 데이터 로드 시작');
      setLoading(true);

      try {
        const supabase = createClient();

        // 필요한 필드만 선택하여 쿼리 최적화
        const { data, error } = await supabase
          .from('common_log_data')
          .select(
            'id, created_at, page, title, description, record_id, action_type, changed_field, before_value, after_value, team, user_name'
          )
          .order('created_at', { ascending: false })
          .limit(50); // 100개에서 50개로 줄임

        if (error) {
          // 타임아웃 에러(57014)는 경고만 표시하고 빈 배열 사용
          if (error.code === '57014') {
            console.warn('⚠️ 변경로그 조회 타임아웃 - 빈 데이터로 표시');
            setDbData([]);
          } else {
            console.error('❌ 변경로그 조회 실패 - error:', error);
            console.error('❌ error.message:', error.message);
            console.error('❌ error.details:', error.details);
            console.error('❌ error.hint:', error.hint);
            console.error('❌ error.code:', error.code);
            setDbData([]);
          }
        } else {
          console.log('✅ 변경로그 데이터 개수:', data?.length || 0);
          if (data && data.length > 0) {
            console.log('✅ 변경로그 샘플:', data[0]);
          }
          setDbData(data || []);
        }
      } catch (err: any) {
        console.error('❌ 변경로그 조회 예외:', err);
        console.error('❌ 예외 메시지:', err?.message);
        setDbData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChangeLogs();
  }, []);

  // DB 데이터를 ChangeLog 형식으로 변환 및 필터링
  const changeLogs = useMemo<ChangeLog[]>(() => {
    if (dbData.length === 0) {
      return [];
    }

    const converted = dbData.map((log) => {
      // created_at 포맷 변환
      const dateTime = log.created_at
        ? new Date(log.created_at).toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })
        : '';

      // Database명을 한글 페이지명으로 변환
      const pageName = log.page ? pageNameMap[log.page] || log.page : '';

      return {
        id: String(log.id || ''),
        dateTime: dateTime,
        createdAt: log.created_at, // 필터링용 원본 날짜
        page: pageName,
        title: log.title || '',
        code: log.record_id || '',
        action: log.action_type || '',
        location: '', // common_log_data에 없는 필드
        changedField: log.changed_field || '',
        beforeValue: log.before_value || '',
        afterValue: log.after_value || '',
        description: log.description || '',
        team: log.team || '',
        user: log.user_name || ''
      };
    });

    // 필터링 적용
    return converted.filter((log) => {
      // 기간 필터 (시작일~종료일)
      if (log.createdAt) {
        const logDate = dayjs(log.createdAt);

        // 시작일 필터
        if (startDate && logDate.isBefore(startDate, 'day')) {
          return false;
        }

        // 종료일 필터
        if (endDate && logDate.isAfter(endDate, 'day')) {
          return false;
        }
      }

      // 페이지 필터
      if (selectedPage !== '전체' && log.page !== selectedPage) return false;

      // 변경분류 필터
      if (selectedAction !== '전체' && log.action !== selectedAction) return false;

      // 팀 필터
      if (selectedTeam !== '전체' && log.team !== selectedTeam) return false;

      // 변경자 필터
      if (selectedUser !== '전체' && log.user !== selectedUser) return false;

      return true;
    });
  }, [dbData, startDate, endDate, selectedPage, selectedAction, selectedTeam, selectedUser, pageNameMap]);

  // 필터 옵션 생성
  const pageOptions = useMemo(() => {
    const pages = new Set<string>();
    dbData.forEach((log) => {
      if (log.page) pages.add(log.page);
    });
    return Array.from(pages).sort();
  }, [dbData]);

  const actionOptions = useMemo(() => {
    const actions = new Set<string>();
    dbData.forEach((log) => {
      if (log.action_type) actions.add(log.action_type);
    });
    return Array.from(actions).sort();
  }, [dbData]);

  const teamOptions = useMemo(() => {
    const teams = new Set<string>();
    dbData.forEach((log) => {
      if (log.team) teams.add(log.team);
    });
    return Array.from(teams).sort();
  }, [dbData]);

  const userOptions = useMemo(() => {
    const users = new Set<string>();
    dbData.forEach((log) => {
      if (log.user_name) users.add(log.user_name);
    });
    return Array.from(users).sort();
  }, [dbData]);

  // 페이지네이션 적용된 데이터
  const paginatedLogs = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return changeLogs.slice(startIndex, startIndex + rowsPerPage);
  }, [changeLogs, page, rowsPerPage]);

  // 총 페이지 수 계산
  const totalPages = Math.ceil(changeLogs.length / rowsPerPage);

  // 페이지 변경 핸들러
  const handleChangePage = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage - 1);
  };

  // Go to 페이지 핸들러
  const handleGoToPage = () => {
    const pageNumber = parseInt(goToPage, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setPage(pageNumber - 1);
    }
    setGoToPage('');
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: 'background.paper'
      }}
    >
      {/* 타이틀 및 브레드크럼 */}
      <Box sx={{ mb: 2, px: 2.5, pt: 2.5, flexShrink: 0, backgroundColor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
          <Typography variant="h2" sx={{ fontWeight: 700 }}>
            종합 변경로그
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ pb: 0.5 }}>
            관리자메뉴 &gt; 종합 변경로그
          </Typography>
        </Box>
      </Box>

      {/* 권한 체크: 카테고리 보기만 가능한 경우 */}
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
          {/* 탭 영역 */}
          <MainCard
            border={false}
            content={false}
            sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'none' }}
          >
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 2.5,
            pt: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="종합 변경로그 탭"
            sx={{
              minHeight: 'auto',
              '& .MuiTab-root': {
                minHeight: 'auto',
                py: 1.5
              }
            }}
          >
            <Tab
              icon={<DocumentText />}
              iconPosition="start"
              label="종합변경로그"
              {...a11yProps(0)}
              sx={{
                '& svg': {
                  width: 20,
                  height: 20
                }
              }}
            />
          </Tabs>

          {/* 필터 영역 */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mr: 1 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="시작일"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                format="YYYY-MM-DD"
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: { width: 145 },
                    InputLabelProps: {
                      shrink: true
                    }
                  }
                }}
              />
              <DatePicker
                label="종료일"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                format="YYYY-MM-DD"
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: { width: 145 },
                    InputLabelProps: {
                      shrink: true
                    }
                  }
                }}
              />
            </LocalizationProvider>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>페이지</InputLabel>
              <Select value={selectedPage} label="페이지" onChange={(e) => setSelectedPage(e.target.value)}>
                <MenuItem value="전체">전체</MenuItem>
                {pageOptions.map((page) => (
                  <MenuItem key={page} value={page}>
                    {page}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>변경분류</InputLabel>
              <Select value={selectedAction} label="변경분류" onChange={(e) => setSelectedAction(e.target.value)}>
                <MenuItem value="전체">전체</MenuItem>
                {actionOptions.map((action) => (
                  <MenuItem key={action} value={action}>
                    {action}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>팀</InputLabel>
              <Select value={selectedTeam} label="팀" onChange={(e) => setSelectedTeam(e.target.value)}>
                <MenuItem value="전체">전체</MenuItem>
                {teamOptions.map((team) => (
                  <MenuItem key={team} value={team}>
                    {team}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>변경자</InputLabel>
              <Select value={selectedUser} label="변경자" onChange={(e) => setSelectedUser(e.target.value)}>
                <MenuItem value="전체">전체</MenuItem>
                {userOptions.map((user) => (
                  <MenuItem key={user} value={user}>
                    {user}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* 탭 패널 */}
        <TabPanel value={value} index={0}>
          <Box sx={{ height: 'calc(100vh - 280px)', display: 'flex', flexDirection: 'column', p: 2.5 }}>
            {/* 상단 정보 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexShrink: 0 }}>
              <Typography variant="body2" color="text.secondary">
                총 {changeLogs.length}건 {loading && '(로딩 중...)'}
              </Typography>
            </Box>

            {/* 변경로그 테이블 */}
            <TableContainer
              sx={{
                flex: 1,
                border: 'none',
                borderRadius: 0,
                overflowX: 'auto',
                overflowY: 'auto',
                boxShadow: 'none',
                minHeight: 0,
                // 스크롤바 스타일
                '&::-webkit-scrollbar': {
                  width: '10px',
                  height: '10px'
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px'
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#e9ecef',
                  borderRadius: '4px',
                  border: '2px solid #f8f9fa'
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: '#dee2e6'
                },
                '&::-webkit-scrollbar-corner': {
                  backgroundColor: '#f8f9fa'
                }
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600, width: 50, fontSize: '12px' }}>NO</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 130, fontSize: '12px' }}>변경시간</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 120, fontSize: '12px' }}>페이지</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 150, fontSize: '12px' }}>코드</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 150, fontSize: '12px' }}>제목</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 100, fontSize: '12px' }}>변경분류</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 70, fontSize: '12px' }}>변경필드</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 120, fontSize: '12px' }}>변경전</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 120, fontSize: '12px' }}>변경후</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 360, fontSize: '12px' }}>변경세부내용</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 90, fontSize: '12px' }}>팀</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 90, fontSize: '12px' }}>변경자</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          {loading ? '데이터를 불러오는 중...' : '표시할 데이터가 없습니다.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedLogs.map((log, index) => (
                      <TableRow
                        key={log.id}
                        hover
                        sx={{
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '12px' }}>
                            {changeLogs.length - (page * rowsPerPage + index)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '12px' }}>
                            {log.dateTime}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '12px' }}>
                            {log.page}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '12px' }}>
                            {log.code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '12px' }}>
                            {log.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '12px' }}>
                            {log.action}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '12px' }}>
                            {log.changedField}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '12px' }}>
                            {log.beforeValue}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '12px' }}>
                            {log.afterValue}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '12px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'normal',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: 1.4
                            }}
                            title={log.description}
                          >
                            {log.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '12px' }}>
                            {log.team}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '12px' }}>
                            {log.user}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* 페이지네이션 */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 0.5,
                px: 1,
                py: 0.5,
                borderTop: '1px solid',
                borderColor: 'divider',
                flexShrink: 0
              }}
            >
              {/* 왼쪽: Row per page */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Row per page
                </Typography>
                <FormControl size="small" sx={{ minWidth: 60 }}>
                  <Select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setPage(0);
                    }}
                    sx={{
                      '& .MuiSelect-select': {
                        py: 0.5,
                        px: 1,
                        fontSize: '0.875rem'
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid #e0e0e0'
                      }
                    }}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                  </Select>
                </FormControl>

                {/* Go to */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Go to
                  </Typography>
                  <TextField
                    size="small"
                    value={goToPage}
                    onChange={(e) => setGoToPage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleGoToPage();
                      }
                    }}
                    placeholder="1"
                    sx={{
                      width: 60,
                      '& .MuiOutlinedInput-root': {
                        '& input': {
                          py: 0.5,
                          px: 1,
                          textAlign: 'center',
                          fontSize: '0.875rem'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: '1px solid #e0e0e0'
                        }
                      }
                    }}
                  />
                  <Button
                    size="small"
                    onClick={handleGoToPage}
                    sx={{
                      minWidth: 'auto',
                      px: 1.5,
                      py: 0.5,
                      fontSize: '0.875rem'
                    }}
                  >
                    Go
                  </Button>
                </Box>
              </Box>

              {/* 오른쪽: 페이지 네비게이션 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {changeLogs.length > 0
                    ? `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, changeLogs.length)} of ${changeLogs.length}`
                    : '0-0 of 0'}
                </Typography>
                {totalPages > 0 && (
                  <Pagination
                    count={totalPages}
                    page={page + 1}
                    onChange={handleChangePage}
                    color="primary"
                    size="small"
                    showFirstButton
                    showLastButton
                    sx={{
                      '& .MuiPaginationItem-root': {
                        fontSize: '0.875rem',
                        minWidth: '32px',
                        height: '32px',
                        borderRadius: '4px'
                      },
                      '& .MuiPaginationItem-page.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'white !important',
                        borderRadius: '4px',
                        fontWeight: 500,
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                          color: 'white !important'
                        }
                      },
                      '& .MuiPaginationItem-page': {
                        borderRadius: '4px',
                        '&:hover': {
                          backgroundColor: 'grey.100'
                        }
                      }
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>
        </TabPanel>
      </MainCard>
        </>
      )}
    </Box>
  );
}
