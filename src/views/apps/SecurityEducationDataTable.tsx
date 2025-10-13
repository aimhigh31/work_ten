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
import SecurityEducationEditDialog from 'components/SecurityEducationEditDialog';

// data and types
import {
  securityEducationData,
  teams,
  assignees,
  securityEducationStatusOptions,
  securityEducationStatusColors,
  assigneeAvatars
} from 'data/security-education';
import { SecurityEducationTableData, SecurityEducationStatus, SecurityEducationRecord } from 'types/security-education';

// hooks
import { useSupabaseSecurityEducation } from '../../hooks/useSupabaseSecurityEducation';
import { useSupabaseUserManagement } from '../../hooks/useSupabaseUserManagement';
import useIdGenerator from '../../hooks/useIdGenerator';
import { supabase } from '../../lib/supabase';

// 데이터 변환 함수
const convertTableDataToRecord = (tableData: SecurityEducationTableData): SecurityEducationRecord => {
  console.log(`🔍 convertTableDataToRecord - 입력 tableData:`, {
    achievements: tableData.achievements,
    improvements: tableData.improvements,
    feedback: tableData.feedback,
    team: tableData.team
  });

  const converted = {
    id: tableData.id,
    no: tableData.no,
    registrationDate: tableData.registrationDate,
    code: tableData.code,
    educationType: tableData.educationType,
    educationName: tableData.educationName,
    description: tableData.description,
    location: tableData.location,
    participantCount: tableData.attendeeCount,
    executionDate: tableData.executionDate,
    status: tableData.status,
    assignee: tableData.assignee,
    team: tableData.team || '보안팀', // 팀 필드 추가
    attachment: Boolean(tableData.attachments?.length),
    attachmentCount: tableData.attachments?.length || 0,
    attachments: tableData.attachments || [],
    isNew: false,
    // 교육실적보고 필드 추가
    achievements: tableData.achievements || '',
    improvement_points: tableData.improvements || '', // improvements -> improvement_points 매핑
    feedback: tableData.feedback || ''
  };

  console.log(`🔍 convertTableDataToRecord - 변환된 record:`, {
    achievements: converted.achievements,
    improvement_points: converted.improvement_points,
    feedback: converted.feedback,
    team: converted.team
  });

  // 개선사항 필드 특별 확인
  console.log(`🔧 convertTableDataToRecord 개선사항 매핑: 테이블 "${tableData.improvements}" → DB "${converted.improvement_points}"`);

  return converted;
};

const convertRecordToTableData = (record: SecurityEducationRecord): SecurityEducationTableData => {
  console.log(`🔍 convertRecordToTableData - 입력 record:`, {
    achievements: record.achievements,
    improvement_points: record.improvement_points,
    feedback: record.feedback,
    team: record.team
  });

  const converted = {
    id: record.id,
    no: record.no || record.id,
    registrationDate: record.registrationDate,
    code: record.code,
    educationType: record.educationType,
    educationName: record.educationName,
    description: record.description,
    location: record.location,
    attendeeCount: record.participantCount,
    executionDate: record.executionDate,
    status: record.status,
    assignee: record.assignee,
    team: record.team || '보안팀', // DB에서 팀 정보 로드
    department: undefined,
    attachments: record.attachments,
    // 교육실적보고 데이터 포함 추가
    achievements: record.achievements,
    improvements: record.improvement_points, // improvement_points -> improvements로 매핑
    feedback: record.feedback
  };

  console.log(`🔍 convertRecordToTableData - 변환된 데이터:`, {
    achievements: converted.achievements,
    improvements: converted.improvements,
    feedback: converted.feedback,
    team: converted.team
  });

  // 개선사항 필드 특별 확인
  console.log(`🔧 convertRecordToTableData 개선사항 매핑: DB "${record.improvement_points}" → 테이블 "${converted.improvements}"`);

  return converted;
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
  executionDate: 100,
  status: 90,
  assignee: 120,
  action: 80
};

