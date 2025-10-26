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
import EvaluationEditDialog from 'components/EvaluationEditDialog';

// hooks
import { useSupabaseUsers } from 'hooks/useSupabaseUsers';

// data and types
import {
  evaluationData,
  teams,
  evaluationStatusOptions,
  evaluationStatusColors,
  evaluationTypeOptions,
  managementCategoryOptions,
  evaluationTypeColors,
  managementCategoryColors
} from 'data/evaluation';
import { EvaluationTableData, EvaluationStatus } from 'types/evaluation';

// Icons
import { Add, Trash, Edit, DocumentDownload } from '@wandersonalwes/iconsax-react';

// Hooks
import { useMenuPermission } from 'hooks/usePermissions';

// 컬럼 너비 정의
const columnWidths = {
  checkbox: 50,
  no: 60,
  registrationDate: 100,
  code: 120,
  evaluationType: 100,
  managementCategory: 120,
  evaluationTitle: 250,
  team: 100,
  assignee: 120,
  status: 90,
  inspectionDate: 100,
  action: 80
};

interface EvaluationTableProps {
  selectedYear?: string;
  selectedTeam?: string;
  selectedStatus?: string;
  selectedAssignee?: string;
  evaluations?: EvaluationTableData[];
  setEvaluations?: React.Dispatch<React.SetStateAction<EvaluationTableData[]>>;
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
  onSave?: (evaluation: EvaluationTableData) => Promise<void>;
  onDelete?: (ids: number[]) => Promise<void>;
  generateEvaluationCode?: () => Promise<string>;
}

