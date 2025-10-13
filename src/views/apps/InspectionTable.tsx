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
import InspectionEditDialog from 'components/InspectionEditDialog';

// hooks
import { useSupabaseUserManagement } from 'hooks/useSupabaseUserManagement';

// data and types
import {
  inspectionData,
  teams,
  inspectionStatusOptions,
  inspectionStatusColors,
  inspectionTypeOptions,
  inspectionTargetOptions,
  inspectionTypeColors,
  inspectionTargetColors
} from 'data/inspection';
import { InspectionTableData, InspectionStatus } from 'types/inspection';

// Icons
import { Add, Trash, Edit, DocumentDownload } from '@wandersonalwes/iconsax-react';

// 컬럼 너비 정의 (VOC관리와 유사하게)
const columnWidths = {
  checkbox: 50,
  no: 60,
  registrationDate: 100,
  code: 120,
  inspectionType: 100,
  inspectionTarget: 120,
  inspectionContent: 250,
  team: 100,
  assignee: 120,
  status: 90,
  inspectionDate: 100,
  action: 80
};

interface InspectionTableProps {
  selectedYear?: string;
  selectedTeam?: string;
  selectedStatus?: string;
  selectedAssignee?: string;
  inspections?: InspectionTableData[];
  setInspections?: React.Dispatch<React.SetStateAction<InspectionTableData[]>>;
  addChangeLog?: (action: string, target: string, description: string, team?: string, beforeValue?: string, afterValue?: string, changedField?: string) => void;
  onSave?: (inspection: InspectionTableData) => Promise<void>;
  onDelete?: (ids: number[]) => Promise<void>;
  generateInspectionCode?: () => Promise<string>;
}

