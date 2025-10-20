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
  LinearProgress,
  Switch
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { SelectChangeEvent } from '@mui/material/Select';

// Icons
import { Add, Trash, Edit, DocumentDownload, Category2, Menu } from '@wandersonalwes/iconsax-react';

// Components
import MenuEditDialog from 'components/MenuEditDialog';

// Hooks
import { useMenuPermission } from 'hooks/usePermissions';

// 메뉴 데이터 타입 정의
interface MenuData {
  id: number;
  no: number;
  level: number;
  menu: string;
  icon: string;
  path: string;
  pageKey: string;
  read: boolean;
  write: boolean;
  all: boolean;
  parentGroup: string;
  menuType: '그룹' | '접기' | '항목';
  isEnabled: boolean;
  displayOrder: number;
  registrationDate: string;
  registeredBy: string;
  lastModifiedDate: string;
  lastModifiedBy: string;
}

// 컬럼 너비 정의 (RoleManagementTable과 동일한 방식)
const columnWidths = {
  checkbox: 50,
  level: 60,
  menu: 100,
  icon: 100,
  path: 250,
  pageKey: 150,
  read: 60,
  write: 60,
  all: 60
};

// Props 타입 정의
interface MenuManagementTableProps {
  selectedYear?: string;
  selectedTeam?: string;
  selectedStatus?: string;
  selectedAssignee?: string;
  menus?: MenuData[];
  setMenus?: React.Dispatch<React.SetStateAction<MenuData[]>>;
  addChangeLog?: (action: string, target: string, description: string, team?: string) => void;
}

