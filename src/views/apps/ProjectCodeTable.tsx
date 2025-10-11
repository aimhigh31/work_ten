'use client';

import React, { useState, useMemo } from 'react';

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
  IconButton,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Pagination,
  Stack,
  Switch,
  FormControlLabel,
  Grid,
  Tabs,
  Tab
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Icons
import { Add, Trash, Edit, ArrowUp2, ArrowDown2 } from '@wandersonalwes/iconsax-react';

// Types
interface ProjectCode {
  id: string;
  code: string;
  name: string;
  description: string;
  businessUnit: string;
  startDate: string;
  endDate: string;
  manager: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  subCodes?: SubCode[];
}

interface SubCode {
  id: string;
  sortOrder: number;
  subCode: string;
  selected?: boolean;
}

// ==============================|| 탭 패널 컴포넌트 ||============================== //

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      style={{ flex: 1, overflow: 'hidden' }}
      {...other}
    >
      {value === index && <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>{children}</Box>}
    </div>
  );
}

// ==============================|| 프로젝트코드 데이터 테이블 ||============================== //

interface ProjectCodeTableProps {
  selectedBusinessUnit: string;
  selectedStatus: string;
}

// 컬럼 너비 정의
const codeColumnWidths = {
  checkbox: 50,
  no: 60,
  createdAt: 100,
  code: 120,
  name: 150,
  description: 250,
  status: 90,
  createdBy: 100,
  action: 100
};

