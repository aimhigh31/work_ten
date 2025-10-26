'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

// third-party

// Material-UI
import {
  Box,
  Tab,
  Tabs,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Pagination,
  Button
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// Project imports
import ChecklistTable from 'views/apps/ChecklistTable';
import ChecklistEditDialog from 'components/ChecklistEditDialog';
import { taskData, taskStatusColors, assigneeAvatars } from 'data/task';
import { TaskTableData, TaskStatus } from 'types/task';
import { ThemeMode } from 'config';
import { useCommonData } from 'contexts/CommonDataContext'; // 🏪 공용 창고

// 변경로그 타입 정의
interface ChangeLog {
  id: number;
  dateTime: string;
  team: string;
  user: string;
  action: string;
  target: string;
  description: string;
}

// Icons
import { TableDocument, DocumentText } from '@wandersonalwes/iconsax-react';

// ==============================|| 체크리스트관리 메인 페이지 ||============================== //

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
      id={`checklist-tabpanel-${index}`}
      aria-labelledby={`checklist-tab-${index}`}
      {...other}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      {value === index && <Box sx={{ pt: 0.5, height: '100%', overflow: 'hidden' }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `checklist-tab-${index}`,
    'aria-controls': `checklist-tabpanel-${index}`
  };
}

// 변경로그 뷰 컴포넌트
interface ChangeLogViewProps {
  changeLogs: ChangeLog[];
  tasks: TaskTableData[];
  page: number;
  rowsPerPage: number;
  goToPage: string;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  onGoToPageChange: (page: string) => void;
}

function ChangeLogView({
  changeLogs,
  tasks,
  page,
  rowsPerPage,
  goToPage,
  onPageChange,
  onRowsPerPageChange,
  onGoToPageChange
}: ChangeLogViewProps) {
  const theme = useTheme();

  // 페이지네이션 적용된 데이터
  const paginatedLogs = React.useMemo(() => {
    const startIndex = page * rowsPerPage;
    return changeLogs.slice(startIndex, startIndex + rowsPerPage);
  }, [changeLogs, page, rowsPerPage]);

  // 총 페이지 수 계산
  const totalPages = Math.ceil(changeLogs.length / rowsPerPage);

  // 페이지 변경 핸들러
  const handleChangePage = (event: React.ChangeEvent<unknown>, newPage: number) => {
    onPageChange(newPage - 1);
  };

  // Go to 페이지 핸들러
  const handleGoToPage = () => {
    const pageNumber = parseInt(goToPage, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber - 1);
    }
    onGoToPageChange('');
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 상단 정보 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, mt: 4.5, flexShrink: 0 }}>
        <Typography variant="body2" color="text.secondary">
          총 {changeLogs.length}건
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
          '& .MuiTable-root': {},
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
            <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
              <TableCell sx={{ fontWeight: 600, width: 50 }}>NO</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 130 }}>변경시간</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100 }}>코드</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 180 }}>업무내용</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 120 }}>변경분류</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 280 }}>변경 세부내용</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 90 }}>팀</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 90 }}>담당자</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedLogs.map((log, index) => (
              <TableRow
                key={log.id}
                hover
                sx={{
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    {changeLogs.length - (page * rowsPerPage + index)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.secondary' }}>
                    {log.dateTime}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    {log.target}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    {(() => {
                      const task = tasks.find((task) => task.code === log.target);
                      return task?.workContent || log.description.split(' - ')[0] || '업무내용 없음';
                    })()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                  >
                    {log.action}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '13px',
                      color: 'text.secondary',
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
                  <Chip
                    label={log.team}
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 22,
                      fontSize: '13px',
                      color: '#333333',
                      fontWeight: 500
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    {log.user}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
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
                onRowsPerPageChange(Number(e.target.value));
                onPageChange(0);
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
              onChange={(e) => onGoToPageChange(e.target.value)}
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
  );
}

export default function ChecklistManagement() {
  const theme = useTheme();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(0);

  // Supabase 훅 사용
  const { users, departments, masterCodes } = useCommonData(); // 🏪 공용 창고에서 가져오기

  // 🔍 디버깅: CommonData에서 받은 users 확인
  React.useEffect(() => {
    console.log('🔍 [ChecklistManagement] CommonData users:', users.length);
    if (users.length > 0) {
      console.log('🔍 [ChecklistManagement] 첫 번째 user 샘플:', {
        user_code: users[0].user_code,
        user_name: users[0].user_name,
        avatar_url: users[0].avatar_url,
        profile_image_url: users[0].profile_image_url
      });
    }
  }, [users]);

  // 마스터코드에서 체크리스트분류 옵션 가져오기 (GROUP006)
  const categoriesMap = useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP006' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  // 상태 타입 데이터 (GROUP002의 서브코드만 필터링)
  const statusTypes = React.useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP002' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  // subcode → subcode_name 변환 함수들
  const getCategoryName = useCallback(
    (subcode: string) => {
      const found = categoriesMap.find((item) => item.subcode === subcode);
      return found ? found.subcode_name : subcode;
    },
    [categoriesMap]
  );

  const getStatusName = useCallback(
    (subcode: string) => {
      const found = statusTypes.find((item) => item.subcode === subcode);
      return found ? found.subcode_name : subcode;
    },
    [statusTypes]
  );

  // 공유 Tasks 상태
  const [tasks, setTasks] = useState<TaskTableData[]>(taskData);

  // 편집 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskTableData | null>(null);

  // URL 쿼리 파라미터 처리
  useEffect(() => {
    const cardId = searchParams.get('cardId');
    const action = searchParams.get('action');
    const openDialog = searchParams.get('openDialog');

    // 카드 편집 팝업 열기
    if (cardId && action === 'edit' && openDialog === 'true') {
      // 카드 ID로 해당 태스크 찾기
      const taskToEdit = tasks.find((task) => task.id.toString() === cardId);
      if (taskToEdit) {
        setEditingTask(taskToEdit);
        setEditDialog(true);
      }
    }
  }, [searchParams, tasks]);

  // 변경로그 페이지네이션 상태
  const [changeLogPage, setChangeLogPage] = useState(0);
  const [changeLogRowsPerPage, setChangeLogRowsPerPage] = useState(10);
  const [changeLogGoToPage, setChangeLogGoToPage] = useState('');

  // 변경로그 상태 - 초기 데이터는 기존 샘플 데이터 사용
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([
    {
      id: 1,
      dateTime: '2024-12-15 14:30',
      team: '개발팀',
      user: '김철수',
      action: '업무 상태 변경',
      target: 'TASK-24-010',
      description: '웹사이트 리뉴얼 프로젝트 상태를 "진행"에서 "완료"로 변경'
    },
    {
      id: 2,
      dateTime: '2024-12-14 10:15',
      team: '기획팀',
      user: '이영희',
      action: '새 업무 생성',
      target: 'TASK-24-011',
      description: '모바일 앱 UI/UX 개선 업무 신규 등록'
    },
    {
      id: 3,
      dateTime: '2024-12-13 16:45',
      team: '마케팅팀',
      user: '박민수',
      action: '담당자 변경',
      target: 'TASK-24-009',
      description: '마케팅 캠페인 기획 담당자를 "최지연"에서 "박민수"로 변경'
    },
    {
      id: 4,
      dateTime: '2024-12-12 09:30',
      team: '디자인팀',
      user: '강민정',
      action: '완료일 수정',
      target: 'TASK-24-008',
      description: '로고 디자인 작업의 완료 예정일을 2024-12-20으로 수정'
    },
    {
      id: 5,
      dateTime: '2024-12-11 15:20',
      team: '개발팀',
      user: '정현우',
      action: '업무 삭제',
      target: 'TASK-24-007',
      description: '중복된 데이터베이스 최적화 업무 삭제'
    }
  ]);

  // 필터 상태
  const [selectedYear, setSelectedYear] = useState('전체');
  const [selectedTeam, setSelectedTeam] = useState('전체');
  const [selectedStatus, setSelectedStatus] = useState('전체');
  const [selectedAssignee, setSelectedAssignee] = useState('전체');

  // 연도 옵션 생성
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear - 3; i <= currentYear + 3; i++) {
    yearOptions.push(i.toString());
  }

  // 변경로그 추가 함수
  const addChangeLog = (action: string, target: string, description: string, team: string = '시스템') => {
    const now = new Date();
    const dateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newLog: ChangeLog = {
      id: Math.max(...changeLogs.map((log) => log.id), 0) + 1,
      dateTime,
      team,
      user: '시스템', // 임시로 시스템으로 설정, 나중에 실제 사용자 정보로 교체 가능
      action,
      target,
      description
    };

    setChangeLogs((prev) => [newLog, ...prev]); // 최신순으로 정렬
  };

  // 카드 클릭 핸들러
  const handleCardClick = (task: TaskTableData) => {
    setEditingTask(task);
    setEditDialog(true);
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingTask(null);
  };

  // Task 저장 핸들러 - 이제 ChecklistTable에서 Supabase 연동을 처리하므로 간소화
  const handleEditTaskSave = (updatedTask: TaskTableData) => {
    console.log('📝 ChecklistManagement에서 Task 저장:', updatedTask);

    // ChecklistTable에서 이미 Supabase 저장을 처리하므로,
    // 여기서는 변경로그만 추가
    addChangeLog('업무 수정', updatedTask.code, `업무가 수정되었습니다: ${updatedTask.workContent}`, updatedTask.team || '기본팀');

    handleEditDialogClose();
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
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
      <Card
        sx={{
          border: 'none',
          borderRadius: 0,
          boxShadow: 'none',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0
        }}
      >
        <CardContent
          sx={{
            pb: 0,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
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
          {/* 페이지 타이틀 및 브레드크럼 */}
          <Box sx={{ mb: 2, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              <Typography variant="h2" sx={{ fontWeight: 700 }}>
                체크리스트관리
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ pb: 0.5 }}>
                관리자메뉴 &gt; 체크리스트관리
              </Typography>
            </Box>
          </Box>

          {/* 탭 네비게이션 및 필터 */}
          <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              flexShrink: 0,
              mt: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="체크리스트관리 탭"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 48,
                  textTransform: 'none',
                  fontSize: '0.91rem',
                  fontWeight: 500
                }
              }}
            >
              <Tab
                icon={<TableDocument size={19} />}
                iconPosition="start"
                label="데이터"
                {...a11yProps(0)}
                sx={{
                  gap: 0.8,
                  '& .MuiTab-iconWrapper': {
                    margin: 0
                  }
                }}
              />
              <Tab
                icon={<DocumentText size={19} />}
                iconPosition="start"
                label="변경로그"
                {...a11yProps(1)}
                sx={{
                  gap: 0.8,
                  '& .MuiTab-iconWrapper': {
                    margin: 0
                  }
                }}
              />
            </Tabs>

            {/* 필터 영역 */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mr: 1 }}>
              {/* 연도 필터 */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>연도</InputLabel>
                <Select
                  value={selectedYear}
                  label="연도"
                  onChange={(e) => setSelectedYear(e.target.value)}
                  sx={{
                    '& .MuiSelect-select': {
                      py: 1,
                      px: 2
                    }
                  }}
                >
                  <MenuItem value="전체">전체</MenuItem>
                  {yearOptions.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}년
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 팀 필터 */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>팀</InputLabel>
                <Select
                  value={selectedTeam}
                  label="팀"
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  sx={{
                    '& .MuiSelect-select': {
                      py: 1,
                      px: 2
                    }
                  }}
                >
                  <MenuItem value="전체">전체</MenuItem>
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
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>담당자</InputLabel>
                <Select
                  value={selectedAssignee}
                  label="담당자"
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  sx={{
                    '& .MuiSelect-select': {
                      py: 1,
                      px: 2
                    }
                  }}
                >
                  <MenuItem value="전체">전체</MenuItem>
                  {users
                    .filter((user) => user.status === 'active')
                    .map((user) => (
                      <MenuItem key={user.id} value={user.user_name}>
                        {user.user_name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              {/* 상태 필터 */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>상태</InputLabel>
                <Select
                  value={selectedStatus}
                  label="상태"
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  sx={{
                    '& .MuiSelect-select': {
                      py: 1,
                      px: 2
                    }
                  }}
                >
                  <MenuItem value="전체">전체</MenuItem>
                  {statusTypes.map((statusItem) => (
                    <MenuItem key={statusItem.id} value={statusItem.subcode_name}>
                      {statusItem.subcode_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* 탭 내용 */}
          <Box
            sx={{
              flex: 1,
              overflow: 'hidden',
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
            <TabPanel value={value} index={0}>
              {/* 데이터 탭 - 테이블 */}
              <Box
                sx={{
                  p: 0.5,
                  height: '100%',
                  overflow: 'hidden',
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
                <ChecklistTable
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  tasks={undefined} // Supabase 데이터를 사용하도록 undefined 전달
                  setTasks={setTasks}
                  addChangeLog={addChangeLog}
                />
              </Box>
            </TabPanel>
            <TabPanel value={value} index={1}>
              {/* 변경로그 탭 */}
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  p: 0.5,
                  // 스크롤바 스타일
                  '&::-webkit-scrollbar': {
                    width: '10px',
                    height: '10px'
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '10px'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#c1c1c1',
                    borderRadius: '10px'
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: '#a8a8a8'
                  }
                }}
              >
                <ChangeLogView
                  changeLogs={changeLogs}
                  tasks={tasks}
                  page={changeLogPage}
                  rowsPerPage={changeLogRowsPerPage}
                  goToPage={changeLogGoToPage}
                  onPageChange={setChangeLogPage}
                  onRowsPerPageChange={setChangeLogRowsPerPage}
                  onGoToPageChange={setChangeLogGoToPage}
                />
              </Box>
            </TabPanel>
          </Box>
        </CardContent>
      </Card>

      {/* Task 편집 다이얼로그 */}
      {editDialog && (
        <ChecklistEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          task={editingTask}
          onSave={handleEditTaskSave}
          assignees={users.map((user) => user.user_name)}
          assigneeAvatars={assigneeAvatars}
          statusOptions={statusTypes.map((statusItem) => statusItem.subcode_name)}
          statusColors={taskStatusColors}
          teams={departments.filter((dept) => dept.is_active).map((dept) => dept.department_name)}
        />
      )}
    </Box>
  );
}
