'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';

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
  Backdrop,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { SelectChangeEvent } from '@mui/material/Select';

// project imports
import MainCard from 'components/MainCard';
import SecurityIncidentEditDialog from 'components/SecurityIncidentEditDialog';

// data and types
import { SecurityIncidentRecord, incidentTypeOptions, statusOptions } from 'types/security-incident';
import { useSupabaseUsers } from 'hooks/useSupabaseUsers';
import { useSupabaseSecurityAccident } from 'hooks/useSupabaseSecurityAccident';
import { TaskTableData, TaskStatus } from 'types/task';
import { useSession } from 'next-auth/react';
import useUser from 'hooks/useUser';
import { useCommonData } from 'contexts/CommonDataContext';

// Icons
import { Edit } from '@wandersonalwes/iconsax-react';

// 한국어 조사 선택 함수
function getJosa(word: string, josaType: '이가' | '은는' | '을를'): string {
  if (!word || word.length === 0) return josaType === '이가' ? '이' : josaType === '은는' ? '은' : '을';

  const lastChar = word.charAt(word.length - 1);
  const code = lastChar.charCodeAt(0);

  // 한글이 아닌 경우
  if (code < 0xac00 || code > 0xd7a3) {
    return josaType === '이가' ? '가' : josaType === '은는' ? '는' : '를';
  }

  // 받침 유무 확인
  const hasJongseong = (code - 0xac00) % 28 !== 0;

  if (josaType === '이가') {
    return hasJongseong ? '이' : '가';
  } else if (josaType === '은는') {
    return hasJongseong ? '은' : '는';
  } else {
    return hasJongseong ? '을' : '를';
  }
}

// 임시 데이터 매핑
const teams = ['보안팀', 'IT팀', '운영팀', '관리팀'];
const assignees = ['김철수', '이영희', '박민수', '최지연', '정현우', '강민정', '윤성호', '송민정'];
const incidentStatusOptions = ['대기', '진행', '완료', '홀딩'];
const taskStatusColors = {
  대기: 'warning',
  진행: 'info',
  완료: 'success',
  홀딩: 'error'
};
// 삭제: assigneeAvatars는 이제 사용자 데이터에서 가져옴

// Icons
import { Add, Trash, DocumentDownload } from '@wandersonalwes/iconsax-react';

// 컬럼 너비 정의 (보안사고관리 전용)
const columnWidths = {
  checkbox: 45,
  no: 50,
  registrationDate: 90,
  code: 130,
  incidentType: 75,
  mainContent: 170,
  responseAction: 160,
  team: 100,
  assignee: 100,
  responseStage: 85,
  status: 70,
  startDate: 90,
  completedDate: 90,
  action: 70
};

interface SecurityIncidentTableProps {
  selectedYear?: string;
  selectedTeam?: string;
  selectedStatus?: string;
  selectedAssignee?: string;
  tasks: SecurityIncidentRecord[];
  setTasks: React.Dispatch<React.SetStateAction<SecurityIncidentRecord[]>>;
  addChangeLog: (
    action: string,
    target: string,
    description: string,
    team?: string,
    beforeValue?: string,
    afterValue?: string,
    changedField?: string,
    title?: string
  ) => void;
  error?: string | null;
  onDataRefresh?: () => Promise<void>;
  canCreateData?: boolean;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
  setSnackbar?: React.Dispatch<React.SetStateAction<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>>;
}

