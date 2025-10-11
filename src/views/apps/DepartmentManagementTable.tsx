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

// Icons
import { Add, Trash, Edit, DocumentDownload } from '@wandersonalwes/iconsax-react';

// Components
import DepartmentEditDialog from 'components/DepartmentEditDialog';

// Hooks
import { useSupabaseDepartmentManagement, Department } from 'hooks/useSupabaseDepartmentManagement';

// 부서 데이터 타입 정의 (기존 호환성 유지)
interface DepartmentData {
  id: number;
  no: number;
  registrationDate: string;
  code: string;
  departmentName: string;
  departmentDescription: string;
  status: '활성' | '비활성' | '대기';
  lastModifiedDate: string;
  modifier: string;
}

// 컬럼 너비 정의
const columnWidths = {
  checkbox: 50,
  no: 60,
  registrationDate: 100,
  code: 120,
  departmentName: 150,
  departmentDescription: 200,
  status: 90,
  lastModifiedDate: 130,
  modifier: 130,
  action: 80
};

// Props 타입 정의
interface DepartmentManagementTableProps {
  selectedYear?: string;
  selectedTeam?: string;
  selectedStatus?: string;
  selectedAssignee?: string;
  departments?: DepartmentData[];
  setDepartments?: React.Dispatch<React.SetStateAction<DepartmentData[]>>;
  addChangeLog?: (action: string, target: string, description: string, team?: string) => void;
}

// Department을 DepartmentData로 변환하는 함수
const transformDepartment = (department: Department, index: number, totalCount: number): DepartmentData => {
  return {
    id: department.id,
    no: totalCount - index, // 역순 번호 (신규행이 가장 큰 번호)
    registrationDate: department.created_at.split('T')[0],
    code: department.department_code,
    departmentName: department.department_name,
    departmentDescription: department.description || '',
    status: department.is_active ? ('활성' as const) : ('비활성' as const),
    lastModifiedDate: department.updated_at.split('T')[0],
    modifier: department.updated_by
  };
};

// 목업 데이터
const mockDepartmentData: DepartmentData[] = [
  {
    id: 1,
    no: 1,
    registrationDate: '2025-09-01',
    code: 'DEPT-25-001',
    departmentName: '개발팀',
    departmentDescription: '소프트웨어 개발 및 시스템 구축',
    status: '활성',
    lastModifiedDate: '2025-09-07',
    modifier: '김부장'
  },
  {
    id: 2,
    no: 2,
    registrationDate: '2025-09-02',
    code: 'DEPT-25-002',
    departmentName: '디자인팀',
    departmentDescription: 'UI/UX 디자인 및 브랜딩',
    status: '활성',
    lastModifiedDate: '2025-09-06',
    modifier: '박과장'
  },
  {
    id: 3,
    no: 3,
    registrationDate: '2025-09-03',
    code: 'DEPT-25-003',
    departmentName: '기획팀',
    departmentDescription: '프로젝트 기획 및 전략 수립',
    status: '활성',
    lastModifiedDate: '2025-09-05',
    modifier: '이차장'
  },
  {
    id: 4,
    no: 4,
    registrationDate: '2025-09-04',
    code: 'DEPT-25-004',
    departmentName: '마케팅팀',
    departmentDescription: '마케팅 전략 및 홍보 업무',
    status: '활성',
    lastModifiedDate: '2025-09-04',
    modifier: '최팀장'
  },
  {
    id: 5,
    no: 5,
    registrationDate: '2025-09-05',
    code: 'DEPT-25-005',
    departmentName: '인사팀',
    departmentDescription: '인사 관리 및 채용 업무',
    status: '대기',
    lastModifiedDate: '2025-09-07',
    modifier: '홍대리'
  }
];

