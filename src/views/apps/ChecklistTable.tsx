'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

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
  LinearProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { SelectChangeEvent } from '@mui/material/Select';

// project imports
import MainCard from 'components/MainCard';
import ChecklistEditDialog from 'components/ChecklistEditDialog';

// data and types
import { teams, assignees, taskStatusOptions, taskStatusColors, assigneeAvatars } from 'data/task';
import { TaskTableData, TaskStatus } from 'types/task';

// hooks
import { useSupabaseUsers } from 'hooks/useSupabaseUsers';
import { useSupabaseMasterCode3 } from 'hooks/useSupabaseMasterCode3';
import { useSupabaseChecklistManagement } from 'hooks/useSupabaseChecklistManagement';
import { useMenuPermission } from 'hooks/usePermissions'; // ✅ 권한 체크 훅

// Icons
import { Add, Trash, Edit, DocumentDownload } from '@wandersonalwes/iconsax-react';

// 컬럼 너비 정의
const columnWidths = {
  checkbox: 50,
  no: 60,
  registrationDate: 100,
  code: 140,
  category: 120,
  title: 160,
  description: 160,
  status: 90,
  team: 100,
  registrant: 120,
  action: 80
};

interface ChecklistTableProps {
  selectedYear?: string;
  selectedTeam?: string;
  selectedStatus?: string;
  selectedAssignee?: string;
  tasks?: TaskTableData[];
  setTasks?: React.Dispatch<React.SetStateAction<TaskTableData[]>>;
  addChangeLog?: (action: string, target: string, description: string, team?: string) => void;
  canCreateData?: boolean;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
}

