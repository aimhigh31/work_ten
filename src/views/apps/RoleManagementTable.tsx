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
  Snackbar,
  Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { SelectChangeEvent } from '@mui/material/Select';

// Icons
import { Add, Trash, Edit, DocumentDownload } from '@wandersonalwes/iconsax-react';

// Components
import RoleEditDialog from '../../components/RoleEditDialog';

// Hooks
import { useMenuPermission } from 'hooks/usePermissions'; // ✅ 권한 체크 훅

// Utils
import { loadFromCache, saveToCache, createCacheKey, clearCache, DEFAULT_CACHE_EXPIRY_MS } from 'utils/cacheUtils';

// 역할 데이터 타입 정의
interface RoleData {
  id: number;
  no: number;
  registrationDate: string;
  code: string;
  role: string;
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
  role: 150,
  description: 200,
  status: 90,
  registeredBy: 130,
  action: 80
};

// Props 타입 정의
interface RoleManagementTableProps {
  selectedYear?: string;
  selectedTeam?: string;
  selectedStatus?: string;
  selectedAssignee?: string;
  roles?: RoleData[];
  setRoles?: React.Dispatch<React.SetStateAction<RoleData[]>>;
  addChangeLog?: (action: string, target: string, description: string, team?: string) => void;
  canReadData?: boolean;
  canCreateData?: boolean;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
}