export default function InspectionTable({
  selectedYear = '전체',
  selectedTeam = '전체',
  selectedStatus = '전체',
  selectedAssignee = '전체',
  inspections,
  setInspections,
  addChangeLog,
  onSave,
  onDelete,
  generateInspectionCode
}: InspectionTableProps) {
  const theme = useTheme();
  const [data, setData] = useState<InspectionTableData[]>(
    inspections ? inspections : inspectionData.map((inspection) => ({ ...inspection }))
  );
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState('');

  // 사용자관리 데이터 가져오기
  const { users } = useSupabaseUserManagement();

  // 사용자명 -> 프로필 이미지 URL 매핑
  const userAvatarMap = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach((user) => {
      if (user.user_name) {
        map[user.user_name] = user.profile_image_url || user.avatar_url || '';
      }
    });
    return map;
  }, [users]);

  // Edit 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingInspection, setEditingInspection] = useState<InspectionTableData | null>(null);
  const [editingInspectionId, setEditingInspectionId] = useState<number | null>(null);

  // Excel 다운로드 기능
  const handleExcelDownload = () => {
    try {
      // 필터링된 데이터를 Excel 형식으로 변환 (테이블과 동일한 컬럼 순서)
      const excelData = filteredData.map((inspection, index) => ({
        NO: index + 1,
        등록일: inspection.registrationDate,
        코드: inspection.code,
        점검유형: inspection.inspectionType,
        점검대상: inspection.inspectionTarget,
        점검내용: inspection.inspectionContent,
        팀: inspection.team,
        담당자: inspection.assignee,
        상태: inspection.status,
        점검일: inspection.inspectionDate
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
      link.setAttribute('download', `보안점검관리_${new Date().toISOString().slice(0, 10)}.csv`);
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

  // inspections props가 변경될 때 data 상태 업데이트
  useEffect(() => {
    if (inspections) {
      setData([...inspections]);
    }
  }, [inspections]);

  // 필터링된 데이터 (역순 정렬 추가)
  const filteredData = useMemo(() => {
    const filtered = data.filter((inspection) => {
      // 연도 필터
      if (selectedYear !== '전체') {
        const inspectionYear = new Date(inspection.startDate).getFullYear().toString();
        if (inspectionYear !== selectedYear) return false;
      }

      const teamMatch = selectedTeam === '전체' || inspection.team === selectedTeam;
      const statusMatch = selectedStatus === '전체' || inspection.status === selectedStatus;
      const assigneeMatch = selectedAssignee === '전체' || inspection.assignee === selectedAssignee;

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
          const deletedInspections = data.filter((inspection) => selected.includes(inspection.id));
          deletedInspections.forEach((inspection) => {
            const inspectionCode = inspection.code || `SEC-${inspection.id}`;
            const inspectionTitle = inspection.inspectionContent || '점검';
            addChangeLog(
              '삭제',
              inspectionCode,
              `보안점검관리 ${inspectionTitle}(${inspectionCode}) 데이터가 삭제 되었습니다.`,
              inspection.team || '미분류',
              '',
              '',
              '-'
            );
          });
        }

        console.log('✅ Supabase 삭제 완료');
      } else {
        // fallback: 로컬 삭제
        console.log('🔄 로컬 삭제 실행');
        const updatedData = data.filter((inspection) => !selected.includes(inspection.id));
        setData(updatedData);

        // 부모 컴포넌트로 동기화
        if (setInspections) {
          setInspections(updatedData);
        }

        // 삭제된 항목들의 정보를 변경로그에 추가
        if (addChangeLog) {
          const deletedInspections = data.filter((inspection) => selected.includes(inspection.id));
          deletedInspections.forEach((inspection) => {
            const inspectionCode = inspection.code || `SEC-${inspection.id}`;
            const inspectionTitle = inspection.inspectionContent || '점검';
            addChangeLog(
              '삭제',
              inspectionCode,
              `보안점검관리 ${inspectionTitle}(${inspectionCode}) 데이터가 삭제 되었습니다.`,
              inspection.team || '미분류',
              '',
              '',
              '-'
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
    setEditingInspection(null);
    setEditingInspectionId(null);
  };

  // Inspection 저장
  const handleEditInspectionSave = async (updatedInspection: InspectionTableData) => {
    console.log('💾 InspectionTable 저장 요청:', updatedInspection);

    // onSave prop이 있으면 Supabase 연동된 저장 함수 사용
    if (onSave) {
      console.log('🔄 Supabase 연동 저장 함수 호출');
      try {
        // 기존 inspection 찾기 (변경로그 추적용)
        const existingIndex = data.findIndex((inspection) => inspection.id === updatedInspection.id);
        const originalInspection = existingIndex !== -1 ? data[existingIndex] : null;

        // Supabase에 저장
        await onSave(updatedInspection);
        console.log('✅ Supabase 저장 완료');

        // 변경로그 추가 - 각 필드별로 개별 로그 생성 (기존 inspection 업데이트인 경우에만)
        if (originalInspection && addChangeLog) {
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
              '상태'
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
              '담당자'
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
              '점검내용'
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
              '점검유형'
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
              '점검대상'
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
              '점검일'
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
              '팀'
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
              '세부설명'
            );
          }
        }

        // 새 inspection 생성인 경우 생성 로그 추가
        if (!originalInspection && addChangeLog) {
          const inspectionCode = updatedInspection.code || `SEC-${updatedInspection.id}`;
          const inspectionTitle = updatedInspection.inspectionContent || '새 점검';
          addChangeLog(
            '생성',
            inspectionCode,
            `보안점검관리 ${inspectionTitle}(${inspectionCode}) 데이터가 생성 되었습니다.`,
            updatedInspection.team || '미분류',
            '',
            '',
            '-'
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
              '상태'
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
              '담당자'
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
              '점검내용'
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
              '점검유형'
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
              '점검대상'
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
              '점검일'
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
              '팀'
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
              '세부설명'
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
            '-'
          );
        }

        console.log('✅ 새 Inspection 추가 완료:', newInspectionWithNumber);
      }
    }

    handleEditDialogClose();
  };

  // 새 Inspection 추가
  const addNewInspection = () => {
    // 바로 편집 팝업 열기
    setEditingInspection(null);
    setEditingInspectionId(null);
    setEditDialog(true);
  };

  // 편집 핸들러 (IT교육관리 스타일)
  const handleEditInspection = (inspection: InspectionTableData) => {
    setEditingInspection(inspection);
    setEditingInspectionId(inspection.id);
    setEditDialog(true);
  };

  // 상태 색상 (파스텔톤 배경, 검정 계열 글자)
  const getStatusColor = (status: InspectionStatus) => {
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
          <Button variant="contained" startIcon={<Add size={16} />} size="small" onClick={addNewInspection} sx={{ px: 2 }}>
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
                  checked={paginatedData.length > 0 && paginatedData.every((inspection) => selected.includes(inspection.id))}
                  indeterminate={selected.length > 0 && selected.length < paginatedData.length}
                  onChange={handleSelectAllClick}
                  size="small"
                />
              </TableCell>
              <TableCell sx={{ width: columnWidths.no, fontWeight: 600 }}>NO</TableCell>
              <TableCell sx={{ width: columnWidths.registrationDate, fontWeight: 600 }}>등록일</TableCell>
              <TableCell sx={{ width: columnWidths.code, fontWeight: 600 }}>코드</TableCell>
              <TableCell sx={{ width: columnWidths.inspectionType, fontWeight: 600 }}>점검유형</TableCell>
              <TableCell sx={{ width: columnWidths.inspectionTarget, fontWeight: 600 }}>점검대상</TableCell>
              <TableCell sx={{ width: columnWidths.inspectionContent, fontWeight: 600 }}>점검내용</TableCell>
              <TableCell sx={{ width: columnWidths.team, fontWeight: 600 }}>팀</TableCell>
              <TableCell sx={{ width: columnWidths.assignee, fontWeight: 600 }}>담당자</TableCell>
              <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: columnWidths.inspectionDate, fontWeight: 600 }}>점검일</TableCell>
              <TableCell sx={{ width: columnWidths.action, fontWeight: 600 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((inspection) => (
                <TableRow
                  key={inspection.id}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(inspection.id)}
                      onChange={(event) => {
                        const selectedIndex = selected.indexOf(inspection.id);
                        let newSelected: number[] = [];

                        if (selectedIndex === -1) {
                          newSelected = newSelected.concat(selected, inspection.id);
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
                      {inspection.no}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {inspection.registrationDate}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {inspection.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {inspection.inspectionType}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {inspection.inspectionTarget}
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
                      {inspection.inspectionContent || '점검내용 없음'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                      {inspection.team || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        src={userAvatarMap[inspection.assignee] || ''}
                        alt={inspection.assignee}
                        sx={{ width: 24, height: 24 }}
                      >
                        {inspection.assignee?.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 80, fontSize: '13px' }}>
                        {inspection.assignee}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={inspection.status}
                      size="small"
                      sx={{
                        ...getStatusColor(inspection.status),
                        fontWeight: 500,
                        fontSize: '13px'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {inspection.inspectionDate}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="수정">
                        <IconButton size="small" onClick={() => handleEditInspection(inspection)} sx={{ color: 'primary.main' }}>
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

      {/* Inspection 편집 다이얼로그 */}
      {editDialog && (
        <InspectionEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          inspection={editingInspection}
          onSave={handleEditInspectionSave}
          generateInspectionCode={generateInspectionCode}
        />
      )}
    </Box>
  );
}