interface SecurityEducationTableProps {
  selectedYear?: string;
  selectedTeam?: string;
  selectedStatus?: string;
  selectedAssignee?: string;
  tasks?: SecurityEducationTableData[];
  setTasks?: React.Dispatch<React.SetStateAction<SecurityEducationTableData[]>>;
  addChangeLog?: (action: string, target: string, description: string, team?: string, beforeValue?: string, afterValue?: string, changedField?: string, title?: string) => void;
  onDataRefresh?: () => Promise<void>;
}

export default function SecurityEducationTable({
  selectedYear = '전체',
  selectedTeam = '전체',
  selectedStatus = '전체',
  selectedAssignee = '전체',
  tasks,
  setTasks,
  addChangeLog,
  onDataRefresh
}: SecurityEducationTableProps) {
  const theme = useTheme();
  const [data, setData] = useState<SecurityEducationTableData[]>(tasks ? tasks : securityEducationData.map((task) => ({ ...task })));
  const [selected, setSelected] = useState<number[]>([]);

  // Supabase 훅
  const { createEducation, updateEducation, deleteEducation } = useSupabaseSecurityEducation();
  const { users } = useSupabaseUserManagement();
  const { generateNextId, syncMaxId } = useIdGenerator();

  // 담당자 프로필 이미지 가져오기 함수 (팝업창과 동일한 로직 사용)
  const getAssigneeAvatar = (assigneeName: string) => {
    if (!assigneeName) {
      console.log('⚠️ 담당자 이름이 없습니다');
      return '/assets/images/users/avatar-1.png';
    }

    console.log('🎭 담당자 이름:', assigneeName);

    // 1. 사용자 관리 시스템에서 찾기 (팝업창과 동일한 로직)
    const user = users.find((u) => u.name === assigneeName || u.user_name === assigneeName);
    if (user) {
      const avatarUrl = user.profile_image_url || user.avatar_url;
      if (avatarUrl) {
        console.log('✅ 사용자 관리에서 찾은 프로필:', avatarUrl);
        return avatarUrl;
      }
    }

    // 2. 정적 아바타 매핑에서 찾기
    const staticAvatar = assigneeAvatars[assigneeName as keyof typeof assigneeAvatars];
    if (staticAvatar) {
      console.log('✅ 정적 매핑에서 찾은 아바타:', staticAvatar);
      return staticAvatar;
    }

    // 3. 동적 아바타 생성 (새로운 사용자나 매핑되지 않은 사용자용)
    const availableAvatars = [
      '/assets/images/users/avatar-1.png',
      '/assets/images/users/avatar-2.png',
      '/assets/images/users/avatar-3.png',
      '/assets/images/users/avatar-4.png',
      '/assets/images/users/avatar-5.png',
      '/assets/images/users/avatar-6.png',
      '/assets/images/users/avatar-7.png',
      '/assets/images/users/avatar-8.png',
      '/assets/images/users/avatar-9.png',
      '/assets/images/users/avatar-10.png'
    ];

    // 이름의 해시값을 이용해 일관된 아바타 선택
    const nameHash = assigneeName.split('').reduce((hash, char) => {
      return hash + char.charCodeAt(0);
    }, 0);

    const selectedAvatar = availableAvatars[nameHash % availableAvatars.length];
    console.log('🎲 동적 아바타 선택:', selectedAvatar, '(해시:', nameHash, ')');

    return selectedAvatar;
  };

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState('');

  // Edit 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<SecurityEducationTableData | null>(null);
  const [editingRecord, setEditingRecord] = useState<SecurityEducationRecord | null>(null);
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

    const confirmDelete = window.confirm(`선택한 ${selected.length}개의 교육을 삭제하시겠습니까?`);
    if (!confirmDelete) return;

    try {
      console.log('🗑️ 삭제할 항목들:', selected);

      // Supabase에서 각 항목 삭제
      const deletePromises = selected.map(async (id) => {
        // ID가 숫자인지 확인
        const numericId = typeof id === 'string' ? parseInt(id) : id;
        if (!isNaN(numericId)) {
          const success = await deleteEducation(numericId);
          if (!success) {
            console.error(`❌ ID ${id} 삭제 실패`);
          } else {
            console.log(`✅ ID ${id} 삭제 성공`);
          }
          return success;
        }
        return false;
      });

      const results = await Promise.all(deletePromises);
      const allSuccess = results.every((result) => result);

      if (allSuccess) {
        console.log('✅ 모든 항목 삭제 성공');

        // 삭제될 업무들의 정보를 변경로그에 추가
        if (addChangeLog) {
          const deletedTasks = data.filter((task) => selected.includes(task.id));
          for (const task of deletedTasks) {
            const codeToUse = task.code || `ID-${task.id}`;
            const educationTitle = task.educationName || '교육';
            console.log('🔍 삭제 변경로그:', { code: task.code, codeToUse });
            // 삭제의 경우 변경 후 값은 없음
            await addChangeLog(
              '삭제',
              codeToUse,
              `보안교육관리 ${educationTitle}(${codeToUse}) 정보의 데이터탭 데이터가 삭제 되었습니다.`,
              task.team || '보안팀',
              `${educationTitle} - ${task.location || '-'}`,
              '',
              '데이터탭',
              educationTitle
            );
          }
        }

        // 로컬 상태 업데이트
        const updatedData = data.filter((task) => !selected.includes(task.id));
        setData(updatedData);
        setSelected([]);

        // 부모 컴포넌트로 동기화
        if (setTasks) {
          setTasks(updatedData);
        }

        // 데이터 새로고침
        if (onDataRefresh) {
          await onDataRefresh();
        }

        alert('선택한 교육이 삭제되었습니다.');
      } else {
        alert('일부 항목 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('🔴 삭제 중 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingTask(null);
    setEditingRecord(null);
    setEditingTaskId(null);
  };

  // Task 저장 - Supabase DB 연동
  const handleEditTaskSave = async (updatedRecord: SecurityEducationRecord) => {
    console.log('[HANDLE_EDIT_TASK_SAVE] 💾 Task 저장 요청 시작');
    console.log('[HANDLE_EDIT_TASK_SAVE] updatedRecord:', updatedRecord);

    try {
      console.log('[HANDLE_EDIT_TASK_SAVE] Record를 TableData로 변환 시작');
      // Record를 TableData로 변환
      let updatedTask;
      try {
        updatedTask = convertRecordToTableData(updatedRecord);
        console.log('[HANDLE_EDIT_TASK_SAVE] 변환된 updatedTask:', updatedTask);
      } catch (convertError) {
        console.error('[CONVERT_ERROR] convertRecordToTableData 실패:', convertError);
        throw new Error('데이터 변환 실패: ' + (convertError instanceof Error ? convertError.message : '알 수 없는 오류'));
      }

      const existingIndex = data.findIndex((task) => task.id === updatedTask.id);
      console.log('[HANDLE_EDIT_TASK_SAVE] existingIndex:', existingIndex);

      // Supabase 저장용 데이터 변환
      const educationData = {
        education_name: updatedTask.title || updatedTask.educationName,
        description: updatedTask.description,
        education_type: updatedTask.educationType,
        assignee: updatedTask.assignee,
        team: updatedRecord.team || null,
        execution_date: updatedTask.executionDate,
        location: updatedTask.location,
        status: updatedTask.status,
        participant_count: updatedTask.participantCount || 0,
        code: updatedTask.code,
        achievements: updatedRecord.achievements || '', // 성과
        feedback: updatedRecord.feedback || '', // 교육소감
        improvement_points: updatedRecord.improvements || updatedRecord.improvement_points || '', // 개선사항 -> improvement_points로 저장
        effectiveness_score: updatedTask.effectivenessScore || null,
        completion_rate: updatedTask.completionRate || null,
        satisfaction_score: updatedTask.satisfactionScore || null
      };

      console.log('🔵 Supabase 저장 데이터:', educationData);

      // 개선사항 필드 특별 확인
      console.log('🔧 개선사항 필드 저장 확인:');
      console.log(`  updatedRecord.improvements: "${updatedRecord.improvements || '(없음)'}"`);
      console.log(`  updatedRecord.improvement_points: "${updatedRecord.improvement_points || '(없음)'}"`);
      console.log(`  최종 저장값 improvement_points: "${educationData.improvement_points}"`);

      console.log('🔵 저장 데이터 타입 체크:');
      Object.entries(educationData).forEach(([key, value]) => {
        console.log(`  ${key}:`, typeof value, value);
      });

      if (existingIndex !== -1 && updatedTask.id && updatedTask.id !== 'new' && !isNaN(parseInt(updatedTask.id.toString()))) {
        // 기존 교육 수정
        console.log('🔵 기존 교육 수정:', updatedTask.id);
        console.log('🔵 updateEducation 호출 전 데이터:', JSON.stringify(educationData, null, 2));
        const success = await updateEducation(parseInt(updatedTask.id.toString()), educationData);

        if (success) {
          console.log('✅ 수정 성공');

          // 원본 데이터에서 code 가져오기
          const originalTask = data.find(t => t.id === updatedTask.id);

          console.log('🔍🔍🔍 CODE 디버깅:', {
            'updatedTask.id': updatedTask.id,
            'data 배열 개수': data.length,
            'originalTask 찾았나?': !!originalTask,
            'originalTask 전체': originalTask,
            'originalTask?.code': originalTask?.code,
            'updatedTask.code': updatedTask.code,
            'educationData.code': educationData.code
          });

          const codeToUse = originalTask?.code || updatedTask.code || educationData.code || `ID-${updatedTask.id}`;

          console.log('🔍 최종 사용할 코드:', codeToUse);

          if (addChangeLog && originalTask) {
            // 필드 한글명 매핑
            const fieldNameMap: Record<string, string> = {
              educationName: '교육명',
              status: '상태',
              educationType: '교육유형',
              location: '장소',
              executionDate: '실행일',
              assignee: '담당자',
              attendeeCount: '참석수',
              team: '팀',
              description: '설명',
              achievements: '성과',
              improvements: '개선사항',
              feedback: '피드백'
            };

            // 변경된 필드 찾기
            const changes: Array<{ field: string; fieldKorean: string; before: any; after: any }> = [];

            Object.keys(fieldNameMap).forEach((field) => {
              const beforeVal = (originalTask as any)[field];
              const afterVal = (updatedTask as any)[field];

              // 값이 다른 경우만 추가
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

            // 변경된 필드가 있으면 각각 로그 기록
            if (changes.length > 0) {
              for (const change of changes) {
                const description = `보안교육관리 ${updatedTask.educationName}(${codeToUse}) 정보의 개요탭 ${change.fieldKorean}이 ${change.before} → ${change.after} 로 수정 되었습니다.`;

                await addChangeLog(
                  '수정',
                  codeToUse,
                  description,
                  updatedTask.team || '보안팀',
                  String(change.before),
                  String(change.after),
                  change.fieldKorean,
                  updatedTask.educationName
                );
              }
            } else {
              // 변경사항이 없는 경우 (일반 저장)
              await addChangeLog(
                '수정',
                codeToUse,
                `보안교육관리 ${updatedTask.educationName}(${codeToUse}) 정보의 개요탭에서 수정되었습니다.`,
                updatedTask.team || '보안팀',
                '',
                '',
                '-',
                updatedTask.educationName
              );
            }
          }
          // 데이터 새로고침
          if (onDataRefresh) {
            console.log('🔄 데이터 새로고침 호출 (수정)');
            await onDataRefresh();
          }
        } else {
          console.error('[UPDATE_FAIL] ❌ 수정 실패');
          alert('교육 정보 수정에 실패했습니다.');
          return;
        }
      } else {
        // 새 교육 생성 - Supabase 직접 사용
        console.warn('[DEBUG] 🔵 새 교육 생성 시작');

        try {
          // 중앙화된 Supabase 클라이언트 사용

          // ID 생성 - 순차적으로 생성
          const newId = updatedRecord.id && updatedRecord.id !== 'new' ? updatedRecord.id : generateNextId();

          const educationDataWithId = {
            id: newId,
            ...educationData,
            registration_date: new Date().toISOString().split('T')[0]
          };

          console.warn('[DEBUG] 🔵 Supabase 직접 저장:', educationDataWithId);
          console.warn('[DEBUG] 🔵 생성 데이터 타입 체크:');
          Object.entries(educationDataWithId).forEach(([key, value]) => {
            console.warn(`[DEBUG]   ${key}:`, typeof value, value);
          });

          console.warn('[DEBUG] 🔵 Supabase 쿼리 실행 시작...');
          const { data: createdData, error } = await supabase.from('security_education_data').insert(educationDataWithId).select().single();

          console.warn('[DEBUG] 🔵 Supabase 생성 결과:', { createdData, error });

          if (error) {
            // 순환 참조를 피하는 안전한 직렬화
            const safeStringify = (obj: any) => {
              const seen = new WeakSet();
              return JSON.stringify(
                obj,
                (key, val) => {
                  if (val != null && typeof val == 'object') {
                    if (seen.has(val)) {
                      return '[Circular]';
                    }
                    seen.add(val);
                  }
                  return val;
                },
                2
              );
            };

            const errorInfo = `
[CREATE_FAIL] ❌ Supabase 생성 실패
에러 구조:
  - message: ${error.message}
  - code: ${error.code}
  - details: ${error.details}
  - hint: ${error.hint}
  - name: ${error.name}
  - status: ${error.status}
  - 에러 타입: ${typeof error}
  - 에러 객체 키들: ${Object.keys(error).join(', ')}
생성 시도 데이터: ${safeStringify(educationDataWithId)}
에러 안전 직렬화: ${safeStringify(error)}
            `;

            console.error(errorInfo);
            alert('교육 생성에 실패했습니다: ' + (error?.message || '알 수 없는 오류'));
            return;
          }

          console.log('✅ 생성 성공, 생성된 데이터:', createdData);

          // 생성된 데이터에서 code 가져오기
          const codeToUse = createdData?.code || educationData.code || updatedTask.code || `ID-${newId}`;

          console.log('🔍 변경로그 저장:', {
            'createdData?.code': createdData?.code,
            'codeToUse': codeToUse
          });

          if (addChangeLog) {
            // 생성의 경우 변경 전 값은 없음
            await addChangeLog(
              '추가',
              codeToUse,
              `보안교육관리 ${updatedRecord.educationName}(${codeToUse}) 정보의 개요탭 데이터가 추가 되었습니다.`,
              updatedRecord.team || '보안팀',
              '',
              `${updatedRecord.educationName} - ${updatedRecord.location || '-'}`,
              '개요탭',
              updatedRecord.educationName
            );
          }

          // 데이터 새로고침
          if (onDataRefresh) {
            console.log('🔄 데이터 새로고침 호출 (생성)');
            await onDataRefresh();
          }

          // 생성된 데이터를 반환
          handleEditDialogClose();
          return createdData;
        } catch (error) {
          console.error('[CREATE_EXCEPTION] ❌ 생성 예외:', error);
          console.error('❌ 생성 예외 상세:', JSON.stringify(error, null, 2));
          console.error('❌ 예외 타입:', typeof error);
          console.error('❌ 예외 메시지:', error instanceof Error ? error.message : '알 수 없는 오류');
          alert('교육 생성 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
          return;
        }
      }

      handleEditDialogClose();
    } catch (error) {
      console.error('[MAIN_CATCH] 🔴 저장 오류:', error);
      console.error('[MAIN_CATCH] 에러 상세:', error instanceof Error ? error.message : '알 수 없는 오류');
      console.error('[MAIN_CATCH] 에러 스택:', error instanceof Error ? error.stack : '스택 없음');
      alert('저장 중 오류가 발생했습니다.');
    }
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

  // 편집 핸들러 - DB에서 최신 데이터 가져오기
  const handleEditTask = async (task: SecurityEducationTableData) => {
    try {
      // DB에서 최신 데이터 가져오기
      const { data: latestData, error } = await supabase
        .from('security_education_data')
        .select('*')
        .eq('id', task.id)
        .single();

      if (error) {
        console.error('❌ DB 조회 실패:', error);
        // 실패 시 메모리 데이터 사용
        setEditingTask(task);
        setEditingRecord(convertTableDataToRecord(task));
      } else {
        console.log('✅ DB에서 최신 데이터 조회:', latestData);
        // 최신 데이터로 TableData 형식 변환
        const latestTask: SecurityEducationTableData = {
          ...task,
          code: latestData.code, // DB의 code 명시적으로 설정
          team: latestData.team || '보안팀',
          achievements: latestData.achievements || '',
          improvements: latestData.improvement_points || '',
          feedback: latestData.feedback || ''
        };
        console.log('🔍 DB에서 가져온 code:', latestData.code);
        setEditingTask(latestTask);
        setEditingRecord(convertTableDataToRecord(latestTask));
      }

      setEditingTaskId(task.id);
      setEditMode('edit');
      setEditDialog(true);
    } catch (error) {
      console.error('❌ 편집 준비 오류:', error);
      // 오류 시 메모리 데이터 사용
      setEditingTask(task);
      setEditingRecord(convertTableDataToRecord(task));
      setEditingTaskId(task.id);
      setEditMode('edit');
      setEditDialog(true);
    }
  };

  // 상태 색상 (파스텔톤 배경, 검정 계열 글자)
  const getStatusColor = (status: SecurityEducationStatus) => {
    switch (status) {
      case '대기':
        return { backgroundColor: '#F5F5F5', color: '#757575' }; // 회색
      case '진행':
      case '진행중':
        return { backgroundColor: '#E3F2FD', color: '#1976D2' }; // 파란색
      case '완료':
        return { backgroundColor: '#E8F5E9', color: '#388E3C' }; // 녹색
      case '홀딩':
      case '취소':
        return { backgroundColor: '#FFEBEE', color: '#D32F2F' }; // 빨간색
      case '계획':
        return { backgroundColor: '#FFF3E0', color: '#F57C00' }; // 주황색
      default:
        return { backgroundColor: '#F5F5F5', color: '#757575' }; // 기본 회색
    }
  };

  // 팀 색상
  const getTeamColor = (team: string) => {
    switch (team) {
      case '개발팀':
        return { backgroundColor: '#F1F8E9', color: '#333333' };
      case '디자인팀':
        return { backgroundColor: '#F3E5F5', color: '#333333' };
      case '기획팀':
        return { backgroundColor: '#E0F2F1', color: '#333333' };
      case '마케팅팀':
        return { backgroundColor: '#E3F2FD', color: '#333333' };
      default:
        return { backgroundColor: '#F5F5F5', color: '#333333' };
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
              <TableCell sx={{ width: 80, fontWeight: 600 }}>팀</TableCell>
              <TableCell sx={{ width: columnWidths.assignee, fontWeight: 600 }}>담당자</TableCell>
              <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: columnWidths.executionDate, fontWeight: 600 }}>실행일</TableCell>
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
                      {task.team || '보안팀'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar src={getAssigneeAvatar(task.assignee || '')} alt={task.assignee} sx={{ width: 24, height: 24 }}>
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

      {/* Task 편집 다이얼로그 */}
      {editDialog && (
        <SecurityEducationEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          data={editingRecord}
          mode={editMode}
          onSave={handleEditTaskSave}
        />
      )}
    </Box>
  );
}
