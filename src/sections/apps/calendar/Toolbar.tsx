import { useState, useEffect } from 'react';

// material-ui
import { Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid2';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';

// third-party
import { format } from 'date-fns';

// project-imports
import IconButton from 'components/@extended/IconButton';
import { useSupabaseUserManagement } from 'hooks/useSupabaseUserManagement';
import { useSupabaseDepartmentManagement } from 'hooks/useSupabaseDepartmentManagement';

// assets
import { ArrowLeft2, ArrowRight2, Calendar1, Category, Grid6, TableDocument, Add } from '@wandersonalwes/iconsax-react';

// constant
const viewOptions = [
  {
    label: '월',
    value: 'dayGridMonth',
    icon: Category
  },
  {
    label: '주',
    value: 'timeGridWeek',
    icon: Grid6
  },
  {
    label: '일',
    value: 'timeGridDay',
    icon: Calendar1
  },
  {
    label: '일정',
    value: 'listWeek',
    icon: TableDocument
  }
];

// ==============================|| CALENDAR - TOOLBAR ||============================== //

interface ToolbarProps {
  date: number | Date;
  view: string;
  onClickNext: () => void;
  onClickPrev: () => void;
  onClickToday: () => void;
  onChangeView: (s: string) => void;
  onAddEvent: () => void;
  teamFilter?: string;
  assigneeFilter?: string;
  attendeesFilter?: string[];
  onTeamFilterChange?: (team: string) => void;
  onAssigneeFilterChange?: (assignee: string) => void;
  onAttendeesFilterChange?: (attendees: string[]) => void;
  allAttendees?: string[];
}

export default function Toolbar({
  date,
  view,
  onClickNext,
  onClickPrev,
  onClickToday,
  onChangeView,
  onAddEvent,
  teamFilter,
  assigneeFilter,
  attendeesFilter,
  onTeamFilterChange,
  onAssigneeFilterChange,
  onAttendeesFilterChange,
  allAttendees,
  ...others
}: ToolbarProps) {
  const downSM = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  // Supabase 훅 사용
  const { users } = useSupabaseUserManagement();
  const { departments, fetchDepartments } = useSupabaseDepartmentManagement();

  // 부서 데이터 로드
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const [viewFilter, setViewFilter] = useState(viewOptions);

  useEffect(() => {
    if (downSM) {
      const filter = viewOptions.filter((item) => item.value !== 'dayGridMonth' && item.value !== 'timeGridWeek');
      setViewFilter(filter);
    } else {
      setViewFilter(viewOptions);
    }
  }, [downSM]);

  // 한국어 형식으로 날짜 포맷팅 함수
  const formatKoreanDate = (date: Date | number) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    return `${year}년 ${month}월`;
  };

  return (
    <Grid container sx={{ alignItems: 'center', mt: 3, pb: 3, width: '100%', gap: 1 }}>
      {/* 왼쪽: 오늘 버튼 + 뷰 탭 */}
      <Grid size="auto">
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Button variant="outlined" onClick={onClickToday} size={downSM ? 'small' : 'medium'}>
            오늘
          </Button>
          <ButtonGroup variant="outlined" aria-label="outlined button group" size={downSM ? 'small' : 'medium'}>
            {viewFilter.map((viewOption) => {
              const Icon = viewOption.icon;
              return (
                <Tooltip title={viewOption.label} key={viewOption.value}>
                  <Button
                    disableElevation
                    variant={viewOption.value === view ? 'contained' : 'outlined'}
                    onClick={() => onChangeView(viewOption.value)}
                    sx={{ minWidth: downSM ? '32px' : '40px' }}
                  >
                    <Icon variant={viewOption.value === view ? 'Bold' : 'Linear'} size={downSM ? 14 : 18} />
                  </Button>
                </Tooltip>
              );
            })}
          </ButtonGroup>
        </Stack>
      </Grid>

      {/* 가운데: 날짜 네비게이션 */}
      <Grid size="grow" sx={{ display: 'flex', justifyContent: 'center' }}>
        <Stack direction="row" sx={{ gap: { xs: 1, sm: 2 }, alignItems: 'center' }}>
          <IconButton onClick={onClickPrev} size={downSM ? 'small' : 'medium'}>
            <ArrowLeft2 />
          </IconButton>
          <Typography
            variant={downSM ? 'h6' : 'h4'}
            sx={{
              color: 'text.primary',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              minWidth: '120px'
            }}
          >
            {formatKoreanDate(date)}
          </Typography>
          <IconButton onClick={onClickNext} size={downSM ? 'small' : 'medium'}>
            <ArrowRight2 />
          </IconButton>
        </Stack>
      </Grid>

      {/* 오른쪽: 필터들 + 일정 추가 버튼 */}
      <Grid size="auto">
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {/* 팀 필터 */}
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>팀</InputLabel>
            <Select value={teamFilter || ''} onChange={(e) => onTeamFilterChange?.(e.target.value)} label="팀">
              <MenuItem value="">전체</MenuItem>
              {departments
                .filter((dept) => dept.is_active)
                .map((dept) => (
                  <MenuItem key={dept.id} value={dept.department_name}>
                    {dept.department_name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          {/* 담당자 필터 */}
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>담당자</InputLabel>
            <Select value={assigneeFilter || ''} onChange={(e) => onAssigneeFilterChange?.(e.target.value)} label="담당자">
              <MenuItem value="">전체</MenuItem>
              {users
                .filter((user) => user.status === 'active')
                .map((user) => (
                  <MenuItem key={user.id} value={user.user_name}>
                    {user.user_name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          {/* 참석자 필터 */}
          <Autocomplete
            multiple
            size="small"
            options={allAttendees || []}
            value={attendeesFilter || []}
            onChange={(event, newValue) => {
              onAttendeesFilterChange?.(newValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="참석자"
                placeholder="검색"
              />
            )}
            renderTags={(value: readonly string[], getTagProps) => {
              if (value.length === 0) return null;
              if (value.length === 1) {
                return (
                  <Chip
                    size="small"
                    label={value[0]}
                    {...getTagProps({ index: 0 })}
                    key={value[0]}
                  />
                );
              }
              return (
                <Chip
                  size="small"
                  label={`${value[0]} 외 ${value.length - 1}명`}
                  {...getTagProps({ index: 0 })}
                  key={value[0]}
                />
              );
            }}
            sx={{ minWidth: 150 }}
          />

          {/* 일정 추가 버튼 */}
          <Button
            variant="contained"
            startIcon={<Add size={16} />}
            onClick={onAddEvent}
            size={downSM ? 'small' : 'medium'}
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark'
              },
              whiteSpace: 'nowrap'
            }}
          >
            일정 추가
          </Button>
        </Stack>
      </Grid>
    </Grid>
  );
}
