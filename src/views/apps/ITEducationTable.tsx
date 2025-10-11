'use client';

import { useState, useMemo, useEffect } from 'react';

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
import ITEducationEditDialog from 'components/ITEducationEditDialog';

// data and types
import { itEducationData, teams, assignees, itEducationStatusOptions, itEducationStatusColors, assigneeAvatars } from 'data/it-education';
import { ITEducationTableData, ITEducationStatus, ITEducationRecord } from 'types/it-education';
import { useSupabaseItEducation, ItEducationData } from 'hooks/useSupabaseItEducation';
import { useSupabaseUserManagement } from 'hooks/useSupabaseUserManagement';

// 데이터 변환 함수
const convertTableDataToRecord = (tableData: ITEducationTableData): ITEducationRecord => {
  return {
    id: tableData.id,
    registrationDate: tableData.registrationDate,
    code: tableData.code,
    educationType: tableData.educationType,
    educationName: tableData.educationName,
    location: tableData.location,
    participantCount: tableData.attendeeCount,
    executionDate: tableData.executionDate,
    status: tableData.status,
    assignee: tableData.assignee,
    attachment: Boolean(tableData.attachments?.length),
    attachmentCount: tableData.attachments?.length || 0,
    attachments: tableData.attachments || [],
    isNew: false
  };
};

const convertRecordToTableData = (record: ITEducationRecord): ITEducationTableData => {
  return {
    id: record.id,
    no: record.id,
    registrationDate: record.registrationDate,
    code: record.code,
    educationType: record.educationType,
    educationName: record.educationName,
    location: record.location,
    attendeeCount: record.participantCount,
    executionDate: record.executionDate,
    status: record.status,
    team: (record as any).team || '',
    assignee: record.assignee,
    department: undefined,
    attachments: record.attachments
  };
};

// Icons
import { Add, Trash, Edit, DocumentDownload } from '@wandersonalwes/iconsax-react';

// 컬럼 너비 정의 (IT교육관리 전용)
const columnWidths = {
  checkbox: 50,
  no: 60,
  registrationDate: 100,
  code: 120,
  educationType: 120,
  educationName: 200,
  location: 120,
  attendeeCount: 80,
  team: 120,
  assignee: 120,
  status: 90,
  executionDate: 100,
  action: 80
};

interface ITEducationTableProps {
  selectedYear?: string;
  selectedTeam?: string;
  selectedStatus?: string;
  selectedAssignee?: string;
  tasks?: ITEducationTableData[];
  setTasks?: React.Dispatch<React.SetStateAction<ITEducationTableData[]>>;
  addChangeLog?: (action: string, target: string, description: string, team?: string) => void;
}

