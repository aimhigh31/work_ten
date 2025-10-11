// ProjectCodeDataTable.tsx

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
  Button,
  TextField,
  Select,
  MenuItem,
  Typography,
  Pagination,
  IconButton,
  Chip,
  FormControl,
  Avatar,
  Tooltip,
  Tabs,
  Tab,
  Grid,
  Stack,
  Card,
  CardContent
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Icons
import { Add, Minus, Edit, SearchNormal1, Calendar, User } from '@wandersonalwes/iconsax-react';

// Types
interface ProjectCodeRecord {
  id: number;
  registrationDate: string;
  code: string;
  projectName: string;
  businessUnit: string;
  status: string;
  startDate: string;
  endDate: string;
  manager: string;
  description: string;
  isNew?: boolean;
}

interface ChangeLog {
  id: number;
  date: string;
  user: string;
  action: string;
  field: string;
  oldValue: string;
  newValue: string;
  projectCode: string;
}

const ProjectCodeDataTable: React.FC = () => {
  const theme = useTheme();

  // 기본 데이터
  const initialData: ProjectCodeRecord[] = [
    {
      id: 1,
      registrationDate: '2024-08-05',
      code: 'PRJ-2024-001',
      projectName: '전기차 배터리 관리 시스템',
      businessUnit: '전기차배터리',
      status: '진행중',
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      manager: '김프로젝트',
      description: '전기차 배터리 생산 및 관리를 위한 통합 시스템 구축'
    },
    {
      id: 2,
      registrationDate: '2024-08-04',
      code: 'PRJ-2024-002',
      projectName: '수소연료전지 효율 개선',
      businessUnit: '수소연료전지',
      status: '계획중',
      startDate: '2024-09-01',
      endDate: '2025-03-31',
      manager: '이연구원',
      description: '수소연료전지의 효율성 향상을 위한 R&D 프로젝트'
    },
    {
      id: 3,
      registrationDate: '2024-08-03',
      code: 'PRJ-2024-003',
      projectName: '폴더블 디스플레이 기술',
      businessUnit: '폴더블',
      status: '완료',
      startDate: '2024-03-01',
      endDate: '2024-07-30',
      manager: '박개발자',
      description: '차세대 폴더블 디스플레이 기술 개발 및 상용화'
    }
  ];

  // 변경 로그 데이터
  const changeLogData: ChangeLog[] = [
    {
      id: 1,
      date: '2024-08-05 14:30',
      user: '김관리자',
      action: '수정',
      field: '프로젝트명',
      oldValue: '전기차 배터리 시스템',
      newValue: '전기차 배터리 관리 시스템',
      projectCode: 'PRJ-2024-001'
    },
    {
      id: 2,
      date: '2024-08-05 10:15',
      user: '이관리자',
      action: '생성',
      field: '전체',
      oldValue: '-',
      newValue: 'PRJ-2024-002 생성',
      projectCode: 'PRJ-2024-002'
    },
    {
      id: 3,
      date: '2024-08-04 16:45',
      user: '박관리자',
      action: '상태변경',
      field: '상태',
      oldValue: '진행중',
      newValue: '완료',
      projectCode: 'PRJ-2024-003'
    }
  ];

  // 상태
  const [records, setRecords] = useState<ProjectCodeRecord[]>(initialData);
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [goToPage, setGoToPage] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // 옵션들
  const businessUnitOptions = ['전기차배터리', '수소연료전지', '폴더블', '기타'];
  const statusOptions = ['계획중', '진행중', '보류', '완료', '취소'];

  // 컬럼 너비 정의
  const columnWidths = {
    checkbox: 50,
    no: 60,
    registrationDate: 120,
    code: 150,
    projectName: 200,
    businessUnit: 150,
    status: 100,
    startDate: 120,
    endDate: 120,
    manager: 120,
    action: 80
  };

  // 필터링된 레코드
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesSearch =
        searchTerm === '' ||
        record.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.manager.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [records, searchTerm]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
  const paginatedRecords = filteredRecords.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case '완료':
        return { bgcolor: '#E8F5E8', color: '#2E7D32' };
      case '진행중':
        return { bgcolor: '#E3F2FD', color: '#1976D2' };
      case '계획중':
        return { bgcolor: '#FFF3E0', color: '#F57C00' };
      case '보류':
        return { bgcolor: '#F3E5F5', color: '#7B1FA2' };
      case '취소':
        return { bgcolor: '#FFEBEE', color: '#D32F2F' };
      default:
        return { bgcolor: '#F5F5F5', color: '#757575' };
    }
  };

  // 액션별 색상
  const getActionColor = (action: string) => {
    switch (action) {
      case '생성':
        return { bgcolor: '#E8F5E8', color: '#2E7D32' };
      case '수정':
        return { bgcolor: '#E3F2FD', color: '#1976D2' };
      case '삭제':
        return { bgcolor: '#FFEBEE', color: '#D32F2F' };
      case '상태변경':
        return { bgcolor: '#FFF3E0', color: '#F57C00' };
      default:
        return { bgcolor: '#F5F5F5', color: '#757575' };
    }
  };

  // 코드 생성
  const generateCode = () => {
    const currentYear = new Date().getFullYear();
    const lastRecord = records[records.length - 1];
    const lastNumber = lastRecord ? parseInt(lastRecord.code.split('-')[2]) : 0;
    return `PRJ-${currentYear}-${String(lastNumber + 1).padStart(3, '0')}`;
  };

  // 등록일 생성
  const generateRegistrationDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // 새 행 추가
  const handleAddRecord = () => {
    const newRecord: ProjectCodeRecord = {
      id: Date.now(),
      registrationDate: generateRegistrationDate(),
      code: generateCode(),
      projectName: '',
      businessUnit: '',
      status: '계획중',
      startDate: '',
      endDate: '',
      manager: '',
      description: '',
      isNew: true
    };
    setRecords((prev) => [newRecord, ...prev]);
  };

  // 선택된 행 삭제
  const handleDeleteRecords = () => {
    if (window.confirm(`선택된 ${selectedRecords.length}개 항목을 삭제하시겠습니까?`)) {
      setRecords((prev) => prev.filter((record) => !selectedRecords.includes(record.id)));
      setSelectedRecords([]);
    }
  };

  // 전체 선택
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedRecords(paginatedRecords.map((record) => record.id));
    } else {
      setSelectedRecords([]);
    }
  };

  // 개별 선택
  const handleSelectRecord = (recordId: number) => {
    setSelectedRecords((prev) => (prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]));
  };

  // 페이지 변경
  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage - 1);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 탭 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="프로젝트 코드 관리" />
          <Tab label="변경 로그" />
        </Tabs>
      </Box>

      {/* 프로젝트 코드 관리 탭 */}
      {tabValue === 0 && (
        <>
          {/* 검색 */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="프로젝트명, 코드, 담당자 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchNormal1 size={20} style={{ marginRight: 8, color: '#666' }} />
              }}
              sx={{ minWidth: 300 }}
            />
          </Box>

          {/* 액션 버튼 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              총 {filteredRecords.length}건
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" startIcon={<Add size={16} />} size="small" onClick={handleAddRecord} sx={{ px: 2 }}>
                추가
              </Button>
              <Button
                variant="outlined"
                startIcon={<Minus size={16} />}
                size="small"
                color="error"
                disabled={selectedRecords.length === 0}
                onClick={handleDeleteRecords}
                sx={{ px: 2 }}
              >
                삭제
              </Button>
            </Box>
          </Box>

          {/* 테이블 */}
          <TableContainer
            component={Paper}
            sx={{
              mb: 3,
              overflowX: 'auto',
              '& .MuiTable-root': {
                minWidth: 1400
              },
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
                      indeterminate={selectedRecords.length > 0 && selectedRecords.length < paginatedRecords.length}
                      checked={paginatedRecords.length > 0 && selectedRecords.length === paginatedRecords.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell sx={{ width: columnWidths.no, fontWeight: 600 }}>NO</TableCell>
                  <TableCell sx={{ width: columnWidths.registrationDate, fontWeight: 600 }}>등록일</TableCell>
                  <TableCell sx={{ width: columnWidths.code, fontWeight: 600 }}>프로젝트코드</TableCell>
                  <TableCell sx={{ width: columnWidths.projectName, fontWeight: 600 }}>프로젝트명</TableCell>
                  <TableCell sx={{ width: columnWidths.businessUnit, fontWeight: 600 }}>사업부</TableCell>
                  <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
                  <TableCell sx={{ width: columnWidths.startDate, fontWeight: 600 }}>시작일</TableCell>
                  <TableCell sx={{ width: columnWidths.endDate, fontWeight: 600 }}>종료일</TableCell>
                  <TableCell sx={{ width: columnWidths.manager, fontWeight: 600 }}>담당자</TableCell>
                  <TableCell sx={{ width: columnWidths.action, fontWeight: 600 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRecords.map((record, index) => (
                  <TableRow
                    key={record.id}
                    hover
                    sx={{
                      '&:hover': { backgroundColor: 'action.hover' },
                      backgroundColor: record.isNew ? 'action.selected' : 'inherit'
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox checked={selectedRecords.includes(record.id)} onChange={() => handleSelectRecord(record.id)} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                        {filteredRecords.length - (page * rowsPerPage + index)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary', whiteSpace: 'nowrap' }}>
                        {record.registrationDate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary', whiteSpace: 'nowrap' }}>
                        {record.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '12px',
                          color: 'text.primary',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '200px'
                        }}
                      >
                        {record.projectName || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                        {record.businessUnit || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={record.status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(record.status).bgcolor,
                          color: getStatusColor(record.status).color,
                          fontSize: '12px'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary', whiteSpace: 'nowrap' }}>
                        {record.startDate || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary', whiteSpace: 'nowrap' }}>
                        {record.endDate || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                        {record.manager || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="편집">
                        <IconButton size="small" onClick={() => {}} sx={{ color: 'text.secondary' }}>
                          <Edit size={16} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
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
                      py: '4px'
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

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Go to
                </Typography>
                <TextField
                  size="small"
                  placeholder="페이지"
                  value={goToPage}
                  onChange={(e) => setGoToPage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const pageNumber = parseInt(goToPage, 10);
                      if (pageNumber >= 1 && pageNumber <= totalPages) {
                        setPage(pageNumber - 1);
                      }
                      setGoToPage('');
                    }
                  }}
                  sx={{
                    width: 60,
                    '& .MuiOutlinedInput-input': {
                      textAlign: 'center',
                      py: '4px'
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: '1px solid #e0e0e0'
                    }
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {filteredRecords.length > 0
                  ? `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, filteredRecords.length)} of ${filteredRecords.length}`
                  : '0-0 of 0'}
              </Typography>
              {totalPages > 0 && (
                <Pagination
                  count={totalPages}
                  page={page + 1}
                  onChange={handlePageChange}
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
        </>
      )}

      {/* 변경 로그 탭 */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calendar size={20} />
              변경 로그
            </Typography>

            <Stack spacing={2}>
              {changeLogData.map((log) => (
                <Paper key={log.id} variant="outlined" sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip
                        label={log.action}
                        size="small"
                        sx={{
                          backgroundColor: getActionColor(log.action).bgcolor,
                          color: getActionColor(log.action).color,
                          fontSize: '12px',
                          fontWeight: 500
                        }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {log.projectCode}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {log.date}
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          <User size={14} />
                        </Avatar>
                        <Typography variant="body2" color="text.secondary">
                          {log.user}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {log.field}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        <del>{log.oldValue}</del>
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 500 }}>
                        {log.newValue}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ProjectCodeDataTable;
