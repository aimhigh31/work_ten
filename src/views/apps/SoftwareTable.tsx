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
  LinearProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { SelectChangeEvent } from '@mui/material/Select';

// project imports
import MainCard from 'components/MainCard';
import SoftwareEditDialog from 'components/SoftwareEditDialog';

// data and types
import { taskData, teams, assignees, softwareStatusOptions, softwareStatusColors, assigneeAvatars } from 'data/software';
import { TaskTableData, SoftwareStatus } from 'types/software';
import { useCommonData } from 'contexts/CommonDataContext';

// Users hook - users prop으로 전달받음 (props 사용)

// GROUP002 hook
import { useGroup002 } from '../../hooks/useGroup002';

// Icons
import { Add, Trash, Edit, DocumentDownload } from '@wandersonalwes/iconsax-react';

// 컬럼 너비 정의 (소프트웨어관리 전용)
const columnWidths = {
  checkbox: 50,
  no: 60,
  registrationDate: 100,
  code: 120,
  softwareCategory: 140,
  softwareName: 200,
  spec: 150,
  status: 90,
  currentUser: 120,
  assignee: 120,
  startDate: 100,
  completedDate: 100,
  action: 80
};

interface SoftwareTableProps {
  selectedYear?: string;
  selectedTeam?: string;
  selectedStatus?: string;
  selectedAssignee?: string;
  tasks?: TaskTableData[];
  setTasks?: React.Dispatch<React.SetStateAction<TaskTableData[]>>;
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
  deleteMultipleSoftware?: (ids: number[]) => Promise<any>;
  users?: any[];
  canCreateData?: boolean;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
  setSnackbar?: React.Dispatch<React.SetStateAction<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>>;
}