export default function ProjectCodeTable({ selectedBusinessUnit, selectedStatus }: ProjectCodeTableProps) {
  const theme = useTheme();
  const [codes, setCodes] = useState<ProjectCode[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedItem, setSelectedItem] = useState<ProjectCode | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState<string>('');

  // 폼 데이터 상태
  const [formData, setFormData] = useState<any>({});

  // 세부분류 관리 상태
  const [subCodes, setSubCodes] = useState<SubCode[]>([]);

  // 탭 상태
  const [tabValue, setTabValue] = useState(0);

  // 에러 상태 관리
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: boolean }>({});

  // 코드 자동생성 함수
  const generateCode = () => {
    const currentYear = new Date().getFullYear();
    const existingCodes = codes.filter((code) => code.code.includes(`PRJ-${currentYear}-`));
    const maxNumber =
      existingCodes.length > 0
        ? Math.max(
            ...existingCodes.map((code) => {
              const match = code.code.match(/PRJ-\d{4}-(\d{3})/);
              return match ? parseInt(match[1]) : 0;
            })
          )
        : 0;
    const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
    return `PRJ-${currentYear}-${nextNumber}`;
  };

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    return codes.filter((code) => {
      const unitMatch = selectedBusinessUnit === '전체' || code.businessUnit === selectedBusinessUnit;
      const statusMatch =
        selectedStatus === '전체' || (selectedStatus === '활성' && code.isActive) || (selectedStatus === '비활성' && !code.isActive);
      return unitMatch && statusMatch;
    });
  }, [codes, selectedBusinessUnit, selectedStatus]);

  // 페이지네이션 적용된 데이터
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  // 총 페이지 수 계산
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // 체크박스 관련 함수들
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = paginatedData.map((row) => row.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const isSelected = (id: string) => selected.indexOf(id) !== -1;

  // 새 항목 추가
  const handleAddItem = () => {
    setDialogMode('add');
    setFormData({
      code: generateCode(),
      name: '',
      description: '',
      businessUnit: selectedBusinessUnit !== '전체' ? selectedBusinessUnit : '전기차배터리',
      startDate: '',
      endDate: '',
      manager: '',
      status: '계획중',
      createdAt: new Date().toISOString().split('T')[0],
      isActive: true
    });
    setSubCodes([]);
    setTabValue(0); // 개요 탭으로 초기화
    setSelectedItem(null);
    setOpenDialog(true);
  };

  // 항목 편집
  const handleEditItem = (item: MasterCode) => {
    setDialogMode('edit');
    setSelectedItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description,
      businessUnit: item.businessUnit,
      startDate: item.startDate,
      endDate: item.endDate,
      manager: item.manager,
      status: item.status,
      createdAt: item.createdAt,
      isActive: item.isActive
    });
    // 기존 세부코드가 있다면 로드, 없으면 빈 배열
    setSubCodes(item.subCodes ? item.subCodes.map((sc) => ({ ...sc, selected: false })) : []);
    setTabValue(0); // 개요 탭으로 초기화
    setOpenDialog(true);
  };

  // 다이얼로그 닫기
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
    setFormData({});
    setSubCodes([]);
    setTabValue(0);
    setFieldErrors({});
  };

  // 세부분류 추가
  const handleAddSubCode = () => {
    // 사용되지 않은 가장 작은 정렬순서 찾기
    const usedSortOrders = subCodes.map((item) => item.sortOrder).sort((a, b) => a - b);
    let nextSortOrder = 1;

    for (let i = 0; i < usedSortOrders.length; i++) {
      if (usedSortOrders[i] === nextSortOrder) {
        nextSortOrder++;
      } else {
        break;
      }
    }

    const newSubCode = {
      id: String(Date.now()),
      sortOrder: nextSortOrder,
      subCode: '',
      selected: false
    };
    setSubCodes((prev) => [...prev, newSubCode]);
  };

  // 세부분류 삭제
  const handleDeleteSubCodes = () => {
    const remainingItems = subCodes.filter((item) => !item.selected);

    // 남은 항목들을 정렬순서에 따라 정렬하고 연속된 번호로 재정렬
    const reorderedItems = remainingItems
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item, index) => ({
        ...item,
        sortOrder: index + 1
      }));

    setSubCodes(reorderedItems);
  };

  // 세부분류 수정
  const handleUpdateSubCode = (id: string, field: string, value: any) => {
    if (field === 'sortOrder') {
      const newSortOrder = parseInt(value);

      if (newSortOrder < 1) {
        // 1보다 작은 경우 기존 값 유지
        return;
      }

      // 중복 확인
      const isDuplicate = subCodes.some((item) => item.id !== id && item.sortOrder === newSortOrder);

      if (isDuplicate) {
        // 중복된 경우 사용되지 않는 다음 번호 자동 할당
        const usedSortOrders = subCodes
          .filter((item) => item.id !== id)
          .map((item) => item.sortOrder)
          .sort((a, b) => a - b);

        let nextAvailable = newSortOrder + 1;
        while (usedSortOrders.includes(nextAvailable)) {
          nextAvailable++;
        }

        setSubCodes((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: nextAvailable } : item)));
        return;
      }
    }

    setSubCodes((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  // 세부분류 선택
  const handleSelectSubCode = (id: string, checked: boolean) => {
    setSubCodes((prev) => prev.map((item) => (item.id === id ? { ...item, selected: checked } : item)));
  };

  // 세부분류 전체 선택
  const handleSelectAllSubCodes = (checked: boolean) => {
    setSubCodes((prev) => prev.map((item) => ({ ...item, selected: checked })));
  };

  // 저장
  const handleSave = () => {
    // 필수 입력값 검증 및 에러 상태 업데이트
    const errors: { [key: string]: boolean } = {};
    let hasError = false;

    if (!formData.name || formData.name.trim() === '') {
      errors.name = true;
      hasError = true;
    }

    if (!formData.description || formData.description.trim() === '') {
      errors.description = true;
      hasError = true;
    }

    setFieldErrors(errors);

    if (hasError) {
      alert('필수 입력 항목을 모두 입력해주세요.');
      return;
    }

    // 세부코드를 정렬순서에 따라 정렬하고 selected 속성 제거
    const cleanedSubCodes = subCodes.map(({ selected, ...rest }) => rest).sort((a, b) => a.sortOrder - b.sortOrder);

    if (dialogMode === 'add') {
      const newCode: ProjectCode = {
        id: String(Math.max(...codes.map((c) => parseInt(c.id)), 0) + 1),
        code: formData.code,
        name: formData.name,
        description: formData.description,
        businessUnit: formData.businessUnit,
        startDate: formData.startDate,
        endDate: formData.endDate,
        manager: formData.manager,
        status: formData.status,
        isActive: formData.isActive,
        createdAt: formData.createdAt,
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        createdBy: '현재사용자',
        subCodes: cleanedSubCodes
      };
      setCodes((prev) => [newCode, ...prev]);
    } else {
      setCodes((prev) =>
        prev.map((code) =>
          code.id === selectedItem?.id
            ? {
                ...code,
                code: formData.code,
                name: formData.name,
                description: formData.description,
                businessUnit: formData.businessUnit,
                startDate: formData.startDate,
                endDate: formData.endDate,
                manager: formData.manager,
                status: formData.status,
                isActive: formData.isActive,
                updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
                subCodes: cleanedSubCodes
              }
            : code
        )
      );
    }
    handleCloseDialog();
  };

  // 선택된 항목 삭제
  const handleDeleteItems = () => {
    setCodes((prev) => prev.filter((code) => !selected.includes(code.id)));
    setSelected([]);
  };

  // 페이지 변경
  const handleChangePage = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage - 1);
  };

  const handleGoToPage = () => {
    const pageNumber = parseInt(goToPage, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setPage(pageNumber - 1);
    }
    setGoToPage('');
  };

  // 상태별 색상 정의
  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? { backgroundColor: '#E8F5E8', color: '#2E7D32' } // 파스텔 그린
      : { backgroundColor: '#FFEBEE', color: '#C62828' }; // 파스텔 레드
  };

  // 상태별 색상 정의
  const getProjectStatusColor = (status: string) => {
    const colors: { [key: string]: { backgroundColor: string; color: string } } = {
      계획중: { backgroundColor: '#FFF3E0', color: '#F57C00' }, // 파스텔 오렌지
      진행중: { backgroundColor: '#E3F2FD', color: '#1976D2' }, // 파스텔 블루
      보류: { backgroundColor: '#F3E5F5', color: '#7B1FA2' }, // 파스텔 퍼플
      완료: { backgroundColor: '#E8F5E8', color: '#2E7D32' }, // 파스텔 그린
      취소: { backgroundColor: '#FFEBEE', color: '#D32F2F' } // 파스텔 레드
    };
    return colors[status] || { backgroundColor: '#F5F5F5', color: '#616161' };
  };

  return (
    <Box>
      {/* 상단 정보 및 액션 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          총 {filteredData.length}건
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" startIcon={<Add size={16} />} size="small" onClick={handleAddItem} sx={{ px: 2 }}>
            추가
          </Button>
          <Button
            variant="outlined"
            startIcon={<Trash size={16} />}
            size="small"
            color="error"
            disabled={selected.length === 0}
            onClick={handleDeleteItems}
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
        component={Paper}
        variant="outlined"
        sx={{
          borderRadius: 2,
          overflowX: 'auto',
          '& .MuiTable-root': {
            minWidth: 1000
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
              <TableCell padding="checkbox" sx={{ width: codeColumnWidths.checkbox }}>
                <Checkbox
                  checked={paginatedData.length > 0 && paginatedData.every((item) => selected.includes(item.id))}
                  indeterminate={selected.length > 0 && selected.length < paginatedData.length}
                  onChange={handleSelectAllClick}
                />
              </TableCell>
              <TableCell sx={{ width: codeColumnWidths.no, fontWeight: 600 }}>NO</TableCell>
              <TableCell sx={{ width: codeColumnWidths.createdAt, fontWeight: 600 }}>등록일</TableCell>
              <TableCell sx={{ width: codeColumnWidths.code, fontWeight: 600 }}>CODE</TableCell>
              <TableCell sx={{ width: codeColumnWidths.name, fontWeight: 600 }}>프로젝트명</TableCell>
              <TableCell sx={{ width: codeColumnWidths.description, fontWeight: 600 }}>설명</TableCell>
              <TableCell sx={{ width: codeColumnWidths.status, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: codeColumnWidths.createdBy, fontWeight: 600 }}>등록자</TableCell>
              <TableCell sx={{ width: codeColumnWidths.action, fontWeight: 600 }}>ACTION</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <TableRow
                  key={item.id}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(item.id)}
                      onChange={(event) => {
                        const selectedIndex = selected.indexOf(item.id);
                        let newSelected: string[] = [];

                        if (selectedIndex === -1) {
                          newSelected = newSelected.concat(selected, item.id);
                        } else if (selectedIndex === 0) {
                          newSelected = newSelected.concat(selected.slice(1));
                        } else if (selectedIndex === selected.length - 1) {
                          newSelected = newSelected.concat(selected.slice(0, -1));
                        } else if (selectedIndex > 0) {
                          newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
                        }
                        setSelected(newSelected);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                      {filteredData.length - (page * rowsPerPage + index)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                      {item.createdAt}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary', fontWeight: 500 }}>
                      {item.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                      {item.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '12px',
                        color: 'text.secondary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 200
                      }}
                    >
                      {item.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.status || '-'}
                      size="small"
                      sx={{
                        fontSize: '12px',
                        fontWeight: 500,
                        ...getProjectStatusColor(item.status)
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                      {item.createdBy}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="편집">
                      <IconButton size="small" onClick={() => handleEditItem(item)} color="primary" sx={{ p: 0.5 }}>
                        <Edit size={16} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
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
          mt: 2,
          px: 2,
          py: 1,
          borderTop: '1px solid',
          borderColor: 'divider'
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

      {/* 추가/편집 다이얼로그 */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            minHeight: '600px',
            height: '80vh'
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{dialogMode === 'add' ? '새 프로젝트 추가' : '프로젝트 편집'}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={handleCloseDialog} variant="outlined" size="small">
                취소
              </Button>
              <Button
                onClick={handleSave}
                variant="contained"
                size="small"
                disabled={!formData.name?.trim() || !formData.description?.trim()}
              >
                {dialogMode === 'add' ? '추가' : '저장'}
              </Button>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          {/* 탭 헤더 */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(event, newValue) => setTabValue(newValue)} sx={{ px: 3 }}>
              <Tab label="개요" />
              <Tab label="세부코드" />
            </Tabs>
          </Box>

          {/* 개요 탭 */}
          <CustomTabPanel value={tabValue} index={0}>
            <Grid container spacing={2}>
              {/* 등록일-CODE */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  등록일
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  value={formData.createdAt || ''}
                  disabled // 편집 불가
                  sx={{
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  CODE *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={formData.code || ''}
                  disabled // 자동생성되므로 편집 불가
                  sx={{
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)'
                    }
                  }}
                />
              </Grid>

              {/* 마스터코드 */}
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  프로젝트명 *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={formData.name || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (fieldErrors.name && e.target.value.trim() !== '') {
                      setFieldErrors((prev) => ({ ...prev, name: false }));
                    }
                  }}
                  placeholder="프로젝트명을 입력하세요"
                  required
                  error={fieldErrors.name || false}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: fieldErrors.name ? '#d32f2f' : undefined,
                        borderWidth: fieldErrors.name ? '2px' : '1px'
                      }
                    }
                  }}
                />
              </Grid>

              {/* 코드설명 */}
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  프로젝트 설명 *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (fieldErrors.description && e.target.value.trim() !== '') {
                      setFieldErrors((prev) => ({ ...prev, description: false }));
                    }
                  }}
                  placeholder="프로젝트 설명을 입력하세요"
                  required
                  error={fieldErrors.description || false}
                />
              </Grid>

              {/* 사업부 */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  사업부 *
                </Typography>
                <Select
                  fullWidth
                  size="small"
                  value={formData.businessUnit || ''}
                  onChange={(e) => setFormData({ ...formData, businessUnit: e.target.value })}
                >
                  <MenuItem value="전기차배터리">전기차배터리</MenuItem>
                  <MenuItem value="수소연료전지">수소연료전지</MenuItem>
                  <MenuItem value="폴더블">폴더블</MenuItem>
                  <MenuItem value="기타">기타</MenuItem>
                </Select>
              </Grid>

              {/* 상태 */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  상태 *
                </Typography>
                <Select
                  fullWidth
                  size="small"
                  value={formData.status || ''}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="계획중">계획중</MenuItem>
                  <MenuItem value="진행중">진행중</MenuItem>
                  <MenuItem value="보류">보류</MenuItem>
                  <MenuItem value="완료">완료</MenuItem>
                  <MenuItem value="취소">취소</MenuItem>
                </Select>
              </Grid>

              {/* 시작일 */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  시작일
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </Grid>

              {/* 종료일 */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  종료일
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </Grid>

              {/* 담당자 */}
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  담당자
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={formData.manager || ''}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  placeholder="담당자명을 입력하세요"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive || false}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                  }
                  label="활성 상태"
                />
              </Grid>
            </Grid>
          </CustomTabPanel>

          {/* 세부코드 탭 */}
          <CustomTabPanel value={tabValue} index={1}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  세부분류 관리
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" size="small" startIcon={<Add size={16} />} onClick={handleAddSubCode}>
                    추가
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    startIcon={<Trash size={16} />}
                    disabled={!subCodes.some((item) => item.selected)}
                    onClick={handleDeleteSubCodes}
                  >
                    삭제
                  </Button>
                </Box>
              </Box>

              {/* 세부분류 테이블 */}
              <TableContainer component={Paper} variant="outlined" sx={{ height: '300px', overflow: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell padding="checkbox" sx={{ width: 50 }}>
                        <Checkbox
                          checked={subCodes.length > 0 && subCodes.every((item) => item.selected)}
                          indeterminate={subCodes.some((item) => item.selected) && !subCodes.every((item) => item.selected)}
                          onChange={(e) => handleSelectAllSubCodes(e.target.checked)}
                        />
                      </TableCell>
                      <TableCell sx={{ width: 120, fontWeight: 600 }}>정렬순서</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>세부코드</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {subCodes.length > 0 ? (
                      subCodes
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((subItem) => (
                          <TableRow key={subItem.id}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={subItem.selected || false}
                                onChange={(e) => handleSelectSubCode(subItem.id, e.target.checked)}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={subItem.sortOrder}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (!isNaN(value) && value >= 1) {
                                    handleUpdateSubCode(subItem.id, 'sortOrder', value);
                                  }
                                }}
                                inputProps={{ min: 1, step: 1 }}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                fullWidth
                                size="small"
                                value={subItem.subCode}
                                onChange={(e) => handleUpdateSubCode(subItem.id, 'subCode', e.target.value)}
                                placeholder="세부코드를 입력하세요"
                              />
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            세부분류가 없습니다. 추가 버튼을 클릭하여 세부분류를 추가하세요.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </CustomTabPanel>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