export default function ITEducationTable({
  selectedYear = '전체',
  selectedTeam = '전체',
  selectedStatus = '전체',
  selectedAssignee = '전체',
  tasks,
  setTasks,
  addChangeLog
}: ITEducationTableProps) {
  const theme = useTheme();

  // Supabase 훅 사용
  const { loading, error, getItEducationData, deleteItEducation } = useSupabaseItEducation();

  // 사용자관리 훅 사용 (프로필 이미지 가져오기)
  const { users: allUsers } = useSupabaseUserManagement();

  // 사용자 이름으로 프로필 이미지 찾기
  const getUserProfileImage = (userName: string): string | undefined => {
    const user = allUsers.find(u => u.user_name === userName);
    return user?.profile_image_url || user?.avatar_url;
  };

  const [data, setData] = useState<ITEducationTableData[]>(tasks ? tasks : []);
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState('');

  // Edit 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<ITEducationTableData | null>(null);
  const [editingRecord, setEditingRecord] = useState<ITEducationRecord | null>(null);
  const [editMode, setEditMode] = useState<'add' | 'edit'>('edit');
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  // Excel 다운로드 기능
  const handleExcelDownload = () => {
    try {
      // 필터링된 데이터를 Excel 형식으로 변환 (테이블과 동일한 컬럼 순서)
      const excelData = filteredData.map((task, index) => ({
        NO: index + 1,
        등록일: task.registrationDate,
        코드: task.code,
        교육유형: task.educationType,
        교육명: task.educationName,
        장소: task.location,
        참석수: task.attendeeCount,
        팀: task.team || '-',
        담당자: task.assignee,
        상태: task.status,
        실행일: task.executionDate
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
      link.setAttribute('download', `IT교육관리_${new Date().toISOString().slice(0, 10)}.csv`);
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

  // Supabase에서 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      if (!tasks) {
        try {
          const supabaseData = await getItEducationData();
          console.log('🔍 Supabase 원본 데이터 (첫 번째):', supabaseData[0]);
          const convertedData: ITEducationTableData[] = supabaseData.map((item) => ({
            id: item.id!,
            no: item.id!,
            registrationDate: item.registration_date || '',
            code: item.code || '',
            educationType: (item.education_type as any) || '온라인',
            educationName: item.education_name || '',
            location: item.location || '',
            attendeeCount: item.participant_count || 0,
            executionDate: item.execution_date || '',
            status: (item.status as any) || '계획',
            team: item.team || '',
            assignee: item.assignee || '',
            department: undefined,
            attachments: []
          }));
          console.log('🔍 변환된 데이터 (첫 번째):', convertedData[0]);
          setData(convertedData);
        } catch (error) {
          console.error('데이터 로드 실패:', error);
          // 오류 시 목업 데이터 사용
          setData(itEducationData.map((task) => ({ ...task })));
        }
      }
    };

    loadData();
  }, [getItEducationData, tasks]);

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
    // ID 기준 역순 정렬 (최신 ID가 위로) + 등록일 기준 역순 정렬
    return filtered.sort((a, b) => {
      // 먼저 ID로 정렬 (큰 ID가 위로)
      const idSort = (b.id || 0) - (a.id || 0);
      if (idSort !== 0) return idSort;

      // ID가 같으면 등록일로 정렬 (최신이 위로)
      return new Date(b.registrationDate || '').getTime() - new Date(a.registrationDate || '').getTime();
    });
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

  // 선택된 행 삭제 (Supabase 소프트 삭제)
  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;

    try {
      const deletedTasks = data.filter((task) => selected.includes(task.id));

      // 각 선택된 항목을 Supabase에서 소프트 삭제
      const deletePromises = selected.map(id => deleteItEducation(id));
      const deleteResults = await Promise.all(deletePromises);

      // 성공한 삭제만 처리
      const successfulDeletes = deleteResults.filter(result => result);

      if (successfulDeletes.length > 0) {
        // 변경로그 추가
        if (addChangeLog) {
          deletedTasks.forEach((task) => {
            addChangeLog('교육 삭제', task.code || `IT-EDU-${task.id}`, `${task.educationName || '교육'} 삭제`);
          });
        }

        // 로컬 상태에서 삭제된 항목 제거
        const updatedData = data.filter((task) => !selected.includes(task.id));
        setData(updatedData);
        setSelected([]);

        // 부모 컴포넌트로 동기화
        if (setTasks) {
          setTasks(updatedData);
        }

        console.log(`✅ ${successfulDeletes.length}개 항목이 삭제되었습니다.`);
      }

      if (deleteResults.includes(false)) {
        console.error('❌ 일부 항목 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 삭제 중 오류 발생:', error);
    }
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingTask(null);
    setEditingRecord(null);
    setEditingTaskId(null);
  };

  // Task 저장 - Supabase 저장 후 데이터 새로 로드
  const handleEditTaskSave = async (updatedRecord: ITEducationRecord) => {
    console.log('💾 Task 저장 요청:', updatedRecord);

    try {
      // Record를 TableData로 변환
      const updatedTask = convertRecordToTableData(updatedRecord);
      const existingIndex = data.findIndex((task) => task.id === updatedTask.id);

      if (existingIndex !== -1) {
        // 기존 Task 업데이트 - 즉시 업데이트
        const originalTask = data[existingIndex];
        const updatedData = [...data];
        updatedData[existingIndex] = updatedTask;
        setData(updatedData);

        // 부모 컴포넌트로 동기화
        if (setTasks) {
          setTasks(updatedData);
        }

        // 변경로그 추가
        if (addChangeLog) {
          const changes: string[] = [];
          const taskCode = updatedTask.code || `IT-EDU-${updatedTask.id}`;

          if (originalTask.status !== updatedTask.status) {
            changes.push(`상태: "${originalTask.status}" → "${updatedTask.status}"`);
          }
          if (originalTask.assignee !== updatedTask.assignee) {
            changes.push(`담당자: "${originalTask.assignee || '미할당'}" → "${updatedTask.assignee || '미할당'}"`);
          }

          if (changes.length > 0) {
            addChangeLog(
              'IT교육 정보 수정',
              taskCode,
              `${updatedTask.educationName || 'IT교육'} - ${changes.join(', ')}`,
              '교육관리'
            );
          }
        }

        console.log('✅ 기존 Task 업데이트 완료');
      } else {
        // 새 Task 추가 - Supabase 저장 후 전체 데이터 다시 로드
        console.log('🔄 새 Task 추가 후 데이터 새로고침...');

        // 즉시 데이터 새로 로드 (await 사용)
        try {
          await new Promise(resolve => setTimeout(resolve, 300)); // 짧은 지연으로 Supabase 저장 완료 보장
          const supabaseData = await getItEducationData();
          console.log('🔍 Supabase 원본 데이터 (첫 번째):', supabaseData[0]);
          const convertedData: ITEducationTableData[] = supabaseData.map((item) => ({
            id: item.id!,
            no: item.id!,
            registrationDate: item.registration_date || '',
            code: item.code || '',
            educationType: (item.education_type as any) || '온라인',
            educationName: item.education_name || '',
            location: item.location || '',
            attendeeCount: item.participant_count || 0,
            executionDate: item.execution_date || '',
            status: (item.status as any) || '계획',
            team: item.team || '',
            assignee: item.assignee || '',
            department: undefined,
            attachments: []
          }));
          console.log('🔍 변환된 데이터 (첫 번째):', convertedData[0]);
          setData(convertedData);

          // 부모 컴포넌트로 동기화
          if (setTasks) {
            setTasks(convertedData);
          }

          console.log('✅ 새 데이터 로드 완료');
        } catch (error) {
          console.error('❌ 데이터 로드 실패:', error);
        }
      }
    } catch (error) {
      console.error('❌ Task 저장 중 오류:', error);
    }

    handleEditDialogClose();
  };

  // 새 Task 추가
  const addNewTask = () => {
    // 바로 편집 팝업 열기
    setEditingTask(null);
    setEditingRecord(null);
    setEditingTaskId(null);
    setEditMode('add');
    setEditDialog(true);
  };

  // 편집 핸들러 (IT교육관리 스타일)
  const handleEditTask = (task: ITEducationTableData) => {
    setEditingTask(task);
    setEditingRecord(convertTableDataToRecord(task));
    setEditingTaskId(task.id);
    setEditMode('edit');
    setEditDialog(true);
  };

  // 상태 색상 (파스텔톤 배경, 검정 계열 글자)
  const getStatusColor = (status: ITEducationStatus) => {
    switch (status) {
      case '계획':
        return { backgroundColor: '#F5F5F5', color: '#757575' };
      case '진행중':
        return { backgroundColor: '#E3F2FD', color: '#1976D2' };
      case '완료':
        return { backgroundColor: '#E8F5E9', color: '#388E3C' };
      case '취소':
        return { backgroundColor: '#FFEBEE', color: '#D32F2F' };
      default:
        return { backgroundColor: '#F5F5F5', color: '#757575' };
    }
  };

  // 팀 색상
  const getTeamColor = (team: string) => {
    return { color: '#333333' };
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 로딩/에러 상태 표시 */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <LinearProgress sx={{ width: '100%' }} />
        </Box>
      )}

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error" variant="body2">
            ⚠️ 데이터 로드 중 오류: {error}
          </Typography>
        </Box>
      )}

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
              <TableCell sx={{ width: columnWidths.educationType, fontWeight: 600 }}>교육유형</TableCell>
              <TableCell sx={{ width: columnWidths.educationName, fontWeight: 600 }}>교육명</TableCell>
              <TableCell sx={{ width: columnWidths.location, fontWeight: 600 }}>장소</TableCell>
              <TableCell sx={{ width: columnWidths.attendeeCount, fontWeight: 600 }}>참석수</TableCell>
              <TableCell sx={{ width: columnWidths.team, fontWeight: 600 }}>팀</TableCell>
              <TableCell sx={{ width: columnWidths.assignee, fontWeight: 600 }}>담당자</TableCell>
              <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: columnWidths.executionDate, fontWeight: 600 }}>실행일</TableCell>
              <TableCell sx={{ width: columnWidths.action, fontWeight: 600 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((task, index) => (
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
                      {filteredData.length - (page * rowsPerPage + index)}
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
                      {task.educationType || '유형없음'}
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
                      {task.educationName || '교육명 없음'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {task.location || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary', textAlign: 'center' }}>
                      {task.attendeeCount || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {task.team || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        src={getUserProfileImage(task.assignee)}
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
                      {task.executionDate || '-'}
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
                <TableCell colSpan={13} align="center" sx={{ py: 4 }}>
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
        <ITEducationEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          recordId={editingTaskId}
          tasks={data}
          onSave={handleEditTaskSave}
        />
      )}
    </Box>
  );
}
