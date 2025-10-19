import { useMemo, useState } from 'react';

// material-ui
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

// project-imports
import MainCard from 'components/MainCard';
import useUser from 'hooks/useUser';
import { useSupabaseKpi } from 'hooks/useSupabaseKpi';

// utils
import dayjs from 'dayjs';

// =========================|| KPI관리 WIDGET ||========================= //

export default function KpiWidget() {
  const user = useUser();
  const { kpis } = useSupabaseKpi();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('Total');
  const itemsPerPage = 5;

  // 필터 핸들러
  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilter(event.target.value);
    setPage(1); // 필터 변경 시 첫 페이지로
  };

  // 페이지 변경 핸들러
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // 로그인한 사용자의 KPI만 필터링 (날짜 필터 포함)
  const userKpis = useMemo(() => {
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
        return kpis.filter((kpi) => kpi.assignee === userName);
    }

    return kpis.filter((kpi) => {
      // 사용자 필터
      if (kpi.assignee !== userName) return false;

      // 날짜 필터
      if (kpi.registration_date) {
        const kpiDate = dayjs(kpi.registration_date);
        return kpiDate.isAfter(startDate);
      }
      return true;
    });
  }, [kpis, user, filter]);

  // 페이지네이션 적용
  const paginatedKpis = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return userKpis.slice(startIndex, startIndex + itemsPerPage);
  }, [userKpis, page]);

  // 총 페이지 수
  const totalPages = Math.ceil(userKpis.length / itemsPerPage);

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case '대기':
        return { backgroundColor: '#FFF4E5', color: '#FF9800' };
      case '진행':
        return { backgroundColor: '#E3F2FD', color: '#1976D2' };
      case '완료':
        return { backgroundColor: '#E8F5E9', color: '#4CAF50' };
      case '홀딩':
        return { backgroundColor: '#FFEBEE', color: '#F44336' };
      default:
        return { backgroundColor: '#F5F5F5', color: '#757575' };
    }
  };

  return (
    <MainCard
      title="KPI관리"
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
            {paginatedKpis.length > 0 ? (
              paginatedKpis.map((kpi) => (
                <ListItem
                  key={kpi.id}
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
                        {kpi.work_content || '업무 내용 없음'}
                      </Typography>
                      <Chip
                        label={kpi.status}
                        size="small"
                        sx={{
                          ...getStatusColor(kpi.status),
                          fontWeight: 500,
                          fontSize: '11px',
                          height: '20px'
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {kpi.registration_date ? dayjs(kpi.registration_date).format('YYYY-MM-DD') : '-'}
                    </Typography>
                  </Box>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 400, color: 'text.secondary' }}>
                        {kpi.description || kpi.management_category || '설명 없음'}
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
                      KPI 데이터가 없습니다
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
