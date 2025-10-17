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
import SolutionEditDialog from 'components/SolutionEditDialog';

// data and types
import { solutionData, teams, assignees, solutionStatusOptions, solutionStatusColors, assigneeAvatars } from 'data/solution';
import { SolutionTableData, SolutionStatus } from 'types/solution';
import { useSupabaseSolution } from '../../hooks/useSupabaseSolution';
import { useSupabaseUserManagement } from '../../hooks/useSupabaseUserManagement';

// Icons
import { Add, Trash, Edit, DocumentDownload } from '@wandersonalwes/iconsax-react';

// 컬럼 너비 정의 (새로운 솔루션 관리 구조)
const columnWidths = {
  checkbox: 50,
  no: 60,
  registrationDate: 100,
  code: 110,
  solutionType: 100,
  developmentType: 100,
  title: 200,
  team: 90,
  assignee: 120,
  status: 90,
  startDate: 100,
  completedDate: 100,
  action: 80
};

interface SolutionTableProps {
  selectedYear?: string;
  selectedTeam?: string;
  selectedStatus?: string;
  selectedAssignee?: string;
  solutions?: SolutionTableData[];
  setSolutions?: React.Dispatch<React.SetStateAction<SolutionTableData[]>>;
  addChangeLog?: (action: string, target: string, description: string, team?: string, beforeValue?: string, afterValue?: string, changedField?: string, title?: string) => void;
}

