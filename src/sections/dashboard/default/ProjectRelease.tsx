import { useState, useEffect, useMemo } from 'react';

// material-ui
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';

// project-imports
import MainCard from 'components/MainCard';
import useUser from 'hooks/useUser';
import { createClient } from '@/lib/supabase/client';

// utils
import dayjs from 'dayjs';

// =========================|| DATA WIDGET - CHANGE LOG ||========================= //

export default function ProjectRelease() {
  const user = useUser();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('Total');
  const [page, setPage] = useState(1);
  const itemsPerPage = 4;

  // 변경로그 데이터 로드
  useEffect(() => {
    const fetchChangeLogs = async () => {
      setLoading(true);
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from('common_log_data')
          .select('id, created_at, page, title, description, action_type, user_name')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          if (error.code === '57014') {
            console.warn('⚠️ 변경로그 조회 타임아웃');
            setLogs([]);
          } else {
            console.error('❌ 변경로그 조회 실패:', error);
            setLogs([]);
          }
        } else {
          setLogs(data || []);
        }
      } catch (err) {
        console.error('❌ 변경로그 조회 예외:', err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChangeLogs();
  }, []);

  // 필터 핸들러
  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilter(event.target.value);
    setPage(1); // 필터 변경 시 첫 페이지로
  };

  // 페이지 변경 핸들러
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // 로그인한 사용자의 변경로그만 필터링 (전체)
  const userChangeLogs = useMemo(() => {
    const userName = user?.korName || user?.name || '';
    if (!userName) return [];

    const now = dayjs();
    let startDate: dayjs.Dayjs;

    // 필터에 따른 시작 날짜 계산
    switch (filter) {
      case 'Today':
        startDate = now.startOf('day');
        break;
      case 'Weekly':
        startDate = now.subtract(7, 'day').startOf('day');
        break;
      case 'Monthly':
        startDate = now.subtract(30, 'day').startOf('day');
        break;
      case 'Total':
      default:
        // Total인 경우 날짜 필터링 없이 전체 반환
        return logs.filter((log) => log.user_name === userName);
    }

    return logs.filter((log) => {
      // 사용자 필터
      if (log.user_name !== userName) return false;

      // 날짜 필터
      const logDate = dayjs(log.created_at);
      return logDate.isAfter(startDate);
    });
  }, [logs, user, filter]);

  // 페이지네이션 적용
  const paginatedLogs = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return userChangeLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [userChangeLogs, page, itemsPerPage]);

  // 총 페이지 수
  const totalPages = Math.ceil(userChangeLogs.length / itemsPerPage);

  return (
    <MainCard
      title="변경로그"
      divider={false}
      secondary={
        <FormControl size="small" sx={{ minWidth: 90 }}>
          <Select
            value={filter}
            onChange={handleFilterChange}
            sx={{
              '& .MuiSelect-select': {
                py: 0.5,
                px: 1.25,
                fontSize: '0.75rem'
              }
            }}
          >
            <MenuItem value="Today" sx={{ fontSize: '0.75rem' }}>
              Today
            </MenuItem>
            <MenuItem value="Weekly" sx={{ fontSize: '0.75rem' }}>
              Weekly
            </MenuItem>
            <MenuItem value="Monthly" sx={{ fontSize: '0.75rem' }}>
              Monthly
            </MenuItem>
            <MenuItem value="Total" sx={{ fontSize: '0.75rem' }}>
              Total
            </MenuItem>
          </Select>
        </FormControl>
      }
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 480,
        '& .MuiCardContent-root': {
          pt: 0.5,
          pb: 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          '&:last-child': {
            pb: 0
          }
        },
        '& .MuiCardHeader-root': {
          pb: 0.5,
          flexShrink: 0
        }
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0
        }}
      >
        <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <List disablePadding sx={{ '& .MuiListItem-root': { px: 0, py: 0.75 } }}>
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <ListItem
                  key={log.id}
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 0 }
                  }}
                >
                  <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                        {log.page || '페이지'}
                      </Typography>
                      <Chip
                        label={log.action_type}
                        size="small"
                        sx={{
                          backgroundColor: '#E3F2FD',
                          color: '#1976D2',
                          fontWeight: 500,
                          fontSize: '11px',
                          height: '20px'
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {dayjs(log.created_at).format('YYYY-MM-DD HH:mm')}
                    </Typography>
                  </Box>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 400, color: 'text.secondary' }}>
                        {log.description}
                      </Typography>
                    }
                  />
                </ListItem>
              ))
            ) : (
              <ListItem sx={{ py: 2 }}>
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      변경로그가 없습니다
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
        </Box>

        {/* 페이지네이션 - 하단 고정 */}
        <Box sx={{ flexShrink: 0, bgcolor: 'background.paper', py: 1, borderTop: 1, borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="center" sx={{ minHeight: 32, alignItems: 'center' }}>
            {totalPages > 0 && (
              <Pagination
                count={totalPages || 1}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="small"
                siblingCount={0}
                boundaryCount={1}
                disabled={totalPages <= 1}
                sx={{
                  '& .MuiPaginationItem-root': {
                    fontSize: '0.75rem'
                  }
                }}
              />
            )}
          </Stack>
        </Box>
      </Box>
    </MainCard>
  );
}
