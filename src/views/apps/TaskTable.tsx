'use client';

import { useState, useMemo, useEffect } from 'react';
import supabase from '../../lib/supabaseClient';

// Material-UI
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Typography,
  Chip,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Avatar,
  Pagination,
  Stack,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { SelectChangeEvent } from '@mui/material/Select';

// project imports
import MainCard from 'components/MainCard';
import TaskEditDialog from 'components/TaskEditDialog';

// data and types
import { taskData, teams, assignees, taskStatusOptions, taskStatusColors, assigneeAvatars } from 'data/task';
import { TaskTableData, TaskStatus } from 'types/task';

// Hooks
import { useSupabaseTaskManagement } from 'hooks/useSupabaseTaskManagement';

// Icons
import { Add, Trash, Edit, DocumentDownload } from '@wandersonalwes/iconsax-react';

// 컬럼 너비 정의 (VOC관리와 유사하게)
const columnWidths = {
  checkbox: 50,
  no: 60,
  registrationDate: 100,
  code: 160,
  department: 80,
  team: 100,
  assignee: 120,
  workContent: 250,
  progress: 130,
  status: 90,
  startDate: 100,
  completedDate: 100,
  action: 80
};

interface TaskTableProps {
  selectedYear?: string;
  selectedTeam?: string;
  selectedStatus?: string;
  selectedAssignee?: string;
  tasks?: TaskTableData[];
  setTasks?: React.Dispatch<React.SetStateAction<TaskTableData[]>>;
  kpiData?: any[]; // KPI 데이터 추가
  addChangeLog?: (
    action: string,
    target: string,
    description: string,
    team?: string,
    beforeValue?: string,
    afterValue?: string,
    changedField?: string,
    title?: string
  ) => void;
}