export default function SoftwareTable({
  selectedYear = '전체',
  selectedTeam = '전체',
  selectedStatus = '전체',
  selectedAssignee = '전체',
  tasks,
  setTasks,
  addChangeLog,
  deleteMultipleSoftware,
  users = [],
  canCreateData = true,
  canEditOwn = true,
  canEditOthers = true,
  setSnackbar = undefined
}: SoftwareTableProps) {
  const theme = useTheme();
  const [data, setData] = useState<TaskTableData[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState('');

  // 공통 데이터 가져오기
  const { masterCodes } = useCommonData();

  // 소프트웨어분류 서브코드명 변환 함수
  const getSoftwareCategoryName = useCallback((subcode: string) => {
    if (!subcode) return '';
    const found = masterCodes.find(
      (item) => item.codetype === 'subcode' && item.group_code === 'GROUP015' && item.subcode === subcode && item.is_active
    );
    return found ? found.subcode_name : subcode;
  }, [masterCodes]);

  // 상태 코드를 이름으로 변환하는 함수
  const getStatusName = useCallback((statusCode: string) => {
    if (!statusCode) return '대기';
    // "GROUP002-SUB001" 형태에서 서브코드명 찾기
    const status = masterCodes.find(
      (code) => code.codetype === 'subcode' && code.group_code === 'GROUP002' && (code.subcode === statusCode || `${code.group_code}-${code.subcode}` === statusCode)
    );
    return status?.subcode_name || statusCode;
  }, [masterCodes]);

  // 🔐 세션 정보 (권한 체크용)
  const { data: session } = useSession();

  // 🔐 권한 체크: 현재 사용자 정보
  const currentUser = useMemo(() => {
    if (!session?.user?.email || !users || users.length === 0) return null;
    const found = users.find((u) => u.email === session.user.email);
    console.log('🔐 SoftwareTable - 현재 사용자:', {
      email: session?.user?.email,
      user_name: found?.user_name,
      found: !!found
    });
    return found;
  }, [session, users]);

  // 🔐 권한 체크: 데이터 소유자 확인
  const isDataOwner = (software: TaskTableData) => {
    if (!currentUser) return false;
    const isCreator = software.createdBy === currentUser.user_name;
    const isAssignee = software.assignee === currentUser.user_name;
    const result = isCreator || isAssignee;

    if (software.id === data[0]?.id) { // 첫 번째 항목만 로그
      console.log('🔐 SoftwareTable - 데이터 소유자 확인 (첫 항목):', {
        softwareId: software.id,
        currentUserName: currentUser.user_name,
        createdBy: software.createdBy,
        assignee: software.assignee,
        isCreator,
        isAssignee,
        isOwner: result
      });
    }

    return result;
  };

  // 🔐 권한 체크: 개별 데이터 편집 가능 여부
  const canEditData = useCallback((software: TaskTableData) => {
    return canEditOthers || (canEditOwn && isDataOwner(software));
  }, [canEditOthers, canEditOwn, currentUser]);

  // 🔐 권한 체크: 선택된 모든 데이터 편집 가능 여부
  const canEditAllSelected = useMemo(() => {
    if (selected.length === 0) return false;
    return selected.every((id) => {
      const software = data.find((item) => item.id === id);
      return software && canEditData(software);
    });
  }, [selected, data, canEditData]);

  // GROUP002 상태 데이터 가져오기
  const { statusOptions: masterStatusOptions, loading: statusLoading, error: statusError } = useGroup002();

  // 사용자 이름으로 사용자 데이터 찾기
  const findUserByName = (userName: string) => {
    if (!users || users.length === 0) return null;
    return users.find((user) => user.user_name === userName);
  };

  // tasks props 변경시 data 상태 업데이트
  useEffect(() => {
    console.log('📊 SoftwareTable - tasks props 변경됨:', tasks?.length || 0, '개');
    if (tasks && tasks.length > 0) {
      setData(tasks.map((task) => ({ ...task })));
      console.log('✅ SoftwareTable - 데이터 업데이트 완료');
    } else {
      // tasks가 비어있으면 기본 데이터 사용 (개발 중에만)
      setData(taskData.map((task) => ({ ...task })));
      console.log('⚠️ SoftwareTable - 기본 taskData 사용');
    }
  }, [tasks]);

  // Edit 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskTableData | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  // Excel 다운로드 기능
  const handleExcelDownload = () => {
    try {
      // 필터링된 데이터를 Excel 형식으로 변환 (테이블과 동일한 컬럼 순서)
      const excelData = filteredData.map((task, index) => ({
        NO: filteredData.length - index,
        등록일: task.registrationDate,
        코드: task.code,
        소프트웨어분류: (task as any).softwareCategory || '분류없음',
        소프트웨어명: (task as any).softwareName || task.workContent,
        스펙: (task as any).spec || '미정',
        상태: getStatusName(task.status),
        사용자: (task as any).currentUser || '미할당',
        담당자: task.assignee,
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
      link.setAttribute('download', `소프트웨어관리_${new Date().toISOString().slice(0, 10)}.csv`);
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

    // 삭제할 항목들의 정보를 미리 저장
    const deletedSoftwares = data.filter((task) => selected.includes(task.id));

    try {
      // 삭제될 업무들의 정보를 변경로그에 추가
      if (addChangeLog) {
        deletedSoftwares.forEach((task) => {
          const softwareName = task.softwareName || task.workContent || '소프트웨어';
          const taskCode = task.code || `SW-${task.id}`;
          addChangeLog(
            '삭제',
            taskCode,
            `소프트웨어관리 ${softwareName}(${taskCode})의 데이터가 삭제 되었습니다.`,
            task.team || '미분류',
            undefined,
            undefined,
            undefined,
            softwareName
          );
        });
      }

      // 데이터베이스에서 삭제 (soft delete)
      if (deleteMultipleSoftware) {
        console.log('🗑️ 선택삭제 시작:', selected);
        await deleteMultipleSoftware(selected);
        console.log('✅ 선택삭제 완료');

        // 즉시 로컬 상태 업데이트 (화면에서 바로 제거)
        const updatedData = data.filter((task) => !selected.includes(task.id));
        setData(updatedData);

        // 부모 컴포넌트로 동기화
        if (setTasks) {
          setTasks(updatedData);
        }

        // 토스트 알림 (삭제)
        if (setSnackbar) {
          if (deletedSoftwares.length === 1) {
            const softwareName = deletedSoftwares[0].softwareName || deletedSoftwares[0].workContent || '소프트웨어';
            const taskCode = deletedSoftwares[0].code || `SW-${deletedSoftwares[0].id}`;
            setSnackbar({
              open: true,
              message: `소프트웨어관리 ${softwareName}(${taskCode})의 데이터가 삭제 되었습니다.`,
              severity: 'error'
            });
          } else {
            setSnackbar({
              open: true,
              message: `${deletedSoftwares.length}개 소프트웨어가 성공적으로 삭제되었습니다.`,
              severity: 'error'
            });
          }
        }
      } else {
        // Supabase 연결이 없는 경우 로컬에서만 삭제 (개발용)
        console.warn('⚠️ deleteMultipleSoftware 함수가 없습니다. 로컬 상태만 업데이트합니다.');
        const updatedData = data.filter((task) => !selected.includes(task.id));
        setData(updatedData);

        // 부모 컴포넌트로 동기화
        if (setTasks) {
          setTasks(updatedData);
        }
      }
    } catch (error) {
      console.error('❌ 삭제 중 오류 발생:', error);
      // 토스트 알림 (에러)
      if (setSnackbar) {
        setSnackbar({
          open: true,
          message: '삭제에 실패했습니다.',
          severity: 'error'
        });
      }
    } finally {
      // 선택 초기화 (성공/실패 관계없이)
      setSelected([]);
    }
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingTask(null);
    setEditingTaskId(null);
  };

  // Task 저장
  const handleEditTaskSave = (updatedTask: TaskTableData) => {
    console.log('💾 Task 저장 요청:', updatedTask);

    const existingIndex = data.findIndex((task) => task.id === updatedTask.id);
    console.log('🔍 기존 Task 인덱스:', existingIndex);

    if (existingIndex !== -1) {
      // 기존 Task 업데이트
      const originalTask = data[existingIndex];
      const updatedData = [...data];
      updatedData[existingIndex] = updatedTask;
      setData(updatedData);

      // 부모 컴포넌트로 동기화
      if (setTasks) {
        setTasks(updatedData);
      }

      // 변경로그 추가 - 필드별 상세 추적 (14개 필드)
      if (addChangeLog) {
        const taskCode = updatedTask.code || `IT-SW-${updatedTask.id}`;
        const softwareName = updatedTask.softwareName || updatedTask.workContent || '소프트웨어';

        // 1. 소프트웨어분류 변경
        if (originalTask.softwareCategory !== updatedTask.softwareCategory) {
          addChangeLog(
            '수정',
            taskCode,
            `소프트웨어관리 ${softwareName}(${taskCode}) 정보의 개요탭 소프트웨어분류가 ${originalTask.softwareCategory || ''} → ${updatedTask.softwareCategory || ''} 로 수정 되었습니다.`,
            updatedTask.team || '미분류',
            originalTask.softwareCategory || '',
            updatedTask.softwareCategory || '',
            '소프트웨어분류',
            softwareName
          );
        }

        // 2. 소프트웨어명 변경
        if (originalTask.softwareName !== updatedTask.softwareName) {
          addChangeLog(
            '수정',
            taskCode,
            `소프트웨어관리 ${originalTask.softwareName || ''}(${taskCode}) 정보의 개요탭 소프트웨어명이 ${originalTask.softwareName || ''} → ${updatedTask.softwareName || ''} 로 수정 되었습니다.`,
            updatedTask.team || '미분류',
            originalTask.softwareName || '',
            updatedTask.softwareName || '',
            '소프트웨어명',
            updatedTask.softwareName
          );
        }

        // 3. 스펙 변경
        if (originalTask.spec !== updatedTask.spec) {
          addChangeLog(
            '수정',
            taskCode,
            `소프트웨어관리 ${softwareName}(${taskCode}) 정보의 개요탭 스펙이 ${originalTask.spec || ''} → ${updatedTask.spec || ''} 로 수정 되었습니다.`,
            updatedTask.team || '미분류',
            originalTask.spec || '',
            updatedTask.spec || '',
            '스펙',
            softwareName
          );
        }

        // 4. 사용자 변경
        if (originalTask.currentUser !== updatedTask.currentUser) {
          addChangeLog(
            '수정',
            taskCode,
            `소프트웨어관리 ${softwareName}(${taskCode}) 정보의 개요탭 사용자가 ${originalTask.currentUser || ''} → ${updatedTask.currentUser || ''} 로 수정 되었습니다.`,
            updatedTask.team || '미분류',
            originalTask.currentUser || '',
            updatedTask.currentUser || '',
            '사용자',
            softwareName
          );
        }

        // 5. 담당자 변경
        if (originalTask.assignee !== updatedTask.assignee) {
          addChangeLog(
            '수정',
            taskCode,
            `소프트웨어관리 ${softwareName}(${taskCode}) 정보의 개요탭 담당자가 ${originalTask.assignee || ''} → ${updatedTask.assignee || ''} 로 수정 되었습니다.`,
            updatedTask.team || '미분류',
            originalTask.assignee || '',
            updatedTask.assignee || '',
            '담당자',
            softwareName
          );
        }

        // 6. 상태 변경
        if (originalTask.status !== updatedTask.status) {
          addChangeLog(
            '수정',
            taskCode,
            `소프트웨어관리 ${softwareName}(${taskCode}) 정보의 개요탭 상태가 ${originalTask.status} → ${updatedTask.status} 로 수정 되었습니다.`,
            updatedTask.team || '미분류',
            originalTask.status,
            updatedTask.status,
            '상태',
            softwareName
          );
        }

        // 7. 시작일 변경
        if (originalTask.startDate !== updatedTask.startDate) {
          addChangeLog(
            '수정',
            taskCode,
            `소프트웨어관리 ${softwareName}(${taskCode}) 정보의 개요탭 시작일이 ${originalTask.startDate || ''} → ${updatedTask.startDate || ''} 로 수정 되었습니다.`,
            updatedTask.team || '미분류',
            originalTask.startDate || '',
            updatedTask.startDate || '',
            '시작일',
            softwareName
          );
        }

        // 8. 완료일 변경
        if (originalTask.completedDate !== updatedTask.completedDate) {
          addChangeLog(
            '수정',
            taskCode,
            `소프트웨어관리 ${softwareName}(${taskCode}) 정보의 개요탭 완료일이 ${originalTask.completedDate || ''} → ${updatedTask.completedDate || ''} 로 수정 되었습니다.`,
            updatedTask.team || '미분류',
            originalTask.completedDate || '',
            updatedTask.completedDate || '',
            '완료일',
            softwareName
          );
        }

        // 9. 팀 변경
        if (originalTask.team !== updatedTask.team) {
          addChangeLog(
            '수정',
            taskCode,
            `소프트웨어관리 ${softwareName}(${taskCode}) 정보의 개요탭 팀이 ${originalTask.team || ''} → ${updatedTask.team || ''} 로 수정 되었습니다.`,
            updatedTask.team || '미분류',
            originalTask.team || '',
            updatedTask.team || '',
            '팀',
            softwareName
          );
        }

        // 10. 설명 변경
        if (originalTask.description !== updatedTask.description) {
          addChangeLog(
            '수정',
            taskCode,
            `소프트웨어관리 ${softwareName}(${taskCode}) 정보의 개요탭 설명이 ${originalTask.description || ''} → ${updatedTask.description || ''} 로 수정 되었습니다.`,
            updatedTask.team || '미분류',
            originalTask.description || '',
            updatedTask.description || '',
            '설명',
            softwareName
          );
        }

        // 11. 라이센스키 변경
        if (originalTask.licenseKey !== updatedTask.licenseKey) {
          addChangeLog(
            '수정',
            taskCode,
            `소프트웨어관리 ${softwareName}(${taskCode}) 정보의 개요탭 라이센스키가 ${originalTask.licenseKey || ''} → ${updatedTask.licenseKey || ''} 로 수정 되었습니다.`,
            updatedTask.team || '미분류',
            originalTask.licenseKey || '',
            updatedTask.licenseKey || '',
            '라이센스키',
            softwareName
          );
        }

        // 12. 솔루션업체 변경
        if (originalTask.solutionProvider !== updatedTask.solutionProvider) {
          addChangeLog(
            '수정',
            taskCode,
            `소프트웨어관리 ${softwareName}(${taskCode}) 정보의 개요탭 솔루션업체가 ${originalTask.solutionProvider || ''} → ${updatedTask.solutionProvider || ''} 로 수정 되었습니다.`,
            updatedTask.team || '미분류',
            originalTask.solutionProvider || '',
            updatedTask.solutionProvider || '',
            '솔루션업체',
            softwareName
          );
        }

        // 13. 사용자수 변경
        if (originalTask.userCount !== updatedTask.userCount) {
          addChangeLog(
            '수정',
            taskCode,
            `소프트웨어관리 ${softwareName}(${taskCode}) 정보의 개요탭 사용자수가 ${originalTask.userCount || 0} → ${updatedTask.userCount || 0} 로 수정 되었습니다.`,
            updatedTask.team || '미분류',
            String(originalTask.userCount || 0),
            String(updatedTask.userCount || 0),
            '사용자수',
            softwareName
          );
        }

        // 14. 라이센스유형 변경
        if (originalTask.licenseType !== updatedTask.licenseType) {
          addChangeLog(
            '수정',
            taskCode,
            `소프트웨어관리 ${softwareName}(${taskCode}) 정보의 개요탭 라이센스유형이 ${originalTask.licenseType || ''} → ${updatedTask.licenseType || ''} 로 수정 되었습니다.`,
            updatedTask.team || '미분류',
            originalTask.licenseType || '',
            updatedTask.licenseType || '',
            '라이센스유형',
            softwareName
          );
        }
      }

      console.log('✅ 기존 Task 업데이트 완료');

      // 토스트 알림 (수정)
      if (setSnackbar) {
        const softwareName = updatedTask.softwareName || updatedTask.workContent || '소프트웨어';
        const getKoreanParticle = (word: string): string => {
          const lastChar = word.charAt(word.length - 1);
          const code = lastChar.charCodeAt(0);
          if (code >= 0xAC00 && code <= 0xD7A3) {
            const hasJongseong = (code - 0xAC00) % 28 !== 0;
            return hasJongseong ? '이' : '가';
          }
          return '가';
        };
        const josa = getKoreanParticle(softwareName);
        setSnackbar({
          open: true,
          message: `${softwareName}${josa} 성공적으로 수정되었습니다.`,
          severity: 'success'
        });
      }
    } else {
      // 새 Task 추가 - DB 저장 후 정확한 코드로 추가
      // updatedTask에는 이미 SoftwareEditDialog에서 생성된 정확한 코드가 포함되어 있음
      const newTaskWithNumber = {
        ...updatedTask,
        id: updatedTask.id || Date.now(), // DB에서 생성된 ID 사용
        no: 0, // 프론트엔드에서 계산됨
        code: updatedTask.code || '', // Dialog에서 생성된 정확한 코드 사용
        registrationDate: updatedTask.registrationDate || new Date().toISOString().split('T')[0],
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
        const softwareName = newTaskWithNumber.softwareName || newTaskWithNumber.workContent || '새 업무';
        addChangeLog(
          '추가',
          newTaskWithNumber.code,
          `${newTaskWithNumber.workContent || '새 업무'} 생성`,
          newTaskWithNumber.team || '미분류',
          undefined,
          undefined,
          undefined,
          softwareName
        );
      }

      console.log('✅ 새 Task 추가 완료:', newTaskWithNumber);

      // 토스트 알림 (추가)
      if (setSnackbar) {
        const softwareName = newTaskWithNumber.softwareName || newTaskWithNumber.workContent || '소프트웨어';
        const getKoreanParticle = (word: string): string => {
          const lastChar = word.charAt(word.length - 1);
          const code = lastChar.charCodeAt(0);
          if (code >= 0xAC00 && code <= 0xD7A3) {
            const hasJongseong = (code - 0xAC00) % 28 !== 0;
            return hasJongseong ? '이' : '가';
          }
          return '가';
        };
        const josa = getKoreanParticle(softwareName);
        setSnackbar({
          open: true,
          message: `${softwareName}${josa} 성공적으로 추가되었습니다.`,
          severity: 'success'
        });
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

  // 소프트웨어 상태 색상 (파스텔톤)
  const getStatusColor = (status: string) => {
    switch (status) {
      case '대기':
        return {
          backgroundColor: '#F5F5F5',
          color: '#757575'
        };
      case '진행':
        return {
          backgroundColor: '#E3F2FD',
          color: '#1976D2'
        };
      case '완료':
        return {
          backgroundColor: '#E8F5E9',
          color: '#388E3C'
        };
      case '홀딩':
      case '홀딩22':
        return {
          backgroundColor: '#FFEBEE',
          color: '#D32F2F'
        };
      case '사용중':
        return {
          backgroundColor: '#E8F5E9',
          color: '#388E3C'
        };
      case '사용만료':
        return {
          backgroundColor: '#F3E5F5',
          color: '#7B1FA2'
        };
      case '폐기':
        return {
          backgroundColor: '#FFEBEE',
          color: '#D32F2F'
        };
      default:
        return {
          backgroundColor: '#F5F5F5',
          color: '#757575'
        };
    }
  };

  // 상태 값을 올바른 형태로 변환하는 함수 (제거 - getStatusName 사용)

  // 팀 색상
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
              borderColor: (selected.length > 0 && (canEditOwn || canEditOthers)) ? 'error.main' : 'grey.300',
              color: (selected.length > 0 && (canEditOwn || canEditOthers)) ? 'error.main' : 'grey.500',
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
              <TableCell sx={{ width: columnWidths.softwareCategory, fontWeight: 600 }}>소프트웨어분류</TableCell>
              <TableCell sx={{ width: columnWidths.softwareName, fontWeight: 600 }}>소프트웨어명</TableCell>
              <TableCell sx={{ width: columnWidths.spec, fontWeight: 600 }}>스펙</TableCell>
              <TableCell sx={{ width: columnWidths.currentUser, fontWeight: 600 }}>사용자</TableCell>
              <TableCell sx={{ width: columnWidths.assignee, fontWeight: 600 }}>담당자</TableCell>
              <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: columnWidths.startDate, fontWeight: 600 }}>시작일</TableCell>
              <TableCell sx={{ width: columnWidths.completedDate, fontWeight: 600 }}>완료일</TableCell>
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
                      {getSoftwareCategoryName((task as any).softwareCategory) || '분류없음'}
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
                      {(task as any).softwareName || task.workContent || '소프트웨어명 없음'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                      {(task as any).spec || '미정'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {(task as any).currentUser || '미할당'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {task.assignee ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar
                          src={findUserByName(task.assignee)?.avatar_url || findUserByName(task.assignee)?.profile_image_url}
                          alt={task.assignee}
                          sx={{ width: 24, height: 24 }}
                        >
                          {task.assignee?.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 80, fontSize: '13px' }}>
                          {task.assignee}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary' }}>
                        미할당
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        px: 1,
                        py: 0.25,
                        borderRadius: 2,
                        backgroundColor: getStatusColor(getStatusName(task.status)).backgroundColor
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: getStatusColor(getStatusName(task.status)).color
                        }}
                      >
                        {getStatusName(task.status)}
                      </Typography>
                    </Box>
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
        <SoftwareEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          task={editingTask}
          onSave={handleEditTaskSave}
          assignees={assignees}
          assigneeAvatars={assigneeAvatars}
          statusOptions={softwareStatusOptions}
          statusColors={softwareStatusColors}
          teams={teams}
          canCreateData={canCreateData}
          canEditOwn={canEditOwn}
          canEditOthers={canEditOthers}
        />
      )}
    </Box>
  );
}
