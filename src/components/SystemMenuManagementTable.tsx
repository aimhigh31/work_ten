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
import MenuEditDialog from 'components/MenuEditDialog';

// 메뉴 데이터 타입 정의
interface MenuData {
  id: number;
  no: number;
  registrationDate: string;
  code: string;
  menu: string;
  description: string;
  userCount: number;
  permissionCount: number;
  status: '활성' | '비활성' | '대기';
  registeredBy: string;
  lastModifiedDate: string;
  lastModifiedBy: string;
}

// 컬럼 너비 정의 (TaskTable과 동일한 방식)
const columnWidths = {
  checkbox: 50,
  no: 60,
  registrationDate: 100,
  code: 120,
  menu: 150,
  description: 200,
  status: 90,
  registeredBy: 130,
  action: 80
};

// Props 타입 정의
interface SystemMenuManagementTableProps {
  selectedYear?: string;
  selectedTeam?: string;
  selectedStatus?: string;
  selectedAssignee?: string;
  menus?: MenuData[];
  setMenus?: React.Dispatch<React.SetStateAction<MenuData[]>>;
  addChangeLog?: (action: string, target: string, description: string, team?: string) => void;
}

// 목업 데이터
const mockMenuData: MenuData[] = [
  {
    id: 1,
    no: 1,
    registrationDate: '2025-09-01',
    code: 'MENU-25-001',
    menu: '관리자메뉴',
    description: '시스템 관리자 메뉴',
    userCount: 5,
    permissionCount: 3,
    status: '활성',
    registeredBy: '김관리자',
    lastModifiedDate: '2025-09-07',
    lastModifiedBy: '김관리자'
  },
  {
    id: 2,
    no: 2,
    registrationDate: '2025-09-02',
    code: 'MENU-25-002',
    menu: '시스템설정',
    description: '시스템 기본 설정 관리',
    userCount: 3,
    permissionCount: 5,
    status: '활성',
    registeredBy: '이설정',
    lastModifiedDate: '2025-09-08',
    lastModifiedBy: '이설정'
  },
  {
    id: 3,
    no: 3,
    registrationDate: '2025-09-03',
    code: 'MENU-25-003',
    menu: '사용자관리',
    description: '사용자 계정 관리',
    userCount: 2,
    permissionCount: 4,
    status: '활성',
    registeredBy: '박사용자',
    lastModifiedDate: '2025-09-09',
    lastModifiedBy: '박사용자'
  },
  {
    id: 4,
    no: 4,
    registrationDate: '2025-09-04',
    code: 'MENU-25-004',
    menu: '메인메뉴',
    description: '메인 대시보드',
    userCount: 10,
    permissionCount: 2,
    status: '활성',
    registeredBy: '최메인',
    lastModifiedDate: '2025-09-10',
    lastModifiedBy: '최메인'
  },
  {
    id: 5,
    no: 5,
    registrationDate: '2025-09-05',
    code: 'MENU-25-005',
    menu: '대시보드',
    description: '현황 대시보드',
    userCount: 8,
    permissionCount: 3,
    status: '활성',
    registeredBy: '정대시',
    lastModifiedDate: '2025-09-11',
    lastModifiedBy: '정대시'
  },
  {
    id: 6,
    no: 6,
    registrationDate: '2025-09-06',
    code: 'MENU-25-006',
    menu: '기획메뉴',
    description: '기획 업무 관리',
    userCount: 4,
    permissionCount: 6,
    status: '활성',
    registeredBy: '김기획',
    lastModifiedDate: '2025-09-12',
    lastModifiedBy: '김기획'
  },
  {
    id: 7,
    no: 7,
    registrationDate: '2025-09-07',
    code: 'MENU-25-007',
    menu: '비용관리',
    description: '프로젝트 비용 관리',
    userCount: 6,
    permissionCount: 8,
    status: '활성',
    registeredBy: '이비용',
    lastModifiedDate: '2025-09-13',
    lastModifiedBy: '이비용'
  }
];