export default function DepartmentManagementTable({
  selectedYear = '전체',
  selectedTeam = '전체',
  selectedStatus = '전체',
  selectedAssignee = '전체',
  departments,
  setDepartments,
  addChangeLog
}: DepartmentManagementTableProps) {
  const theme = useTheme();

  // Supabase 훅 사용
  const {
    departments: supabaseDepartments,
    loading,
    error,
    clearError,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    toggleDepartmentStatus
  } = useSupabaseDepartmentManagement();

  // 변환된 부서 데이터
  const transformedDepartments = useMemo(() => {
    return supabaseDepartments.map((department, index) => transformDepartment(department, index, supabaseDepartments.length));
  }, [supabaseDepartments]);

  const [data, setData] = useState<DepartmentData[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState('');

  // Edit 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentData | null>(null);

  // Excel 다운로드 기능
  const handleExcelDownload = () => {
    try {
      const excelData = filteredData.map((dept, index) => ({
        NO: index + 1,
        등록일: dept.registrationDate,
        코드: dept.code,
        부서명: dept.departmentName,
        부서설명: dept.departmentDescription,
        상태: dept.status,
        마지막수정일: dept.lastModifiedDate,
        수정자: dept.modifier
      }));

      const csvContent = [
        Object.keys(excelData[0] || {}).join(','),
        ...excelData.map((row) =>
          Object.values(row)
            .map((value) => (typeof value === 'string' && value.includes(',') ? `"${value}"` : value))
            .join(',')
        )
      ].join('\n');

      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `부서관리_${new Date().toISOString().slice(0, 10)}.csv`);
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

  // Supabase 데이터 또는 props 데이터 사용
  useEffect(() => {
    if (departments && departments.length > 0) {
      setData([...departments]);
    } else if (transformedDepartments.length > 0) {
      setData([...transformedDepartments]);
    }
  }, [departments, transformedDepartments]);

  // 에러 처리 (로딩 완료 후에만 에러 표시)
  useEffect(() => {
    if (error && !loading) {
      console.error('부서 데이터 에러:', error);
      // 에러를 일정 시간 후 자동 클리어
      setTimeout(() => {
        clearError();
      }, 5000);
    }
  }, [error, loading, clearError]);

  // 필터링된 데이터 (역순 정렬 추가)
  const filteredData = useMemo(() => {
    const filtered = data.filter((dept) => {
      // 연도 필터
      if (selectedYear !== '전체') {
        const deptYear = new Date(dept.registrationDate).getFullYear().toString();
        if (deptYear !== selectedYear) return false;
      }

      const statusMatch = selectedStatus === '전체' || dept.status === selectedStatus;
      return statusMatch;
    });
    // NO 기준 역순 정렬
    return filtered.sort((a, b) => (b.no || 0) - (a.no || 0));
  }, [data, selectedYear || '전체', selectedStatus]);

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
  }, [selectedYear || '전체', selectedStatus]);

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
      // 선택된 각 부서에 대해 DB에서 삭제
      const deletedDepartments = data.filter((dept) => selected.includes(dept.id));

      for (const dept of deletedDepartments) {
        const success = await deleteDepartment(dept.id.toString());

        if (success && addChangeLog) {
          addChangeLog('부서 삭제', dept.code || `DEPT-${dept.id}`, `${dept.departmentName || '부서'} 삭제`);
        }
      }

      // 선택 상태 초기화
      setSelected([]);
    } catch (error) {
      console.error('부서 삭제 중 오류:', error);
    }
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingDepartment(null);
  };

  // 부서 저장
  const handleEditDepartmentSave = async (updatedDept: DepartmentData) => {
    const existingDept = data.find((dept) => dept.id === updatedDept.id);

    if (existingDept) {
      // 기존 부서 업데이트
      const updateData = {
        id: updatedDept.id,
        department_code: updatedDept.code,
        department_name: updatedDept.departmentName,
        description: updatedDept.departmentDescription,
        manager_name: updatedDept.modifier || '',
        display_order: updatedDept.no || 0
      };

      const success = await updateDepartment(updateData);

      if (success && addChangeLog) {
        addChangeLog('부서 정보 수정', updatedDept.code || `DEPT-${updatedDept.id}`, `${updatedDept.departmentName || '부서'} 정보 수정`);
      }
    } else {
      // 새 부서 추가
      const currentYear = new Date().getFullYear();
      const yearSuffix = currentYear.toString().slice(-2);

      // 더 안전한 부서 코드 생성
      const existingCodes = supabaseDepartments.map((d) => d.department_code).filter((code) => code.startsWith(`DEPT-${yearSuffix}-`));
      const existingNumbers = existingCodes.map((code) => {
        const match = code.match(/DEPT-\d{2}-(\d{3})/);
        return match ? parseInt(match[1]) : 0;
      });
      const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
      const departmentCode = `DEPT-${yearSuffix}-${String(nextNumber).padStart(3, '0')}`;

      const newDepartmentData = {
        department_code: departmentCode,
        department_name: updatedDept.departmentName,
        description: updatedDept.departmentDescription || '',
        manager_name: updatedDept.modifier || '',
        display_order: supabaseDepartments.length + 1
      };

      const success = await createDepartment(newDepartmentData);

      if (success && addChangeLog) {
        addChangeLog('새 부서 생성', departmentCode, `${updatedDept.departmentName || '새 부서'} 생성`);
      }
    }

    handleEditDialogClose();
  };

  // 새 Department 추가
  const addNewDepartment = () => {
    setEditingDepartment(null);
    setEditDialog(true);
  };

  // 편집 핸들러
  const handleEditDepartment = (dept: DepartmentData) => {
    setEditingDepartment(dept);
    setEditDialog(true);
  };

  // 상태 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case '활성':
        return { backgroundColor: '#E8F5E8', color: '#333333' };
      case '비활성':
        return { backgroundColor: '#FFEBEE', color: '#333333' };
      case '대기':
        return { backgroundColor: '#FFF3E0', color: '#333333' };
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
          <Button variant="contained" startIcon={<Add size={16} />} size="small" onClick={addNewDepartment} sx={{ px: 2 }}>
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
                  checked={paginatedData.length > 0 && paginatedData.every((dept) => selected.includes(dept.id))}
                  indeterminate={selected.length > 0 && selected.length < paginatedData.length}
                  onChange={handleSelectAllClick}
                  size="small"
                />
              </TableCell>
              <TableCell sx={{ width: columnWidths.no, fontWeight: 600 }}>NO</TableCell>
              <TableCell sx={{ width: columnWidths.registrationDate, fontWeight: 600 }}>등록일</TableCell>
              <TableCell sx={{ width: columnWidths.code, fontWeight: 600 }}>코드</TableCell>
              <TableCell sx={{ width: columnWidths.departmentName, fontWeight: 600 }}>부서명</TableCell>
              <TableCell sx={{ width: columnWidths.departmentDescription, fontWeight: 600 }}>부서설명</TableCell>
              <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: columnWidths.lastModifiedDate, fontWeight: 600 }}>마지막수정일</TableCell>
              <TableCell sx={{ width: columnWidths.modifier, fontWeight: 600 }}>수정자</TableCell>
              <TableCell sx={{ width: columnWidths.action, fontWeight: 600 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((dept) => (
                <TableRow
                  key={dept.id}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(dept.id)}
                      onChange={(event) => {
                        const selectedIndex = selected.indexOf(dept.id);
                        let newSelected: number[] = [];

                        if (selectedIndex === -1) {
                          newSelected = newSelected.concat(selected, dept.id);
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
                      {dept.no}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {dept.registrationDate}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {dept.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '13px',
                        color: 'text.primary',
                        fontWeight: 500
                      }}
                    >
                      {dept.departmentName}
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
                      {dept.departmentDescription}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={dept.status}
                      size="small"
                      sx={{
                        ...getStatusColor(dept.status),
                        fontWeight: 500,
                        fontSize: '13px'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {dept.lastModifiedDate}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {dept.modifier}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="수정">
                        <IconButton size="small" onClick={() => handleEditDepartment(dept)} sx={{ color: 'primary.main' }}>
                          <Edit size={16} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <LinearProgress sx={{ width: '100%', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    부서 데이터를 불러오는 중...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="error">
                    {error}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
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

        {/* 오른쪽: 페이지 정보와 페이지네이션 */}
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

      {/* 부서 편집 다이얼로그 */}
      {editDialog && (
        <DepartmentEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          department={editingDepartment}
          onSave={handleEditDepartmentSave}
          existingDepartments={data}
        />
      )}
    </Box>
  );
}
