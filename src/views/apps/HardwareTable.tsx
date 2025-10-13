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
import HardwareEditDialog from 'components/HardwareEditDialog';

// data and types
import { hardwareData, teams, assignees, hardwareStatusOptions, hardwareStatusColors, assigneeAvatars } from 'data/hardware';
import { HardwareTableData, HardwareStatus } from 'types/hardware';
import { useUserManagement } from 'hooks/useUserManagement';

// Icons
import { Add, Trash, Edit, DocumentDownload } from '@wandersonalwes/iconsax-react';

// 컬럼 너비 정의 (하드웨어 관리용)
const columnWidths = {
  checkbox: 50,
  no: 60,
  registrationDate: 100,
  code: 120,
  assetCategory: 120,
  assetName: 200,
  currentUser: 120,
  location: 120,
  assignee: 120,
  status: 90,
  purchaseDate: 100,
  action: 80
};

interface HardwareTableProps {
  selectedYear?: string;
  selectedTeam?: string;
  selectedStatus?: string;
  selectedAssignee?: string;
  tasks?: HardwareTableData[];
  setTasks?: React.Dispatch<React.SetStateAction<HardwareTableData[]>>;
  addChangeLog?: (action: string, target: string, description: string, team?: string, beforeValue?: string, afterValue?: string, changedField?: string) => void;
  deleteMultipleHardware?: (ids: number[]) => Promise<any>;
  onHardwareSave?: (hardware: HardwareTableData) => Promise<void>;
  statusTypes?: any[];
}