export default function SolutionTable({
  selectedYear = '전체',
  selectedTeam = '전체',
  selectedStatus = '전체',
  selectedAssignee = '전체',
  solutions,
  setSolutions,
  addChangeLog
}: SolutionTableProps) {
  const theme = useTheme();

  // Supabase 연동 훅
  const {
    createSolution,
    updateSolution,
    deleteSolution,
    convertToDbSolutionData,
    convertToSolutionData,
    getSolutions
  } = useSupabaseSolution();

  // 사용자관리 훅 - 담당자 프로필 사진 연동
  const { users } = useSupabaseUserManagement();

  // 담당자별 프로필 사진 가져오는 함수
  const getUserProfileImage = (assigneeName: string) => {
    const user = users.find(u => u.user_name === assigneeName);
    return user?.profile_image_url || user?.avatar_url || null;
  };

  const [data, setData] = useState<SolutionTableData[]>(solutions ? solutions : solutionData.map((solution) => ({ ...solution })));
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState('');

  // Edit 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingSolution, setEditingSolution] = useState<SolutionTableData | null>(null);
  const [editingSolutionId, setEditingSolutionId] = useState<number | null>(null);

  // Excel 다운로드 기능
  const handleExcelDownload = () => {
    try {
      // 필터링된 데이터를 Excel 형식으로 변환 (새로운 컬럼 구조)
      const excelData = filteredData.map((solution, index) => ({
        NO: filteredData.length - index,
        등록일: solution.registrationDate,
        코드: solution.code,
        솔루션유형: solution.solutionType,
        개발유형: solution.developmentType,
        세부내용: solution.detailContent,
        팀: solution.team,
        담당자: solution.assignee,
        상태: solution.status,
        완료일: solution.completedDate || '미정'
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
      console.log('Excel 다운로드 중 오류 발생:', error);
      alert('Excel 다운로드 중 오류가 발생했습니다.');
    }
  };

  // solutions props가 변경될 때 data 상태 업데이트
  useEffect(() => {
    if (solutions) {
      setData([...solutions]);
    }
  }, [solutions]);

  // 필터링된 데이터 (역순 정렬 추가)
  const filteredData = useMemo(() => {
    const filtered = data.filter((solution) => {
      // 연도 필터
      if (selectedYear !== '전체') {
        const solutionYear = new Date(solution.registrationDate).getFullYear().toString();
        if (solutionYear !== selectedYear) return false;
      }

      const teamMatch = selectedTeam === '전체' || solution.team === selectedTeam;
      const statusMatch = selectedStatus === '전체' || solution.status === selectedStatus;
      const assigneeMatch = selectedAssignee === '전체' || solution.assignee === selectedAssignee;

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

  // 선택된 행 삭제 (DB에서 soft delete)
  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;

    console.log('🗑️ 선택된 항목 삭제 시작:', selected);

    // 삭제될 업무들의 정보를 변경로그에 추가
    if (addChangeLog) {
      const deletedSolutions = data.filter((solution) => selected.includes(solution.id));
      deletedSolutions.forEach((solution) => {
        const solutionTitle = solution.title || solution.workContent || '업무';
        addChangeLog(
          '업무 삭제',
          solution.code || `IT-SOL-${new Date().getFullYear().toString().slice(-2)}-${String(solution.id).padStart(3, '0')}`,
          `${solutionTitle} 삭제`,
          solution.team || '미분류',
          undefined,
          undefined,
          undefined,
          solutionTitle
        );
      });
    }

    // DB에서 is_active를 false로 업데이트 (soft delete)
    try {
      // 각 선택된 항목에 대해 DB 업데이트 수행
      const deletePromises = selected.map((id) => deleteSolution(id));
      const results = await Promise.all(deletePromises);

      // 성공한 삭제만 화면에서 제거
      const successfulDeletes = selected.filter((id, index) => results[index]);

      if (successfulDeletes.length > 0) {
        const updatedData = data.filter((solution) => !successfulDeletes.includes(solution.id));
        setData(updatedData);
        console.log('✅ 삭제 완료:', successfulDeletes.length, '개');

        // 부모 컴포넌트로 동기화
        if (setSolutions) {
          setSolutions(updatedData);
        }
      } else {
        console.log('❌ 삭제 실패: 모든 항목 삭제에 실패했습니다.');
        alert('삭제에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.log('❌ 삭제 중 오류 발생:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setSelected([]);
    }
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingSolution(null);
    setEditingSolutionId(null);
  };

  // Solution 저장 (DB 연동 버전)
  const handleEditSolutionSave = async (updatedSolution: SolutionTableData) => {
    console.log('🚀 SolutionTable handleEditSolutionSave 시작:', { updatedSolution });

    const existingIndex = data.findIndex((solution) => solution.id === updatedSolution.id);
    console.log('🔍 기존 Solution 인덱스:', existingIndex);

    if (existingIndex !== -1) {
      // 기존 솔루션 업데이트
      console.log('📝 기존 솔루션 업데이트 시작:', existingIndex);

      try {
        // 변경로그 추가 - 필드별 상세 추적 (개요탭 전체 필드) - DB 저장 전에 실행
        if (addChangeLog) {
          const originalSolution = data[existingIndex];
          const solutionCode = updatedSolution.code || `IT-SOL-${new Date().getFullYear().toString().slice(-2)}-${String(updatedSolution.id).padStart(3, '0')}`;
          const solutionName = updatedSolution.title || '솔루션';

        // 1. 솔루션유형 변경
        if (originalSolution.solutionType !== updatedSolution.solutionType) {
          addChangeLog(
            '수정',
            solutionCode,
            `솔루션관리 ${solutionName}(${solutionCode}) 정보의 개요탭 솔루션유형이 ${originalSolution.solutionType || ''} → ${updatedSolution.solutionType || ''} 로 수정 되었습니다.`,
            updatedSolution.team || '미분류',
            originalSolution.solutionType || '',
            updatedSolution.solutionType || '',
            '솔루션유형',
            solutionName
          );
        }

        // 2. 개발유형 변경
        if (originalSolution.developmentType !== updatedSolution.developmentType) {
          addChangeLog(
            '수정',
            solutionCode,
            `솔루션관리 ${solutionName}(${solutionCode}) 정보의 개요탭 개발유형이 ${originalSolution.developmentType || ''} → ${updatedSolution.developmentType || ''} 로 수정 되었습니다.`,
            updatedSolution.team || '미분류',
            originalSolution.developmentType || '',
            updatedSolution.developmentType || '',
            '개발유형',
            solutionName
          );
        }

        // 3. 제목 변경
        if (originalSolution.title !== updatedSolution.title) {
          addChangeLog(
            '수정',
            solutionCode,
            `솔루션관리 ${originalSolution.title || ''}(${solutionCode}) 정보의 개요탭 제목이 ${originalSolution.title || ''} → ${updatedSolution.title || ''} 로 수정 되었습니다.`,
            updatedSolution.team || '미분류',
            originalSolution.title || '',
            updatedSolution.title || '',
            '제목',
            solutionName
          );
        }

        // 4. 세부내용 변경
        if (originalSolution.detailContent !== updatedSolution.detailContent) {
          addChangeLog(
            '수정',
            solutionCode,
            `솔루션관리 ${solutionName}(${solutionCode}) 정보의 개요탭 세부내용이 ${originalSolution.detailContent || ''} → ${updatedSolution.detailContent || ''} 로 수정 되었습니다.`,
            updatedSolution.team || '미분류',
            originalSolution.detailContent || '',
            updatedSolution.detailContent || '',
            '세부내용',
            solutionName
          );
        }

        // 5. 팀 변경
        if (originalSolution.team !== updatedSolution.team) {
          addChangeLog(
            '수정',
            solutionCode,
            `솔루션관리 ${solutionName}(${solutionCode}) 정보의 개요탭 팀이 ${originalSolution.team || ''} → ${updatedSolution.team || ''} 로 수정 되었습니다.`,
            updatedSolution.team || '미분류',
            originalSolution.team || '',
            updatedSolution.team || '',
            '팀',
            solutionName
          );
        }

        // 6. 담당자 변경
        if (originalSolution.assignee !== updatedSolution.assignee) {
          addChangeLog(
            '수정',
            solutionCode,
            `솔루션관리 ${solutionName}(${solutionCode}) 정보의 개요탭 담당자가 ${originalSolution.assignee || ''} → ${updatedSolution.assignee || ''} 로 수정 되었습니다.`,
            updatedSolution.team || '미분류',
            originalSolution.assignee || '',
            updatedSolution.assignee || '',
            '담당자',
            solutionName
          );
        }

        // 7. 상태 변경
        if (originalSolution.status !== updatedSolution.status) {
          addChangeLog(
            '수정',
            solutionCode,
            `솔루션관리 ${solutionName}(${solutionCode}) 정보의 개요탭 상태가 ${originalSolution.status} → ${updatedSolution.status} 로 수정 되었습니다.`,
            updatedSolution.team || '미분류',
            originalSolution.status,
            updatedSolution.status,
            '상태',
            solutionName
          );
        }

        // 8. 진행율 변경
        if ((originalSolution.progress || 0) !== (updatedSolution.progress || 0)) {
          addChangeLog(
            '수정',
            solutionCode,
            `솔루션관리 ${solutionName}(${solutionCode}) 정보의 개요탭 진행율이 ${originalSolution.progress || 0}% → ${updatedSolution.progress || 0}% 로 수정 되었습니다.`,
            updatedSolution.team || '미분류',
            String(originalSolution.progress || 0),
            String(updatedSolution.progress || 0),
            '진행율',
            solutionName
          );
        }

        // 9. 시작일 변경
        if (originalSolution.startDate !== updatedSolution.startDate) {
          addChangeLog(
            '수정',
            solutionCode,
            `솔루션관리 ${solutionName}(${solutionCode}) 정보의 개요탭 시작일이 ${originalSolution.startDate || ''} → ${updatedSolution.startDate || ''} 로 수정 되었습니다.`,
            updatedSolution.team || '미분류',
            originalSolution.startDate || '',
            updatedSolution.startDate || '',
            '시작일',
            solutionName
          );
        }

        // 10. 완료일 변경
        if (originalSolution.completedDate !== updatedSolution.completedDate) {
          addChangeLog(
            '수정',
            solutionCode,
            `솔루션관리 ${solutionName}(${solutionCode}) 정보의 개요탭 완료일이 ${originalSolution.completedDate || ''} → ${updatedSolution.completedDate || ''} 로 수정 되었습니다.`,
            updatedSolution.team || '미분류',
            originalSolution.completedDate || '',
            updatedSolution.completedDate || '',
            '완료일',
            solutionName
          );
        }
      }

        // 이제 DB 저장 작업 수행
        const dbData = convertToDbSolutionData(updatedSolution);
        console.log('🔄 DB 형식으로 변환된 데이터:', dbData);
        console.log('📝 업데이트할 솔루션 ID:', updatedSolution.id);

        const success = await updateSolution(updatedSolution.id, dbData);
        console.log('📋 updateSolution 결과:', success);

        if (success) {
          console.log('✅ 솔루션 업데이트 성공 - UI 업데이트 시작');
          // UI 업데이트
          const updatedData = [...data];
          updatedData[existingIndex] = updatedSolution;
          setData(updatedData);

          if (setSolutions) {
            setSolutions(updatedData);
          }

          console.log('✅ 솔루션 업데이트 완료');
        } else {
          console.log('❌ 솔루션 업데이트 실패');
          alert('솔루션 업데이트에 실패했습니다. 다시 시도해주세요.');
          return;
        }
      } catch (error) {
        console.log('❌ 솔루션 업데이트 오류 상세:', {
          error,
          message: error instanceof Error ? error.message : '알 수 없는 오류',
          stack: error instanceof Error ? error.stack : undefined
        });
        alert(`솔루션 업데이트 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        return;
      }
    } else {
      // 새 솔루션 생성
      console.log('🆕 새 솔루션 생성 시작');

      try {
        // 입력 데이터 검증
        if (!updatedSolution.title?.trim()) {
          alert('제목을 입력해주세요.');
          return;
        }
        if (!updatedSolution.detailContent?.trim()) {
          alert('상세내용을 입력해주세요.');
          return;
        }
        if (!updatedSolution.assignee?.trim()) {
          alert('담당자를 입력해주세요.');
          return;
        }

        console.log('📋 입력 데이터 검증 완료');

        const dbData = convertToDbSolutionData(updatedSolution);
        console.log('🔄 DB 형식으로 변환된 데이터:', dbData);

        const createdDbSolution = await createSolution(dbData);
        console.log('📤 createSolution 결과:', createdDbSolution);

        if (createdDbSolution) {
          const createdSolution = {
            ...convertToSolutionData(createdDbSolution),
            isEditing: false
          };

          console.log('🎯 변환된 프론트엔드 데이터:', createdSolution);

          // UI 업데이트 - 새로 생성된 솔루션 추가
          const newData = [createdSolution, ...data];
          setData(newData);

          if (setSolutions) {
            setSolutions(newData);
          }

          // 변경로그 추가
          if (addChangeLog) {
            addChangeLog(
              '새 업무 생성',
              createdSolution.code,
              `새로운 업무가 생성되었습니다: ${createdSolution.title}`,
              createdSolution.team,
              undefined,
              undefined,
              undefined,
              createdSolution.title
            );
          }

          console.log('✅ 새 솔루션 생성 완료:', createdSolution);
        } else {
          console.log('❌ 새 솔루션 생성 실패 - createSolution이 null 반환');
          alert('솔루션 생성에 실패했습니다. 입력 데이터를 확인하고 다시 시도해주세요.');
          return;
        }
      } catch (error) {
        console.log('❌ 새 솔루션 생성 오류 상세:', {
          error,
          message: error instanceof Error ? error.message : '알 수 없는 오류',
          stack: error instanceof Error ? error.stack : undefined
        });
        alert(`솔루션 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        return;
      }
    }

    console.log('🏁 SolutionTable handleEditSolutionSave 완료');
    handleEditDialogClose();
  };

  // 새 Solution 추가
  const addNewSolution = () => {
    // 바로 편집 팝업 열기
    setEditingSolution(null);
    setEditingSolutionId(null);
    setEditDialog(true);
  };

  // 편집 핸들러 (IT교육관리 스타일)
  const handleEditSolution = (solution: SolutionTableData) => {
    setEditingSolution(solution);
    setEditingSolutionId(solution.id);
    setEditDialog(true);
  };

  // 상태 색상 (파스텔톤 배경, 검정 계열 글자)
  const getStatusColor = (status: SolutionStatus) => {
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
          <Button variant="contained" startIcon={<Add size={16} />} size="small" onClick={addNewSolution} sx={{ px: 2 }}>
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
                  checked={paginatedData.length > 0 && paginatedData.every((solution) => selected.includes(solution.id))}
                  indeterminate={selected.length > 0 && selected.length < paginatedData.length}
                  onChange={handleSelectAllClick}
                  size="small"
                />
              </TableCell>
              <TableCell sx={{ width: columnWidths.no, fontWeight: 600 }}>NO</TableCell>
              <TableCell sx={{ width: columnWidths.registrationDate, fontWeight: 600 }}>등록일</TableCell>
              <TableCell sx={{ width: columnWidths.code, fontWeight: 600 }}>코드</TableCell>
              <TableCell sx={{ width: columnWidths.solutionType, fontWeight: 600 }}>솔루션유형</TableCell>
              <TableCell sx={{ width: columnWidths.developmentType, fontWeight: 600 }}>개발유형</TableCell>
              <TableCell sx={{ width: columnWidths.title, fontWeight: 600 }}>제목</TableCell>
              <TableCell sx={{ width: columnWidths.team, fontWeight: 600 }}>팀</TableCell>
              <TableCell sx={{ width: columnWidths.assignee, fontWeight: 600 }}>담당자</TableCell>
              <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: columnWidths.startDate, fontWeight: 600 }}>시작일</TableCell>
              <TableCell sx={{ width: columnWidths.completedDate, fontWeight: 600 }}>완료일</TableCell>
              <TableCell sx={{ width: columnWidths.action, fontWeight: 600 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((solution, index) => (
                <TableRow
                  key={solution.id}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(solution.id)}
                      onChange={(event) => {
                        const selectedIndex = selected.indexOf(solution.id);
                        let newSelected: number[] = [];

                        if (selectedIndex === -1) {
                          newSelected = newSelected.concat(selected, solution.id);
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
                      {solution.registrationDate}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {solution.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {solution.solutionType}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {solution.developmentType}
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
                      {solution.title || '제목 없음'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                      {solution.team || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        src={getUserProfileImage(solution.assignee)}
                        alt={solution.assignee}
                        sx={{ width: 24, height: 24 }}
                      >
                        {solution.assignee?.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 80, fontSize: '13px' }}>
                        {solution.assignee}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={solution.status}
                      size="small"
                      sx={{
                        ...getStatusColor(solution.status),
                        fontWeight: 500,
                        fontSize: '13px'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {solution.startDate || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {solution.completedDate || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="수정">
                        <IconButton size="small" onClick={() => handleEditSolution(solution)} sx={{ color: 'primary.main' }}>
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

      {/* Solution 편집 다이얼로그 */}
      {editDialog && (
        <SolutionEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          solution={editingSolution}
          onSave={handleEditSolutionSave}
          assignees={assignees}
          assigneeAvatars={assigneeAvatars}
          statusOptions={solutionStatusOptions}
          statusColors={solutionStatusColors}
          teams={teams}
        />
      )}
    </Box>
  );
}
