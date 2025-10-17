import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Checkbox,
  TextField,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';

// 아이콘 컴포넌트 import
import {
  Setting2,
  Profile,
  Home3,
  Chart,
  TaskSquare,
  Category2,
  Money,
  Book1,
  Code,
  TrendUp,
  Calendar1,
  MoneyRecive,
  Monitor,
  MessageQuestion,
  Setting3,
  ProgrammingArrows,
  Teacher,
  SecuritySafe,
  ScanBarcode,
  SecurityUser,
  Warning2,
  DocumentText,
  Add,
  Edit,
  Trash
} from '@wandersonalwes/iconsax-react';

// Hooks
import { useSupabaseMenuManagement } from 'hooks/useSupabaseMenuManagement';

// Types
import { MenuData } from 'types/menu-management';

// 부모 컴포넌트에서 호출할 수 있는 메서드들
export interface SystemMenuPermissionsTableRef {
  savePendingChanges: () => Promise<boolean>;
  hasPendingChanges: () => boolean;
}

// 메뉴 아이템 import (아이콘 렌더링용)
import menuItems from 'menu-items';

const SystemMenuPermissionsTable = forwardRef<SystemMenuPermissionsTableRef>((props, ref) => {
  const { menus, loading, error, updateMenu, addMenu, deleteMenu, toggleMenuEnabled, clearError } = useSupabaseMenuManagement();

  // 선택된 메뉴들
  const [selectedMenus, setSelectedMenus] = useState<number[]>([]);

  // 메뉴 추가 다이얼로그 상태
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newMenuData, setNewMenuData] = useState({
    menu_level: 0,
    menu_category: '',
    menu_icon: 'Setting2',
    menu_page: '',
    menu_url: '',
    menu_description: '',
    menu_database: '',
    display_order: 0
  });

  // 메뉴 편집 다이얼로그 상태
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any>(null);

  // 아이콘 문자열을 실제 컴포넌트로 매핑하는 함수
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      Setting2: Setting2,
      Profile: Profile,
      Home3: Home3,
      Chart: Chart,
      TaskSquare: TaskSquare,
      Category2: Category2,
      Money: Money,
      Book1: Book1,
      Code: Code,
      TrendUp: TrendUp,
      Calendar1: Calendar1,
      MoneyRecive: MoneyRecive,
      Monitor: Monitor,
      MessageQuestion: MessageQuestion,
      Setting3: Setting3,
      ProgrammingArrows: ProgrammingArrows,
      Teacher: Teacher,
      SecuritySafe: SecuritySafe,
      ScanBarcode: ScanBarcode,
      SecurityUser: SecurityUser,
      Warning2: Warning2,
      DocumentText: DocumentText
    };

    return iconMap[iconName] || Setting2; // 기본값은 Setting2
  };

  // 아이콘 컴포넌트 렌더링 함수
  const renderIconComponent = (iconName: string) => {
    const IconComponent = getIconComponent(iconName);
    return <IconComponent size={18} color="#666" />;
  };

  // 사용/미사용 변경 핸들러
  const handleToggleEnabled = async (menuId: number) => {
    try {
      await toggleMenuEnabled(menuId);

      // 사이드바 메뉴 업데이트 이벤트 발생
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('menuUpdated'));
      }, 100);
    } catch (err: any) {
      console.error('메뉴 상태 변경 실패:', err);
    }
  };

  // 메뉴 선택 핸들러
  const handleSelectMenu = (menuId: number) => {
    setSelectedMenus((prev) => {
      if (prev.includes(menuId)) {
        return prev.filter((id) => id !== menuId);
      } else {
        return [...prev, menuId];
      }
    });
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedMenus.length === menus.length) {
      setSelectedMenus([]);
    } else {
      setSelectedMenus(menus.map((menu) => menu.id));
    }
  };

  // 새 메뉴 추가 핸들러
  const handleAddMenu = () => {
    // 현재 메뉴들 중 가장 큰 정렬순서 찾기
    const maxOrder = menus.length > 0 ? Math.max(...menus.map((menu) => menu.displayOrder || 0)) : 0;
    const nextOrder = maxOrder + 1;

    setNewMenuData({
      menu_level: 0,
      menu_category: '',
      menu_icon: 'Setting2',
      menu_page: '',
      menu_url: '',
      menu_description: '',
      menu_database: '',
      display_order: nextOrder
    });
    setAddDialogOpen(true);
  };

  // 메뉴 추가 저장
  const handleSaveNewMenu = async () => {
    if (!newMenuData.menu_category || !newMenuData.menu_page) {
      alert('카테고리와 페이지명은 필수입니다.');
      return;
    }

    try {
      // 새 메뉴 데이터 생성 (ID는 자동 생성)
      const menuToAdd = {
        id: Date.now(), // 임시 ID
        level: newMenuData.menu_level,
        category: newMenuData.menu_category,
        icon: newMenuData.menu_icon,
        page: newMenuData.menu_page,
        url: newMenuData.menu_url,
        description: newMenuData.menu_description,
        database: newMenuData.menu_database,
        displayOrder: newMenuData.display_order,
        permissions: {
          enabled: true // 기본값: 사용
        }
      };

      // addMenu 호출
      const success = await addMenu(menuToAdd);

      if (success) {
        setAddDialogOpen(false);

        // 사이드바 메뉴 업데이트 이벤트 발생
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('menuUpdated'));
        }, 100);
      } else {
        // 에러는 이미 hook에서 처리됨
      }
    } catch (error) {
      console.error('메뉴 추가 실패:', error);
      alert('메뉴 추가에 실패했습니다.');
    }
  };

  // 선택된 메뉴 삭제
  const handleDeleteSelected = async () => {
    if (selectedMenus.length === 0) return;

    const confirmed = confirm(`선택된 ${selectedMenus.length}개 메뉴를 삭제하시겠습니까?`);
    if (!confirmed) return;

    try {
      console.log('메뉴 삭제 시작:', selectedMenus);

      // 각 메뉴를 순차적으로 삭제
      let successCount = 0;
      let failCount = 0;

      for (const menuId of selectedMenus) {
        try {
          const success = await deleteMenu(menuId);
          if (success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          console.error(`메뉴 ${menuId} 삭제 실패:`, err);
          failCount++;
        }
      }

      // 선택 해제
      setSelectedMenus([]);

      // 사이드바 메뉴 업데이트 이벤트 발생
      if (successCount > 0) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('menuUpdated'));
        }, 100);
      }

      // 결과 알림
      if (failCount === 0) {
        console.log(`${successCount}개 메뉴가 성공적으로 삭제되었습니다.`);
      } else {
        alert(`삭제 완료: ${successCount}개, 실패: ${failCount}개`);
      }
    } catch (error) {
      console.error('메뉴 삭제 전체 실패:', error);
      alert('메뉴 삭제에 실패했습니다.');
    }
  };

  // 메뉴 편집 핸들러
  const handleEditMenu = (menu: any) => {
    setEditingMenu({
      ...menu,
      menu_level: menu.level,
      menu_category: menu.category,
      menu_icon: menu.icon,
      menu_page: menu.page,
      menu_url: menu.url,
      menu_description: menu.description || '',
      menu_database: menu.database || '',
      display_order: menu.displayOrder || 1
    });
    setEditDialogOpen(true);
  };

  // 메뉴 편집 저장
  const handleSaveEditMenu = async () => {
    if (!editingMenu.menu_category || !editingMenu.menu_page) {
      alert('카테고리와 페이지명은 필수입니다.');
      return;
    }

    try {
      console.log('메뉴 편집 저장 시작:', editingMenu);

      // 편집된 메뉴 데이터를 updateMenu로 전달
      const updateData = {
        level: editingMenu.menu_level,
        category: editingMenu.menu_category,
        icon: editingMenu.menu_icon,
        page: editingMenu.menu_page,
        url: editingMenu.menu_url,
        description: editingMenu.menu_description,
        database: editingMenu.menu_database,
        displayOrder: editingMenu.display_order
      };

      // updateMenu 호출
      const success = await updateMenu(editingMenu.id, updateData);

      // 다이얼로그 닫기 (성공/실패 관계없이)
      setEditDialogOpen(false);
      setEditingMenu(null);

      // 사이드바 메뉴 업데이트 이벤트 발생
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('menuUpdated'));
      }, 100);

      if (success) {
        console.log('✅ 메뉴 수정이 완료되었습니다.');
        // 성공 메시지는 부모 컴포넌트에서 처리하도록 할 수도 있음
      } else {
        console.log('⚠️ 메뉴 수정이 완료되었습니다 (폴백 모드).');
      }
    } catch (error) {
      console.error('메뉴 수정 실패:', error);
      // 에러가 발생해도 다이얼로그는 닫기
      setEditDialogOpen(false);
      setEditingMenu(null);
      alert('메뉴 수정에 실패했습니다.');
    }
  };

  // 부모 컴포넌트에서 호출할 수 있는 메서드들
  useImperativeHandle(
    ref,
    () => ({
      // 임시 저장된 변경사항을 DB에 저장
      savePendingChanges: async () => {
        // 테이블에서 직접 편집하지 않으므로 항상 true 반환
        return true;
      },

      // 저장되지 않은 변경사항이 있는지 확인
      hasPendingChanges: () => {
        // 테이블에서 직접 편집하지 않으므로 항상 false 반환
        return false;
      }
    }),
    []
  );

  // 에러 처리
  useEffect(() => {
    if (error) {
      console.error('메뉴 데이터 에러:', error);
      clearError();
    }
  }, [error, clearError]);

  // 로딩 상태
  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          메뉴 데이터를 불러오는 중...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <Box sx={{ px: 0, py: 1.2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h6" sx={{ mb: 0.6 }}>
            메뉴 관리
          </Typography>
          <Typography variant="body2" color="text.secondary">
            시스템 메뉴를 관리합니다. (총 {menus.length}개 메뉴)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" startIcon={<Add size={16} />} onClick={handleAddMenu} size="small">
            메뉴 추가
          </Button>
          <Button
            variant="outlined"
            startIcon={<Trash size={16} />}
            onClick={handleDeleteSelected}
            disabled={selectedMenus.length === 0}
            color="error"
            size="small"
          >
            삭제 ({selectedMenus.length})
          </Button>
        </Box>
      </Box>

      <TableContainer
        sx={{
          flex: 1,
          border: 'none',
          boxShadow: 'none',
          overflowY: 'auto',
          overflowX: 'hidden',
          mx: 0,
          mb: 1.8
        }}
      >
        <Table
          stickyHeader
          size="small"
          sx={{
            '& .MuiTableRow-root': {
              height: '32px'
            },
            '& .MuiTableCell-root': {
              height: '32px',
              minHeight: '32px',
              maxHeight: '32px',
              verticalAlign: 'middle',
              padding: '4px 8px'
            }
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell
                padding="checkbox"
                sx={{ fontWeight: 'bold', bgcolor: '#f8f9fa', borderTop: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0' }}
              >
                <Checkbox
                  checked={selectedMenus.length === menus.length && menus.length > 0}
                  indeterminate={selectedMenus.length > 0 && selectedMenus.length < menus.length}
                  onChange={handleSelectAll}
                  size="small"
                />
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 'bold',
                  bgcolor: '#f8f9fa',
                  py: 0.375,
                  minWidth: 80,
                  borderTop: '1px solid #e0e0e0',
                  borderBottom: '1px solid #e0e0e0'
                }}
              >
                레벨
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 'bold',
                  bgcolor: '#f8f9fa',
                  py: 0.375,
                  minWidth: 120,
                  borderTop: '1px solid #e0e0e0',
                  borderBottom: '1px solid #e0e0e0'
                }}
              >
                메뉴
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 'bold',
                  bgcolor: '#f8f9fa',
                  py: 0.375,
                  minWidth: 60,
                  borderTop: '1px solid #e0e0e0',
                  borderBottom: '1px solid #e0e0e0'
                }}
              >
                아이콘
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 'bold',
                  bgcolor: '#f8f9fa',
                  py: 0.375,
                  minWidth: 120,
                  borderTop: '1px solid #e0e0e0',
                  borderBottom: '1px solid #e0e0e0'
                }}
              >
                페이지
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 'bold',
                  bgcolor: '#f8f9fa',
                  py: 1.5,
                  minWidth: 200,
                  borderTop: '1px solid #e0e0e0',
                  borderBottom: '1px solid #e0e0e0'
                }}
              >
                페이지주소
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 'bold',
                  bgcolor: '#f8f9fa',
                  py: 0.375,
                  minWidth: 300,
                  borderTop: '1px solid #e0e0e0',
                  borderBottom: '1px solid #e0e0e0'
                }}
              >
                설명
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 'bold',
                  bgcolor: '#f8f9fa',
                  py: 0.375,
                  minWidth: 150,
                  borderTop: '1px solid #e0e0e0',
                  borderBottom: '1px solid #e0e0e0'
                }}
              >
                Database
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 'bold',
                  bgcolor: '#f8f9fa',
                  py: 1.5,
                  minWidth: 80,
                  borderTop: '1px solid #e0e0e0',
                  borderBottom: '1px solid #e0e0e0'
                }}
              >
                정렬순서
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 'bold',
                  bgcolor: '#f8f9fa',
                  py: 1.5,
                  minWidth: 100,
                  borderTop: '1px solid #e0e0e0',
                  borderBottom: '1px solid #e0e0e0'
                }}
              >
                사용여부
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 'bold',
                  bgcolor: '#f8f9fa',
                  py: 1.5,
                  minWidth: 80,
                  borderTop: '1px solid #e0e0e0',
                  borderBottom: '1px solid #e0e0e0'
                }}
              >
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {menus.map((menu) => {
              // 사용여부에 따른 텍스트 색상
              const isEnabled = menu.permissions.enabled;
              const textColor = isEnabled ? '#000000' : '#999999';
              const isSelected = selectedMenus.includes(menu.id);

              return (
                <TableRow
                  key={`${menu.category}-${menu.page}-${menu.id}`}
                  hover
                  sx={{
                    backgroundColor: menu.level === 0 ? '#e3f2fd' : 'transparent',
                    '&:hover': { backgroundColor: '#f5f5f5' }
                  }}
                >
                  {/* 선택 체크박스 */}
                  <TableCell padding="checkbox" sx={{ py: 0.625 }}>
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleSelectMenu(menu.id)}
                      size="small"
                      sx={{
                        transform: 'scale(0.91)',
                        '& .MuiSvgIcon-root': {
                          fontSize: 16
                        }
                      }}
                    />
                  </TableCell>
                  {/* 레벨 */}
                  <TableCell align="center" sx={{ py: 0.625 }}>
                    <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 500, color: textColor }}>
                      {menu.level}
                    </Typography>
                  </TableCell>
                  {/* 메뉴 */}
                  <TableCell sx={{ fontWeight: 500, py: 2.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: textColor }}>
                      {menu.category}
                    </Typography>
                  </TableCell>
                  {/* 아이콘 */}
                  <TableCell align="center" sx={{ py: 0.625 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      {menu.level === 0 ? (
                        <Typography variant="body2" sx={{ fontSize: '12px', color: textColor, fontWeight: 'bold' }}>
                          /
                        </Typography>
                      ) : (
                        renderIconComponent(menu.icon)
                      )}
                    </Box>
                  </TableCell>
                  {/* 페이지 */}
                  <TableCell sx={{ py: 0.625 }}>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: textColor }}>
                      {menu.page}
                    </Typography>
                  </TableCell>
                  {/* 페이지주소 */}
                  <TableCell sx={{ py: 1 }}>
                    <Typography variant="body2" sx={{ fontSize: '12px', fontFamily: 'monospace', color: textColor }}>
                      {menu.url}
                    </Typography>
                  </TableCell>
                  {/* 설명 */}
                  <TableCell sx={{ py: 0.625 }}>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: textColor }}>
                      {menu.description || ''}
                    </Typography>
                  </TableCell>
                  {/* Database */}
                  <TableCell sx={{ py: 0.625 }}>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: textColor }}>
                      {menu.database || ''}
                    </Typography>
                  </TableCell>
                  {/* 정렬순서 */}
                  <TableCell align="center" sx={{ py: 0.625 }}>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: textColor }}>
                      {menu.displayOrder || 0}
                    </Typography>
                  </TableCell>
                  {/* 사용여부 체크박스 */}
                  <TableCell align="center" sx={{ py: 0.625 }}>
                    <Checkbox
                      checked={isEnabled}
                      onChange={() => handleToggleEnabled(menu.id)}
                      size="small"
                      color="primary"
                      sx={{
                        transform: 'scale(0.91)',
                        '& .MuiSvgIcon-root': {
                          fontSize: 16
                        }
                      }}
                    />
                  </TableCell>
                  {/* Action 버튼 */}
                  <TableCell align="center" sx={{ py: 0.625 }}>
                    <Tooltip title="편집">
                      <IconButton
                        size="small"
                        onClick={() => handleEditMenu(menu)}
                        sx={{
                          padding: '4px',
                          '& .MuiSvgIcon-root': {
                            fontSize: 16
                          }
                        }}
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

      {/* 메뉴 추가 다이얼로그 */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>새 메뉴 추가</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel
                sx={{
                  fontSize: '12px',
                  '&:not(.MuiInputLabel-shrink)': {
                    top: '50%',
                    transform: 'translate(14px, -50%)'
                  }
                }}
              >
                레벨
              </InputLabel>
              <Select
                value={newMenuData.menu_level}
                label="레벨"
                onChange={(e) => setNewMenuData({ ...newMenuData, menu_level: Number(e.target.value) })}
              >
                <MenuItem value={0}>0 (상위 메뉴)</MenuItem>
                <MenuItem value={1}>1 (하위 메뉴)</MenuItem>
              </Select>
            </FormControl>

            {newMenuData.menu_level === 0 ? (
              <TextField
                label="메뉴 카테고리"
                value={newMenuData.menu_category}
                onChange={(e) => setNewMenuData({ ...newMenuData, menu_category: e.target.value })}
                fullWidth
                required
                placeholder="예: 관리자메뉴, 메인메뉴"
                sx={{
                  '& .MuiInputLabel-root': {
                    fontSize: '12px',
                    '&:not(.MuiInputLabel-shrink)': {
                      top: '50%',
                      transform: 'translate(14px, -50%)'
                    }
                  },
                  '& .MuiInputBase-input': {
                    display: 'flex',
                    alignItems: 'center'
                  },
                  '& .MuiInputBase-input::placeholder': {
                    fontSize: '12px',
                    lineHeight: 'normal'
                  }
                }}
              />
            ) : (
              <FormControl fullWidth required>
                <InputLabel
                  sx={{
                    fontSize: '12px',
                    '&:not(.MuiInputLabel-shrink)': {
                      top: '50%',
                      transform: 'translate(14px, -50%)'
                    }
                  }}
                >
                  상위 메뉴 선택
                </InputLabel>
                <Select
                  value={newMenuData.menu_category}
                  label="상위 메뉴 선택"
                  onChange={(e) => setNewMenuData({ ...newMenuData, menu_category: e.target.value })}
                >
                  {menus
                    .filter((menu) => menu.level === 0)
                    .map((menu) => (
                      <MenuItem key={menu.id} value={menu.category}>
                        {menu.category}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            )}

            <FormControl fullWidth>
              <InputLabel
                sx={{
                  fontSize: '12px',
                  '&:not(.MuiInputLabel-shrink)': {
                    top: '50%',
                    transform: 'translate(14px, -50%)'
                  }
                }}
              >
                아이콘
              </InputLabel>
              <Select
                value={newMenuData.menu_level === 0 ? 'none' : newMenuData.menu_icon}
                label="아이콘"
                onChange={(e) => setNewMenuData({ ...newMenuData, menu_icon: e.target.value })}
                disabled={newMenuData.menu_level === 0}
                renderValue={(value) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {newMenuData.menu_level === 0 ? (
                      <Typography sx={{ color: '#999' }}>0레벨은 아이콘 없음</Typography>
                    ) : (
                      <>
                        {renderIconComponent(value as string)}
                        <Typography>{value}</Typography>
                      </>
                    )}
                  </Box>
                )}
              >
                <MenuItem value="Setting2">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {renderIconComponent('Setting2')}
                    <Typography>Setting2</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="Profile">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {renderIconComponent('Profile')}
                    <Typography>Profile</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="Home3">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {renderIconComponent('Home3')}
                    <Typography>Home3</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="Chart">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {renderIconComponent('Chart')}
                    <Typography>Chart</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="TaskSquare">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {renderIconComponent('TaskSquare')}
                    <Typography>TaskSquare</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="Category2">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {renderIconComponent('Category2')}
                    <Typography>Category2</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="Money">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {renderIconComponent('Money')}
                    <Typography>Money</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="Code">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {renderIconComponent('Code')}
                    <Typography>Code</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="SecurityUser">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {renderIconComponent('SecurityUser')}
                    <Typography>SecurityUser</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="Book1">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {renderIconComponent('Book1')}
                    <Typography>Book1</Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="페이지명"
              value={newMenuData.menu_page}
              onChange={(e) => setNewMenuData({ ...newMenuData, menu_page: e.target.value })}
              fullWidth
              required
              placeholder="예: 시스템설정, 사용자관리"
              sx={{
                '& .MuiInputLabel-root': {
                  fontSize: '12px',
                  '&:not(.MuiInputLabel-shrink)': {
                    top: '50%',
                    transform: 'translate(14px, -50%)'
                  }
                },
                '& .MuiInputBase-input': {
                  display: 'flex',
                  alignItems: 'center'
                },
                '& .MuiInputBase-input::placeholder': {
                  fontSize: '12px',
                  lineHeight: 'normal'
                }
              }}
            />

            <TextField
              label="페이지 주소"
              value={newMenuData.menu_url}
              onChange={(e) => setNewMenuData({ ...newMenuData, menu_url: e.target.value })}
              fullWidth
              placeholder="예: /admin-panel/system-settings"
              sx={{
                '& .MuiInputLabel-root': {
                  fontSize: '12px',
                  '&:not(.MuiInputLabel-shrink)': {
                    top: '50%',
                    transform: 'translate(14px, -50%)'
                  }
                },
                '& .MuiInputBase-input': {
                  display: 'flex',
                  alignItems: 'center'
                },
                '& .MuiInputBase-input::placeholder': {
                  fontSize: '12px',
                  lineHeight: 'normal'
                }
              }}
            />

            <TextField
              label="설명"
              value={newMenuData.menu_description}
              onChange={(e) => setNewMenuData({ ...newMenuData, menu_description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="메뉴에 대한 설명을 입력하세요"
              sx={{
                '& .MuiInputLabel-root': {
                  fontSize: '12px',
                  '&:not(.MuiInputLabel-shrink)': {
                    top: '50%',
                    transform: 'translate(14px, -50%)'
                  }
                },
                '& .MuiInputBase-input': {
                  display: 'flex',
                  alignItems: 'center'
                },
                '& .MuiInputBase-input::placeholder': {
                  fontSize: '12px',
                  lineHeight: 'normal'
                }
              }}
            />

            <TextField
              label="Database"
              value={newMenuData.menu_database}
              onChange={(e) => setNewMenuData({ ...newMenuData, menu_database: e.target.value })}
              fullWidth
              placeholder="예: admin_systemsetting_menu"
              sx={{
                '& .MuiInputLabel-root': {
                  fontSize: '12px',
                  '&:not(.MuiInputLabel-shrink)': {
                    top: '50%',
                    transform: 'translate(14px, -50%)'
                  }
                },
                '& .MuiInputBase-input': {
                  display: 'flex',
                  alignItems: 'center'
                },
                '& .MuiInputBase-input::placeholder': {
                  fontSize: '12px',
                  lineHeight: 'normal'
                }
              }}
            />

            <TextField
              label="정렬순서"
              type="number"
              value={newMenuData.display_order}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setNewMenuData({ ...newMenuData, display_order: isNaN(value) || value < 1 ? 1 : value });
              }}
              fullWidth
              inputProps={{ min: 1 }}
              placeholder={`자동으로 ${newMenuData.display_order}이 설정됩니다`}
              helperText={`현재 최대 순서: ${menus.length > 0 ? Math.max(...menus.map((menu) => menu.displayOrder || 0)) : 0}, 권장 순서: ${newMenuData.display_order}`}
              sx={{
                '& .MuiInputLabel-root': {
                  fontSize: '12px',
                  '&:not(.MuiInputLabel-shrink)': {
                    top: '50%',
                    transform: 'translate(14px, -50%)'
                  }
                },
                '& .MuiInputBase-input': {
                  display: 'flex',
                  alignItems: 'center'
                },
                '& .MuiInputBase-input::placeholder': {
                  fontSize: '12px',
                  lineHeight: 'normal'
                },
                '& .MuiFormHelperText-root': {
                  fontSize: '11px',
                  color: '#666'
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>취소</Button>
          <Button onClick={handleSaveNewMenu} variant="contained">
            추가
          </Button>
        </DialogActions>
      </Dialog>

      {/* 메뉴 편집 다이얼로그 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>메뉴 편집</DialogTitle>
        <DialogContent>
          {editingMenu && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <FormControl fullWidth>
                <InputLabel
                  sx={{
                    fontSize: '12px',
                    '&:not(.MuiInputLabel-shrink)': {
                      top: '50%',
                      transform: 'translate(14px, -50%)'
                    }
                  }}
                >
                  레벨
                </InputLabel>
                <Select
                  value={editingMenu.menu_level}
                  label="레벨"
                  onChange={(e) => setEditingMenu({ ...editingMenu, menu_level: Number(e.target.value) })}
                >
                  <MenuItem value={0}>0 (상위 메뉴)</MenuItem>
                  <MenuItem value={1}>1 (하위 메뉴)</MenuItem>
                </Select>
              </FormControl>

              {editingMenu.menu_level === 0 ? (
                <TextField
                  label="메뉴 카테고리"
                  value={editingMenu.menu_category}
                  onChange={(e) => setEditingMenu({ ...editingMenu, menu_category: e.target.value })}
                  fullWidth
                  required
                  placeholder="예: 관리자메뉴, 메인메뉴"
                  sx={{
                    '& .MuiInputLabel-root': {
                      fontSize: '12px',
                      '&:not(.MuiInputLabel-shrink)': {
                        top: '50%',
                        transform: 'translate(14px, -50%)'
                      }
                    },
                    '& .MuiInputBase-input': {
                      display: 'flex',
                      alignItems: 'center'
                    },
                    '& .MuiInputBase-input::placeholder': {
                      fontSize: '12px',
                      lineHeight: 'normal'
                    }
                  }}
                />
              ) : (
                <FormControl fullWidth required>
                  <InputLabel
                    sx={{
                      fontSize: '12px',
                      '&:not(.MuiInputLabel-shrink)': {
                        top: '50%',
                        transform: 'translate(14px, -50%)'
                      }
                    }}
                  >
                    상위 메뉴 선택
                  </InputLabel>
                  <Select
                    value={editingMenu.menu_category}
                    label="상위 메뉴 선택"
                    onChange={(e) => setEditingMenu({ ...editingMenu, menu_category: e.target.value })}
                  >
                    {menus
                      .filter((menu) => menu.level === 0)
                      .map((menu) => (
                        <MenuItem key={menu.id} value={menu.category}>
                          {menu.category}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              )}

              <FormControl fullWidth>
                <InputLabel
                  sx={{
                    fontSize: '12px',
                    '&:not(.MuiInputLabel-shrink)': {
                      top: '50%',
                      transform: 'translate(14px, -50%)'
                    }
                  }}
                >
                  아이콘
                </InputLabel>
                <Select
                  value={editingMenu.menu_level === 0 ? 'none' : editingMenu.menu_icon}
                  label="아이콘"
                  onChange={(e) => setEditingMenu({ ...editingMenu, menu_icon: e.target.value })}
                  disabled={editingMenu.menu_level === 0}
                  renderValue={(value) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {editingMenu.menu_level === 0 ? (
                        <Typography sx={{ color: '#999' }}>0레벨은 아이콘 없음</Typography>
                      ) : (
                        <>
                          {renderIconComponent(value as string)}
                          <Typography>{value}</Typography>
                        </>
                      )}
                    </Box>
                  )}
                >
                  <MenuItem value="Setting2">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {renderIconComponent('Setting2')}
                      <Typography>Setting2</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="Profile">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {renderIconComponent('Profile')}
                      <Typography>Profile</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="Home3">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {renderIconComponent('Home3')}
                      <Typography>Home3</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="Chart">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {renderIconComponent('Chart')}
                      <Typography>Chart</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="TaskSquare">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {renderIconComponent('TaskSquare')}
                      <Typography>TaskSquare</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="Category2">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {renderIconComponent('Category2')}
                      <Typography>Category2</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="Money">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {renderIconComponent('Money')}
                      <Typography>Money</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="Code">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {renderIconComponent('Code')}
                      <Typography>Code</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="SecurityUser">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {renderIconComponent('SecurityUser')}
                      <Typography>SecurityUser</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="Book1">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {renderIconComponent('Book1')}
                      <Typography>Book1</Typography>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="페이지명"
                value={editingMenu.menu_page}
                onChange={(e) => setEditingMenu({ ...editingMenu, menu_page: e.target.value })}
                fullWidth
                required
                placeholder="예: 시스템설정, 사용자관리"
                sx={{
                  '& .MuiInputLabel-root': {
                    fontSize: '12px',
                    '&:not(.MuiInputLabel-shrink)': {
                      top: '50%',
                      transform: 'translate(14px, -50%)'
                    }
                  },
                  '& .MuiInputBase-input': {
                    display: 'flex',
                    alignItems: 'center'
                  },
                  '& .MuiInputBase-input::placeholder': {
                    fontSize: '12px',
                    lineHeight: 'normal'
                  }
                }}
              />

              <TextField
                label="페이지 주소"
                value={editingMenu.menu_url}
                onChange={(e) => setEditingMenu({ ...editingMenu, menu_url: e.target.value })}
                fullWidth
                placeholder="예: /admin-panel/system-settings"
                sx={{
                  '& .MuiInputLabel-root': {
                    fontSize: '12px',
                    '&:not(.MuiInputLabel-shrink)': {
                      top: '50%',
                      transform: 'translate(14px, -50%)'
                    }
                  },
                  '& .MuiInputBase-input': {
                    display: 'flex',
                    alignItems: 'center'
                  },
                  '& .MuiInputBase-input::placeholder': {
                    fontSize: '12px',
                    lineHeight: 'normal'
                  }
                }}
              />

              <TextField
                label="설명"
                value={editingMenu.menu_description}
                onChange={(e) => setEditingMenu({ ...editingMenu, menu_description: e.target.value })}
                fullWidth
                multiline
                rows={3}
                placeholder="메뉴에 대한 설명을 입력하세요"
                sx={{
                  '& .MuiInputLabel-root': {
                    fontSize: '12px',
                    '&:not(.MuiInputLabel-shrink)': {
                      top: '50%',
                      transform: 'translate(14px, -50%)'
                    }
                  },
                  '& .MuiInputBase-input': {
                    display: 'flex',
                    alignItems: 'center'
                  },
                  '& .MuiInputBase-input::placeholder': {
                    fontSize: '12px',
                    lineHeight: 'normal'
                  }
                }}
              />

              <TextField
                label="Database"
                value={editingMenu.menu_database}
                onChange={(e) => setEditingMenu({ ...editingMenu, menu_database: e.target.value })}
                fullWidth
                placeholder="예: admin_systemsetting_menu"
                sx={{
                  '& .MuiInputLabel-root': {
                    fontSize: '12px',
                    '&:not(.MuiInputLabel-shrink)': {
                      top: '50%',
                      transform: 'translate(14px, -50%)'
                    }
                  },
                  '& .MuiInputBase-input': {
                    display: 'flex',
                    alignItems: 'center'
                  },
                  '& .MuiInputBase-input::placeholder': {
                    fontSize: '12px',
                    lineHeight: 'normal'
                  }
                }}
              />

              <TextField
                label="정렬순서"
                type="number"
                value={editingMenu.display_order}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setEditingMenu({ ...editingMenu, display_order: isNaN(value) || value < 1 ? 1 : value });
                }}
                fullWidth
                inputProps={{ min: 1 }}
                placeholder="메뉴 표시 순서를 입력하세요"
                helperText={`현재 최대 순서: ${menus.length > 0 ? Math.max(...menus.map((menu) => menu.displayOrder || 0)) : 0} (1부터 시작)`}
                sx={{
                  '& .MuiInputLabel-root': {
                    fontSize: '12px',
                    '&:not(.MuiInputLabel-shrink)': {
                      top: '50%',
                      transform: 'translate(14px, -50%)'
                    }
                  },
                  '& .MuiInputBase-input': {
                    display: 'flex',
                    alignItems: 'center'
                  },
                  '& .MuiInputBase-input::placeholder': {
                    fontSize: '12px',
                    lineHeight: 'normal'
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: '11px',
                    color: '#666'
                  }
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>취소</Button>
          <Button onClick={handleSaveEditMenu} variant="contained">
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

SystemMenuPermissionsTable.displayName = 'SystemMenuPermissionsTable';

export default SystemMenuPermissionsTable;