export default function RoleManagementTable({
  selectedYear = '전체',
  selectedTeam = '전체',
  selectedStatus = '전체',
  selectedAssignee = '전체',
  roles,
  setRoles,
  addChangeLog,
  canReadData = true,
  canCreateData = true,
  canEditOwn = true,
  canEditOthers = true
}: RoleManagementTableProps) {
  const theme = useTheme();

  // ✅ 권한 체크
  const { canRead, canWrite, canFull, loading: permissionLoading } = useMenuPermission('/admin-panel/user-settings');

  // 🔍 권한 디버깅 로그
  useEffect(() => {
    if (!permissionLoading) {
      console.log('🔐 [역할관리] 현재 권한 상태:', {
        canRead,
        canWrite,
        canFull,
        메뉴: '/admin-panel/user-settings'
      });
    }
  }, [canRead, canWrite, canFull, permissionLoading]);

  // 로컬 상태
  const [data, setData] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState('');

  // 알림창 상태
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // 역할 편집 다이얼로그 상태
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);

  // 캐시 키
  const CACHE_KEY = createCacheKey('role_management', 'roles');

  // 역할 데이터 가져오기 함수
  const fetchRoles = async () => {
    try {
      // 1. 캐시 확인
      const cachedData = loadFromCache<RoleData[]>(CACHE_KEY, DEFAULT_CACHE_EXPIRY_MS);
      if (cachedData && cachedData.length > 0) {
        console.log('⚡ [역할관리] 캐시 데이터 사용 (즉시 표시)');
        setData(cachedData);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const t1 = performance.now();
      const response = await fetch('/api/role-permissions');
      const result = await response.json();
      const t2 = performance.now();

      console.log(`⚡ [역할관리] API 응답 시간: ${(t2 - t1).toFixed(2)}ms`);

      if (result.success) {
        // admin_users_rules 데이터를 UI 포맷으로 변환
        const formattedRoles: RoleData[] = result.roles.map((role: any, index: number) => ({
          id: role.id || index + 1,
          no: index + 1,
          registrationDate: role.created_at ? new Date(role.created_at).toISOString().split('T')[0] : '2025-09-01',
          code: role.role_code,
          role: role.role_name,
          description: role.role_description || '',
          userCount: 0, // 실제 사용자 수는 별도 계산 필요
          permissionCount: role.permissions ? Object.keys(role.permissions).length : 0,
          status: role.is_active === true || role.is_active === 'true' || role.is_active === 1 ? ('활성' as const) : ('비활성' as const),
          registeredBy: role.created_by || '시스템',
          lastModifiedDate: role.updated_at ? new Date(role.updated_at).toISOString().split('T')[0] : '2025-09-01',
          lastModifiedBy: role.updated_by || '시스템'
        }));

        // 2. 캐시에 저장
        saveToCache(CACHE_KEY, formattedRoles);
        console.log('💾 [역할관리] 데이터 캐싱 완료');

        console.log('✅ 역할 데이터 로드 성공:', formattedRoles);
        setData(formattedRoles);
      } else {
        setError(result.error || '역할 데이터를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 역할 데이터 로드 실패:', error);
      setError('역할 데이터 로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchRoles();
  }, []);

  // Excel 다운로드 기능
  const handleExcelDownload = () => {
    try {
      const excelData = filteredData.map((role, index) => ({
        NO: index + 1,
        등록일: role.registrationDate,
        코드: role.code,
        역할: role.role,
        설명: role.description,
        상태: role.status,
        등록자: role.registeredBy
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
      link.setAttribute('download', `역할관리_${new Date().toISOString().slice(0, 10)}.csv`);
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

  // 필터링된 데이터 (역순 정렬 추가)
  const filteredData = useMemo(() => {
    const filtered = data.filter((role) => {
      // 연도 필터
      if (selectedYear !== '전체') {
        const roleYear = new Date(role.registrationDate).getFullYear().toString();
        if (roleYear !== selectedYear) return false;
      }

      const statusMatch = selectedStatus === '전체' || role.status === selectedStatus;
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

    if (!confirm(`선택된 ${selected.length}개의 역할을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/role-permissions?roleIds=${selected.join(',')}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ 역할 삭제 완료:', result.message);

        // 삭제된 역할들에 대한 로그 추가
        for (const deletedRole of result.deletedRoles) {
          if (addChangeLog) {
            addChangeLog('역할 삭제', deletedRole.role_code, `${deletedRole.role_name} 삭제`);
          }
        }

        // 캐시 무효화
        clearCache(CACHE_KEY);
        console.log('🗑️ [역할관리] 캐시 무효화 (삭제)');

        // 데이터 새로고침
        await fetchRoles();

        // 선택 상태 초기화
        setSelected([]);

        setSnackbar({
          open: true,
          message: `${selected.length}개 역할이 성공적으로 삭제되었습니다.`,
          severity: 'success'
        });
      } else {
        console.error('❌ 역할 삭제 실패:', result.error);
        setSnackbar({
          open: true,
          message: result.error || '역할 삭제에 실패했습니다.',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('❌ 역할 삭제 중 오류:', error);
      setSnackbar({
        open: true,
        message: '삭제 중 오류가 발생했습니다.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // 역할 편집 핸들러
  const handleEditRole = (role: RoleData) => {
    setEditingRole(role);
    setEditDialogOpen(true);
  };

  // 역할 편집 완료 핸들러
  const handleSaveRole = async (updatedRole: RoleData) => {
    // ✅ 권한 체크
    if (!canWrite) {
      setSnackbar({
        open: true,
        message: '역할을 생성/수정할 권한이 없습니다.',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);

      if (editingRole) {
        // 기존 역할 업데이트
        const response = await fetch('/api/role-permissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'update',
            roleId: editingRole.id,
            roleData: {
              role_name: updatedRole.role,
              role_description: updatedRole.description,
              is_active: updatedRole.status === '활성'
            }
          })
        });

        const result = await response.json();

        if (result.success) {
          console.log('✅ 역할 업데이트 완료:', result.message);

          if (addChangeLog) {
            addChangeLog('역할 수정', updatedRole.code || `RULE-${updatedRole.id}`, `${updatedRole.role} 정보 수정`);
          }

          // 캐시 무효화
          clearCache(CACHE_KEY);
          console.log('🗑️ [역할관리] 캐시 무효화 (수정)');

          // 데이터 새로고침
          await fetchRoles();

          setSnackbar({
            open: true,
            message: '역할 정보가 성공적으로 수정되었습니다.',
            severity: 'success'
          });
        } else {
          console.error('❌ 역할 업데이트 실패:', result.error);
          setSnackbar({
            open: true,
            message: result.error || '역할 업데이트에 실패했습니다.',
            severity: 'error'
          });
          return;
        }
      } else {
        // 새 역할 추가 - API에서 고유한 role_code 자동 생성
        console.log('🆕 새 역할 생성 요청:', updatedRole.role);

        const response = await fetch('/api/role-permissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'create',
            roleData: {
              role_name: updatedRole.role,
              role_description: updatedRole.description,
              is_active: updatedRole.status === '활성'
            }
          })
        });

        const result = await response.json();

        if (result.success) {
          console.log('✅ 역할 생성 완료:', result.message, 'Role Code:', result.roleCode, 'Role ID:', result.roleId);

          if (addChangeLog) {
            addChangeLog('역할 추가', result.roleCode || 'AUTO-GENERATED', `${updatedRole.role} 새로 추가`);
          }

          // 생성된 역할 ID를 updatedRole에 추가
          updatedRole.id = result.roleId;
          updatedRole.code = result.roleCode;

          // 캐시 무효화
          clearCache(CACHE_KEY);
          console.log('🗑️ [역할관리] 캐시 무효화 (생성)');

          // 데이터 새로고침
          await fetchRoles();

          setSnackbar({
            open: true,
            message: '역할이 성공적으로 생성되었습니다.',
            severity: 'success'
          });
        } else {
          console.error('❌ 역할 생성 실패:', result.error);
          setSnackbar({
            open: true,
            message: result.error || '역할 생성에 실패했습니다.',
            severity: 'error'
          });
          return;
        }
      }

      setEditDialogOpen(false);
      setEditingRole(null);
    } catch (error) {
      console.error('❌ 역할 저장 중 오류:', error);
      setSnackbar({
        open: true,
        message: '저장 중 오류가 발생했습니다.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // 상태 색상 (TaskTable과 동일)
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

  // ✅ 권한 없을 경우 접근 차단
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
      {/* 상단 정보 및 액션 버튼 */}
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
          <Button
            variant="contained"
            startIcon={<Add size={16} />}
            size="small"
            onClick={() => {
              setEditingRole(null);
              setEditDialogOpen(true);
            }}
            disabled={!canCreateData}
            sx={{
              px: 2,
              '&.Mui-disabled': {
                backgroundColor: 'grey.300',
                color: 'grey.500'
              }
            }}
          >
            추가
          </Button>
          <Button
            variant="outlined"
            startIcon={<Trash size={16} />}
            size="small"
            color="error"
            disabled={selected.length === 0 || !(canEditOwn || canEditOthers)}
            onClick={handleDeleteSelected}
            sx={{
              px: 2,
              borderColor: selected.length > 0 && (canEditOwn || canEditOthers) ? 'error.main' : 'grey.300',
              color: selected.length > 0 && (canEditOwn || canEditOthers) ? 'error.main' : 'grey.500',
              '&.Mui-disabled': {
                borderColor: 'grey.300',
                color: 'grey.500'
              }
            }}
          >
            삭제 {selected.length > 0 && `(${selected.length})`}
          </Button>
        </Box>
      </Box>

      {/* 로딩 상태 */}
      {loading && (
        <Box sx={{ py: 2 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
            역할 데이터를 불러오는 중...
          </Typography>
        </Box>
      )}

      {/* 오류 상태 */}
      {error && (
        <Box sx={{ py: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        </Box>
      )}

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
                  checked={paginatedData.length > 0 && paginatedData.every((role) => selected.includes(role.id))}
                  indeterminate={selected.length > 0 && selected.length < paginatedData.length}
                  onChange={handleSelectAllClick}
                  size="small"
                />
              </TableCell>
              <TableCell sx={{ width: columnWidths.no, fontWeight: 600 }}>NO</TableCell>
              <TableCell sx={{ width: columnWidths.registrationDate, fontWeight: 600 }}>등록일</TableCell>
              <TableCell sx={{ width: columnWidths.code, fontWeight: 600 }}>코드</TableCell>
              <TableCell sx={{ width: columnWidths.role, fontWeight: 600 }}>역할</TableCell>
              <TableCell sx={{ width: columnWidths.description, fontWeight: 600 }}>설명</TableCell>
              <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: columnWidths.registeredBy, fontWeight: 600 }}>등록자</TableCell>
              <TableCell sx={{ width: columnWidths.action, fontWeight: 600 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((role) => (
                <TableRow
                  key={role.id}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(role.id)}
                      onChange={(event) => {
                        const selectedIndex = selected.indexOf(role.id);
                        let newSelected: number[] = [];

                        if (selectedIndex === -1) {
                          newSelected = newSelected.concat(selected, role.id);
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
                      {role.no}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {role.registrationDate}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {role.code}
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
                      {role.role}
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
                      {role.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={role.status}
                      size="small"
                      sx={{
                        ...getStatusColor(role.status),
                        fontWeight: 500,
                        fontSize: '13px'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {role.registeredBy}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="편집">
                      <IconButton
                        size="small"
                        onClick={() => handleEditRole(role)}
                        sx={{
                          color: 'primary.main',
                          '&:hover': {
                            backgroundColor: 'primary.main',
                            color: 'white'
                          }
                        }}
                      >
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

      {/* 역할 편집 다이얼로그 */}
      <RoleEditDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingRole(null);
        }}
        role={editingRole}
        onSave={handleSaveRole}
        canEditOwn={canEditOwn}
        canEditOthers={canEditOthers}
      />

      {/* 알림창 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