export default function EvaluationTable({
  selectedYear = '전체',
  selectedTeam = '전체',
  selectedStatus = '전체',
  selectedAssignee = '전체',
  evaluations,
  setEvaluations,
  addChangeLog,
  onSave,
  onDelete,
  generateEvaluationCode
}: EvaluationTableProps) {
  const theme = useTheme();

  // ✅ 권한 체크
  const { canRead, canWrite, canFull, loading: permissionLoading } = useMenuPermission('/hr/evaluation');

  const [data, setData] = useState<EvaluationTableData[]>(
    evaluations ? evaluations : evaluationData.map((evaluation) => ({ ...evaluation }))
  );
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState('');

  // 사용자관리 데이터 가져오기
  const { users } = useSupabaseUsers();

  // 사용자 이름으로 사용자 데이터 찾기
  const findUserByName = (userName: string) => {
    return users.find((user) => user.user_name === userName);
  };

  // Edit 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<EvaluationTableData | null>(null);
  const [editingEvaluationId, setEditingEvaluationId] = useState<number | null>(null);

  // Excel 다운로드 기능
  const handleExcelDownload = () => {
    try {
      // 필터링된 데이터를 Excel 형식으로 변환 (테이블과 동일한 컬럼 순서)
      const excelData = filteredData.map((evaluation, index) => ({
        NO: index + 1,
        등록일: evaluation.registrationDate,
        코드: evaluation.code,
        평가유형: evaluation.evaluationType,
        관리분류: evaluation.managementCategory,
        평가제목: evaluation.evaluationTitle,
        팀: evaluation.team,
        담당자: evaluation.assignee,
        상태: evaluation.status,
        점검일: evaluation.inspectionDate
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
      link.setAttribute('download', `인사평가관리_${new Date().toISOString().slice(0, 10)}.csv`);
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

  // evaluations props가 변경될 때 data 상태 업데이트
  useEffect(() => {
    if (evaluations) {
      setData([...evaluations]);
    }
  }, [evaluations]);

  // 필터링된 데이터 (역순 정렬 추가)
  const filteredData = useMemo(() => {
    const filtered = data.filter((evaluation) => {
      // 연도 필터
      if (selectedYear !== '전체') {
        const evaluationYear = new Date(evaluation.startDate).getFullYear().toString();
        if (evaluationYear !== selectedYear) return false;
      }

      const teamMatch = selectedTeam === '전체' || evaluation.team === selectedTeam;
      const statusMatch = selectedStatus === '전체' || evaluation.status === selectedStatus;
      const assigneeMatch = selectedAssignee === '전체' || evaluation.assignee === selectedAssignee;

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

  // 선택된 행 삭제 (소프트 삭제)
  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;

    // 삭제 확인
    if (!confirm(`선택한 ${selected.length}개의 항목을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      if (onDelete) {
        console.log('🔄 Supabase 소프트 삭제 실행:', selected);
        await onDelete(selected);

        // 삭제된 항목들의 정보를 변경로그에 추가
        if (addChangeLog) {
          const deletedEvaluations = data.filter((evaluation) => selected.includes(evaluation.id));
          deletedEvaluations.forEach((evaluation) => {
            const evaluationCode = evaluation.code || `EVAL-${evaluation.id}`;
            const evaluationTitle = evaluation.evaluationTitle || '평가';
            addChangeLog(
              '삭제',
              evaluationCode,
              `인사평가관리 ${evaluationTitle}(${evaluationCode}) 데이터가 삭제 되었습니다.`,
              evaluation.team || '미분류',
              '',
              '',
              '-',
              evaluationTitle
            );
          });
        }

        console.log('✅ Supabase 삭제 완료');
      } else {
        // fallback: 로컬 삭제
        console.log('🔄 로컬 삭제 실행');
        const updatedData = data.filter((evaluation) => !selected.includes(evaluation.id));
        setData(updatedData);

        // 부모 컴포넌트로 동기화
        if (setEvaluations) {
          setEvaluations(updatedData);
        }

        // 삭제된 항목들의 정보를 변경로그에 추가
        if (addChangeLog) {
          const deletedEvaluations = data.filter((evaluation) => selected.includes(evaluation.id));
          deletedEvaluations.forEach((evaluation) => {
            const evaluationCode = evaluation.code || `EVAL-${evaluation.id}`;
            const evaluationTitle = evaluation.evaluationTitle || '평가';
            addChangeLog(
              '삭제',
              evaluationCode,
              `인사평가관리 ${evaluationTitle}(${evaluationCode}) 데이터가 삭제 되었습니다.`,
              evaluation.team || '미분류',
              '',
              '',
              '-',
              evaluationTitle
            );
          });
        }
      }

      setSelected([]);
    } catch (error) {
      console.error('❌ 삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingEvaluation(null);
    setEditingEvaluationId(null);
  };

  // Evaluation 저장
  const handleEditEvaluationSave = async (updatedEvaluation: EvaluationTableData) => {
    console.log('💾 EvaluationTable 저장 요청:', updatedEvaluation);

    // onSave prop이 있으면 Supabase 연동된 저장 함수 사용
    if (onSave) {
      console.log('🔄 Supabase 연동 저장 함수 호출');
      try {
        // 기존 evaluation 찾기 (변경로그 추적용)
        const existingIndex = data.findIndex((evaluation) => evaluation.id === updatedEvaluation.id);
        const originalEvaluation = existingIndex !== -1 ? data[existingIndex] : null;

        // Supabase에 저장
        await onSave(updatedEvaluation);
        console.log('✅ Supabase 저장 완료');

        // 변경로그 추가 - 각 필드별로 개별 로그 생성 (기존 evaluation 업데이트인 경우에만)
        if (originalEvaluation && addChangeLog) {
          const evaluationCode = updatedEvaluation.code || `EVAL-${updatedEvaluation.id}`;
          const evaluationTitle = updatedEvaluation.evaluationTitle || '평가';

          // 상태 변경
          if (originalEvaluation.status !== updatedEvaluation.status) {
            addChangeLog(
              '수정',
              evaluationCode,
              `인사평가관리 ${evaluationTitle}(${evaluationCode}) 정보 개요탭 상태가 ${originalEvaluation.status} → ${updatedEvaluation.status} 수정 되었습니다.`,
              updatedEvaluation.team || '미분류',
              originalEvaluation.status,
              updatedEvaluation.status,
              '상태',
              evaluationTitle
            );
          }

          // 담당자 변경
          if (originalEvaluation.assignee !== updatedEvaluation.assignee) {
            addChangeLog(
              '수정',
              evaluationCode,
              `인사평가관리 ${evaluationTitle}(${evaluationCode}) 정보 개요탭 담당자가 ${originalEvaluation.assignee || '미할당'} → ${updatedEvaluation.assignee || '미할당'} 수정 되었습니다.`,
              updatedEvaluation.team || '미분류',
              originalEvaluation.assignee || '미할당',
              updatedEvaluation.assignee || '미할당',
              '담당자',
              evaluationTitle
            );
          }

          // 평가제목 변경
          if (originalEvaluation.evaluationTitle !== updatedEvaluation.evaluationTitle) {
            addChangeLog(
              '수정',
              evaluationCode,
              `인사평가관리 ${evaluationTitle}(${evaluationCode}) 정보 개요탭 평가제목이 ${originalEvaluation.evaluationTitle} → ${updatedEvaluation.evaluationTitle} 수정 되었습니다.`,
              updatedEvaluation.team || '미분류',
              originalEvaluation.evaluationTitle || '',
              updatedEvaluation.evaluationTitle || '',
              '평가제목',
              updatedEvaluation.evaluationTitle
            );
          }

          // 평가유형 변경
          if (originalEvaluation.evaluationType !== updatedEvaluation.evaluationType) {
            addChangeLog(
              '수정',
              evaluationCode,
              `인사평가관리 ${evaluationTitle}(${evaluationCode}) 정보 개요탭 평가유형이 ${originalEvaluation.evaluationType} → ${updatedEvaluation.evaluationType} 수정 되었습니다.`,
              updatedEvaluation.team || '미분류',
              originalEvaluation.evaluationType,
              updatedEvaluation.evaluationType,
              '평가유형',
              evaluationTitle
            );
          }

          // 관리분류 변경
          if (originalEvaluation.managementCategory !== updatedEvaluation.managementCategory) {
            addChangeLog(
              '수정',
              evaluationCode,
              `인사평가관리 ${evaluationTitle}(${evaluationCode}) 정보 개요탭 관리분류가 ${originalEvaluation.managementCategory} → ${updatedEvaluation.managementCategory} 수정 되었습니다.`,
              updatedEvaluation.team || '미분류',
              originalEvaluation.managementCategory,
              updatedEvaluation.managementCategory,
              '관리분류',
              evaluationTitle
            );
          }

          // 점검일 변경
          if (originalEvaluation.inspectionDate !== updatedEvaluation.inspectionDate) {
            addChangeLog(
              '수정',
              evaluationCode,
              `인사평가관리 ${evaluationTitle}(${evaluationCode}) 정보 개요탭 점검일이 ${originalEvaluation.inspectionDate || '미정'} → ${updatedEvaluation.inspectionDate || '미정'} 수정 되었습니다.`,
              updatedEvaluation.team || '미분류',
              originalEvaluation.inspectionDate || '미정',
              updatedEvaluation.inspectionDate || '미정',
              '점검일',
              evaluationTitle
            );
          }

          // 팀 변경
          if (originalEvaluation.team !== updatedEvaluation.team) {
            addChangeLog(
              '수정',
              evaluationCode,
              `인사평가관리 ${evaluationTitle}(${evaluationCode}) 정보 개요탭 팀이 ${originalEvaluation.team || '미분류'} → ${updatedEvaluation.team || '미분류'} 수정 되었습니다.`,
              updatedEvaluation.team || '미분류',
              originalEvaluation.team || '미분류',
              updatedEvaluation.team || '미분류',
              '팀',
              evaluationTitle
            );
          }

          // 세부설명 변경
          if (originalEvaluation.details !== updatedEvaluation.details) {
            addChangeLog(
              '수정',
              evaluationCode,
              `인사평가관리 ${evaluationTitle}(${evaluationCode}) 정보의 개요탭 세부설명이 ${originalEvaluation.details || ''} → ${updatedEvaluation.details || ''} 로 수정 되었습니다.`,
              updatedEvaluation.team || '미분류',
              originalEvaluation.details || '',
              updatedEvaluation.details || '',
              '세부설명',
              evaluationTitle
            );
          }
        }

        // 새 evaluation 생성인 경우 생성 로그 추가
        if (!originalEvaluation && addChangeLog) {
          const evaluationCode = updatedEvaluation.code || `EVAL-${updatedEvaluation.id}`;
          const evaluationTitle = updatedEvaluation.evaluationTitle || '새 평가';
          addChangeLog(
            '생성',
            evaluationCode,
            `인사평가관리 ${evaluationTitle}(${evaluationCode}) 데이터가 생성 되었습니다.`,
            updatedEvaluation.team || '미분류',
            '',
            '',
            '-',
            evaluationTitle
          );
        }
      } catch (error) {
        console.error('❌ Supabase 저장 실패:', error);
        alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
        return;
      }
    } else {
      // 기존 로컬 저장 로직 (fallback)
      console.log('🔄 로컬 저장 로직 사용');
      const existingIndex = data.findIndex((inspection) => inspection.id === updatedInspection.id);
      console.log('🔍 기존 Inspection 인덱스:', existingIndex);

      if (existingIndex !== -1) {
        // 기존 Inspection 업데이트
        const originalInspection = data[existingIndex];
        const updatedData = [...data];
        updatedData[existingIndex] = updatedInspection;
        setData(updatedData);

        // 부모 컴포넌트로 동기화
        if (setInspections) {
          setInspections(updatedData);
        }

        // 변경로그 추가 - 각 필드별로 개별 로그 생성
        if (addChangeLog) {
          const inspectionCode = updatedInspection.code || `SEC-${updatedInspection.id}`;
          const inspectionTitle = updatedInspection.inspectionContent || '점검';

          // 상태 변경
          if (originalInspection.status !== updatedInspection.status) {
            addChangeLog(
              '수정',
              inspectionCode,
              `보안점검관리 ${inspectionTitle}(${inspectionCode}) 정보 개요탭 상태가 ${originalInspection.status} → ${updatedInspection.status} 수정 되었습니다.`,
              updatedInspection.team || '미분류',
              originalInspection.status,
              updatedInspection.status,
              '상태',
              inspectionTitle
            );
          }

          // 담당자 변경
          if (originalInspection.assignee !== updatedInspection.assignee) {
            addChangeLog(
              '수정',
              inspectionCode,
              `보안점검관리 ${inspectionTitle}(${inspectionCode}) 정보 개요탭 담당자가 ${originalInspection.assignee || '미할당'} → ${updatedInspection.assignee || '미할당'} 수정 되었습니다.`,
              updatedInspection.team || '미분류',
              originalInspection.assignee || '미할당',
              updatedInspection.assignee || '미할당',
              '담당자',
              inspectionTitle
            );
          }

          // 점검내용 변경
          if (originalInspection.inspectionContent !== updatedInspection.inspectionContent) {
            addChangeLog(
              '수정',
              inspectionCode,
              `보안점검관리 ${inspectionTitle}(${inspectionCode}) 정보 개요탭 점검내용이 ${originalInspection.inspectionContent} → ${updatedInspection.inspectionContent} 수정 되었습니다.`,
              updatedInspection.team || '미분류',
              originalInspection.inspectionContent || '',
              updatedInspection.inspectionContent || '',
              '점검내용',
              updatedInspection.inspectionContent
            );
          }

          // 점검유형 변경
          if (originalInspection.inspectionType !== updatedInspection.inspectionType) {
            addChangeLog(
              '수정',
              inspectionCode,
              `보안점검관리 ${inspectionTitle}(${inspectionCode}) 정보 개요탭 점검유형이 ${originalInspection.inspectionType} → ${updatedInspection.inspectionType} 수정 되었습니다.`,
              updatedInspection.team || '미분류',
              originalInspection.inspectionType,
              updatedInspection.inspectionType,
              '점검유형',
              inspectionTitle
            );
          }

          // 점검대상 변경
          if (originalInspection.inspectionTarget !== updatedInspection.inspectionTarget) {
            addChangeLog(
              '수정',
              inspectionCode,
              `보안점검관리 ${inspectionTitle}(${inspectionCode}) 정보 개요탭 점검대상이 ${originalInspection.inspectionTarget} → ${updatedInspection.inspectionTarget} 수정 되었습니다.`,
              updatedInspection.team || '미분류',
              originalInspection.inspectionTarget,
              updatedInspection.inspectionTarget,
              '점검대상',
              inspectionTitle
            );
          }

          // 점검일 변경
          if (originalInspection.inspectionDate !== updatedInspection.inspectionDate) {
            addChangeLog(
              '수정',
              inspectionCode,
              `보안점검관리 ${inspectionTitle}(${inspectionCode}) 정보 개요탭 점검일이 ${originalInspection.inspectionDate || '미정'} → ${updatedInspection.inspectionDate || '미정'} 수정 되었습니다.`,
              updatedInspection.team || '미분류',
              originalInspection.inspectionDate || '미정',
              updatedInspection.inspectionDate || '미정',
              '점검일',
              inspectionTitle
            );
          }

          // 팀 변경
          if (originalInspection.team !== updatedInspection.team) {
            addChangeLog(
              '수정',
              inspectionCode,
              `보안점검관리 ${inspectionTitle}(${inspectionCode}) 정보 개요탭 팀이 ${originalInspection.team || '미분류'} → ${updatedInspection.team || '미분류'} 수정 되었습니다.`,
              updatedInspection.team || '미분류',
              originalInspection.team || '미분류',
              updatedInspection.team || '미분류',
              '팀',
              inspectionTitle
            );
          }

          // 세부설명 변경
          if (originalInspection.details !== updatedInspection.details) {
            addChangeLog(
              '수정',
              inspectionCode,
              `보안점검관리 ${inspectionTitle}(${inspectionCode}) 정보의 개요탭 세부설명이 ${originalInspection.details || ''} → ${updatedInspection.details || ''} 로 수정 되었습니다.`,
              updatedInspection.team || '미분류',
              originalInspection.details || '',
              updatedInspection.details || '',
              '세부설명',
              inspectionTitle
            );
          }
        }

        console.log('✅ 기존 Inspection 업데이트 완료');
      } else {
        // 새 Inspection 추가 - 상단에 추가
        const currentYear = new Date().getFullYear();
        const yearSuffix = currentYear.toString().slice(-2);
        const maxNo = Math.max(...data.map((t) => t.no || 0), 0);
        const newInspectionWithNumber = {
          ...updatedInspection,
          id: Date.now(), // 임시 ID
          no: maxNo + 1,
          code: `SEC-INS-${yearSuffix}-${String(maxNo + 1).padStart(3, '0')}`,
          registrationDate: new Date().toISOString().split('T')[0],
          inspectionDate: updatedInspection.inspectionDate || new Date().toISOString().split('T')[0]
        };
        // 새 데이터를 배열 맨 앞에 추가 (역순 정렬을 위해)
        const newData = [newInspectionWithNumber, ...data];
        setData(newData);

        // 부모 컴포넌트로 동기화
        if (setInspections) {
          setInspections(newData);
        }

        // 변경로그 추가 - 새 점검 생성
        if (addChangeLog) {
          const newCode = newInspectionWithNumber.code;
          const inspectionTitle = newInspectionWithNumber.inspectionContent || '새 점검';
          addChangeLog(
            '생성',
            newCode,
            `보안점검관리 ${inspectionTitle}(${newCode}) 데이터가 생성 되었습니다.`,
            newInspectionWithNumber.team || '미분류',
            '',
            '',
            '-',
            inspectionTitle
          );
        }

        console.log('✅ 새 Inspection 추가 완료:', newInspectionWithNumber);
      }
    }

    handleEditDialogClose();
  };

  // 새 Evaluation 추가
  const addNewEvaluation = () => {
    // 바로 편집 팝업 열기
    setEditingEvaluation(null);
    setEditingEvaluationId(null);
    setEditDialog(true);
  };

  // 편집 핸들러
  const handleEditEvaluation = (evaluation: EvaluationTableData) => {
    setEditingEvaluation(evaluation);
    setEditingEvaluationId(evaluation.id);
    setEditDialog(true);
  };

  // 상태 색상 (파스텔톤 배경, 검정 계열 글자)
  const getStatusColor = (status: EvaluationStatus) => {
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

  // ✅ 권한 없음 - 접근 차단
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
          {canWrite && (
            <Button variant="contained" startIcon={<Add size={16} />} size="small" onClick={addNewEvaluation} sx={{ px: 2 }}>
              추가
            </Button>
          )}
          {canFull && (
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
          )}
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
                  checked={paginatedData.length > 0 && paginatedData.every((inspection) => selected.includes(inspection.id))}
                  indeterminate={selected.length > 0 && selected.length < paginatedData.length}
                  onChange={handleSelectAllClick}
                  size="small"
                />
              </TableCell>
              <TableCell sx={{ width: columnWidths.no, fontWeight: 600 }}>NO</TableCell>
              <TableCell sx={{ width: columnWidths.registrationDate, fontWeight: 600 }}>등록일</TableCell>
              <TableCell sx={{ width: columnWidths.code, fontWeight: 600 }}>코드</TableCell>
              <TableCell sx={{ width: columnWidths.evaluationType, fontWeight: 600 }}>평가유형</TableCell>
              <TableCell sx={{ width: columnWidths.managementCategory, fontWeight: 600 }}>관리분류</TableCell>
              <TableCell sx={{ width: columnWidths.evaluationTitle, fontWeight: 600 }}>평가제목</TableCell>
              <TableCell sx={{ width: columnWidths.team, fontWeight: 600 }}>팀</TableCell>
              <TableCell sx={{ width: columnWidths.assignee, fontWeight: 600 }}>담당자</TableCell>
              <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: columnWidths.inspectionDate, fontWeight: 600 }}>점검일</TableCell>
              <TableCell sx={{ width: columnWidths.action, fontWeight: 600 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((evaluation) => (
                <TableRow
                  key={evaluation.id}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(evaluation.id)}
                      onChange={(event) => {
                        const selectedIndex = selected.indexOf(evaluation.id);
                        let newSelected: number[] = [];

                        if (selectedIndex === -1) {
                          newSelected = newSelected.concat(selected, evaluation.id);
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
                      {evaluation.no}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {evaluation.registrationDate}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {evaluation.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {evaluation.evaluationType}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {evaluation.managementCategory}
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
                      {evaluation.evaluationTitle || '평가제목 없음'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                      {evaluation.team || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        src={findUserByName(evaluation.assignee)?.avatar_url || findUserByName(evaluation.assignee)?.profile_image_url}
                        alt={evaluation.assignee}
                        sx={{ width: 24, height: 24 }}
                      >
                        {evaluation.assignee?.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 80, fontSize: '13px' }}>
                        {evaluation.assignee}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={evaluation.status}
                      size="small"
                      sx={{
                        ...getStatusColor(evaluation.status),
                        fontWeight: 500,
                        fontSize: '13px'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {evaluation.inspectionDate}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {canWrite && (
                        <Tooltip title="수정">
                          <IconButton size="small" onClick={() => handleEditEvaluation(evaluation)} sx={{ color: 'primary.main' }}>
                            <Edit size={16} />
                          </IconButton>
                        </Tooltip>
                      )}
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

      {/* Evaluation 편집 다이얼로그 */}
      {editDialog && (
        <EvaluationEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          evaluation={editingEvaluation}
          onSave={handleEditEvaluationSave}
          generateEvaluationCode={generateEvaluationCode}
        />
      )}
    </Box>
  );
}
