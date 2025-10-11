'use client';

import { useState, useMemo } from 'react';

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
  Button,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Pagination
} from '@mui/material';

// Icons
import {
  Add,
  Trash,
  DocumentDownload,
  Setting2,
  Dashboard,
  DocumentText,
  Code,
  Security,
  Profile,
  Calculator
} from '@wandersonalwes/iconsax-react';

// 간소화된 메뉴 데이터 타입
interface MenuData {
  id: number;
  level: number;
  menu: string;
  icon: string;
  page: string;
  path: string;
  description: string;
}

// Props 타입
interface Props {
  menuSettings: any[];
  menuStatusMap: Record<string, boolean>;
  onMenuStatusChange: (menuId: string, enabled: boolean) => void;
}

// 고정된 간소한 데이터
const MENU_DATA: MenuData[] = [
  { id: 1, level: 0, menu: '관리자메뉴', icon: 'Setting2', page: '관리자 메뉴', path: '/admin-panel', description: '시스템 관리 메뉴' },
  {
    id: 2,
    level: 1,
    menu: '시스템설정',
    icon: 'Setting2',
    page: '시스템 설정',
    path: '/admin-panel/system-settings',
    description: '기본 설정 관리'
  },
  {
    id: 3,
    level: 1,
    menu: '사용자관리',
    icon: 'Profile',
    page: '사용자 관리',
    path: '/admin-panel/user-settings',
    description: '사용자 계정 관리'
  },

  { id: 4, level: 0, menu: '메인메뉴', icon: 'Dashboard', page: '메인 메뉴', path: '/dashboard', description: '주요 업무 메뉴' },
  { id: 5, level: 1, menu: '대시보드', icon: 'Dashboard', page: '대시보드', path: '/dashboard/default', description: '현황 대시보드' },

  { id: 6, level: 0, menu: '기획메뉴', icon: 'DocumentText', page: '기획 메뉴', path: '/planning', description: '기획 업무 메뉴' },
  { id: 7, level: 1, menu: '비용관리', icon: 'Calculator', page: '비용 관리', path: '/apps/cost', description: '비용 관리' },

  { id: 8, level: 0, menu: 'IT메뉴', icon: 'Code', page: 'IT 메뉴', path: '/it', description: 'IT 관리 메뉴' },
  { id: 9, level: 1, menu: '시스템개발', icon: 'Code', page: '시스템 개발', path: '/it/development', description: '개발 관리' },

  { id: 10, level: 0, menu: '보안메뉴', icon: 'Security', page: '보안 메뉴', path: '/security', description: '보안 관리 메뉴' },
  { id: 11, level: 1, menu: '접근권한', icon: 'Security', page: '접근권한', path: '/security/access', description: '권한 관리' }
];

export default function SystemMenuManagementTableLite({ menuSettings, menuStatusMap, onMenuStatusChange }: Props) {
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // 아이콘 렌더링
  const getIcon = (iconName: string) => {
    const props = { size: 16 };
    switch (iconName) {
      case 'Setting2':
        return <Setting2 {...props} />;
      case 'Dashboard':
        return <Dashboard {...props} />;
      case 'DocumentText':
        return <DocumentText {...props} />;
      case 'Code':
        return <Code {...props} />;
      case 'Security':
        return <Security {...props} />;
      case 'Profile':
        return <Profile {...props} />;
      case 'Calculator':
        return <Calculator {...props} />;
      default:
        return <Setting2 {...props} />;
    }
  };

  // 페이지네이션
  const paginatedData = MENU_DATA.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const totalPages = Math.ceil(MENU_DATA.length / rowsPerPage);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          총 {MENU_DATA.length}건
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<DocumentDownload size={16} />} size="small">
            Excel Down
          </Button>
          <Button variant="contained" startIcon={<Add size={16} />} size="small" disabled>
            추가
          </Button>
          <Button variant="outlined" startIcon={<Trash size={16} />} size="small" color="error" disabled>
            삭제
          </Button>
        </Box>
      </Box>

      {/* 테이블 */}
      <TableContainer sx={{ flex: 1, overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell padding="checkbox" sx={{ width: 50 }}>
                <Checkbox size="small" />
              </TableCell>
              <TableCell sx={{ width: 60, fontWeight: 600 }}>레벨</TableCell>
              <TableCell sx={{ width: 120, fontWeight: 600 }}>메뉴</TableCell>
              <TableCell sx={{ width: 100, fontWeight: 600 }}>아이콘</TableCell>
              <TableCell sx={{ width: 150, fontWeight: 600 }}>페이지</TableCell>
              <TableCell sx={{ width: 200, fontWeight: 600 }}>페이지주소</TableCell>
              <TableCell sx={{ width: 200, fontWeight: 600 }}>설명</TableCell>
              <TableCell sx={{ width: 60, fontWeight: 600 }}>읽기</TableCell>
              <TableCell sx={{ width: 60, fontWeight: 600 }}>쓰기</TableCell>
              <TableCell sx={{ width: 60, fontWeight: 600 }}>전체</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((menu) => (
              <TableRow key={menu.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox size="small" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    {menu.level}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500 }}>
                    {'  '.repeat(menu.level)}
                    {menu.level > 0 ? '└ ' : ''}
                    {menu.menu}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {getIcon(menu.icon)}
                    <Typography variant="body2" sx={{ fontSize: '13px' }}>
                      {menu.icon}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    {menu.page}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    {menu.path}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    {menu.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Checkbox size="small" defaultChecked />
                </TableCell>
                <TableCell>
                  <Checkbox size="small" defaultChecked />
                </TableCell>
                <TableCell>
                  <Checkbox size="small" defaultChecked />
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
          p: 1,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2">Row per page</Typography>
          <FormControl size="small">
            <Select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2">
            {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, MENU_DATA.length)} of {MENU_DATA.length}
          </Typography>
          <Pagination
            count={totalPages}
            page={page + 1}
            onChange={(_, newPage) => setPage(newPage - 1)}
            size="small"
            showFirstButton
            showLastButton
          />
        </Box>
      </Box>
    </Box>
  );
}