export default function SystemMenuManagementTable({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  menus: propMenus,
  setMenus: propSetMenus,
  addChangeLog
}: SystemMenuManagementTableProps) {
  const theme = useTheme();
  const [menus, setMenus] = useState<MenuData[]>(propMenus || mockMenuData);
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentMenu, setCurrentMenu] = useState<MenuData | null>(null);
  const [searchText, setSearchText] = useState('');

  // Props 변경시 내부 상태 업데이트
  useEffect(() => {
    if (propMenus) {
      setMenus(propMenus);
    }
  }, [propMenus]);

  // 메뉴 변경시 부모 컴포넌트 업데이트
  useEffect(() => {
    if (propSetMenus && menus !== propMenus) {
      propSetMenus(menus);
    }
  }, [menus, propSetMenus, propMenus]);

  // 필터링 및 검색 로직
  const filteredData = useMemo(() => {
    return menus.filter((menu) => {
      // 상태 필터
      if (selectedStatus && selectedStatus !== 'all' && menu.status !== selectedStatus) {
        return false;
      }

      // 담당자 필터
      if (selectedAssignee && selectedAssignee !== 'all' && menu.registeredBy !== selectedAssignee) {
        return false;
      }

      // 검색 텍스트 필터
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        return (
          menu.menu.toLowerCase().includes(searchLower) ||
          menu.description.toLowerCase().includes(searchLower) ||
          menu.code.toLowerCase().includes(searchLower) ||
          menu.registeredBy.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [menus, selectedStatus, selectedAssignee, searchText]);

  // 페이지네이션 계산
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // 전체 선택 핸들러
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = paginatedData.map((n) => n.id);
      setSelected(newSelected);
    } else {
      setSelected([]);
    }
  };

  // 개별 선택 핸들러
  const handleSelectRow = (event: React.ChangeEvent<HTMLInputElement>, id: number) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }

    setSelected(newSelected);
  };

  // 선택 상태 확인
  const isSelected = (id: number) => selected.indexOf(id) !== -1;
  const numSelected = selected.length;
  const rowCount = paginatedData.length;

  // 페이지 변경 핸들러
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    setSelected([]);
  };

  // 페이지당 행 수 변경 핸들러
  const handleRowsPerPageChange = (event: SelectChangeEvent<number>) => {
    setRowsPerPage(parseInt(event.target.value as string, 10));
    setPage(1);
    setSelected([]);
  };

  // 상태 칩 스타일
  const getStatusChip = (status: '활성' | '비활성' | '대기') => {
    const colors = {
      활성: { bg: '#e8f5e9', color: '#2e7d32' },
      비활성: { bg: '#ffebee', color: '#d32f2f' },
      대기: { bg: '#fff3e0', color: '#ed6c02' }
    };

    const style = colors[status] || colors['대기'];

    return (
      <Chip
        label={status}
        size="small"
        sx={{
          backgroundColor: style.bg,
          color: style.color,
          fontWeight: 500,
          fontSize: '12px',
          height: '24px',
          '& .MuiChip-label': {
            px: 1
          }
        }}
      />
    );
  };

  // 편집 다이얼로그 열기
  const handleEditClick = (menu: MenuData) => {
    setCurrentMenu(menu);
    setEditDialogOpen(true);
  };

  // 새 메뉴 추가
  const handleAddClick = () => {
    const newMenu: MenuData = {
      id: Date.now(),
      no: menus.length + 1,
      registrationDate: new Date().toISOString().split('T')[0],
      code: `MENU-${new Date().getFullYear().toString().slice(-2)}-${String(menus.length + 1).padStart(3, '0')}`,
      menu: '',
      description: '',
      userCount: 0,
      permissionCount: 0,
      status: '활성',
      registeredBy: '현재사용자',
      lastModifiedDate: new Date().toISOString().split('T')[0],
      lastModifiedBy: '현재사용자'
    };
    setCurrentMenu(newMenu);
    setEditDialogOpen(true);
  };

  // 메뉴 저장
  const handleSaveMenu = (updatedMenu: MenuData) => {
    const menuIndex = menus.findIndex((m) => m.id === updatedMenu.id);

    if (menuIndex >= 0) {
      // 기존 메뉴 수정
      const updatedMenus = [...menus];
      updatedMenus[menuIndex] = {
        ...updatedMenu,
        lastModifiedDate: new Date().toISOString().split('T')[0],
        lastModifiedBy: '현재사용자'
      };
      setMenus(updatedMenus);

      // 변경 로그 추가
      if (addChangeLog) {
        addChangeLog('수정', `메뉴: ${updatedMenu.menu}`, `메뉴 정보가 수정되었습니다.`);
      }
    } else {
      // 새 메뉴 추가
      setMenus([...menus, updatedMenu]);

      // 변경 로그 추가
      if (addChangeLog) {
        addChangeLog('추가', `메뉴: ${updatedMenu.menu}`, `새 메뉴가 추가되었습니다.`);
      }
    }

    setEditDialogOpen(false);
    setCurrentMenu(null);
  };

  // 선택된 메뉴 삭제
  const handleDeleteSelected = () => {
    const remainingMenus = menus.filter((menu) => !selected.includes(menu.id));
    setMenus(remainingMenus);
    setSelected([]);

    // 변경 로그 추가
    if (addChangeLog) {
      addChangeLog('삭제', `${selected.length}개 메뉴`, `선택된 메뉴가 삭제되었습니다.`);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, mt: 3, flexShrink: 0 }}>
        <Typography variant="body2" color="text.secondary">
          총 {filteredData.length}건
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<DocumentDownload size={16} />} size="small">
            Excel Down
          </Button>
          <Button variant="contained" startIcon={<Add size={16} />} size="small" onClick={handleAddClick}>
            추가
          </Button>
          <Button
            variant="outlined"
            startIcon={<Trash size={16} />}
            size="small"
            color="error"
            disabled={numSelected === 0}
            onClick={handleDeleteSelected}
          >
            삭제
          </Button>
        </Box>
      </Box>

      {/* 검색 */}
      <Box sx={{ mb: 2, flexShrink: 0 }}>
        <TextField
          size="small"
          placeholder="메뉴명, 설명, 코드, 등록자로 검색..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ width: 300 }}
        />
      </Box>

      {/* 테이블 */}
      <TableContainer component={Paper} sx={{ flex: 1, overflowX: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell padding="checkbox" sx={{ width: columnWidths.checkbox }}>
                <Checkbox
                  color="primary"
                  indeterminate={numSelected > 0 && numSelected < rowCount}
                  checked={rowCount > 0 && numSelected === rowCount}
                  onChange={handleSelectAll}
                  inputProps={{
                    'aria-label': 'select all menus'
                  }}
                  size="small"
                />
              </TableCell>
              <TableCell sx={{ width: columnWidths.no, fontWeight: 600 }}>No</TableCell>
              <TableCell sx={{ width: columnWidths.registrationDate, fontWeight: 600 }}>등록일</TableCell>
              <TableCell sx={{ width: columnWidths.code, fontWeight: 600 }}>코드</TableCell>
              <TableCell sx={{ width: columnWidths.menu, fontWeight: 600 }}>메뉴</TableCell>
              <TableCell sx={{ width: columnWidths.description, fontWeight: 600 }}>설명</TableCell>
              <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: columnWidths.registeredBy, fontWeight: 600 }}>등록자</TableCell>
              <TableCell sx={{ width: columnWidths.action, fontWeight: 600 }}>편집</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((menu) => {
              const isItemSelected = isSelected(menu.id);

              return (
                <TableRow
                  hover
                  onClick={(event) => handleSelectRow(event as any, menu.id)}
                  role="checkbox"
                  aria-checked={isItemSelected}
                  tabIndex={-1}
                  key={menu.id}
                  selected={isItemSelected}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      checked={isItemSelected}
                      inputProps={{
                        'aria-labelledby': `enhanced-table-checkbox-${menu.id}`
                      }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px' }}>
                      {menu.no}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px' }}>
                      {menu.registrationDate}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500 }}>
                      {menu.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500 }}>
                      {menu.menu}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px' }}>
                      {menu.description}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(menu.status)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '11px' }}>{menu.registeredBy.charAt(0)}</Avatar>
                      <Typography variant="body2" sx={{ fontSize: '13px' }}>
                        {menu.registeredBy}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="편집">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(menu);
                        }}
                        sx={{ color: 'primary.main' }}
                      >
                        <Edit size={16} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
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
          p: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
          flexShrink: 0
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2">Row per page</Typography>
          <FormControl size="small">
            <Select value={rowsPerPage} onChange={handleRowsPerPageChange}>
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2">
            {(page - 1) * rowsPerPage + 1}-{Math.min(page * rowsPerPage, filteredData.length)} of {filteredData.length}
          </Typography>
          <Pagination count={totalPages} page={page} onChange={handlePageChange} size="small" showFirstButton showLastButton />
        </Box>
      </Box>

      {/* 편집 다이얼로그 */}
      <MenuEditDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setCurrentMenu(null);
        }}
        menu={currentMenu}
        onSave={handleSaveMenu}
      />
    </Box>
  );
}