// 목업 데이터 (스크린샷과 동일하게)
const mockMenuData: MenuData[] = [
  {
    id: 0,
    no: 0,
    level: 0,
    menu: '관리자메뉴',
    icon: '',
    path: '/',
    pageKey: '/',
    read: false,
    write: false,
    all: false,
    parentGroup: '',
    menuType: '그룹',
    registrationDate: '2025-09-01',
    registeredBy: '관리자',
    isEnabled: true,
    displayOrder: 1,
    lastModifiedDate: '2025-09-07',
    lastModifiedBy: '관리자'
  },
  {
    id: 1,
    no: 1,
    level: 1,
    menu: '시스템 설정',
    icon: 'Setting2',
    path: '/admin-panel/system-settings',
    pageKey: '/admin-panel/system-settings',
    read: false,
    write: false,
    all: false,
    parentGroup: '관리자메뉴',
    menuType: '항목',
    isEnabled: true,
    displayOrder: 1,
    registrationDate: '2025-09-02',
    registeredBy: '관리자',
    lastModifiedDate: '2025-09-06',
    lastModifiedBy: '관리자'
  },
  {
    id: 2,
    no: 2,
    level: 1,
    menu: '체크리스트관리',
    icon: 'Category2',
    path: '/admin-panel/checklist-management',
    pageKey: '/admin-panel/checklist-management',
    read: false,
    write: false,
    all: false,
    parentGroup: '관리자메뉴',
    menuType: '항목',
    isEnabled: true,
    displayOrder: 2,
    registrationDate: '2025-09-03',
    registeredBy: '관리자',
    lastModifiedDate: '2025-09-05',
    lastModifiedBy: '관리자'
  },
  {
    id: 3,
    no: 3,
    level: 1,
    menu: '마스터코드관리',
    icon: 'Setting2',
    path: '/admin-panel/master-code',
    pageKey: '/admin-panel/master-code',
    read: false,
    write: false,
    all: false,
    parentGroup: '관리자메뉴',
    menuType: '항목',
    isEnabled: true,
    displayOrder: 3,
    registrationDate: '2025-09-04',
    registeredBy: '관리자',
    lastModifiedDate: '2025-09-04',
    lastModifiedBy: '관리자'
  },
  {
    id: 4,
    no: 4,
    level: 1,
    menu: '사용자설정',
    icon: 'Profile',
    path: '/admin-panel/user-settings',
    pageKey: '/admin-panel/user-settings',
    read: false,
    write: false,
    all: false,
    parentGroup: '관리자메뉴',
    menuType: '항목',
    isEnabled: true,
    displayOrder: 4,
    registrationDate: '2025-09-05',
    registeredBy: '관리자',
    lastModifiedDate: '2025-09-07',
    lastModifiedBy: '관리자'
  },
  {
    id: 5,
    no: 5,
    level: 0,
    menu: '메인메뉴',
    icon: 'Dashboard',
    path: '/',
    pageKey: '/',
    read: false,
    write: false,
    all: false,
    parentGroup: '',
    menuType: '그룹',
    isEnabled: true,
    displayOrder: 2,
    registrationDate: '2025-09-06',
    registeredBy: '메인메뉴',
    lastModifiedDate: '2025-09-08',
    lastModifiedBy: '메인메뉴'
  },
  {
    id: 6,
    no: 6,
    level: 1,
    menu: '대시보드',
    icon: 'Chart',
    path: '/dashboard/default',
    pageKey: '/dashboard/default',
    read: false,
    write: false,
    all: false,
    parentGroup: '메인메뉴',
    menuType: '항목',
    isEnabled: true,
    displayOrder: 1,
    registrationDate: '2025-09-07',
    registeredBy: '메인메뉴',
    lastModifiedDate: '2025-09-08',
    lastModifiedBy: '메인메뉴'
  },
  {
    id: 7,
    no: 7,
    level: 1,
    menu: '업무관리',
    icon: 'TableDocument',
    path: '/apps/task',
    pageKey: '/apps/task',
    read: false,
    write: false,
    all: false,
    parentGroup: '메인메뉴',
    menuType: '항목',
    isEnabled: true,
    displayOrder: 2,
    registrationDate: '2025-09-08',
    registeredBy: '메인메뉴',
    lastModifiedDate: '2025-09-08',
    lastModifiedBy: '메인메뉴'
  },
  {
    id: 8,
    no: 8,
    level: 1,
    menu: 'KPI관리',
    icon: 'Chart',
    path: '/apps/kpi',
    pageKey: '/apps/kpi',
    read: false,
    write: false,
    all: false,
    parentGroup: '메인메뉴',
    menuType: '항목',
    isEnabled: true,
    displayOrder: 3,
    registrationDate: '2025-09-09',
    registeredBy: '메인메뉴',
    lastModifiedDate: '2025-09-09',
    lastModifiedBy: '메인메뉴'
  },
  {
    id: 9,
    no: 9,
    level: 1,
    menu: '월별관리',
    icon: 'Calendar',
    path: '/apps/calendar',
    pageKey: '/apps/calendar',
    read: false,
    write: false,
    all: false,
    parentGroup: '메인메뉴',
    menuType: '항목',
    isEnabled: true,
    displayOrder: 4,
    registrationDate: '2025-09-10',
    registeredBy: '메인메뉴',
    lastModifiedDate: '2025-09-10',
    lastModifiedBy: '메인메뉴'
  },
  {
    id: 10,
    no: 10,
    level: 1,
    menu: '교육관리',
    icon: 'Book',
    path: '/apps/education',
    pageKey: '/apps/education',
    read: false,
    write: false,
    all: false,
    parentGroup: '메인메뉴',
    menuType: '항목',
    isEnabled: true,
    displayOrder: 5,
    registrationDate: '2025-09-11',
    registeredBy: '메인메뉴',
    lastModifiedDate: '2025-09-11',
    lastModifiedBy: '메인메뉴'
  }
];

