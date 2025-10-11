import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  TextField,
  Grid,
  Box,
  Tabs,
  Tab,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  CloseSquare,
  Setting2,
  Category2,
  Profile,
  Element,
  Chart,
  Message,
  Calendar1,
  TaskSquare,
  DocumentText,
  Task,
  Code,
  TrendUp,
  TickSquare,
  Shield,
  Book1,
  Money,
  Box as BoxIcon,
  ShoppingBag,
  Receipt,
  SecurityUser,
  Home3,
  Calendar,
  MoneyRecive
} from '@wandersonalwes/iconsax-react';

// 메뉴 아이템 import
import menuItems from 'menu-items';

// 권한 타입
interface Permission {
  read: boolean;
  write: boolean;
  select: boolean;
}

// 페이지 권한 타입
interface PagePermission {
  page: string;
  category: string;
  url: string;
  level: number;
  icon?: string;
  permissions: Permission;
}

// 메뉴 데이터 타입
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
  lastModifiedDate: string;
  lastModifiedBy: string;
  pagePermissions?: PagePermission[];
}

interface MenuEditDialogProps {
  open: boolean;
  onClose: () => void;
  menu: MenuData | null;
  onSave: (menu: MenuData) => void;
}

// TabPanel 컴포넌트
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`menu-tabpanel-${index}`} aria-labelledby={`menu-tab-${index}`} {...other}>
      {value === index && <Box sx={{ px: 4, py: 4 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `menu-tab-${index}`,
    'aria-controls': `menu-tabpanel-${index}`
  };
}

// 메뉴 아이템을 플랫하게 변환하는 함수 (시스템설정 페이지와 동일)
const flattenMenuItems = (items: any[]): any[] => {
  const result: any[] = [];

  items.forEach((item) => {
    if (item.type === 'group') {
      result.push({ ...item, level: 0 });
      if (item.children) {
        item.children.forEach((child: any) => {
          if (child.type === 'collapse') {
            result.push({ ...child, level: 1 });
            if (child.children) {
              child.children.forEach((grandChild: any) => {
                result.push({ ...grandChild, level: 2 });
              });
            }
          } else {
            result.push({ ...child, level: 1 });
          }
        });
      }
    } else if (item.type === 'collapse') {
      result.push({ ...item, level: 0 });
      if (item.children) {
        item.children.forEach((child: any) => {
          result.push({ ...child, level: 1 });
        });
      }
    } else {
      result.push({ ...item, level: 0 });
    }
  });

  return result;
};

// 실제 메뉴 아이템에서 페이지 권한 생성
const createPagePermissionsFromMenuItems = (): PagePermission[] => {
  const flatMenuItems = flattenMenuItems(menuItems.items);

  return flatMenuItems.map((item, index) => {
    // 상위 그룹 찾기 (0레벨인 경우 자신이 그룹)
    let parentGroup = item.title;
    if (item.level > 0) {
      // 현재 아이템보다 앞에 있는 0레벨 아이템을 찾기
      for (let i = index - 1; i >= 0; i--) {
        if (flatMenuItems[i].level === 0) {
          parentGroup = flatMenuItems[i].title;
          break;
        }
      }
    }

    return {
      page: item.title,
      category: parentGroup,
      url: item.url || '/',
      level: item.level,
      icon: item.icon,
      permissions: { read: false, write: false, select: false }
    };
  });
};

// 기본 페이지 권한 목록 (실제 사이드바 메뉴에서 동적 생성)
const defaultPagePermissions: PagePermission[] = createPagePermissionsFromMenuItems();

export default function MenuEditDialog({ open, onClose, menu, onSave }: MenuEditDialogProps) {
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState<MenuData>({
    id: 0,
    no: 0,
    registrationDate: new Date().toISOString().split('T')[0],
    code: '',
    menu: '',
    description: '',
    userCount: 0,
    permissionCount: 0,
    status: '활성',
    lastModifiedDate: new Date().toISOString().split('T')[0],
    lastModifiedBy: '현재사용자',
    pagePermissions: [...defaultPagePermissions]
  });

  // menu가 변경될 때 formData 업데이트
  useEffect(() => {
    if (menu) {
      setFormData({
        ...menu,
        pagePermissions: menu.pagePermissions || [...defaultPagePermissions]
      });
    } else {
      // 새 메뉴 생성시 초기값
      const currentDate = new Date().toISOString().split('T')[0];
      const currentYear = new Date().getFullYear();
      const yearSuffix = currentYear.toString().slice(-2);

      setFormData({
        id: Date.now(),
        no: 0,
        registrationDate: currentDate,
        code: `MENU-${yearSuffix}-001`,
        menu: '',
        description: '',
        userCount: 0,
        permissionCount: 0,
        status: '활성',
        lastModifiedDate: currentDate,
        lastModifiedBy: '현재사용자',
        pagePermissions: [...defaultPagePermissions]
      });
    }
  }, [menu]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = (field: keyof MenuData) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSelectChange = (field: keyof MenuData) => (event: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  // 아이콘 컴포넌트 렌더링 함수 (실제 사이드바 아이콘 사용)
  const renderIconComponent = (IconComponent: any) => {
    if (!IconComponent) return null;
    return <IconComponent size={18} color="#666" />;
  };

  // 권한 변경 핸들러
  const handlePermissionChange = (pageIndex: number, permissionType: keyof Permission) => {
    setFormData((prev) => {
      const updatedPermissions =
        prev.pagePermissions?.map((pagePermission, index) => {
          if (index === pageIndex) {
            const newPermissionValue = !pagePermission.permissions[permissionType];

            // 0레벨 메뉴를 선택/해제할 때 하위 메뉴도 함께 변경
            if (pagePermission.level === 0) {
              const category = pagePermission.category;
              return {
                ...pagePermission,
                permissions: {
                  ...pagePermission.permissions,
                  [permissionType]: newPermissionValue
                }
              };
            } else {
              return {
                ...pagePermission,
                permissions: {
                  ...pagePermission.permissions,
                  [permissionType]: newPermissionValue
                }
              };
            }
          }

          // 0레벨 메뉴가 변경될 때 같은 카테고리의 하위 메뉴들도 변경
          const changedPage = prev.pagePermissions?.[pageIndex];
          if (changedPage?.level === 0 && pagePermission.level > 0 && pagePermission.category === changedPage.page) {
            const newPermissionValue = !changedPage.permissions[permissionType];
            return {
              ...pagePermission,
              permissions: {
                ...pagePermission.permissions,
                [permissionType]: newPermissionValue
              }
            };
          }

          return pagePermission;
        }) || [];

      return {
        ...prev,
        pagePermissions: updatedPermissions
      };
    });
  };

  const handleSave = () => {
    onSave(formData);
  };

  const handleClose = () => {
    setTabValue(0);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '840px',
          maxHeight: '840px',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          pb: 1
        }}
      >
        <Box>
          <Typography variant="h6" component="div">
            메뉴관리 편집
          </Typography>
          {menu && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {menu.code} - {menu.menu}
            </Typography>
          )}
        </Box>

        {/* 취소, 저장 버튼을 오른쪽 상단으로 이동 */}
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          <Button onClick={handleClose} variant="outlined" size="small" sx={{ minWidth: '60px' }}>
            취소
          </Button>
          <Button onClick={handleSave} variant="contained" size="small" sx={{ minWidth: '60px' }}>
            저장
          </Button>
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 0.5 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="메뉴 편집 탭"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary.main'
            },
            '& .MuiTab-root': {
              borderRight: 'none !important',
              borderLeft: 'none !important',
              '&::after': {
                display: 'none'
              },
              '&::before': {
                display: 'none'
              }
            },
            '& .MuiTabs-flexContainer': {
              '& > button': {
                borderRight: 'none !important',
                borderLeft: 'none !important',
                '&:not(:last-child)::after': {
                  display: 'none'
                }
              }
            },
            '& .MuiTabs-scroller': {
              '& .MuiTabs-flexContainer': {
                '& .MuiButtonBase-root': {
                  borderRight: 'none !important',
                  borderLeft: 'none !important'
                }
              }
            }
          }}
        >
          <Tab
            label="개요"
            {...a11yProps(0)}
            sx={{
              borderRight: 'none !important',
              borderLeft: 'none !important',
              '&::after': {
                display: 'none'
              }
            }}
          />
          <Tab
            label="메뉴"
            {...a11yProps(1)}
            sx={{
              borderRight: 'none !important',
              borderLeft: 'none !important',
              '&::after': {
                display: 'none'
              }
            }}
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
        <TabPanel value={tabValue} index={0}>
          {/* 개요 탭 - 간소화된 레이아웃 */}
          <Box sx={{ height: '650px', overflowY: 'auto', pr: 1, px: 1, py: 1 }}>
            <Stack spacing={3}>
              {/* 메뉴 - 전체 너비 */}
              <TextField
                fullWidth
                label={
                  <span>
                    메뉴 <span style={{ color: 'red' }}>*</span>
                  </span>
                }
                value={formData.menu}
                onChange={handleInputChange('menu')}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />

              {/* 설명 - 전체 너비 */}
              <TextField
                fullWidth
                label="설명"
                multiline
                rows={4}
                value={formData.description}
                onChange={handleInputChange('description')}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />

              {/* 등록자, 상태 - 2등분 배치 */}
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="등록자"
                  value={formData.lastModifiedBy}
                  onChange={handleInputChange('lastModifiedBy')}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />

                <FormControl fullWidth>
                  <InputLabel shrink>상태</InputLabel>
                  <Select value={formData.status} label="상태" onChange={handleSelectChange('status')}>
                    <MenuItem value="활성">활성</MenuItem>
                    <MenuItem value="비활성">비활성</MenuItem>
                    <MenuItem value="대기">대기</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              {/* 등록일, 코드 - 2등분 배치 */}
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="등록일"
                  type="date"
                  value={formData.registrationDate}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  disabled
                />

                <TextField fullWidth label="코드" value={formData.code} variant="outlined" InputLabelProps={{ shrink: true }} disabled />
              </Stack>
            </Stack>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* 메뉴 탭 - 권한 설정 */}
          <Box sx={{ px: 1, py: 1, height: 'calc(100vh - 280px)', overflow: 'hidden' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              페이지 권한 설정
            </Typography>

            <TableContainer
              component={Paper}
              sx={{
                height: 'calc(100% - 60px)',
                border: 'none',
                boxShadow: 'none',
                overflowY: 'auto',
                overflowX: 'hidden'
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
                      읽기
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
                      쓰기
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
                      전체
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.pagePermissions?.map((pagePermission, index) => {
                    // 읽기나 쓰기 권한이 하나라도 선택되어 있는지 확인
                    const hasAnyPermission = pagePermission.permissions.read || pagePermission.permissions.write;
                    const textColor = hasAnyPermission ? '#000000' : '#999999';

                    return (
                      <TableRow
                        key={`${pagePermission.category}-${pagePermission.page}`}
                        hover
                        sx={{
                          backgroundColor: pagePermission.level === 0 ? '#e3f2fd' : 'transparent'
                        }}
                      >
                        {/* 레벨 */}
                        <TableCell align="center" sx={{ py: 0.625 }}>
                          <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 500, color: textColor }}>
                            {pagePermission.level}
                          </Typography>
                        </TableCell>
                        {/* 메뉴 */}
                        <TableCell sx={{ fontWeight: 500, py: 2.5 }}>
                          <Typography variant="body2" sx={{ fontSize: '12px', color: textColor }}>
                            {pagePermission.category}
                          </Typography>
                        </TableCell>
                        {/* 아이콘 */}
                        <TableCell align="center" sx={{ py: 0.625 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>{renderIconComponent(pagePermission.icon)}</Box>
                        </TableCell>
                        {/* 페이지 */}
                        <TableCell sx={{ py: 0.625 }}>
                          <Typography variant="body2" sx={{ fontSize: '12px', color: textColor }}>
                            {pagePermission.page}
                          </Typography>
                        </TableCell>
                        {/* 페이지주소 */}
                        <TableCell sx={{ py: 1 }}>
                          <Typography variant="body2" sx={{ fontSize: '12px', fontFamily: 'monospace', color: textColor }}>
                            {pagePermission.url}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 0.625 }}>
                          <Checkbox
                            checked={pagePermission.permissions.read}
                            onChange={() => handlePermissionChange(index, 'read')}
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
                        <TableCell align="center" sx={{ py: 0.625 }}>
                          <Checkbox
                            checked={pagePermission.permissions.write}
                            onChange={() => handlePermissionChange(index, 'write')}
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
                        <TableCell align="center" sx={{ py: 0.625 }}>
                          <Checkbox
                            checked={
                              pagePermission.permissions.read && pagePermission.permissions.write && pagePermission.permissions.select
                            }
                            onChange={() => {
                              const allSelected =
                                pagePermission.permissions.read && pagePermission.permissions.write && pagePermission.permissions.select;
                              const newPermissions = {
                                read: !allSelected,
                                write: !allSelected,
                                select: !allSelected
                              };

                              setFormData((prev) => {
                                const updatedPermissions =
                                  prev.pagePermissions?.map((p, i) => {
                                    if (i === index) {
                                      return { ...p, permissions: newPermissions };
                                    }

                                    // 0레벨 메뉴의 모두선택을 누르면 하위 메뉴들도 모두 변경
                                    if (pagePermission.level === 0 && p.level > 0 && p.category === pagePermission.page) {
                                      return { ...p, permissions: newPermissions };
                                    }

                                    return p;
                                  }) || [];

                                return {
                                  ...prev,
                                  pagePermissions: updatedPermissions
                                };
                              });
                            }}
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
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
}