export default function HardwareTable({
  selectedYear = '전체',
  selectedTeam = '전체',
  selectedStatus = '전체',
  selectedAssignee = '전체',
  tasks,
  setTasks,
  addChangeLog,
  deleteMultipleHardware,
  onHardwareSave,
  statusTypes = []
}: HardwareTableProps) {
  const theme = useTheme();
  const [data, setData] = useState<HardwareTableData[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState('');

  // 사용자 관리 훅
  const { users, findUserByName } = useUserManagement();

  // Edit 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingHardware, setEditingHardware] = useState<HardwareTableData | null>(null);
  const [editingHardwareId, setEditingHardwareId] = useState<number | null>(null);

  // tasks props가 변경될 때 data 업데이트
  useEffect(() => {
    if (tasks) {
      setData([...tasks]);
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
        자산분류: (task as any).assetCategory || task.department || '분류없음',
        자산명: (task as any).assetName || task.workContent || '자산명 없음',
        사용자: (task as any).currentUser || '-',
        위치: (task as any).location || '-',
        담당자: task.assignee || '-',
        상태: task.status,
        구매일: (task as any).purchaseDate || '-'
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

    try {
      // Supabase 삭제 (soft delete)
      if (deleteMultipleHardware) {
        await deleteMultipleHardware(selected);

        // 삭제될 업무들의 정보를 변경로그에 추가
        if (addChangeLog) {
          const deletedTasks = data.filter((task) => selected.includes(task.id));
          deletedTasks.forEach((task) => {
            addChangeLog('하드웨어 삭제', task.code || `HW-${task.id}`, `${task.assetName || task.workContent || '하드웨어'} 삭제`, task.team || '미분류');
          });
        }
      }

      setSelected([]);
    } catch (error) {
      console.error('❌ 하드웨어 삭제 실패:', error);
    }
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingHardware(null);
    setEditingHardwareId(null);
  };

  // Hardware 저장 (OPL 방식: 이미지는 즉시 저장 지원)
  // OPL 방식: 이미지 필드 변경 시 즉시 DB 저장
  const handleImmediateFieldChange = async (fieldName: string, value: any) => {
    console.log(`🚀 [OPL방식] 즉시 필드 저장:`, { fieldName, value });

    if (!editingHardware || !editingHardware.id) {
      console.log('❌ 편집 중인 하드웨어가 없어서 즉시 저장 불가');
      return;
    }

    try {
      // 이미지 필드만 부분 업데이트
      const partialUpdate = {
        id: editingHardware.id,
        [fieldName]: value
      };

      console.log(`💾 [OPL방식] DB 즉시 저장 시작:`, partialUpdate);

      // 부모 컴포넌트의 저장 함수 호출 (이미지만 업데이트)
      if (onHardwareSave) {
        await onHardwareSave(partialUpdate);
        console.log(`✅ [OPL방식] ${fieldName} 즉시 저장 완료`);

        // 로컬 상태도 즉시 업데이트
        setData(prevData =>
          prevData.map(item =>
            item.id === editingHardware.id
              ? { ...item, [fieldName]: value }
              : item
          )
        );
      }
    } catch (error) {
      console.error(`❌ [OPL방식] ${fieldName} 즉시 저장 실패:`, error);
    }
  };

  const handleEditHardwareSave = async (updatedData: any, isImageOnly?: boolean) => {
    console.log(`💾 [${isImageOnly ? 'OPL-이미지즉시저장' : '일반저장'}] Hardware 저장 요청:`, updatedData);

    // 원래 하드웨어 다이얼로그에서 데이터 변환
    const convertedHardware: HardwareTableData = {
      id: updatedData.id ? parseInt(updatedData.id) : 0,
      no: updatedData.no || 0,
      registrationDate: updatedData.registrationDate || new Date().toISOString().split('T')[0],
      code: updatedData.code || `HW-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      team: updatedData.team || '개발팀',
      department: updatedData.department || 'IT',
      workContent: updatedData.assetName || updatedData.workContent || '',
      status: updatedData.status || '예비',
      assignee: updatedData.registrant || updatedData.assignee || '',
      registrant: updatedData.registrant || '',
      startDate: updatedData.startDate || updatedData.registrationDate || new Date().toISOString().split('T')[0],
      completedDate: updatedData.completedDate || '',
      attachments: updatedData.images || [],
      // 하드웨어 특화 필드
      assetCategory: updatedData.assetCategory,
      assetName: updatedData.assetName,
      assetDescription: updatedData.assetDescription,
      model: updatedData.model,
      manufacturer: updatedData.manufacturer,
      vendor: updatedData.vendor,
      detailSpec: updatedData.detailSpec,
      purchaseDate: updatedData.purchaseDate,
      warrantyEndDate: updatedData.warrantyEndDate,
      serialNumber: updatedData.serialNumber,
      currentUser: updatedData.currentUser,
      location: updatedData.location,
      // 이미지 URL 필드 추가
      image_1_url: updatedData.image_1_url,
      image_2_url: updatedData.image_2_url
    };

    console.log('🔄 변환된 데이터:', convertedHardware);

    try {
      // 변경로그 추가 - 필드별 상세 추적 (개요탭 전체 필드)
      const existingIndex = data.findIndex((hardware) => hardware.id === convertedHardware.id);

      if (existingIndex !== -1 && addChangeLog) {
        // 기존 Hardware 업데이트 - 변경로그 추가
        const originalHardware = data[existingIndex];
        const hardwareCode = convertedHardware.code || `HW-${convertedHardware.id}`;
        const hardwareName = convertedHardware.assetName || convertedHardware.workContent || '하드웨어';

        // 1. 자산분류 변경
        if (originalHardware.assetCategory !== convertedHardware.assetCategory) {
          addChangeLog(
            '수정',
            hardwareCode,
            `하드웨어관리 ${hardwareName}(${hardwareCode}) 정보의 개요탭 자산분류가 ${originalHardware.assetCategory || ''} → ${convertedHardware.assetCategory || ''} 로 수정 되었습니다.`,
            convertedHardware.team || '미분류',
            originalHardware.assetCategory || '',
            convertedHardware.assetCategory || '',
            '자산분류'
          );
        }

        // 2. 자산명 변경
        if (originalHardware.assetName !== convertedHardware.assetName) {
          addChangeLog(
            '수정',
            hardwareCode,
            `하드웨어관리 ${originalHardware.assetName || ''}(${hardwareCode}) 정보의 개요탭 자산명이 ${originalHardware.assetName || ''} → ${convertedHardware.assetName || ''} 로 수정 되었습니다.`,
            convertedHardware.team || '미분류',
            originalHardware.assetName || '',
            convertedHardware.assetName || '',
            '자산명'
          );
        }

        // 3. 모델 변경
        if (originalHardware.model !== convertedHardware.model) {
          addChangeLog(
            '수정',
            hardwareCode,
            `하드웨어관리 ${hardwareName}(${hardwareCode}) 정보의 개요탭 모델이 ${originalHardware.model || ''} → ${convertedHardware.model || ''} 로 수정 되었습니다.`,
            convertedHardware.team || '미분류',
            originalHardware.model || '',
            convertedHardware.model || '',
            '모델'
          );
        }

        // 4. 제조사 변경
        if (originalHardware.manufacturer !== convertedHardware.manufacturer) {
          addChangeLog(
            '수정',
            hardwareCode,
            `하드웨어관리 ${hardwareName}(${hardwareCode}) 정보의 개요탭 제조사가 ${originalHardware.manufacturer || ''} → ${convertedHardware.manufacturer || ''} 로 수정 되었습니다.`,
            convertedHardware.team || '미분류',
            originalHardware.manufacturer || '',
            convertedHardware.manufacturer || '',
            '제조사'
          );
        }

        // 5. 공급업체 변경
        if (originalHardware.vendor !== convertedHardware.vendor) {
          addChangeLog(
            '수정',
            hardwareCode,
            `하드웨어관리 ${hardwareName}(${hardwareCode}) 정보의 개요탭 공급업체가 ${originalHardware.vendor || ''} → ${convertedHardware.vendor || ''} 로 수정 되었습니다.`,
            convertedHardware.team || '미분류',
            originalHardware.vendor || '',
            convertedHardware.vendor || '',
            '공급업체'
          );
        }

        // 6. 상세스펙 변경
        if (originalHardware.detailSpec !== convertedHardware.detailSpec) {
          addChangeLog(
            '수정',
            hardwareCode,
            `하드웨어관리 ${hardwareName}(${hardwareCode}) 정보의 개요탭 상세스펙이 ${originalHardware.detailSpec || ''} → ${convertedHardware.detailSpec || ''} 로 수정 되었습니다.`,
            convertedHardware.team || '미분류',
            originalHardware.detailSpec || '',
            convertedHardware.detailSpec || '',
            '상세스펙'
          );
        }

        // 7. 사용자 변경
        if (originalHardware.currentUser !== convertedHardware.currentUser) {
          addChangeLog(
            '수정',
            hardwareCode,
            `하드웨어관리 ${hardwareName}(${hardwareCode}) 정보의 개요탭 사용자가 ${originalHardware.currentUser || ''} → ${convertedHardware.currentUser || ''} 로 수정 되었습니다.`,
            convertedHardware.team || '미분류',
            originalHardware.currentUser || '',
            convertedHardware.currentUser || '',
            '사용자'
          );
        }

        // 8. 위치 변경
        if (originalHardware.location !== convertedHardware.location) {
          addChangeLog(
            '수정',
            hardwareCode,
            `하드웨어관리 ${hardwareName}(${hardwareCode}) 정보의 개요탭 위치가 ${originalHardware.location || ''} → ${convertedHardware.location || ''} 로 수정 되었습니다.`,
            convertedHardware.team || '미분류',
            originalHardware.location || '',
            convertedHardware.location || '',
            '위치'
          );
        }

        // 9. 담당자 변경
        if (originalHardware.assignee !== convertedHardware.assignee) {
          addChangeLog(
            '수정',
            hardwareCode,
            `하드웨어관리 ${hardwareName}(${hardwareCode}) 정보의 개요탭 담당자가 ${originalHardware.assignee || ''} → ${convertedHardware.assignee || ''} 로 수정 되었습니다.`,
            convertedHardware.team || '미분류',
            originalHardware.assignee || '',
            convertedHardware.assignee || '',
            '담당자'
          );
        }

        // 10. 상태 변경
        if (originalHardware.status !== convertedHardware.status) {
          addChangeLog(
            '수정',
            hardwareCode,
            `하드웨어관리 ${hardwareName}(${hardwareCode}) 정보의 개요탭 상태가 ${originalHardware.status} → ${convertedHardware.status} 로 수정 되었습니다.`,
            convertedHardware.team || '미분류',
            originalHardware.status,
            convertedHardware.status,
            '상태'
          );
        }

        // 11. 구매일 변경
        if (originalHardware.purchaseDate !== convertedHardware.purchaseDate) {
          addChangeLog(
            '수정',
            hardwareCode,
            `하드웨어관리 ${hardwareName}(${hardwareCode}) 정보의 개요탭 구매일이 ${originalHardware.purchaseDate || ''} → ${convertedHardware.purchaseDate || ''} 로 수정 되었습니다.`,
            convertedHardware.team || '미분류',
            originalHardware.purchaseDate || '',
            convertedHardware.purchaseDate || '',
            '구매일'
          );
        }

        // 12. 보증만료일 변경
        if (originalHardware.warrantyEndDate !== convertedHardware.warrantyEndDate) {
          addChangeLog(
            '수정',
            hardwareCode,
            `하드웨어관리 ${hardwareName}(${hardwareCode}) 정보의 개요탭 보증만료일이 ${originalHardware.warrantyEndDate || ''} → ${convertedHardware.warrantyEndDate || ''} 로 수정 되었습니다.`,
            convertedHardware.team || '미분류',
            originalHardware.warrantyEndDate || '',
            convertedHardware.warrantyEndDate || '',
            '보증만료일'
          );
        }

        // 13. 시리얼번호 변경
        if (originalHardware.serialNumber !== convertedHardware.serialNumber) {
          addChangeLog(
            '수정',
            hardwareCode,
            `하드웨어관리 ${hardwareName}(${hardwareCode}) 정보의 개요탭 시리얼번호가 ${originalHardware.serialNumber || ''} → ${convertedHardware.serialNumber || ''} 로 수정 되었습니다.`,
            convertedHardware.team || '미분류',
            originalHardware.serialNumber || '',
            convertedHardware.serialNumber || '',
            '시리얼번호'
          );
        }

        // 14. 팀 변경
        if (originalHardware.team !== convertedHardware.team) {
          addChangeLog(
            '수정',
            hardwareCode,
            `하드웨어관리 ${hardwareName}(${hardwareCode}) 정보의 개요탭 팀이 ${originalHardware.team || ''} → ${convertedHardware.team || ''} 로 수정 되었습니다.`,
            convertedHardware.team || '미분류',
            originalHardware.team || '',
            convertedHardware.team || '',
            '팀'
          );
        }

        // 15. 자산설명 변경
        if (originalHardware.assetDescription !== convertedHardware.assetDescription) {
          addChangeLog(
            '수정',
            hardwareCode,
            `하드웨어관리 ${hardwareName}(${hardwareCode}) 정보의 개요탭 자산설명이 ${originalHardware.assetDescription || ''} → ${convertedHardware.assetDescription || ''} 로 수정 되었습니다.`,
            convertedHardware.team || '미분류',
            originalHardware.assetDescription || '',
            convertedHardware.assetDescription || '',
            '자산설명'
          );
        }
      }

      // 부모 컴포넌트의 저장 함수 호출 (Supabase 연동)
      if (onHardwareSave) {
        await onHardwareSave(convertedHardware);
        console.log('✅ Supabase 저장 완료');
        handleEditDialogClose();
      } else {
        // onHardwareSave가 없으면 로컬 상태만 업데이트
        const updatedDataArray = [...data];
        updatedDataArray[existingIndex] = convertedHardware;
        setData(updatedDataArray);

        // 부모 컴포넌트로 동기화
        if (setTasks) {
          setTasks(updatedDataArray);
        }
        handleEditDialogClose();
      }
    } catch (error) {
      console.error('❌ 하드웨어 저장 실패:', error);
      alert('하드웨어 저장 중 오류가 발생했습니다.');
    }
  };

  // 새 Hardware 추가
  const addNewHardware = () => {
    // 바로 편집 팝업 열기
    setEditingHardware(null);
    setEditingHardwareId(null);
    setEditDialog(true);
  };

  // 편집 핸들러 (IT교육관리 스타일)
  const handleEditHardware = (hardware: HardwareTableData) => {
    console.log('🔧 handleEditHardware 호출:', {
      id: hardware.id,
      team: hardware.team,
      registrant: hardware.registrant,
      assetName: hardware.assetName || hardware.workContent,
      assetDescription: hardware.assetDescription
    });
    setEditingHardware(hardware);
    setEditingHardwareId(hardware.id);
    // 상태 업데이트가 완료된 후 다이얼로그 열기
    setTimeout(() => {
      setEditDialog(true);
    }, 0);
  };

  // 상태 색상 (파스텔톤 배경, 검정 계열 글자)
  const getStatusColor = (status: HardwareStatus) => {
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
          <Button variant="contained" startIcon={<Add size={16} />} size="small" onClick={addNewHardware} sx={{ px: 2 }}>
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
              <TableCell sx={{ width: columnWidths.assetCategory, fontWeight: 600 }}>자산분류</TableCell>
              <TableCell sx={{ width: columnWidths.assetName, fontWeight: 600 }}>자산명</TableCell>
              <TableCell sx={{ width: columnWidths.currentUser, fontWeight: 600 }}>사용자</TableCell>
              <TableCell sx={{ width: columnWidths.location, fontWeight: 600 }}>위치</TableCell>
              <TableCell sx={{ width: columnWidths.assignee, fontWeight: 600 }}>담당자</TableCell>
              <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: columnWidths.purchaseDate, fontWeight: 600 }}>구매일</TableCell>
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
                      {(task as any).assetCategory || task.department || '분류없음'}
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
                      {(task as any).assetName || task.workContent || '자산명 없음'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 80, fontSize: '13px' }}>
                      {(task as any).currentUser || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {(task as any).location || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 80, fontSize: '13px' }}>
                      {task.assignee || '-'}
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
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {(task as any).purchaseDate || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="수정">
                        <IconButton size="small" onClick={() => handleEditHardware(task)} sx={{ color: 'primary.main' }}>
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

      {/* Hardware 편집 다이얼로그 */}
      {editDialog && (
        <HardwareEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          onSave={handleEditHardwareSave}
          onFieldChange={handleImmediateFieldChange}
          data={
            editingHardware
              ? {
                  id: editingHardware.id.toString(),
                  no: editingHardware.no,
                  registrationDate: editingHardware.registrationDate,
                  code: editingHardware.code,
                  team: editingHardware.team || '개발팀',
                  assetCategory: editingHardware.assetCategory || '데스크톱',
                  assetName: editingHardware.assetName || editingHardware.workContent,
                  assetDescription: editingHardware.assetDescription || '',
                  model: editingHardware.model || '',
                  manufacturer: editingHardware.manufacturer || '',
                  vendor: editingHardware.vendor || '',
                  detailSpec: editingHardware.detailSpec || '',
                  status: editingHardware.status,
                  purchaseDate: editingHardware.purchaseDate || '',
                  warrantyEndDate: editingHardware.warrantyEndDate || '',
                  serialNumber: editingHardware.serialNumber || '',
                  currentUser: editingHardware.currentUser || '',
                  location: editingHardware.location || '',
                  assignee: editingHardware.assignee,
                  registrant: editingHardware.registrant || '',
                  image_1_url: editingHardware.image_1_url || '',
                  image_2_url: editingHardware.image_2_url || ''
                }
              : null
          }
          mode={editingHardware ? 'edit' : 'add'}
          statusOptions={statusTypes.length > 0 ? statusTypes.map((s) => s.subcode_name) : hardwareStatusOptions}
          statusColors={hardwareStatusColors}
        />
      )}
    </Box>
  );
}
