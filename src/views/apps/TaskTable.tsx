'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import supabase from '../../lib/supabaseClient';
import { useSession } from 'next-auth/react';
import { useSupabaseUsers } from 'hooks/useSupabaseUsers';

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
import { teams, assignees, taskStatusOptions, taskStatusColors, assigneeAvatars } from 'data/task';
import { TaskTableData, TaskStatus } from 'types/task';

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
  users?: any[]; // ✅ 사용자 목록 추가 (KPI 패턴)
  onDeleteTasks?: (taskIds: number[]) => Promise<void>; // ✅ KPI 패턴: number[] 타입
  onAddTask?: (taskInput: any) => Promise<boolean>; // ✅ Optimistic Update 패턴
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
  // 🔐 권한 관리
  canCreateData?: boolean;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
}

export default function TaskTable({
  selectedYear = '전체',
  selectedTeam = '전체',
  selectedStatus = '전체',
  selectedAssignee = '전체',
  tasks,
  setTasks,
  kpiData = [],
  users = [],
  onDeleteTasks,
  onAddTask,
  addChangeLog,
  canCreateData = true,
  canEditOwn = true,
  canEditOthers = true
}: TaskTableProps) {
  const theme = useTheme();

  // 현재 로그인한 사용자 정보
  const { data: session } = useSession();
  const { users: allUsers } = useSupabaseUsers();

  const currentUser = useMemo(() => {
    if (!session?.user?.email || !allUsers || allUsers.length === 0) return null;
    const found = allUsers.find((u) => u.email === session.user.email);
    return found;
  }, [session, allUsers]);

  // 데이터 소유자 확인 함수
  const isDataOwner = useCallback((task: TaskTableData) => {
    if (!currentUser) return false;
    // createdBy 또는 assignee 중 하나라도 현재 사용자와 일치하면 소유자
    return task.createdBy === currentUser.user_name ||
           task.assignee === currentUser.user_name;
  }, [currentUser]);

  // 편집 가능 여부 확인 함수
  const canEditData = useCallback((task: TaskTableData) => {
    return canEditOthers || (canEditOwn && isDataOwner(task));
  }, [canEditOthers, canEditOwn, isDataOwner]);

  // ✅ KPI 패턴: props로 받은 tasks만 사용
  const [data, setData] = useState<TaskTableData[]>(tasks ? tasks : []);
  const [selected, setSelected] = useState<number[]>([]);

  // 선택된 모든 레코드가 편집 가능한지 확인
  const canEditAllSelected = useMemo(() => {
    if (selected.length === 0) return false;
    return selected.every(id => {
      const task = data.find(t => t.id === id);
      return task && canEditData(task);
    });
  }, [selected, data, canEditData]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState('');

  // Edit 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskTableData | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  // ✅ KPI 패턴: props.tasks가 변경되면 data 업데이트 + 첫 페이지로 이동
  useEffect(() => {
    if (tasks) {
      setData(tasks);
      setPage(0); // ✅ 새 항목 추가 시 헤더 바로 아래(첫 페이지)에서 보이도록
    }
  }, [tasks]);

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


  // 필터링된 데이터 (최신 항목이 헤더 바로 아래 표시)
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
    // ✅ NO 기준 역순 정렬 (큰 no = 최신 항목이 먼저)
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

  // 선택된 행 삭제 (KPI 패턴)
  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;

    const confirmDelete = window.confirm(`선택한 ${selected.length}개의 업무를 삭제하시겠습니까?`);
    if (!confirmDelete) return;

    try {
      // ✅ KPI 패턴: onDeleteTasks prop 사용 (TaskManagement에서 처리)
      if (onDeleteTasks) {
        await onDeleteTasks(selected);
      } else {
        // 로컬 삭제 (fallback)
        const updatedData = data.filter((task) => !selected.includes(task.id));
        setData(updatedData);
        if (setTasks) {
          setTasks(updatedData);
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
    try {
      console.log('💾 Task 저장 요청:', updatedTask);
      console.log('📋 [TaskTable] KPI 필드 확인:', {
        taskType: (updatedTask as any).taskType,
        kpiId: (updatedTask as any).kpiId,
        kpiWorkContent: (updatedTask as any).kpiWorkContent,
        loadedKpiTitle: (updatedTask as any).loadedKpiTitle,
        loadedKpiData: (updatedTask as any).loadedKpiData
      });

      // ✅ Use supabaseId from task
      const originalTask = data.find((t) => t.id === updatedTask.id);
      const supabaseId = (updatedTask as any).supabaseId || (originalTask as any)?.supabaseId;

      if (supabaseId) {
        console.log('🔄 [TaskTable] 기존 업무 수정 - Supabase 업데이트 실행');
        // ✅ Direct Supabase update (simplified)
        const { error } = await supabase
          .from('main_task_data')
          .update({
            start_date: updatedTask.startDate || null,
            completed_date: updatedTask.completedDate || null,
            department: updatedTask.department,
            work_content: updatedTask.workContent,
            description: (updatedTask as any).description || null,
            team: updatedTask.team,
            assignee_name: updatedTask.assignee,
            progress: updatedTask.progress,
            status: updatedTask.status,
            task_type: (updatedTask as any).taskType || '일반',
            kpi_id: (updatedTask as any).kpiId || null,
            kpi_record_id: (updatedTask as any).kpiRecordId || null,
            kpi_work_content: (updatedTask as any).kpiWorkContent || null
          })
          .eq('id', supabaseId);

        if (error) {
          console.error('❌ [TaskTable] Supabase 업데이트 실패:', error);
          throw error;
        }

        console.log('✅ [TaskTable] Supabase 업데이트 성공 - KPI 필드 포함');

        if (addChangeLog && originalTask) {
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
        console.log('📊 전체 Tasks:', data.length);

        // ✅ Use data (from props.tasks) instead of supabaseTasks
        const existingCodes = data
          .filter((item) => item.code && item.code.startsWith(`MAIN-TASK-${yearSuffix}-`))
          .map((item) => {
            const parts = item.code.split('-');
            return parseInt(parts[3]) || 0;
          });

        console.log('📊 기존 코드 목록:', existingCodes);

        let maxNumber = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
        console.log('📊 최대 번호:', maxNumber);

        let newTaskCode = `MAIN-TASK-${yearSuffix}-${(maxNumber + 1).toString().padStart(3, '0')}`;
        console.log('📊 생성할 코드:', newTaskCode);

        // ✅ Direct code existence check
        let attempts = 0;
        let codeExists = true;
        while (codeExists && attempts < 100) {
          const { data: existingTask } = await supabase
            .from('main_task_data')
            .select('id')
            .eq('code', newTaskCode)
            .eq('is_active', true)
            .single();

          if (existingTask) {
            attempts++;
            console.log(`⚠️ 코드 중복 발견 (시도 ${attempts}):`, newTaskCode);
            maxNumber++;
            newTaskCode = `MAIN-TASK-${yearSuffix}-${(maxNumber + 1).toString().padStart(3, '0')}`;
            console.log('📊 다음 코드 시도:', newTaskCode);
          } else {
            codeExists = false;
          }
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
          status: updatedTask.status || '대기',
          task_type: (updatedTask as any).taskType || '일반',
          kpi_id: (updatedTask as any).kpiId || null,
          kpi_record_id: (updatedTask as any).kpiRecordId || null,
          kpi_work_content: (updatedTask as any).kpiWorkContent || null
        };

        console.log('📤 업무 추가 전송 데이터:', taskInput);
        console.log('📋 [TaskTable] 새 업무 KPI 필드:', {
          task_type: taskInput.task_type,
          kpi_id: taskInput.kpi_id,
          kpi_record_id: taskInput.kpi_record_id,
          kpi_work_content: taskInput.kpi_work_content
        });

        // ✅ Optimistic Update 패턴: 상위 컴포넌트의 onAddTask 호출
        if (onAddTask) {
          const success = await onAddTask(taskInput);
          if (success) {
            console.log('✅ 새 Task 추가 완료 (테이블 즉시 반영):', newTaskCode);
          } else {
            console.error('❌ 새 Task 추가 실패');
            alert('업무 추가에 실패했습니다.');
            return;
          }
        } else {
          console.error('❌ onAddTask prop이 없습니다');
          alert('업무 추가 기능을 사용할 수 없습니다.');
          return;
        }
      }

      handleEditDialogClose();
    } catch (error: any) {
      console.error('❌ handleEditTaskSave 전체 오류:', error);
      console.error('❌ 오류 스택:', error.stack);
      alert(`업무 저장 중 오류가 발생했습니다.\n오류: ${error.message || error}`);
    }
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
          <Button
            variant="contained"
            startIcon={<Add size={16} />}
            size="small"
            onClick={addNewTask}
            disabled={!canCreateData}
            sx={{
              px: 2,
              '&.Mui-disabled': {
                backgroundColor: 'grey.300',
                color: 'grey.500'
              }
            }}
          >
            추가
          </Button>
          <Button
            variant="outlined"
            startIcon={<Trash size={16} />}
            size="small"
            color="error"
            disabled={!canEditAllSelected}
            onClick={handleDeleteSelected}
            sx={{
              px: 2,
              borderColor: canEditAllSelected ? 'error.main' : 'grey.300',
              color: canEditAllSelected ? 'error.main' : 'grey.500',
              '&.Mui-disabled': {
                borderColor: 'grey.300',
                color: 'grey.500'
              }
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
                  key={(task as any).supabaseId || task.id}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(task.id)}
                      disabled={!canEditData(task)}
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
                        src={
                          task.assignee
                            ? users.find((user) => user.user_name === task.assignee)?.profile_image_url ||
                              users.find((user) => user.user_name === task.assignee)?.avatar_url
                            : undefined
                        }
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
          tasks={data}
          canCreateData={canCreateData}
          canEditOwn={canEditOwn}
          canEditOthers={canEditOthers}
        />
      )}
    </Box>
  );
}