export default function SecurityIncidentTable({
  selectedYear = '전체',
  selectedTeam = '전체',
  selectedStatus = '전체',
  selectedAssignee = '전체',
  tasks,
  setTasks,
  addChangeLog,
  onDelete,
  error = null,
  onDataRefresh,
  canCreateData = true,
  canEditOwn = true,
  canEditOthers = true,
  setSnackbar = undefined
}: SecurityIncidentTableProps) {
  const theme = useTheme();
  const { users } = useSupabaseUsers();
  const { createAccident, updateAccident, deleteAccident } = useSupabaseSecurityAccident();
  const { masterCodes } = useCommonData();

  // 사고유형 코드를 이름으로 변환하는 함수
  const getIncidentTypeName = useCallback((incidentType: string) => {
    if (!incidentType) return '미분류';
    // "GROUP009-SUB001" 형태에서 서브코드명 찾기
    const type = masterCodes.find(
      (code) => code.codetype === 'subcode' && code.group_code === 'GROUP009' && (code.subcode === incidentType || `${code.group_code}-${code.subcode}` === incidentType)
    );
    return type?.subcode_name || incidentType;
  }, [masterCodes]);

  // 상태 코드를 이름으로 변환하는 함수
  const getStatusName = useCallback((status: string) => {
    if (!status) return '미분류';
    // "GROUP002-SUB001" 형태에서 서브코드명 찾기
    const statusItem = masterCodes.find(
      (code) => code.codetype === 'subcode' && code.group_code === 'GROUP002' && (code.subcode === status || `${code.group_code}-${code.subcode}` === status)
    );
    return statusItem?.subcode_name || status;
  }, [masterCodes]);

  // 사고대응단계 코드를 이름으로 변환하는 함수
  const getResponseStageName = useCallback((responseStage: string) => {
    if (!responseStage) return '사고 탐지';
    // "GROUP010-SUB001" 형태에서 서브코드명 찾기
    const stage = masterCodes.find(
      (code) => code.codetype === 'subcode' && code.group_code === 'GROUP010' && (code.subcode === responseStage || `${code.group_code}-${code.subcode}` === responseStage)
    );
    return stage?.subcode_name || responseStage;
  }, [masterCodes]);

  // 현재 로그인한 사용자 정보
  const { data: session } = useSession();
  const user = useUser();

  const currentUser = useMemo(() => {
    if (!session?.user?.email || users.length === 0) return null;
    const found = users.find((u) => u.email === session.user.email);
    return found;
  }, [session, users]);

  // 데이터 소유자 확인 함수 - createdBy 또는 assignee가 본인인 경우
  const isDataOwner = (incident: SecurityIncidentRecord) => {
    if (!currentUser) return false;
    return (
      incident.createdBy === currentUser.user_name ||
      incident.assignee === currentUser.user_name
    );
  };

  // 사용자 이름으로 사용자 데이터 찾기
  const findUserByName = (userName: string) => {
    return users.find((user) => user.user_name === userName);
  };

  // Dialog에 전달하기 위한 userProfiles 매핑 (임시)
  const userProfiles = useMemo(() => {
    const profiles: { [key: string]: string } = {};
    users.forEach((user) => {
      profiles[user.user_name] = user.profile_image_url || user.avatar_url || '/assets/images/users/default.png';
    });
    return profiles;
  }, [users]);

  const [selected, setSelected] = useState<number[]>([]);

  // 편집 가능 여부 확인 함수
  const canEditData = useCallback((incident: SecurityIncidentRecord) => {
    return canEditOthers || (canEditOwn && isDataOwner(incident));
  }, [canEditOthers, canEditOwn, currentUser]);

  // 선택된 항목들이 모두 편집 가능한지 확인
  const canEditAllSelected = useMemo(() => {
    if (selected.length === 0) return false;
    return selected.every((id) => {
      const incident = tasks.find((item) => item.id === id);
      return incident && canEditData(incident);
    });
  }, [selected, tasks, canEditData]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState('');

  // Edit 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<SecurityIncidentRecord | null>(null);

  // Excel 다운로드 기능
  const handleExcelDownload = () => {
    try {
      // 필터링된 데이터를 Excel 형식으로 변환 (테이블과 동일한 컬럼 순서)
      const excelData = filteredData.map((task, index) => ({
        NO: index + 1,
        등록일: task.registrationDate,
        코드: task.code,
        사고유형: getIncidentTypeName(task.incidentType),
        사고내용: task.mainContent,
        대응조치: task.responseAction,
        팀: task.team || '-',
        담당자: task.assignee,
        사고대응단계: getResponseStageName(task.responseStage),
        상태: getStatusName(task.status),
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
      link.setAttribute('download', `보안사고관리_${new Date().toISOString().slice(0, 10)}.csv`);
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

  // 필터링된 데이터 (역순 정렬 추가) - props의 tasks 직접 사용
  const filteredData = useMemo(() => {
    const filtered = tasks.filter((task) => {
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
  }, [tasks, selectedYear, selectedTeam, selectedStatus, selectedAssignee]);

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
      // onDelete prop이 있으면 부모 컴포넌트에서 삭제 처리 (토스트 알림 포함)
      if (onDelete) {
        await onDelete(selected);
        setSelected([]);
        return;
      }

      // onDelete가 없으면 기존 로직 사용 (하위 호환성)
      // 삭제될 보안사고들의 정보를 변경로그에 추가
      if (addChangeLog) {
        const deletedTasks = tasks.filter((task) => selected.includes(task.id));
        deletedTasks.forEach((task) => {
          const incidentCode = task.code || `INC-${task.id}`;
          const incidentTitle = task.mainContent || '보안사고';
          addChangeLog(
            '삭제',
            incidentCode,
            `보안사고관리 ${incidentTitle}(${incidentCode}) 데이터가 삭제 되었습니다.`,
            task.team || '미분류',
            '',
            '',
            '-',
            incidentTitle
          );
        });
      }

      // Supabase에서 삭제
      for (const id of selected) {
        await deleteAccident(id);
      }

      // tasks 상태에서 삭제된 항목 제거
      setTasks((prevTasks) => prevTasks.filter((task) => !selected.includes(task.id)));
      console.log('✅ tasks 상태에서 삭제 완료');

      setSelected([]);
    } catch (error) {
      console.error('삭제 중 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingTask(null);
  };

  // 보안사고 저장
  const handleIncidentSave = async (updatedIncident: SecurityIncidentRecord): Promise<SecurityIncidentRecord | null> => {
    console.log('💾 보안사고 저장 요청:', updatedIncident);
    console.log('📋 저장할 데이터 상세:', {
      id: updatedIncident.id,
      mainContent: updatedIncident.mainContent,
      responseAction: updatedIncident.responseAction,
      incidentType: updatedIncident.incidentType,
      assignee: updatedIncident.assignee,
      status: updatedIncident.status
    });

    try {
      const existingIndex = tasks.findIndex((incident) => incident.id === updatedIncident.id);
      console.log('🔍 기존 보안사고 인덱스:', existingIndex);
      console.log('🔍 현재 데이터 개수:', tasks.length);

      if (existingIndex !== -1 && updatedIncident.id > 0) {
        // 기존 보안사고 업데이트
        const originalIncident = tasks[existingIndex];

        // SecurityIncidentRecord를 Supabase 형식으로 변환
        const supabaseData = {
          main_content: updatedIncident.mainContent,
          response_action: updatedIncident.responseAction || '',
          incident_type: updatedIncident.incidentType,
          assignee: updatedIncident.assignee || '',
          status: updatedIncident.status,
          severity: updatedIncident.severity || '중간',
          team: updatedIncident.team || '',
          description: updatedIncident.description || '',
          response_stage: updatedIncident.responseStage || '',
          occurrence_date: updatedIncident.occurrenceDate || null,
          completed_date: updatedIncident.completedDate || null,
          start_date: updatedIncident.startDate || null,
          progress: updatedIncident.progress || 0,
          attachment: updatedIncident.attachment || false,
          attachment_count: updatedIncident.attachmentCount || 0
        };

        const success = await updateAccident(updatedIncident.id, supabaseData);
        if (success) {
          // 변경로그 추가 - 각 필드별로 개별 로그 생성
          if (addChangeLog) {
            const incidentCode = updatedIncident.code || `INC-${updatedIncident.id}`;
            const incidentTitle = updatedIncident.mainContent || '보안사고';

            // 상태 변경
            if (originalIncident.status !== updatedIncident.status) {
              const originalStatusName = getStatusName(originalIncident.status);
              const updatedStatusName = getStatusName(updatedIncident.status);
              const josa = getJosa('상태', '이가');
              addChangeLog(
                '수정',
                incidentCode,
                `보안사고관리 ${incidentTitle}(${incidentCode}) 개요탭의 상태${josa} ${originalStatusName} → ${updatedStatusName}로 수정 되었습니다.`,
                updatedIncident.team || '미분류',
                originalIncident.status,
                updatedIncident.status,
                '상태',
                incidentTitle
              );
            }

            // 담당자 변경
            if (originalIncident.assignee !== updatedIncident.assignee) {
              const josa = getJosa('담당자', '이가');
              addChangeLog(
                '수정',
                incidentCode,
                `보안사고관리 ${incidentTitle}(${incidentCode}) 개요탭의 담당자${josa} ${originalIncident.assignee || '미할당'} → ${updatedIncident.assignee || '미할당'}로 수정 되었습니다.`,
                updatedIncident.team || '미분류',
                originalIncident.assignee || '미할당',
                updatedIncident.assignee || '미할당',
                '담당자',
                incidentTitle
              );
            }

            // 사고내용 변경
            if (originalIncident.mainContent !== updatedIncident.mainContent) {
              const josa = getJosa('사고내용', '이가');
              addChangeLog(
                '수정',
                incidentCode,
                `보안사고관리 ${incidentTitle}(${incidentCode}) 개요탭의 사고내용${josa} ${originalIncident.mainContent} → ${updatedIncident.mainContent}로 수정 되었습니다.`,
                updatedIncident.team || '미분류',
                originalIncident.mainContent || '',
                updatedIncident.mainContent || '',
                '사고내용',
                updatedIncident.mainContent
              );
            }

            // 완료일 변경
            if (originalIncident.completedDate !== updatedIncident.completedDate) {
              const josa = getJosa('완료일', '이가');
              addChangeLog(
                '수정',
                incidentCode,
                `보안사고관리 ${incidentTitle}(${incidentCode}) 개요탭의 완료일${josa} ${originalIncident.completedDate || '미정'} → ${updatedIncident.completedDate || '미정'}로 수정 되었습니다.`,
                updatedIncident.team || '미분류',
                originalIncident.completedDate || '미정',
                updatedIncident.completedDate || '미정',
                '완료일',
                incidentTitle
              );
            }

            // 팀 변경
            if (originalIncident.team !== updatedIncident.team) {
              const josa = getJosa('팀', '이가');
              addChangeLog(
                '수정',
                incidentCode,
                `보안사고관리 ${incidentTitle}(${incidentCode}) 개요탭의 팀${josa} ${originalIncident.team || '미분류'} → ${updatedIncident.team || '미분류'}로 수정 되었습니다.`,
                updatedIncident.team || '미분류',
                originalIncident.team || '미분류',
                updatedIncident.team || '미분류',
                '팀',
                incidentTitle
              );
            }

            // 사고유형 변경
            if (originalIncident.incidentType !== updatedIncident.incidentType) {
              const originalTypeName = getIncidentTypeName(originalIncident.incidentType);
              const updatedTypeName = getIncidentTypeName(updatedIncident.incidentType);
              const josa = getJosa('사고유형', '이가');
              addChangeLog(
                '수정',
                incidentCode,
                `보안사고관리 ${incidentTitle}(${incidentCode}) 개요탭의 사고유형${josa} ${originalTypeName} → ${updatedTypeName}로 수정 되었습니다.`,
                updatedIncident.team || '미분류',
                originalIncident.incidentType,
                updatedIncident.incidentType,
                '사고유형',
                incidentTitle
              );
            }

            // 대응조치 변경
            if (originalIncident.responseAction !== updatedIncident.responseAction) {
              const josa = getJosa('대응조치', '이가');
              addChangeLog(
                '수정',
                incidentCode,
                `보안사고관리 ${incidentTitle}(${incidentCode}) 개요탭의 대응조치${josa} ${originalIncident.responseAction || '-'} → ${updatedIncident.responseAction || '-'}로 수정 되었습니다.`,
                updatedIncident.team || '미분류',
                originalIncident.responseAction || '',
                updatedIncident.responseAction || '',
                '대응조치',
                incidentTitle
              );
            }

            // 시작일 변경
            if (originalIncident.startDate !== updatedIncident.startDate) {
              const josa = getJosa('시작일', '이가');
              addChangeLog(
                '수정',
                incidentCode,
                `보안사고관리 ${incidentTitle}(${incidentCode}) 개요탭의 시작일${josa} ${originalIncident.startDate || '미정'} → ${updatedIncident.startDate || '미정'}로 수정 되었습니다.`,
                updatedIncident.team || '미분류',
                originalIncident.startDate || '미정',
                updatedIncident.startDate || '미정',
                '시작일',
                incidentTitle
              );
            }
          }

          // tasks 상태 업데이트
          setTasks((prevTasks) => prevTasks.map((task) => (task.id === updatedIncident.id ? updatedIncident : task)));
          console.log('✅ 기존 보안사고 업데이트 완료');

          // 토스트 알림 with Korean particle detection
          if (setSnackbar) {
            // 변경된 필드 찾기
            const changedFields: string[] = [];
            const fieldMap: { [key: string]: string } = {
              mainContent: '사고내용',
              incidentType: '사고유형',
              status: '상태',
              assignee: '담당자',
              completedDate: '완료일',
              responseAction: '대응조치',
              team: '팀',
              startDate: '시작일'
            };

            Object.keys(fieldMap).forEach((key) => {
              const oldValue = (originalIncident as any)[key];
              const newValue = (updatedIncident as any)[key];
              if (oldValue !== newValue && !changedFields.includes(fieldMap[key])) {
                changedFields.push(fieldMap[key]);
              }
            });

            let message = '';
            if (changedFields.length > 0) {
              const fieldsText = changedFields.join(', ');
              const lastField = changedFields[changedFields.length - 1];
              const lastChar = lastField.charAt(lastField.length - 1);
              const code = lastChar.charCodeAt(0);
              const hasJongseong = (code >= 0xAC00 && code <= 0xD7A3) && ((code - 0xAC00) % 28 !== 0);
              const josa = hasJongseong ? '이' : '가';
              message = `${updatedIncident.mainContent}의 ${fieldsText}${josa} 성공적으로 수정되었습니다.`;
            } else {
              const lastChar = updatedIncident.mainContent.charAt(updatedIncident.mainContent.length - 1);
              const code = lastChar.charCodeAt(0);
              const hasJongseong = (code >= 0xAC00 && code <= 0xD7A3) && ((code - 0xAC00) % 28 !== 0);
              const josa = hasJongseong ? '이' : '가';
              message = `${updatedIncident.mainContent}${josa} 성공적으로 수정되었습니다.`;
            }

            setSnackbar({
              open: true,
              message: message,
              severity: 'success'
            });
          }

          return updatedIncident; // 수정된 데이터 반환
        }
        return null; // 실패 시 null 반환
      } else {
        // 새 보안사고 추가 - API에서 코드 가져오기
        let newCode = '';
        try {
          const response = await fetch('/api/security-incident/next-code');
          const result = await response.json();
          if (response.ok && result.code) {
            newCode = result.code;
          } else {
            // API 실패 시 임시 코드
            const currentYear = new Date().getFullYear();
            const yearSuffix = currentYear.toString().slice(-2);
            newCode = `SEC-ACC-TEMP-${yearSuffix}-${Date.now()}`;
          }
        } catch (error) {
          console.error('❌ 코드 생성 API 호출 실패:', error);
          const currentYear = new Date().getFullYear();
          const yearSuffix = currentYear.toString().slice(-2);
          newCode = `SEC-ACC-TEMP-${yearSuffix}-${Date.now()}`;
        }

        const maxNo = Math.max(...tasks.map((t) => t.no || 0), 0);

        // SecurityIncidentRecord를 Supabase 형식으로 변환
        const supabaseData = {
          no: maxNo + 1, // 새 순번 할당
          code: newCode,
          main_content: updatedIncident.mainContent || '새 보안사고 내용', // 필수 필드는 빈 값 방지
          response_action: updatedIncident.responseAction || '',
          incident_type: updatedIncident.incidentType || '악성코드', // 필수 필드 기본값
          assignee: updatedIncident.assignee || '',
          status: updatedIncident.status || '대기',
          severity: updatedIncident.severity || '중간',
          team: updatedIncident.team || '',
          description: updatedIncident.description || '',
          response_stage: updatedIncident.responseStage || '',
          occurrence_date: updatedIncident.occurrenceDate || null,
          completed_date: updatedIncident.completedDate || null,
          start_date: updatedIncident.startDate || new Date().toISOString().split('T')[0],
          progress: updatedIncident.progress || 0,
          attachment: updatedIncident.attachment || false,
          attachment_count: updatedIncident.attachmentCount || 0
        };

        const newIncident = await createAccident(supabaseData);
        if (newIncident) {
          // 변경로그 추가 - 새 보안사고 추가
          if (addChangeLog) {
            const incidentTitle = updatedIncident.mainContent || '새 보안사고';
            addChangeLog(
              '추가',
              newCode,
              `보안사고관리 ${incidentTitle}(${newCode}) 데이터가 추가 되었습니다.`,
              updatedIncident.team || '미분류',
              '',
              '',
              '-',
              incidentTitle
            );
          }
          console.log('✅ 새 보안사고 추가 완료:', newIncident);

          // newIncident를 SecurityIncidentRecord 형식으로 변환
          const createdRecord: SecurityIncidentRecord = {
            ...updatedIncident,
            id: newIncident.id,
            no: newIncident.no || maxNo + 1,
            code: newIncident.code || newCode,
            registrationDate: newIncident.registration_date || new Date().toISOString().split('T')[0]
          };

          // tasks 상태에 새 보안사고 추가
          setTasks((prevTasks) => [...prevTasks, createdRecord]);
          console.log('✅ tasks 상태 업데이트 완료');

          // 토스트 알림 with Korean particle detection
          if (setSnackbar) {
            const lastChar = updatedIncident.mainContent.charAt(updatedIncident.mainContent.length - 1);
            const code = lastChar.charCodeAt(0);
            const hasJongseong = (code >= 0xAC00 && code <= 0xD7A3) && ((code - 0xAC00) % 28 !== 0);
            const josa = hasJongseong ? '이' : '가';
            setSnackbar({
              open: true,
              message: `${updatedIncident.mainContent}${josa} 성공적으로 추가되었습니다.`,
              severity: 'success'
            });
          }

          return createdRecord;
        }
        return null; // 실패 시 null 반환
      }
    } catch (error) {
      console.error('보안사고 저장 중 오류:', error);
      alert('보안사고 저장 중 오류가 발생했습니다.');
      return null; // 오류 시 null 반환
    }

    handleEditDialogClose();
    return null; // 기본값으로 null 반환
  };

  // 새 보안사고 추가
  const addNewIncident = () => {
    const newTask: SecurityIncidentRecord = {
      id: 0,
      no: 0,
      mainContent: '',
      assignee: '',
      status: '대기',
      incidentType: '악성코드',
      severity: '중간',
      code: '',
      registrationDate: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      completedDate: '',
      description: '',
      responseAction: '',
      team: '',
      progress: 0,
      attachment: false,
      attachmentCount: 0,
      attachments: []
    };

    console.log('🔍 SecurityIncidentTable - 새 보안사고 생성:', newTask);
    setEditingTask(newTask);
    setEditDialog(true);
  };

  // 편집 핸들러
  const handleEditIncident = (incident: SecurityIncidentRecord) => {
    console.log('🔍 SecurityIncidentTable - handleEditIncident 호출:', {
      incident,
      incidentMainContent: incident.mainContent,
      incidentId: incident.id
    });
    // SecurityIncidentRecord를 직접 전달
    setEditingTask(incident);
    setEditDialog(true);
  };

  // 상태 색상 (더 연한 파스텔톤 배경, 상태별 글자색)
  const getStatusColor = (status: string) => {
    switch (status) {
      case '대기':
        return { backgroundColor: '#F0F0F0', color: '#424242' };
      case '진행':
        return { backgroundColor: '#E3F2FD', color: '#1976D2' };
      case '완료':
        return { backgroundColor: '#E8F5E8', color: '#388E3C' };
      case '홀딩':
        return { backgroundColor: '#FFEBEE', color: '#D32F2F' };
      default:
        return { backgroundColor: '#FAFAFA', color: '#424242' };
    }
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
            onClick={addNewIncident}
            disabled={!(canCreateData || canEditOwn)}
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

      {/* 에러 상태 */}
      {error && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {/* 테이블 */}
      <TableContainer
        sx={{
          flex: 1,
          border: 'none',
          borderRadius: 0,
          overflowX: 'auto',
          minWidth: 1200,
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
              <TableCell sx={{ width: columnWidths.incidentType, fontWeight: 600 }}>사고유형</TableCell>
              <TableCell sx={{ width: columnWidths.mainContent, fontWeight: 600 }}>사고내용</TableCell>
              <TableCell sx={{ width: columnWidths.responseAction, fontWeight: 600 }}>대응조치</TableCell>
              <TableCell sx={{ width: columnWidths.team, fontWeight: 600 }}>팀</TableCell>
              <TableCell sx={{ width: columnWidths.assignee, fontWeight: 600 }}>담당자</TableCell>
              <TableCell sx={{ width: columnWidths.responseStage, fontWeight: 600 }}>사고대응단계</TableCell>
              <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: columnWidths.startDate, fontWeight: 600 }}>시작일</TableCell>
              <TableCell sx={{ width: columnWidths.completedDate, fontWeight: 600 }}>완료일</TableCell>
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
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {task.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {getIncidentTypeName(task.incidentType)}
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
                        maxWidth: 150
                      }}
                    >
                      {task.mainContent || '사고내용 없음'}
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
                        maxWidth: 140
                      }}
                    >
                      {task.responseAction || '-'}
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
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {getResponseStageName(task.responseStage)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusName(task.status)}
                      size="small"
                      sx={{
                        ...getStatusColor(getStatusName(task.status)),
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
                        <IconButton
                          size="small"
                          onClick={() => handleEditIncident(task)}
                          sx={{ color: 'primary.main' }}
                        >
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
                    textAlign: 'center',
                    fontSize: '0.875rem'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid #e0e0e0'
                  }
                }
              }}
            />
            <Button size="small" onClick={handleGoToPage} sx={{ minWidth: 'auto', px: 1.5, py: 0.5, fontSize: '0.875rem' }}>
              GO
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

      {/* 보안사고 편집 다이얼로그 */}
      {editDialog && editingTask && (
        <SecurityIncidentEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          task={editingTask}
          onSave={handleIncidentSave}
          assignees={assignees}
          assigneeAvatars={userProfiles}
          statusOptions={incidentStatusOptions as TaskStatus[]}
          statusColors={
            {
              대기: 'warning',
              진행: 'info',
              완료: 'success',
              홀딩: 'error'
            } as Record<TaskStatus, any>
          }
          canCreateData={canCreateData}
          canEditOwn={canEditOwn}
          canEditOthers={canEditOthers}
        />
      )}
    </Box>
  );
}
