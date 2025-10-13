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
  Checkbox,
  Typography,
  Chip,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Pagination,
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
// project imports
import VOCEditDialog from 'components/VOCEditDialog';

// data and types
import { teams, assignees, vocStatusOptions, vocStatusColors, assigneeAvatars } from 'data/voc';
import { VocData } from 'types/voc';

// hooks
import { useSupabaseVoc } from 'hooks/useSupabaseVoc';
import { useSupabaseMasterCode3 } from 'hooks/useSupabaseMasterCode3';
import { useSupabaseUserManagement } from 'hooks/useSupabaseUserManagement';

// Icons
import { Add, Trash, Edit, DocumentDownload } from '@wandersonalwes/iconsax-react';

// 컬럼 너비 정의 (VOC 테이블 구조)
const columnWidths = {
  checkbox: 50,
  no: 60,
  registrationDate: 100,
  code: 120,
  vocType: 100,
  requester: 100,
  requestContent: 250,
  responseContent: 250,
  priority: 80,
  status: 80,
  resolutionDate: 100,
  assignee: 100,
  action: 80
};

interface VOCDataTableProps {
  selectedYear?: string;
  selectedTeam?: string;
  selectedStatus?: string;
  selectedAssignee?: string;
  vocs?: VocData[];
  setVOCs?: React.Dispatch<React.SetStateAction<VocData[]>>;
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

export default function VOCDataTable({
  selectedYear = '전체',
  selectedTeam = '전체',
  selectedStatus = '전체',
  selectedAssignee = '전체',
  vocs,
  setVOCs,
  addChangeLog
}: VOCDataTableProps) {
  const [data, setData] = useState<VocData[]>(vocs ? vocs : []);
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState('');

  // Supabase VOC 연동
  const { getVocs, createVoc, updateVoc, deleteVoc, convertToVocData, convertToDbVocData, loading, error } = useSupabaseVoc();

  // 마스터코드 연동
  const { getSubCodesByGroup } = useSupabaseMasterCode3();

  // 사용자관리 연동
  const { users } = useSupabaseUserManagement();

  // GROUP023의 VOC유형 목록 가져오기
  const vocTypeOptions = getSubCodesByGroup('GROUP023');

  // 사용자 목록 옵션 생성 (등록자)
  const userOptions = users
    .filter(user => user.is_active && user.status === 'active')
    .map(user => user.user_name);

  // 사용자명으로 사용자 정보를 빠르게 찾기 위한 Map
  const userMap = useMemo(() => {
    const map = new Map();
    users.forEach(user => {
      if (user.is_active && user.status === 'active') {
        map.set(user.user_name, user);
      }
    });
    return map;
  }, [users]);

  // GROUP024의 우선순위 목록 가져오기 (현재 미사용이지만 향후 확장을 위해 유지)
  // const priorityOptions = getSubCodesByGroup('GROUP024');

  // GROUP002의 상태 목록 가져오기 (현재 미사용이지만 향후 확장을 위해 유지)
  // const statusOptionsFromMaster = getSubCodesByGroup('GROUP002');

  // VOC유형별 색상 매핑 함수
  const getVocTypeColor = (vocType: string) => {
    const colors = [
      '#E3F2FD', // 파란색
      '#FFEBEE', // 빨간색
      '#F3E5F5', // 보라색
      '#E8F5E9', // 초록색
      '#FFF3E0', // 주황색
      '#E0F2F1', // 청록색
      '#FFF8E1', // 노란색
      '#FCE4EC'  // 분홍색
    ];

    // VOC유형의 인덱스를 기반으로 색상 선택
    const index = vocTypeOptions.findIndex(option => option.subcode_name === vocType);
    return index >= 0 ? colors[index % colors.length] : '#F5F5F5';
  };

  // 우선순위별 색상 매핑 함수
  const getPriorityColor = (priority: string) => {
    const priorityColors = {
      '긴급': '#FFEBEE', // 빨간색
      '높음': '#FFF3E0', // 주황색
      '보통': '#E8F5E9', // 초록색
      '낮음': '#E3F2FD'  // 파란색
    };

    return priorityColors[priority as keyof typeof priorityColors] || '#F5F5F5';
  };

  // 상태별 색상 매핑 함수
  const getStatusColor = (status: string) => {
    switch (status) {
      case '대기':
        return { backgroundColor: '#F5F5F5', color: '#757575' };
      case '진행':
        return { backgroundColor: '#E3F2FD', color: '#1976D2' };
      case '완료':
        return { backgroundColor: '#E8F5E9', color: '#388E3C' };
      case '홀딩':
      case '홀딩22':
        return { backgroundColor: '#FFEBEE', color: '#D32F2F' };
      case '사용중':
        return { backgroundColor: '#E0F2F1', color: '#00695C' };
      default:
        return { backgroundColor: '#F5F5F5', color: '#757575' };
    }
  };

  // Edit 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingVOC, setEditingVOC] = useState<VocData | null>(null);

  // Excel 다운로드 기능
  const handleExcelDownload = () => {
    try {
      // 필터링된 데이터를 Excel 형식으로 변환 (테이블과 동일한 컬럼 순서)
      const excelData = filteredData.map((voc) => ({
        NO: voc.no,
        등록일: voc.registrationDate,
        코드: `IT-VOC-${new Date(voc.registrationDate).getFullYear().toString().slice(-2)}-${String(voc.no).padStart(3, '0')}`,
        VOC유형: voc.vocType || '미분류',
        요청내용: voc.content || '',
        처리내용: voc.responseContent || '',
        우선순위: voc.priority || '보통',
        상태: voc.status || '대기',
        완료일: voc.resolutionDate || '',
        등록자: voc.assignee || ''
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
      link.setAttribute('download', `VOC관리_${new Date().toISOString().slice(0, 10)}.csv`);
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

  // 컴포넌트 마운트 시 VOC 데이터 로드
  useEffect(() => {
    const loadVocData = async () => {
      console.log('📞 VOC 데이터 로드 시작');
      const dbVocs = await getVocs();
      const vocData = dbVocs.map(convertToVocData);
      setData(vocData);
      if (setVOCs) {
        setVOCs(vocData);
      }
    };

    loadVocData();
  }, [getVocs, convertToVocData, setVOCs]);

  // vocs props가 변경될 때 data 상태 업데이트
  useEffect(() => {
    if (vocs) {
      setData([...vocs]);
    }
  }, [vocs]);

  // 필터링된 데이터 (역순 정렬 추가)
  const filteredData = useMemo(() => {
    const filtered = data.filter((voc) => {
      // 연도 필터
      if (selectedYear !== '전체') {
        const vocYear = new Date(voc.registrationDate).getFullYear().toString();
        if (vocYear !== selectedYear) return false;
      }

      const teamMatch = selectedTeam === '전체' || voc.team === selectedTeam;
      const statusMatch = selectedStatus === '전체' || voc.status === selectedStatus;
      const assigneeMatch = selectedAssignee === '전체' || voc.assignee === selectedAssignee;

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
      const deletedVOCs = data.filter((voc) => selected.includes(voc.id));

      // Supabase에서 삭제 (soft delete)
      for (const voc of deletedVOCs) {
        await deleteVoc(voc.id);
      }

      // 삭제될 VOC들의 정보를 변경로그에 추가
      if (addChangeLog) {
        deletedVOCs.forEach((voc) => {
          const vocCode = `IT-VOC-${new Date(voc.registrationDate).getFullYear().toString().slice(-2)}-${String(voc.no).padStart(3, '0')}`;
          const vocContent = voc.content || 'VOC';
          addChangeLog(
            '삭제',
            vocCode,
            `VOC관리 ${vocContent}(${vocCode})이 삭제되었습니다.`,
            voc.team || '미분류',
            undefined,
            undefined,
            undefined,
            vocContent
          );
        });
      }

      const updatedData = data.filter((voc) => !selected.includes(voc.id));
      setData(updatedData);
      setSelected([]);

      // 부모 컴포넌트로 동기화
      if (setVOCs) {
        setVOCs(updatedData);
      }
    } catch (error) {
      console.error('❌ VOC 삭제 실패:', error);
      alert('VOC 삭제 중 오류가 발생했습니다.');
    }
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingVOC(null);
  };

  // VOC 저장
  const handleEditVOCSave = async (updatedVOC: VocData) => {
    console.log('💾 VOC 저장 요청:', updatedVOC);

    try {
      const existingIndex = data.findIndex((voc) => voc.id === updatedVOC.id);
      console.log('🔍 기존 VOC 인덱스:', existingIndex);

      if (existingIndex !== -1) {
        // 기존 VOC 업데이트
        const originalVOC = data[existingIndex];

        // 변경로그 추가 - DB 저장 전에 실행 (필드별 상세 추적)
        if (addChangeLog) {
          const vocCode = `IT-VOC-${new Date(updatedVOC.registrationDate).getFullYear().toString().slice(-2)}-${String(updatedVOC.no).padStart(3, '0')}`;
          const vocContent = updatedVOC.content || 'VOC';

          // 1. VOC유형 변경
          if (originalVOC.vocType !== updatedVOC.vocType) {
            addChangeLog(
              '수정',
              vocCode,
              `VOC관리 ${vocContent}(${vocCode}) 정보의 개요탭 VOC유형이 ${originalVOC.vocType || ''} → ${updatedVOC.vocType || ''} 로 수정 되었습니다.`,
              updatedVOC.team || '미분류',
              originalVOC.vocType || '',
              updatedVOC.vocType || '',
              'VOC유형',
              vocContent
            );
          }

          // 2. 고객명 변경
          if (originalVOC.customerName !== updatedVOC.customerName) {
            addChangeLog(
              '수정',
              vocCode,
              `VOC관리 ${vocContent}(${vocCode}) 정보의 개요탭 고객명이 ${originalVOC.customerName || ''} → ${updatedVOC.customerName || ''} 로 수정 되었습니다.`,
              updatedVOC.team || '미분류',
              originalVOC.customerName || '',
              updatedVOC.customerName || '',
              '고객명',
              vocContent
            );
          }

          // 3. 회사명 변경
          if (originalVOC.companyName !== updatedVOC.companyName) {
            addChangeLog(
              '수정',
              vocCode,
              `VOC관리 ${vocContent}(${vocCode}) 정보의 개요탭 회사명이 ${originalVOC.companyName || ''} → ${updatedVOC.companyName || ''} 로 수정 되었습니다.`,
              updatedVOC.team || '미분류',
              originalVOC.companyName || '',
              updatedVOC.companyName || '',
              '회사명',
              vocContent
            );
          }

          // 4. 요청내용 변경
          if (originalVOC.content !== updatedVOC.content) {
            addChangeLog(
              '수정',
              vocCode,
              `VOC관리 ${vocContent}(${vocCode}) 정보의 개요탭 요청내용이 ${originalVOC.content || ''} → ${updatedVOC.content || ''} 로 수정 되었습니다.`,
              updatedVOC.team || '미분류',
              originalVOC.content || '',
              updatedVOC.content || '',
              '요청내용',
              vocContent
            );
          }

          // 5. 처리내용 변경
          if (originalVOC.responseContent !== updatedVOC.responseContent) {
            addChangeLog(
              '수정',
              vocCode,
              `VOC관리 ${vocContent}(${vocCode}) 정보의 개요탭 처리내용이 ${originalVOC.responseContent || ''} → ${updatedVOC.responseContent || ''} 로 수정 되었습니다.`,
              updatedVOC.team || '미분류',
              originalVOC.responseContent || '',
              updatedVOC.responseContent || '',
              '처리내용',
              vocContent
            );
          }

          // 6. 우선순위 변경
          if (originalVOC.priority !== updatedVOC.priority) {
            addChangeLog(
              '수정',
              vocCode,
              `VOC관리 ${vocContent}(${vocCode}) 정보의 개요탭 우선순위가 ${originalVOC.priority || ''} → ${updatedVOC.priority || ''} 로 수정 되었습니다.`,
              updatedVOC.team || '미분류',
              originalVOC.priority || '',
              updatedVOC.priority || '',
              '우선순위',
              vocContent
            );
          }

          // 7. 상태 변경
          if (originalVOC.status !== updatedVOC.status) {
            addChangeLog(
              '수정',
              vocCode,
              `VOC관리 ${vocContent}(${vocCode}) 정보의 개요탭 상태가 ${originalVOC.status || ''} → ${updatedVOC.status || ''} 로 수정 되었습니다.`,
              updatedVOC.team || '미분류',
              originalVOC.status || '',
              updatedVOC.status || '',
              '상태',
              vocContent
            );
          }

          // 8. 담당자 변경
          if (originalVOC.assignee !== updatedVOC.assignee) {
            addChangeLog(
              '수정',
              vocCode,
              `VOC관리 ${vocContent}(${vocCode}) 정보의 개요탭 담당자가 ${originalVOC.assignee || ''} → ${updatedVOC.assignee || ''} 로 수정 되었습니다.`,
              updatedVOC.team || '미분류',
              originalVOC.assignee || '',
              updatedVOC.assignee || '',
              '담당자',
              vocContent
            );
          }

          // 9. 팀 변경
          if (originalVOC.team !== updatedVOC.team) {
            addChangeLog(
              '수정',
              vocCode,
              `VOC관리 ${vocContent}(${vocCode}) 정보의 개요탭 팀이 ${originalVOC.team || ''} → ${updatedVOC.team || ''} 로 수정 되었습니다.`,
              updatedVOC.team || '미분류',
              originalVOC.team || '',
              updatedVOC.team || '',
              '팀',
              vocContent
            );
          }

          // 10. 접수일 변경
          if (originalVOC.receptionDate !== updatedVOC.receptionDate) {
            addChangeLog(
              '수정',
              vocCode,
              `VOC관리 ${vocContent}(${vocCode}) 정보의 개요탭 접수일이 ${originalVOC.receptionDate || ''} → ${updatedVOC.receptionDate || ''} 로 수정 되었습니다.`,
              updatedVOC.team || '미분류',
              originalVOC.receptionDate || '',
              updatedVOC.receptionDate || '',
              '접수일',
              vocContent
            );
          }

          // 11. 완료일 변경
          if (originalVOC.resolutionDate !== updatedVOC.resolutionDate) {
            addChangeLog(
              '수정',
              vocCode,
              `VOC관리 ${vocContent}(${vocCode}) 정보의 개요탭 완료일이 ${originalVOC.resolutionDate || ''} → ${updatedVOC.resolutionDate || ''} 로 수정 되었습니다.`,
              updatedVOC.team || '미분류',
              originalVOC.resolutionDate || '',
              updatedVOC.resolutionDate || '',
              '완료일',
              vocContent
            );
          }

          // 12. 채널 변경
          if (originalVOC.channel !== updatedVOC.channel) {
            addChangeLog(
              '수정',
              vocCode,
              `VOC관리 ${vocContent}(${vocCode}) 정보의 개요탭 채널이 ${originalVOC.channel || ''} → ${updatedVOC.channel || ''} 로 수정 되었습니다.`,
              updatedVOC.team || '미분류',
              originalVOC.channel || '',
              updatedVOC.channel || '',
              '채널',
              vocContent
            );
          }
        }

        // DB 업데이트 (변경로그 추가 후)
        const dbVocData = convertToDbVocData(updatedVOC);
        const success = await updateVoc(updatedVOC.id, dbVocData);

        if (success) {
          const updatedData = [...data];
          updatedData[existingIndex] = updatedVOC;
          setData(updatedData);

          // 부모 컴포넌트로 동기화
          if (setVOCs) {
            setVOCs(updatedData);
          }

          console.log('✅ 기존 VOC 업데이트 완료');
        } else {
          throw new Error('VOC 업데이트 실패');
        }
      } else {
        // 새 VOC 추가
        const dbVocData = convertToDbVocData(updatedVOC);
        const createdVOC = await createVoc(dbVocData);

        if (createdVOC) {
          const newVocData = convertToVocData(createdVOC);
          const newData = [newVocData, ...data];
          setData(newData);

          // 부모 컴포넌트로 동기화
          if (setVOCs) {
            setVOCs(newData);
          }

          // 변경로그 추가 - 새 VOC 생성
          if (addChangeLog) {
            const vocCode = `IT-VOC-${new Date(createdVOC.registration_date).getFullYear().toString().slice(-2)}-${String(createdVOC.no).padStart(3, '0')}`;
            const vocContent = newVocData.content || '새 VOC';
            addChangeLog(
              '추가',
              vocCode,
              `VOC관리 ${vocContent}(${vocCode})이 신규 등록되었습니다.`,
              newVocData.team || '미분류',
              undefined,
              undefined,
              undefined,
              vocContent
            );
          }

          console.log('✅ 새 VOC 추가 완료:', newVocData);
        } else {
          throw new Error('VOC 생성 실패');
        }
      }

      handleEditDialogClose();
    } catch (error) {
      console.error('❌ VOC 저장 실패:', error);
      alert('VOC 저장 중 오류가 발생했습니다.');
    }
  };

  // 새 VOC 추가
  const addNewVOC = () => {
    // 바로 편집 팝업 열기
    setEditingVOC(null);
    setEditDialog(true);
  };

  // 편집 핸들러 (IT교육관리 스타일)
  const handleEditVOC = (voc: VocData) => {
    setEditingVOC(voc);
    setEditDialog(true);
  };


  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 로딩 상태 표시 */}
      {loading && (
        <Box sx={{ width: '100%', mb: 1 }}>
          <LinearProgress />
        </Box>
      )}

      {/* 에러 상태 표시 */}
      {error && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" color="error" sx={{ fontSize: '13px' }}>
            {error}
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
          <Button variant="contained" startIcon={<Add size={16} />} size="small" onClick={addNewVOC} sx={{ px: 2 }}>
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
                  checked={paginatedData.length > 0 && paginatedData.every((voc) => selected.includes(voc.id))}
                  indeterminate={selected.length > 0 && selected.length < paginatedData.length}
                  onChange={handleSelectAllClick}
                  size="small"
                />
              </TableCell>
              <TableCell sx={{ width: columnWidths.no, fontWeight: 600 }}>NO</TableCell>
              <TableCell sx={{ width: columnWidths.registrationDate, fontWeight: 600 }}>등록일</TableCell>
              <TableCell sx={{ width: columnWidths.code, fontWeight: 600 }}>코드</TableCell>
              <TableCell sx={{ width: columnWidths.vocType, fontWeight: 600 }}>VOC유형</TableCell>
              <TableCell sx={{ width: columnWidths.requester, fontWeight: 600 }}>요청자</TableCell>
              <TableCell sx={{ width: columnWidths.requestContent, fontWeight: 600 }}>요청내용</TableCell>
              <TableCell sx={{ width: columnWidths.responseContent, fontWeight: 600 }}>처리내용</TableCell>
              <TableCell sx={{ width: columnWidths.priority, fontWeight: 600 }}>우선순위</TableCell>
              <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: columnWidths.resolutionDate, fontWeight: 600 }}>완료일</TableCell>
              <TableCell sx={{ width: columnWidths.assignee, fontWeight: 600 }}>담당자</TableCell>
              <TableCell sx={{ width: columnWidths.action, fontWeight: 600 }}>ACTION</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((voc) => (
                <TableRow
                  key={voc.id}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(voc.id)}
                      onChange={(event) => {
                        const selectedIndex = selected.indexOf(voc.id);
                        let newSelected: number[] = [];

                        if (selectedIndex === -1) {
                          newSelected = newSelected.concat(selected, voc.id);
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
                      {voc.no}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {voc.registrationDate}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary', fontWeight: 500 }}>
                      IT-VOC-{new Date(voc.registrationDate).getFullYear().toString().slice(-2)}-{String(voc.no).padStart(3, '0')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {voc.vocType || '미분류'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {voc.customerName || '-'}
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
                      title={voc.content || ''}
                    >
                      {voc.content || '요청내용 없음'}
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
                      title={voc.responseContent || ''}
                    >
                      {voc.responseContent || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {voc.priority}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={voc.status}
                      size="small"
                      sx={{
                        ...getStatusColor(voc.status),
                        fontWeight: 500,
                        fontSize: '13px'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {voc.resolutionDate || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {voc.assignee ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          src={userMap.get(voc.assignee)?.profile_image_url || userMap.get(voc.assignee)?.avatar_url}
                          sx={{ width: 24, height: 24, fontSize: '12px' }}
                        >
                          {voc.assignee.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                          {voc.assignee}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.secondary' }}>
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="수정">
                        <IconButton size="small" onClick={() => handleEditVOC(voc)} sx={{ color: 'primary.main' }}>
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

      {/* VOC 편집 다이얼로그 */}
      {editDialog && (
        <VOCEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          voc={editingVOC}
          onSave={handleEditVOCSave}
          assignees={assignees}
          assigneeAvatars={assigneeAvatars}
          statusOptions={vocStatusOptions}
          statusColors={vocStatusColors}
          teams={teams}
        />
      )}
    </Box>
  );
}