export default function ChecklistTable({
  selectedYear = '전체',
  selectedTeam = '전체',
  selectedStatus = '전체',
  selectedAssignee = '전체',
  tasks,
  setTasks,
  addChangeLog,
  canCreateData = true,
  canEditOwn = true,
  canEditOthers = true
}: ChecklistTableProps) {
  const theme = useTheme();

  // ✅ 권한 체크
  const { canRead, canWrite, canFull, loading: permissionLoading } = useMenuPermission('/admin-panel/checklist-management');

  // 사용자 관리 훅 사용 (Auto-loading 패턴)
  const { users } = useSupabaseUsers();

  // 현재 로그인한 사용자 정보
  const { data: session } = useSession();

  const currentUser = useMemo(() => {
    if (!session?.user?.email || users.length === 0) return null;
    const found = users.find((u) => u.email === session.user.email);
    return found;
  }, [session, users]);

  // 데이터 소유자 확인 함수
  const isDataOwner = useCallback((checklist: TaskTableData) => {
    if (!currentUser) return false;
    // createdBy 또는 assignee 중 하나라도 현재 사용자와 일치하면 소유자
    return checklist.createdBy === currentUser.user_name ||
           checklist.assignee === currentUser.user_name;
  }, [currentUser]);

  // 편집 가능 여부 확인 함수
  const canEditData = useCallback((checklist: TaskTableData) => {
    return canEditOthers || (canEditOwn && isDataOwner(checklist));
  }, [canEditOthers, canEditOwn, isDataOwner]);

  // 마스터코드 훅 사용
  const { subCodes } = useSupabaseMasterCode3();

  // 체크리스트 관리 훅 사용
  const {
    checklists: supabaseChecklists,
    loading: checklistLoading,
    fetchChecklists,
    createChecklist,
    updateChecklist,
    deleteChecklist
  } = useSupabaseChecklistManagement();

  // user_code로 user 정보를 찾는 헬퍼 함수
  const getUserByCode = (userCode: string) => {
    const foundUser = users.find((u) => u.user_code === userCode);
    if (userCode && !foundUser) {
      console.log('🔍 [ChecklistTable] 사용자를 찾을 수 없음:', userCode);
      console.log('🔍 [ChecklistTable] 전체 users 배열:', users);
    }
    if (foundUser) {
      console.log('✅ [ChecklistTable] 사용자 찾음:', {
        userCode,
        user_name: foundUser.user_name,
        avatar_url: foundUser.avatar_url,
        profile_image_url: foundUser.profile_image_url
      });
    }
    return foundUser;
  };

  // user_code로 user_name을 찾는 헬퍼 함수
  const getUserNameByCode = (userCode: string) => {
    const user = getUserByCode(userCode);
    return user ? user.user_name : userCode; // user를 찾지 못하면 code 그대로 반환
  };

  // 서브코드로 서브코드명을 찾는 헬퍼 함수
  const getSubCodeName = (subcode: string) => {
    const subCodeInfo = subCodes.find((sc) => sc.subcode === subcode);
    return subCodeInfo ? subCodeInfo.subcode_name : subcode; // 서브코드를 찾지 못하면 코드 그대로 반환
  };

  // Supabase 데이터를 우선 사용하고, props로 전달된 tasks가 있으면 사용
  const [data, setData] = useState<TaskTableData[]>([]);

  // 데이터 소스 결정 및 동기화
  useEffect(() => {
    console.log('🔄 ChecklistTable 데이터 소스 결정:', {
      propsTasksLength: tasks?.length || 0,
      supabaseChecklistsLength: supabaseChecklists.length,
      checklistLoading,
      currentDataLength: data.length
    });

    if (tasks && tasks.length > 0) {
      // props로 전달된 tasks가 있으면 사용 (기존 로직 유지)
      console.log('📊 ChecklistTable props 데이터 사용:', tasks.length);
      setData(tasks);
    } else if (supabaseChecklists.length > 0) {
      // Supabase 데이터 사용
      console.log('🗄️ ChecklistTable Supabase 데이터 사용:', supabaseChecklists.length);
      console.log('📋 ChecklistTable 첫 번째 Supabase 데이터:', supabaseChecklists[0]);
      setData(supabaseChecklists);
    } else if (!checklistLoading) {
      // 로딩이 완료되었는데 데이터가 없으면 빈 배열 사용 (목업 데이터 사용하지 않음)
      console.log('📭 ChecklistTable 데이터 없음 - 빈 배열 사용');
      setData([]);
    } else {
      console.log('⏳ ChecklistTable 로딩 중...');
    }
  }, [tasks, supabaseChecklists, checklistLoading]);
  const [selected, setSelected] = useState<number[]>([]);

  // 선택된 모든 레코드가 편집 가능한지 확인
  const canEditAllSelected = useMemo(() => {
    if (selected.length === 0) return false;
    return selected.every(id => {
      const checklist = data.find(t => t.id === id);
      return checklist && canEditData(checklist);
    });
  }, [selected, data, canEditData]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState('');

  // 알림창 상태
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Edit 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskTableData | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  // Excel 다운로드 기능
  const handleExcelDownload = () => {
    try {
      // 필터링된 데이터를 Excel 형식으로 변환 (테이블과 동일한 컬럼 순서)
      const excelData = filteredData.map((task, index) => ({
        NO: index + 1,
        등록일: task.registrationDate,
        코드: task.code,
        체크리스트분류: getSubCodeName(task.department) || '분류없음',
        제목: task.workContent,
        설명: task.description || '-',
        상태: task.status,
        팀: task.team,
        등록자: getUserNameByCode(task.assignee)
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
      link.setAttribute('download', `체크리스트관리_${new Date().toISOString().slice(0, 10)}.csv`);
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

  // tasks props가 변경될 때 data 상태 업데이트
  useEffect(() => {
    if (tasks) {
      setData([...tasks]);
    }
  }, [tasks]);

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

  // 선택된 행 삭제
  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;

    try {
      const deletedTasks = data.filter((task) => selected.includes(task.id));
      let successCount = 0;
      let failCount = 0;

      // Supabase에서 삭제
      for (const task of deletedTasks) {
        const success = await deleteChecklist(task.code);
        if (!success) {
          console.error(`체크리스트 삭제 실패: ${task.code}`);
          failCount++;
        } else {
          successCount++;
        }
      }

      // 삭제될 업무들의 정보를 변경로그에 추가
      if (addChangeLog && successCount > 0) {
        deletedTasks.forEach((task) => {
          addChangeLog('업무 삭제', task.code || `TASK-${task.id}`, `${task.workContent || '업무'} 삭제`, task.team || '미분류');
        });
      }

      const updatedData = data.filter((task) => !selected.includes(task.id));
      setData(updatedData);
      setSelected([]);

      // 부모 컴포넌트로 동기화
      if (setTasks) {
        setTasks(updatedData);
      }

      // 결과 알림
      if (failCount === 0) {
        setSnackbar({
          open: true,
          message: `${successCount}개 체크리스트가 성공적으로 삭제되었습니다.`,
          severity: 'success'
        });
      } else if (successCount > 0) {
        setSnackbar({
          open: true,
          message: `삭제 완료: ${successCount}개, 실패: ${failCount}개`,
          severity: 'warning'
        });
      } else {
        setSnackbar({
          open: true,
          message: '체크리스트 삭제에 실패했습니다.',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('체크리스트 삭제 중 오류:', error);
      setSnackbar({
        open: true,
        message: '체크리스트 삭제 중 오류가 발생했습니다.',
        severity: 'error'
      });
    }
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingTask(null);
    setEditingTaskId(null);
  };

  // Task 저장 (새 체크리스트 생성 시 ID 반환)
  const handleEditTaskSave = async (updatedTask: TaskTableData) => {
    console.log('💾 Task 저장 요청:', updatedTask);

    try {
      // Supabase에 저장 (새 체크리스트인 경우 createChecklist 호출)
      let success = false;
      let createdId: number | null = null;

      const existingIndex = data.findIndex((task) => task.id === updatedTask.id);
      console.log('🔍 기존 Task 인덱스:', existingIndex);

      if (existingIndex === -1) {
        // 새 체크리스트 생성
        console.log('➕ 새 체크리스트 생성 중...');
        const result = await createChecklist(updatedTask);
        success = result.success;
        createdId = result.data?.id || null;
        if (result.data) {
          // 서버에서 생성된 ID와 code를 task 객체에 반영
          updatedTask.id = result.data.id;
          updatedTask.code = result.data.code;
          console.log('✅ 서버에서 생성된 코드:', result.data.code);
        }
      } else {
        // 기존 체크리스트 수정
        console.log('✏️ 기존 체크리스트 수정 중...');
        success = await updateChecklist(updatedTask);
      }

      if (!success) {
        console.error('체크리스트 저장 실패');
        setSnackbar({
          open: true,
          message: '체크리스트 저장에 실패했습니다.',
          severity: 'error'
        });
        return createdId; // 실패해도 생성된 ID가 있으면 반환
      }

      if (existingIndex === -1 && createdId) {
        // 새로 생성된 체크리스트의 경우 목록 새로고침
        await fetchChecklists();
        setSnackbar({
          open: true,
          message: '체크리스트가 성공적으로 생성되었습니다.',
          severity: 'success'
        });
        return createdId; // 생성된 ID 반환
      } else if (existingIndex !== -1) {
        // 기존 Task 업데이트
        const originalTask = data[existingIndex];
        const updatedData = [...data];
        updatedData[existingIndex] = updatedTask;
        setData(updatedData);

        // 부모 컴포넌트로 동기화
        if (setTasks) {
          setTasks(updatedData);
        }

        // 변경로그 추가 - 변경된 필드 확인
        if (addChangeLog) {
          const changes: string[] = [];
          const taskCode = updatedTask.code || `TASK-${updatedTask.id}`;

          if (originalTask.status !== updatedTask.status) {
            changes.push(`상태: "${originalTask.status}" → "${updatedTask.status}"`);
          }
          if (originalTask.assignee !== updatedTask.assignee) {
            changes.push(`담당자: "${originalTask.assignee || '미할당'}" → "${updatedTask.assignee || '미할당'}"`);
          }
          if (originalTask.workContent !== updatedTask.workContent) {
            changes.push(`업무내용 수정`);
          }
          if (originalTask.progress !== updatedTask.progress) {
            changes.push(`진행율: ${originalTask.progress || 0}% → ${updatedTask.progress || 0}%`);
          }
          if (originalTask.completedDate !== updatedTask.completedDate) {
            changes.push(`완료일: "${originalTask.completedDate || '미정'}" → "${updatedTask.completedDate || '미정'}"`);
          }

          if (changes.length > 0) {
            addChangeLog(
              '업무 정보 수정',
              taskCode,
              `${updatedTask.workContent || '업무'} - ${changes.join(', ')}`,
              updatedTask.team || '미분류'
            );
          }
        }

        setSnackbar({
          open: true,
          message: '체크리스트가 성공적으로 수정되었습니다.',
          severity: 'success'
        });

        console.log('✅ 기존 Task 업데이트 완료');
      } else {
        // 새 Task 추가 - 상단에 추가
        const currentYear = new Date().getFullYear();
        const yearSuffix = currentYear.toString().slice(-2);
        const existingNos = data.map((t) => t.no || 0).filter((no) => typeof no === 'number' && !isNaN(no));
        const maxNo = existingNos.length > 0 ? Math.max(...existingNos, 0) : 0;
        const newTaskWithNumber = {
          ...updatedTask,
          id: Date.now(), // 임시 ID
          no: maxNo + 1,
          code: `TASK-${yearSuffix}-${String(maxNo + 1).padStart(3, '0')}`,
          registrationDate: new Date().toISOString().split('T')[0],
          startDate: updatedTask.startDate || new Date().toISOString().split('T')[0]
        };
        // 새 데이터를 배열 맨 앞에 추가 (역순 정렬을 위해)
        const newData = [newTaskWithNumber, ...data];
        setData(newData);

        // 부모 컴포넌트로 동기화
        if (setTasks) {
          setTasks(newData);
        }

        // 변경로그 추가 - 새 업무 생성
        if (addChangeLog) {
          addChangeLog(
            '새 업무 생성',
            newTaskWithNumber.code,
            `${newTaskWithNumber.workContent || '새 업무'} 생성`,
            newTaskWithNumber.team || '미분류'
          );
        }

        console.log('✅ 새 Task 추가 완료:', newTaskWithNumber);
      }

      handleEditDialogClose();
      return createdId || updatedTask.id; // 생성된 ID 또는 기존 ID 반환
    } catch (error) {
      console.error('체크리스트 저장 중 오류:', error);
      return null;
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

  // 팀 색상
  const getTeamColor = (team: string) => {
    return { color: '#333333' };
  };

  // ✅ 권한 없을 경우 접근 차단
  if (!canRead && !permissionLoading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="error">
          이 페이지에 접근할 권한이 없습니다.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 상단 정보 및 액션 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, mt: 3, flexShrink: 0 }}>
        <Typography variant="body2" color="text.secondary">
          총 {filteredData.length}건
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {canRead && (
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
          )}
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
              <TableCell sx={{ width: columnWidths.category, fontWeight: 600 }}>체크리스트분류</TableCell>
              <TableCell sx={{ width: columnWidths.title, fontWeight: 600 }}>제목</TableCell>
              <TableCell sx={{ width: columnWidths.description, fontWeight: 600 }}>설명</TableCell>
              <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: columnWidths.team, fontWeight: 600 }}>팀</TableCell>
              <TableCell sx={{ width: columnWidths.registrant, fontWeight: 600 }}>등록자</TableCell>
              <TableCell sx={{ width: columnWidths.action, fontWeight: 600 }}>Action</TableCell>
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
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary', whiteSpace: 'nowrap' }}>
                      {task.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {getSubCodeName(task.department) || '분류없음'}
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
                        maxWidth: 180
                      }}
                    >
                      {task.workContent || '제목 없음'}
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
                      {task.description || '설명 없음'}
                    </Typography>
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
                    <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                      {task.team || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {(() => {
                        const user = getUserByCode(task.assignee);
                        return (
                          <>
                            <Avatar src={user?.profile_image_url || user?.avatar_url} alt={user?.user_name} sx={{ width: 24, height: 24 }}>
                              {user?.user_name?.charAt(0) || task.assignee?.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 80, fontSize: '13px' }}>
                              {user?.user_name || task.assignee}
                            </Typography>
                          </>
                        );
                      })()}
                    </Stack>
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
              <MenuItem key={5} value={5}>
                5
              </MenuItem>
              <MenuItem key={10} value={10}>
                10
              </MenuItem>
              <MenuItem key={25} value={25}>
                25
              </MenuItem>
              <MenuItem key={50} value={50}>
                50
              </MenuItem>
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
        <ChecklistEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          task={editingTask}
          onSave={handleEditTaskSave}
          assignees={assignees}
          assigneeAvatars={assigneeAvatars}
          statusOptions={taskStatusOptions}
          statusColors={taskStatusColors}
          teams={teams}
          canCreateData={canCreateData}
          canEditOwn={canEditOwn}
          canEditOthers={canEditOthers}
        />
      )}

      {/* 알림창 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