export default function TaskTable({
  selectedYear = '전체',
  selectedTeam = '전체',
  selectedStatus = '전체',
  selectedAssignee = '전체',
  tasks,
  setTasks,
  kpiData = [],
  addChangeLog
}: TaskTableProps) {
  const theme = useTheme();

  // Supabase 훅 사용
  const { tasks: supabaseTasks, loading, error, addTask, updateTask, deleteTask, checkCodeExists } = useSupabaseTaskManagement();

  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState('');

  // Edit 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskTableData | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  // 사용자 프로필 이미지 매핑
  const [userProfileImages, setUserProfileImages] = useState<Record<string, string>>({});

  // 사용자 프로필 이미지 로드
  useEffect(() => {
    const fetchUserProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_users_userprofiles')
          .select('user_name, profile_image_url')
          .eq('is_active', true);

        if (error) {
          console.error('사용자 프로필 조회 실패:', error);
          return;
        }

        const profileMap: Record<string, string> = {};
        data.forEach(user => {
          if (user.user_name && user.profile_image_url) {
            profileMap[user.user_name] = user.profile_image_url;
          }
        });
        setUserProfileImages(profileMap);
      } catch (err) {
        console.error('사용자 프로필 조회 중 오류:', err);
      }
    };

    fetchUserProfiles();
  }, []);

  // Supabase 데이터를 프론트엔드 형식으로 변환
  const taskData = useMemo(() => {
    return supabaseTasks.map((task, index) => ({
      id: parseInt(task.id.split('-')[0], 16), // UUID를 숫자로 변환
      no: supabaseTasks.length - index, // 역순 NO
      registrationDate: task.registration_date,
      code: task.code,
      department: task.department || '',
      workContent: task.work_content || '',
      description: task.description || '',
      team: task.team || '',
      assignee: task.assignee_name || '',
      progress: task.progress || 0,
      status: task.status as TaskStatus,
      startDate: task.start_date || '',
      completedDate: task.completed_date || ''
    } as any));
  }, [supabaseTasks]);

  const [data, setData] = useState<TaskTableData[]>(taskData);

  // Excel 다운로드 기능
  const handleExcelDownload = () => {
    try {
      // 필터링된 데이터를 Excel 형식으로 변환 (테이블과 동일한 컬럼 순서)
      const excelData = filteredData.map((task, index) => ({
        NO: index + 1,
        등록일: task.registrationDate,
        코드: task.code,
        업무분류: task.department || '분류없음',
        업무내용: task.workContent,
        팀: task.team,
        담당자: task.assignee,
        진행율: `${task.progress || 0}%`,
        상태: task.status,
        시작일: task.startDate || '미정',
        완료일: task.completedDate || '미정'
      }));

      // CSV 형식으로 데이터 변환 (Excel에서 열 수 있음)
      const csvContent = [
        // 헤더
        Object.keys(excelData[0] || {}).join(','),
        // 데이터 행들
        ...excelData.map((row) =>
          Object.values(row)
            .map((value) =>
              // CSV에서 쉼표가 포함된 값은 따옴표로 감싸기
              typeof value === 'string' && value.includes(',') ? `"${value}"` : value
            )
            .join(',')
        )
      ].join('\n');

      // BOM 추가 (한글 깨짐 방지)
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

      // 파일 다운로드
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `업무관리_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Excel 다운로드 중 오류 발생:', error);
      alert('Excel 다운로드 중 오류가 발생했습니다.');
    }
  };

  // Supabase 데이터 변경 시 data 상태 업데이트
  useEffect(() => {
    setData(taskData);
  }, [taskData]);

  // 필터링된 데이터 (역순 정렬 추가)
  const filteredData = useMemo(() => {
    const filtered = data.filter((task) => {
      // 연도 필터
      if (selectedYear !== '전체') {
        const taskYear = new Date(task.startDate).getFullYear().toString();
        if (taskYear !== selectedYear) return false;
      }

      const teamMatch = selectedTeam === '전체' || task.team === selectedTeam;
      const statusMatch = selectedStatus === '전체' || task.status === selectedStatus;
      const assigneeMatch = selectedAssignee === '전체' || task.assignee === selectedAssignee;

      return teamMatch && statusMatch && assigneeMatch;
    });
    // NO 기준 역순 정렬
    return filtered.sort((a, b) => (b.no || 0) - (a.no || 0));
  }, [data, selectedYear || '전체', selectedTeam, selectedStatus, selectedAssignee]);

  // 페이지네이션 적용된 데이터
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  // 총 페이지 수 계산
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // 필터가 변경될 때 페이지를 리셋
  useEffect(() => {
    setPage(0);
  }, [selectedYear || '전체', selectedTeam, selectedStatus, selectedAssignee]);

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

  // 전체 선택 처리
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = paginatedData.map((n) => n.id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  // 선택된 행 삭제 (Supabase 연동)
  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;

    const confirmDelete = window.confirm(`선택한 ${selected.length}개의 업무를 삭제하시겠습니까?`);
    if (!confirmDelete) return;

    try {
      const deletedTasks = data.filter((task) => selected.includes(task.id));

      // 각 선택된 업무를 Supabase에서 삭제 (is_active = false)
      for (const task of deletedTasks) {
        const supabaseTask = supabaseTasks.find(t => parseInt(t.id.split('-')[0], 16) === task.id);
        if (supabaseTask) {
          await deleteTask(supabaseTask.id);

          // 변경로그 추가
          if (addChangeLog) {
            const taskTitle = task.workContent || '업무';
            const codeToUse = task.code || `TASK-${task.id}`;
            await addChangeLog(
              '삭제',
              codeToUse,
              `업무관리 ${taskTitle}(${codeToUse}) 정보의 데이터탭 데이터가 삭제 되었습니다.`,
              task.team || '시스템',
              taskTitle,
              '',
              '데이터탭',
              taskTitle
            );
          }
        }
      }

      setSelected([]);
      alert('선택한 업무가 삭제되었습니다.');
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingTask(null);
    setEditingTaskId(null);
  };

  // Task 저장 (Supabase 연동)
  const handleEditTaskSave = async (updatedTask: TaskTableData) => {
    console.log('💾 Task 저장 요청:', updatedTask);

    // Supabase의 task 찾기
    const supabaseTask = supabaseTasks.find(t => parseInt(t.id.split('-')[0], 16) === updatedTask.id);

    if (supabaseTask) {
      // 원본 데이터 찾기 (변경 전 값 확인용)
      const originalTask = data.find(t => t.id === updatedTask.id);

      // 기존 Task 업데이트
      const success = await updateTask(supabaseTask.id, {
        start_date: updatedTask.startDate || null,
        completed_date: updatedTask.completedDate || null,
        department: updatedTask.department,
        work_content: updatedTask.workContent,
        description: (updatedTask as any).description || null,
        team: updatedTask.team,
        assignee_name: updatedTask.assignee,
        progress: updatedTask.progress,
        status: updatedTask.status
      });

      if (success && addChangeLog && originalTask) {
        // 필드별 변경 추적
        const fieldNameMap: Record<string, string> = {
          workContent: '제목',
          status: '상태',
          assignee: '담당자',
          completedDate: '완료일',
          startDate: '시작일',
          team: '팀',
          department: '부서',
          progress: '진행률',
          description: '설명'
        };

        // 변경된 필드 찾기
        const changes: Array<{ field: string; fieldKorean: string; before: any; after: any }> = [];

        Object.keys(fieldNameMap).forEach((field) => {
          const beforeVal = (originalTask as any)[field];
          const afterVal = (updatedTask as any)[field];

          if (beforeVal !== afterVal) {
            changes.push({
              field,
              fieldKorean: fieldNameMap[field],
              before: beforeVal || '',
              after: afterVal || ''
            });
          }
        });

        console.log('🔍 변경 감지된 필드들:', changes);

        const taskTitle = updatedTask.workContent || '업무';

        // 변경된 필드가 있으면 각각 로그 기록
        if (changes.length > 0) {
          for (const change of changes) {
            const description = `업무관리 ${taskTitle}(${updatedTask.code}) 정보의 데이터탭 ${change.fieldKorean}이 ${change.before} → ${change.after} 로 수정 되었습니다.`;

            await addChangeLog(
              '수정',
              updatedTask.code,
              description,
              updatedTask.team || '시스템',
              String(change.before),
              String(change.after),
              change.fieldKorean,
              taskTitle
            );
          }
        }
      }

      console.log('✅ 기존 Task 업데이트 완료');
    } else {
      // 새 Task 추가
      const currentYear = new Date().getFullYear();
      const yearSuffix = currentYear.toString().slice(-2);

      console.log('📊 코드 생성 시작 - 연도:', yearSuffix);
      console.log('📊 전체 Supabase Tasks:', supabaseTasks.length);

      // 기존 코드에서 번호 추출
      const existingCodes = supabaseTasks
        .filter(item => item.code.startsWith(`MAIN-TASK-${yearSuffix}-`))
        .map(item => {
          const parts = item.code.split('-');
          return parseInt(parts[3]) || 0;
        });

      console.log('📊 기존 코드 목록:', existingCodes);

      let maxNumber = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
      console.log('📊 최대 번호:', maxNumber);

      let newTaskCode = `MAIN-TASK-${yearSuffix}-${(maxNumber + 1).toString().padStart(3, '0')}`;
      console.log('📊 생성할 코드:', newTaskCode);

      // 중복 체크
      let attempts = 0;
      while (await checkCodeExists(newTaskCode)) {
        attempts++;
        console.log(`⚠️ 코드 중복 발견 (시도 ${attempts}):`, newTaskCode);
        maxNumber++;
        newTaskCode = `MAIN-TASK-${yearSuffix}-${(maxNumber + 1).toString().padStart(3, '0')}`;
        console.log('📊 다음 코드 시도:', newTaskCode);
      }

      console.log('✅ 최종 확정 코드:', newTaskCode);

      const taskInput = {
        code: newTaskCode,
        registration_date: updatedTask.registrationDate || new Date().toISOString().split('T')[0],
        start_date: updatedTask.startDate || null,
        completed_date: updatedTask.completedDate || null,
        department: updatedTask.department || null,
        work_content: updatedTask.workContent || null,
        description: (updatedTask as any).description || null,
        team: updatedTask.team || null,
        assignee_name: updatedTask.assignee || null,
        progress: updatedTask.progress || 0,
        status: updatedTask.status || '대기'
      };

      console.log('📤 업무 추가 전송 데이터:', taskInput);

      const result = await addTask(taskInput);

      if (result) {
        if (addChangeLog) {
          const taskTitle = updatedTask.workContent || '업무';
          await addChangeLog(
            '추가',
            newTaskCode,
            `업무관리 ${taskTitle}(${newTaskCode}) 정보의 데이터탭 데이터가 추가 되었습니다.`,
            updatedTask.team || '시스템',
            '',
            taskTitle,
            '데이터탭',
            taskTitle
          );
        }
        console.log('✅ 새 Task 추가 완료:', newTaskCode);
      } else {
        console.error('❌ 새 Task 추가 실패');
        alert('업무 추가에 실패했습니다. 콘솔을 확인해주세요.');
        return;
      }
    }

    handleEditDialogClose();
  };

  // 새 Task 추가
  const addNewTask = () => {
    // 바로 편집 팝업 열기
    setEditingTask(null);
    setEditingTaskId(null);
    setEditDialog(true);
  };

  // 편집 핸들러 (IT교육관리 스타일)
  const handleEditTask = (task: TaskTableData) => {
    setEditingTask(task);
    setEditingTaskId(task.id);
    setEditDialog(true);
  };

  // 상태 색상 (파스텔톤 배경, 검정 계열 글자)
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case '대기':
        return { backgroundColor: '#F5F5F5', color: '#757575' };
      case '진행':
        return { backgroundColor: '#E3F2FD', color: '#1976D2' };
      case '완료':
        return { backgroundColor: '#E8F5E9', color: '#388E3C' };
      case '홀딩':
        return { backgroundColor: '#FFEBEE', color: '#D32F2F' };
      default:
        return { backgroundColor: '#F5F5F5', color: '#757575' };
    }
  };

  // 팀 색상 (배경 제거)
  const getTeamColor = (team: string) => {
    return { color: '#333333' };
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 상단 정보 및 액션 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, mt: 3, flexShrink: 0 }}>
        <Typography variant="body2" color="text.secondary">
          총 {filteredData.length}건
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DocumentDownload size={16} />}
            size="small"
            onClick={handleExcelDownload}
            sx={{
              px: 2,
              borderColor: '#4CAF50',
              color: '#4CAF50',
              '&:hover': {
                borderColor: '#4CAF50',
                backgroundColor: '#4CAF50',
                color: '#fff'
              }
            }}
          >
            Excel Down
          </Button>
          <Button variant="contained" startIcon={<Add size={16} />} size="small" onClick={addNewTask} sx={{ px: 2 }}>
            추가
          </Button>
          <Button
            variant="outlined"
            startIcon={<Trash size={16} />}
            size="small"
            color="error"
            disabled={selected.length === 0}
            onClick={handleDeleteSelected}
            sx={{
              px: 2,
              borderColor: selected.length > 0 ? 'error.main' : 'grey.300',
              color: selected.length > 0 ? 'error.main' : 'grey.500'
            }}
          >
            삭제 {selected.length > 0 && `(${selected.length})`}
          </Button>
        </Box>
      </Box>

      {/* 테이블 */}
      <TableContainer
        sx={{
          flex: 1,
          border: 'none',
          borderRadius: 0,
          overflowX: 'auto',
          overflowY: 'auto',
          boxShadow: 'none',
          minHeight: 0,
          '& .MuiTable-root': {
            minWidth: 1200
          },
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
              <TableCell padding="checkbox" sx={{ width: columnWidths.checkbox }}>
                <Checkbox
                  checked={paginatedData.length > 0 && paginatedData.every((task) => selected.includes(task.id))}
                  indeterminate={selected.length > 0 && selected.length < paginatedData.length}
                  onChange={handleSelectAllClick}
                  size="small"
                />
              </TableCell>
              <TableCell sx={{ width: columnWidths.no, fontWeight: 600 }}>NO</TableCell>
              <TableCell sx={{ width: columnWidths.registrationDate, fontWeight: 600 }}>등록일</TableCell>
              <TableCell sx={{ width: columnWidths.code, fontWeight: 600 }}>코드</TableCell>
              <TableCell sx={{ width: columnWidths.department, fontWeight: 600 }}>업무분류</TableCell>
              <TableCell sx={{ width: columnWidths.workContent, fontWeight: 600 }}>제목</TableCell>
              <TableCell sx={{ width: columnWidths.team, fontWeight: 600 }}>팀</TableCell>
              <TableCell sx={{ width: columnWidths.assignee, fontWeight: 600 }}>담당자</TableCell>
              <TableCell sx={{ width: columnWidths.progress, fontWeight: 600 }}>진행율</TableCell>
              <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: columnWidths.startDate, fontWeight: 600 }}>시작일</TableCell>
              <TableCell sx={{ width: columnWidths.completedDate, fontWeight: 600 }}>완료일</TableCell>
              <TableCell sx={{ width: columnWidths.action, fontWeight: 600 }}>ACTION</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((task) => (
                <TableRow
                  key={task.id}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(task.id)}
                      onChange={(event) => {
                        const selectedIndex = selected.indexOf(task.id);
                        let newSelected: number[] = [];

                        if (selectedIndex === -1) {
                          newSelected = newSelected.concat(selected, task.id);
                        } else if (selectedIndex === 0) {
                          newSelected = newSelected.concat(selected.slice(1));
                        } else if (selectedIndex === selected.length - 1) {
                          newSelected = newSelected.concat(selected.slice(0, -1));
                        } else if (selectedIndex > 0) {
                          newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
                        }
                        setSelected(newSelected);
                      }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {task.no}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {task.registrationDate}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {task.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {task.department || '분류없음'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '13px',
                        color: 'text.primary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 230
                      }}
                    >
                      {task.workContent || '업무내용 없음'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                      {task.team || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        src={userProfileImages[task.assignee] || assigneeAvatars[task.assignee as keyof typeof assigneeAvatars]}
                        alt={task.assignee}
                        sx={{ width: 24, height: 24 }}
                      >
                        {task.assignee?.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 80, fontSize: '13px' }}>
                        {task.assignee}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={task.progress || 0}
                        sx={{
                          width: 80,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            backgroundColor: (() => {
                              const progress = task.progress || 0;
                              if (progress >= 80) return '#4caf50'; // 초록색
                              if (progress >= 50) return '#ff9800'; // 주황색
                              return '#2196f3'; // 파란색
                            })()
                          }
                        }}
                      />
                      <Typography variant="body2" sx={{ minWidth: 40, fontSize: '13px', fontWeight: 500 }}>
                        {task.progress || 0}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.status}
                      size="small"
                      sx={{
                        ...getStatusColor(task.status),
                        fontWeight: 500,
                        fontSize: '13px'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {task.startDate}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {task.completedDate || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="수정">
                        <IconButton size="small" onClick={() => handleEditTask(task)} sx={{ color: 'primary.main' }}>
                          <Edit size={16} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    검색 결과가 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
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
                    fontSize: '0.875rem',
                    textAlign: 'center'
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
            {filteredData.length > 0
              ? `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, filteredData.length)} of ${filteredData.length}`
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

      {/* Task 편집 다이얼로그 */}
      {editDialog && (
        <TaskEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          task={editingTask}
          onSave={handleEditTaskSave}
          assignees={assignees}
          assigneeAvatars={assigneeAvatars}
          statusOptions={taskStatusOptions}
          statusColors={taskStatusColors}
          teams={teams}
          kpiData={kpiData}
        />
      )}
    </Box>
  );
}