export default function MenuManagementTable({
  selectedYear = '전체',
  selectedTeam = '전체',
  selectedStatus = '전체',
  selectedAssignee = '전체',
  menus,
  setMenus,
  addChangeLog
}: MenuManagementTableProps) {
  const theme = useTheme();

  // ✅ 권한 체크
  const { canRead, canWrite, canFull, loading: permissionLoading } = useMenuPermission('/admin-panel/menu-management');

  const [data, setData] = useState<MenuData[]>(menus ? menus : mockMenuData.map((menu) => ({ ...menu })));
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState('');

  // Edit 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuData | null>(null);

  // Excel 다운로드 기능 (RoleManagementTable과 동일한 스타일)
  const handleExcelDownload = () => {
    try {
      const excelData = filteredData.map((menu, index) => ({
        NO: index + 1,
        레벨: menu.level,
        메뉴: menu.menu,
        아이콘: menu.icon,
        페이지주소: menu.path,
        페이지소스: menu.pageKey,
        읽기: menu.read ? '✓' : '',
        쓰기: menu.write ? '✓' : '',
        전체: menu.all ? '✓' : ''
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
      link.setAttribute('download', `메뉴관리_${new Date().toISOString().slice(0, 10)}.csv`);
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

  // menus props가 변경될 때 data 상태 업데이트
  useEffect(() => {
    if (menus) {
      setData([...menus]);
    }
  }, [menus]);

  // 필터링된 데이터 (역순 정렬 추가)
  const filteredData = useMemo(() => {
    const filtered = data.filter((menu) => {
      // 연도 필터
      if (selectedYear !== '전체') {
        const menuYear = new Date(menu.registrationDate).getFullYear().toString();
        if (menuYear !== selectedYear) return false;
      }

      const statusMatch = selectedStatus === '전체' || menu.status === selectedStatus;
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
  const handleDeleteSelected = () => {
    if (selected.length === 0) return;

    if (addChangeLog) {
      const deletedMenus = data.filter((menu) => selected.includes(menu.id));
      deletedMenus.forEach((menu) => {
        addChangeLog('메뉴 삭제', menu.pageKey || `MENU-${menu.id}`, `${menu.menu || '메뉴'} 삭제`);
      });
    }

    const updatedData = data.filter((menu) => !selected.includes(menu.id));
    setData(updatedData);
    setSelected([]);

    if (setMenus) {
      setMenus(updatedData);
    }
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingMenu(null);
  };

  // 새 메뉴 추가
  const addNewMenu = () => {
    const newMenu: MenuData = {
      id: Math.max(...data.map((m) => m.id), 0) + 1,
      no: Math.max(...data.map((m) => m.no), 0) + 1,
      level: 0,
      menu: '',
      icon: 'Menu',
      path: '',
      pageKey: '',
      read: false,
      write: false,
      all: false,
      parentGroup: '',
      menuType: '항목',
      isEnabled: true,
      displayOrder: Math.max(...data.map((m) => m.displayOrder), 0) + 1,
      registrationDate: new Date().toISOString().split('T')[0],
      registeredBy: '현재사용자',
      lastModifiedDate: new Date().toISOString().split('T')[0],
      lastModifiedBy: '현재사용자'
    };

    setEditingMenu(newMenu);
    setEditDialog(true);
  };

  // 메뉴 편집
  const handleEditMenu = (menu: MenuData) => {
    setEditingMenu(menu);
    setEditDialog(true);
  };

  // 메뉴 저장
  const handleMenuSave = (updatedMenu: MenuData) => {
    const isNew = updatedMenu.id === 0 || !data.find((m) => m.id === updatedMenu.id);

    if (isNew) {
      const newId = Math.max(...data.map((m) => m.id), 0) + 1;
      const newMenu = { ...updatedMenu, id: newId };
      setData((prev) => [...prev, newMenu]);

      if (addChangeLog) {
        addChangeLog('메뉴 추가', newMenu.pageKey, `${newMenu.menu} 메뉴를 추가했습니다.`);
      }
    } else {
      setData((prev) =>
        prev.map((menu) =>
          menu.id === updatedMenu.id
            ? { ...updatedMenu, lastModifiedDate: new Date().toISOString().split('T')[0], lastModifiedBy: '현재사용자' }
            : menu
        )
      );

      if (addChangeLog) {
        addChangeLog('메뉴 수정', updatedMenu.pageKey, `${updatedMenu.menu} 메뉴를 수정했습니다.`);
      }
    }

    handleEditDialogClose();
  };

  // 상태 색상 함수
  const getStatusColor = (status: string) => {
    switch (status) {
      case '활성':
        return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
      case '비활성':
        return { backgroundColor: '#ffebee', color: '#d32f2f' };
      default:
        return { backgroundColor: '#fff3e0', color: '#ed6c02' };
    }
  };

  // 메뉴 타입 색상
  const getMenuTypeColor = (type: string) => {
    switch (type) {
      case '그룹':
        return { backgroundColor: '#e3f2fd', color: '#1976d2' };
      case '접기':
        return { backgroundColor: '#fff3e0', color: '#ed6c02' };
      case '항목':
        return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
      default:
        return { backgroundColor: '#f5f5f5', color: '#757575' };
    }
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
      {/* 상단 정보 및 액션 버튼 (RoleManagementTable과 동일한 스타일) */}
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
            <Button variant="contained" startIcon={<Add size={16} />} size="small" onClick={addNewMenu} sx={{ px: 2 }}>
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

      {/* 테이블 (RoleManagementTable과 동일한 스타일) */}
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
            minWidth: 1300
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
                  checked={paginatedData.length > 0 && paginatedData.every((menu) => selected.includes(menu.id))}
                  indeterminate={selected.length > 0 && selected.length < paginatedData.length}
                  onChange={handleSelectAllClick}
                  size="small"
                />
              </TableCell>
              <TableCell sx={{ width: columnWidths.level, fontWeight: 600 }}>레벨</TableCell>
              <TableCell sx={{ width: columnWidths.menu, fontWeight: 600 }}>메뉴</TableCell>
              <TableCell sx={{ width: columnWidths.icon, fontWeight: 600 }}>아이콘</TableCell>
              <TableCell sx={{ width: columnWidths.path, fontWeight: 600 }}>페이지주소</TableCell>
              <TableCell sx={{ width: columnWidths.pageKey, fontWeight: 600 }}>페이지소스</TableCell>
              <TableCell sx={{ width: columnWidths.read, fontWeight: 600 }}>읽기</TableCell>
              <TableCell sx={{ width: columnWidths.write, fontWeight: 600 }}>쓰기</TableCell>
              <TableCell sx={{ width: columnWidths.all, fontWeight: 600 }}>전체</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((menu) => (
                <TableRow
                  key={menu.id}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(menu.id)}
                      onChange={(event) => {
                        const selectedIndex = selected.indexOf(menu.id);
                        let newSelected: number[] = [];

                        if (selectedIndex === -1) {
                          newSelected = newSelected.concat(selected, menu.id);
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
                      {menu.level}
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
                      {'  '.repeat(menu.level)}
                      {menu.level > 0 ? '└ ' : ''}
                      {menu.menu}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Category2 size={16} />
                      <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                        {menu.icon}
                      </Typography>
                    </Box>
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
                        maxWidth: 200
                      }}
                    >
                      {menu.path}
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
                        maxWidth: 150
                      }}
                    >
                      {menu.pageKey}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Checkbox size="small" checked={menu.read} />
                  </TableCell>
                  <TableCell>
                    <Checkbox size="small" checked={menu.write} />
                  </TableCell>
                  <TableCell>
                    <Checkbox size="small" checked={menu.all} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
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

      {/* 메뉴 편집 다이얼로그 */}
      {editDialog && editingMenu && (
        <MenuEditDialog open={editDialog} onClose={handleEditDialogClose} menu={editingMenu} onSave={handleMenuSave} />
      )}
    </Box>
  );
}
