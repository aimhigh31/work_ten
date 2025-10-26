import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  CircularProgress,
  Alert,
  Avatar
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { useCommonData } from 'contexts/CommonDataContext';
import {
  CloseSquare,
  Setting2,
  Profile,
  SecurityUser,
  Category2,
  Setting3,
  Home3,
  Code,
  TaskSquare,
  Money
} from '@wandersonalwes/iconsax-react';

// 역할 데이터 타입
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

// TabPanel 컴포넌트
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`role-tabpanel-${index}`} aria-labelledby={`role-tab-${index}`} {...other}>
      {value === index && <Box sx={{ px: 3, py: 0, pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `role-tab-${index}`,
    'aria-controls': `role-tabpanel-${index}`
  };
}

interface RoleEditDialogProps {
  open: boolean;
  onClose: () => void;
  role: RoleData | null;
  onSave: (role: RoleData) => void;
}

export default function RoleEditDialog({ open, onClose, role, onSave }: RoleEditDialogProps) {
  const { data: session } = useSession();
  const { users } = useCommonData();
  const [tabValue, setTabValue] = useState(0);
  const [validationError, setValidationError] = useState<string>('');
  const [formData, setFormData] = useState<RoleData>({
    id: 0,
    no: 0,
    registrationDate: new Date().toISOString().split('T')[0],
    code: '',
    role: '',
    description: '',
    userCount: 0,
    permissionCount: 0,
    status: '활성',
    registeredBy: session?.user?.name || 'system',
    lastModifiedDate: new Date().toISOString().split('T')[0],
    lastModifiedBy: session?.user?.name || 'system'
  });

  // 등록자 프로필 이미지 찾기
  const getUserProfileImage = useCallback(
    (userName: string) => {
      if (!userName || users.length === 0) return null;
      const user = users.find((u) => u.user_name === userName);
      return user?.profile_image_url || user?.avatar_url || null;
    },
    [users]
  );

  // 권한 데이터 상태 관리
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 아이콘 매핑
  const iconMap: { [key: string]: any } = {
    Setting2: Setting2,
    Profile: Profile,
    SecurityUser: SecurityUser,
    Category2: Category2,
    Setting3: Setting3,
    Home3: Home3,
    Code: Code,
    TaskSquare: TaskSquare,
    Money: Money
  };

  // 시스템 메뉴 및 권한 데이터 로드
  useEffect(() => {
    const fetchRolePermissions = async () => {
      if (!open) return;

      setLoading(true);
      try {
        // 역할 권한 정보를 가져오기 (새 역할이면 빈 권한, 기존 역할이면 저장된 권한)
        const response = await fetch(`/api/role-permissions${role?.id ? `?roleCode=${role.code}` : ''}`);
        const result = await response.json();

        if (result.success) {
          // 메뉴 목록 가져오기
          const menus = result.menus || [];

          let transformedData = [];

          if (role?.id) {
            // 기존 역할: 저장된 권한과 메뉴 정보 조합
            const roleData = result.roles?.[0];
            const detailedPermissions = roleData?.detailed_permissions || [];

            transformedData = menus.map((menu: any) => {
              const permission = detailedPermissions.find((p: any) => p.menu_id === menu.id);
              console.log(`📋 메뉴 ${menu.id} (${menu.menu_category}) 레벨 ${menu.menu_level}:`, permission ? '권한 있음' : '권한 없음');
              // 메뉴 레벨 결정 로직
              let menuLevel = menu.menu_level;
              if (!menuLevel && menuLevel !== 0) {
                // menu_level 필드가 없는 경우, 카테고리에 따라 레벨 결정
                if (menu.menu_category === '관리자메뉴') {
                  menuLevel = 0; // 관리자메뉴는 레벨 0
                } else if (menu.menu_category === '메인메뉴') {
                  menuLevel = 1; // 메인메뉴는 레벨 1
                } else {
                  menuLevel = 0; // 기본값
                }
              }

              return {
                id: menu.id,
                level: menuLevel,
                category: menu.menu_category || '',
                icon: iconMap[menu.menu_icon] || Setting2,
                page: menu.menu_page || '',
                url: menu.menu_url || '',
                description: menu.menu_description || '',
                read: permission?.can_read || false,
                write: permission?.can_write || false,
                full: permission?.can_full || false
              };
            });
          } else {
            // 새 역할: 모든 권한 false로 시작
            transformedData = menus.map((menu: any) => {
              // 메뉴 레벨 결정 로직
              let menuLevel = menu.menu_level;
              if (!menuLevel && menuLevel !== 0) {
                // menu_level 필드가 없는 경우, 카테고리에 따라 레벨 결정
                if (menu.menu_category === '관리자메뉴') {
                  menuLevel = 0; // 관리자메뉴는 레벨 0
                } else if (menu.menu_category === '메인메뉴') {
                  menuLevel = 1; // 메인메뉴는 레벨 1
                } else {
                  menuLevel = 0; // 기본값
                }
              }

              console.log(`📋 새 역할 - 메뉴 ${menu.id} (${menu.menu_category}) 레벨 ${menuLevel}`);
              return {
                id: menu.id,
                level: menuLevel,
                category: menu.menu_category || '',
                icon: iconMap[menu.menu_icon] || Setting2,
                page: menu.menu_page || '',
                url: menu.menu_url || '',
                description: menu.menu_description || '',
                read: false,
                write: false,
                full: false
              };
            });
          }

          setPermissions(transformedData);
        }
      } catch (error) {
        console.error('권한 데이터 로드 실패:', error);
        // 에러 시 기본 메뉴 데이터 사용
        setPermissions([
          {
            id: 1,
            level: 0,
            category: '관리자',
            icon: Setting2,
            page: '시스템설정',
            url: '/admin/system-settings',
            description: '시스템 설정 및 관리',
            read: false,
            write: false,
            full: false
          },
          {
            id: 2,
            level: 0,
            category: '사용자관리',
            icon: Profile,
            page: '사용자관리',
            url: '/admin/user-management',
            description: '사용자 계정 관리',
            read: false,
            write: false,
            full: false
          },
          {
            id: 3,
            level: 0,
            category: '역할관리',
            icon: SecurityUser,
            page: '역할관리',
            url: '/admin/role-management',
            description: '역할 및 권한 관리',
            read: false,
            write: false,
            full: false
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRolePermissions();
  }, [open, role?.id]);

  // role이 변경될 때 formData 업데이트
  useEffect(() => {
    if (role) {
      setFormData({ ...role });
    } else {
      // 새 역할 생성시 초기값
      const currentDate = new Date().toISOString().split('T')[0];
      const currentYear = new Date().getFullYear();
      const yearSuffix = currentYear.toString().slice(-2);

      setFormData({
        id: 0, // 새 역할의 경우 임시 ID
        no: 0,
        registrationDate: currentDate,
        code: `ROLE-${yearSuffix}-NEW`,
        role: '',
        description: '',
        userCount: 0,
        permissionCount: 0,
        status: '활성',
        registeredBy: session?.user?.name || 'system',
        lastModifiedDate: currentDate,
        lastModifiedBy: session?.user?.name || 'system'
      });
    }
  }, [role, session]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 권한 체크박스 변경 핸들러
  const handlePermissionChange = (id: string, type: 'read' | 'write' | 'full') => {
    setPermissions((prev) => {
      // 클릭된 항목 찾기
      const clickedItem = prev.find((p) => p.id === id);
      if (!clickedItem) return prev;

      // 레벨 0 항목인 경우 (카테고리 관계없이)
      const isLevel0Item = clickedItem.level === 0;

      return prev.map((perm) => {
        // 클릭된 항목 처리
        if (perm.id === id) {
          if (type === 'full') {
            // 전체 클릭 시 읽기/쓰기도 함께 변경
            const newFullValue = !perm.full;
            return {
              ...perm,
              full: newFullValue,
              read: newFullValue,
              write: newFullValue
            };
          } else {
            // 읽기/쓰기 클릭 시
            const newValue = !perm[type];
            const updates: any = { [type]: newValue };

            // 읽기나 쓰기 중 하나라도 false면 전체도 false
            if (type === 'read' && !newValue) {
              updates.full = false;
            } else if (type === 'write' && !newValue) {
              updates.full = false;
            }
            // 읽기와 쓰기가 모두 true면 전체도 true
            else if ((type === 'read' && newValue && perm.write) || (type === 'write' && newValue && perm.read)) {
              updates.full = true;
            }

            return { ...perm, ...updates };
          }
        }

        // 레벨 0 항목의 권한 클릭 시 하위 항목들도 변경
        if (isLevel0Item) {
          // 같은 카테고리의 하위 항목들 (레벨 1)
          if (perm.level === 1 && perm.category === clickedItem.category) {
            if (type === 'full') {
              // 전체 클릭 시 모든 권한 연동
              const newFullValue = !clickedItem.full;
              return {
                ...perm,
                full: newFullValue,
                read: newFullValue,
                write: newFullValue
              };
            } else if (type === 'read') {
              // 읽기 클릭 시 하위 항목의 읽기만 연동
              const newReadValue = !clickedItem.read;
              const updates: any = { read: newReadValue };
              // 읽기가 false면 전체도 false
              if (!newReadValue) {
                updates.full = false;
              }
              // 읽기와 쓰기가 모두 true면 전체도 true
              else if (newReadValue && perm.write) {
                updates.full = true;
              }
              return { ...perm, ...updates };
            } else if (type === 'write') {
              // 쓰기 클릭 시 하위 항목의 쓰기만 연동
              const newWriteValue = !clickedItem.write;
              const updates: any = { write: newWriteValue };
              // 쓰기가 false면 전체도 false
              if (!newWriteValue) {
                updates.full = false;
              }
              // 읽기와 쓰기가 모두 true면 전체도 true
              else if (perm.read && newWriteValue) {
                updates.full = true;
              }
              return { ...perm, ...updates };
            }
          }
        }

        return perm;
      });
    });
  };

  const handleInputChange = (field: keyof RoleData) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSelectChange = (field: keyof RoleData) => (event: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSave = async () => {
    // 필수값 검증
    if (!formData.role || !formData.role.trim()) {
      setValidationError('역할명은 필수 입력 항목입니다.');
      return;
    }

    // 검증 통과 시 에러 초기화
    setValidationError('');

    // 기본 역할 정보 저장을 먼저 수행
    const updatedRole = { ...formData };

    try {
      // 부모 컴포넌트에 역할 정보 전달 (역할 생성/수정)
      onSave(updatedRole);

      // 기존 역할인 경우에만 권한 저장 시도
      if (role?.id && permissions.length > 0) {
        console.log('🔄 기존 역할 권한 저장 시작...');

        const permissionData = permissions.map((perm) => {
          console.log(`🔍 메뉴 ${perm.id} (${perm.category}): read=${perm.read}, write=${perm.write}, full=${perm.full}`);
          return {
            menuId: perm.id,
            canRead: perm.read,
            canWrite: perm.write,
            canFull: perm.full
          };
        });

        console.log('📤 권한 저장 요청:', {
          roleId: role.id,
          totalPermissions: permissionData.length,
          activePermissions: permissionData.filter((p) => p.canRead || p.canWrite || p.canFull).length
        });

        const response = await fetch('/api/role-permissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'permissions',
            roleId: role.id,
            permissions: permissionData
          })
        });

        const responseText = await response.text();
        if (!responseText) {
          throw new Error('서버에서 빈 응답을 받았습니다.');
        }

        const result = JSON.parse(responseText);

        if (!result.success) {
          console.error('❌ 권한 저장 실패:', result.error);
          return;
        }

        console.log('✅ 권한 저장 성공:', result.message);
      } else if (!role?.id) {
        console.log('ℹ️ 새 역할의 경우 역할 생성 후 권한 설정이 가능합니다.');
      }
    } catch (error) {
      console.error('💥 저장 중 오류:', error);
    }
  };

  const handleClose = () => {
    setTabValue(0);
    setValidationError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          height: '80vh',
          maxHeight: '800px',
          width: '90vw',
          maxWidth: '1200px',
          overflow: 'visible'
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
          <Typography variant="h6" component="div" sx={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.75)', fontWeight: 500 }}>
            역할관리 편집
          </Typography>
          {role && (
            <Typography variant="body2" sx={{ fontSize: '12px', color: '#666666', fontWeight: 500, mt: 0.5 }}>
              {role.role} ({role.code})
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

      <DialogContent sx={{ p: 0, height: '100%', overflow: 'visible' }}>
        {/* 탭 헤더 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="role tabs">
            <Tab label="개요" {...a11yProps(0)} />
            <Tab label="역할" {...a11yProps(1)} />
          </Tabs>
        </Box>

        {/* 개요 탭 */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ height: '650px', overflowY: 'auto', pr: 1, pt: 2 }}>
            <Stack spacing={3}>
              {/* 역할명 */}
              <TextField
                fullWidth
                label="역할명"
                placeholder="역할명을 입력하세요"
                value={formData.role}
                onChange={handleInputChange('role')}
                variant="outlined"
                required
                InputLabelProps={{
                  shrink: true
                }}
                sx={{ mt: 3 }}
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

              {/* 등록자, 상태, 마지막수정일 - 3등분 배치 */}
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  disabled
                  label="등록자"
                  value={formData.registeredBy}
                  InputLabelProps={{
                    shrink: true
                  }}
                  InputProps={{
                    startAdornment: (
                      <Avatar
                        src={getUserProfileImage(formData.registeredBy) || ''}
                        alt={formData.registeredBy}
                        sx={{ width: 24, height: 24, mr: 0.25 }}
                      >
                        {formData.registeredBy?.charAt(0)}
                      </Avatar>
                    )
                  }}
                  sx={{
                    '& .MuiInputBase-root.Mui-disabled': {
                      backgroundColor: '#f5f5f5'
                    },
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: 'rgba(0, 0, 0, 0.7)'
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(0, 0, 0, 0.7)'
                    },
                    '& .MuiInputLabel-root.Mui-disabled': {
                      color: 'rgba(0, 0, 0, 0.7)'
                    }
                  }}
                />

                <FormControl fullWidth>
                  <InputLabel shrink>상태</InputLabel>
                  <Select
                    value={formData.status}
                    label="상태"
                    onChange={handleSelectChange('status')}
                    renderValue={(selected) => {
                      const statusConfig = {
                        대기: { bgColor: '#f5f5f5', color: '#616161' },
                        활성: { bgColor: '#e3f2fd', color: '#1565c0' },
                        비활성: { bgColor: '#fff8e1', color: '#f57c00' }
                      };
                      const config = statusConfig[selected as keyof typeof statusConfig];
                      return (
                        <Chip
                          label={selected}
                          size="small"
                          sx={{
                            bgcolor: config?.bgColor,
                            color: config?.color,
                            fontWeight: 500,
                            border: 'none'
                          }}
                        />
                      );
                    }}
                  >
                    <MenuItem value="대기">
                      <Chip
                        label="대기"
                        size="small"
                        sx={{
                          bgcolor: '#f5f5f5',
                          color: '#616161',
                          fontWeight: 500,
                          border: 'none'
                        }}
                      />
                    </MenuItem>
                    <MenuItem value="활성">
                      <Chip
                        label="활성"
                        size="small"
                        sx={{
                          bgcolor: '#e3f2fd',
                          color: '#1565c0',
                          fontWeight: 500,
                          border: 'none'
                        }}
                      />
                    </MenuItem>
                    <MenuItem value="비활성">
                      <Chip
                        label="비활성"
                        size="small"
                        sx={{
                          bgcolor: '#fff8e1',
                          color: '#f57c00',
                          fontWeight: 500,
                          border: 'none'
                        }}
                      />
                    </MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="마지막수정일"
                  value={formData.lastModifiedDate}
                  onChange={handleInputChange('lastModifiedDate')}
                  variant="outlined"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  disabled
                />
              </Stack>

              {/* 등록일, 코드 - 2등분 배치 */}
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="등록일"
                  value={formData.registrationDate}
                  onChange={handleInputChange('registrationDate')}
                  variant="outlined"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  disabled
                />

                <TextField
                  fullWidth
                  label="코드"
                  value={formData.code}
                  onChange={handleInputChange('code')}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  disabled
                />
              </Stack>
            </Stack>
          </Box>
        </TabPanel>

        {/* 역할 탭 - SystemMenuPermissionsTable 복사 */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ height: '650px', display: 'flex', flexDirection: 'column', pr: 1, overflowY: 'hidden' }}>
            {/* 헤더 */}
            <Box sx={{ px: 0, py: 1.2, flexShrink: 0 }}>
              <Typography variant="h6" sx={{ mb: 0.6 }}>
                메뉴 권한 설정
              </Typography>
              <Typography variant="body2" color="text.secondary">
                각 메뉴에 대한 사용 여부와 설명을 관리합니다. (총 {permissions.length}개 메뉴)
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer
                sx={{
                  flex: 1,
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  boxShadow: 'none',
                  overflowY: 'auto',
                  overflowX: 'auto',
                  mx: 0,
                  mb: 1.8,
                  minHeight: 0,
                  maxHeight: 'calc(650px - 100px)',
                  '&::-webkit-scrollbar': {
                    width: '8px',
                    height: '8px'
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: '#f1f1f1',
                    borderRadius: '4px'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#888',
                    borderRadius: '4px',
                    '&:hover': {
                      backgroundColor: '#555'
                    }
                  }
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
                  <TableHead sx={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8f9fa' }}>
                    <TableRow>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: '#f8f9fa',
                          py: 0.375,
                          width: 60,
                          borderTop: '1px solid #e0e0e0',
                          borderBottom: '1px solid #e0e0e0',
                          position: 'sticky',
                          top: 0,
                          zIndex: 2
                        }}
                      >
                        레벨
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: '#f8f9fa',
                          py: 0.375,
                          width: 120,
                          borderTop: '1px solid #e0e0e0',
                          borderBottom: '1px solid #e0e0e0',
                          position: 'sticky',
                          top: 0,
                          zIndex: 2
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
                          width: 50,
                          borderTop: '1px solid #e0e0e0',
                          borderBottom: '1px solid #e0e0e0',
                          position: 'sticky',
                          top: 0,
                          zIndex: 2
                        }}
                      >
                        아이콘
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: '#f8f9fa',
                          py: 0.375,
                          width: 120,
                          borderTop: '1px solid #e0e0e0',
                          borderBottom: '1px solid #e0e0e0',
                          position: 'sticky',
                          top: 0,
                          zIndex: 2
                        }}
                      >
                        페이지
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: '#f8f9fa',
                          py: 1.5,
                          width: 200,
                          borderTop: '1px solid #e0e0e0',
                          borderBottom: '1px solid #e0e0e0',
                          position: 'sticky',
                          top: 0,
                          zIndex: 2
                        }}
                      >
                        페이지주소
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: '#f8f9fa',
                          py: 0.375,
                          borderTop: '1px solid #e0e0e0',
                          borderBottom: '1px solid #e0e0e0',
                          position: 'sticky',
                          top: 0,
                          zIndex: 2
                        }}
                      >
                        설명
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: '#f8f9fa',
                          py: 1.5,
                          width: 60,
                          borderTop: '1px solid #e0e0e0',
                          borderBottom: '1px solid #e0e0e0',
                          position: 'sticky',
                          top: 0,
                          zIndex: 2
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
                          width: 60,
                          borderTop: '1px solid #e0e0e0',
                          borderBottom: '1px solid #e0e0e0',
                          position: 'sticky',
                          top: 0,
                          zIndex: 2
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
                          width: 60,
                          borderTop: '1px solid #e0e0e0',
                          borderBottom: '1px solid #e0e0e0',
                          position: 'sticky',
                          top: 0,
                          zIndex: 2
                        }}
                      >
                        전체
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {permissions.map((menu, index) => {
                      const textColor = '#000000';
                      const IconComponent = menu.icon;

                      return (
                        <TableRow
                          key={index}
                          hover
                          sx={{
                            backgroundColor: menu.level === 0 ? '#e3f2fd' : 'transparent'
                          }}
                        >
                          <TableCell align="center" sx={{ py: 0.625 }}>
                            <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 500, color: textColor }}>
                              {menu.level}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 500, py: 2.5 }}>
                            <Typography variant="body2" sx={{ fontSize: '12px', color: textColor }}>
                              {menu.category}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ py: 0.625 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                              <IconComponent size={18} color="#666" />
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 0.625 }}>
                            <Typography variant="body2" sx={{ fontSize: '12px', color: textColor }}>
                              {menu.page}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '12px', fontFamily: 'monospace', color: textColor }}>
                              {menu.url}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 0.625 }}>
                            <Typography variant="body2" sx={{ fontSize: '12px', color: textColor }}>
                              {menu.description}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ py: 0.625 }}>
                            <Checkbox
                              checked={menu.read}
                              onChange={() => handlePermissionChange(menu.id, 'read')}
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
                              checked={menu.write}
                              onChange={() => handlePermissionChange(menu.id, 'write')}
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
                              checked={menu.full}
                              onChange={() => handlePermissionChange(menu.id, 'full')}
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
            )}
          </Box>
        </TabPanel>
      </DialogContent>

      {validationError && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Alert severity="error" sx={{ mt: 1 }}>
            {validationError}
          </Alert>
        </Box>
      )}
    </Dialog>
  );
}
