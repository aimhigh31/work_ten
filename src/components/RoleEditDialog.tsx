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
import { useSupabaseRoleManagement } from 'hooks/useSupabaseRoleManagement';
import { createClient } from '@supabase/supabase-js';
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
  canEditOwn?: boolean;
  canEditOthers?: boolean;
}

export default function RoleEditDialog({ open, onClose, role, onSave, canEditOwn = true, canEditOthers = true }: RoleEditDialogProps) {
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

  // 역할 코드 자동 생성 함수 - ROLE-25-001 형식 (년도별 일련번호)
  const generateRoleCode = useCallback(async (): Promise<string> => {
    console.log('🔵 [RoleEditDialog] generateRoleCode 시작');
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const currentYear = new Date().getFullYear();
      const currentYearStr = currentYear.toString().slice(-2);

      // DB에서 모든 역할 조회
      console.log('🔵 [RoleEditDialog] Supabase 조회');
      const { data, error } = await supabase
        .from('admin_users_rules')
        .select('role_code');

      if (error) {
        console.error('❌ 역할 코드 조회 실패:', error);
        throw error;
      }

      const allRoles = data || [];
      console.log('🔵 [RoleEditDialog] 전체 역할 수:', allRoles.length);

      // 현재 연도의 코드만 필터링 (ROLE-25-XXX 형식)
      const currentYearRoles = allRoles.filter((r: any) => {
        const codePattern = `ROLE-${currentYearStr}-`;
        return r.role_code && r.role_code.startsWith(codePattern);
      });
      console.log('🔵 [RoleEditDialog] 현재 연도 역할 수:', currentYearRoles.length);

      // 정규식으로 올바른 형식(3자리 숫자)의 코드만 필터링
      const validCodePattern = new RegExp(`^ROLE-${currentYearStr}-(\\d{3})$`);
      let maxSequence = 0;

      currentYearRoles.forEach((r: any) => {
        const match = r.role_code.match(validCodePattern);
        if (match) {
          const sequence = parseInt(match[1], 10);
          if (sequence > maxSequence) {
            maxSequence = sequence;
          }
        }
      });

      // 다음 일련번호 생성 (최대값 + 1)
      const nextSequence = maxSequence + 1;
      const formattedSequence = nextSequence.toString().padStart(3, '0');
      const newCode = `ROLE-${currentYearStr}-${formattedSequence}`;

      console.log('✅ [RoleEditDialog] 자동 생성된 코드:', newCode);
      console.log('📊 [RoleEditDialog] 현재 최대 일련번호:', maxSequence, '→ 다음:', nextSequence);
      return newCode;
    } catch (error) {
      console.error('❌ 역할 코드 생성 실패:', error);
      const year = new Date().getFullYear().toString().slice(-2);
      const fallbackCode = `ROLE-${year}-001`;
      console.log('🔴 [RoleEditDialog] 폴백 코드 사용:', fallbackCode);
      return fallbackCode; // 오류 시 001부터 시작
    }
  }, []);

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
                // 기존 3개 필드 유지 (DB 저장용)
                read: permission?.can_read || false,
                write: permission?.can_write || false,
                full: permission?.can_full || false,
                // 새로운 5개 필드 (UI 표시용 - 개별 DB 컬럼)
                viewCategory: permission?.can_view_category || false,
                readData: permission?.can_read_data || false,
                createData: permission?.can_create_data || false,
                editOwn: permission?.can_edit_own || false,
                editOthers: permission?.can_edit_others || false
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
                // 기존 3개 필드 유지 (DB 저장용)
                read: false,
                write: false,
                full: false,
                // 새로운 6개 필드 (UI 표시용)
                viewCategory: false,
                readData: false,
                createData: false,
                editOwn: false,
                editOthers: false
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
      // 새 역할 생성시 초기값 (비동기 처리)
      const initializeNewRole = async () => {
        console.log('🟢 [RoleEditDialog] 다이얼로그 열림: 새 역할 생성');
        console.log('🟢 [RoleEditDialog] role 값:', role);
        console.log('🟢 [RoleEditDialog] open 값:', open);
        const currentDate = new Date().toISOString().split('T')[0];

        // 코드 자동 생성
        console.log('🟢 [RoleEditDialog] generateRoleCode 호출 시작');
        const newCode = await generateRoleCode();
        console.log('🟢 [RoleEditDialog] 생성된 코드:', newCode);

        setFormData({
          id: 0, // 새 역할의 경우 임시 ID
          no: 0,
          registrationDate: currentDate,
          code: newCode,
          role: '',
          description: '',
          userCount: 0,
          permissionCount: 0,
          status: '활성',
          registeredBy: session?.user?.name || 'system',
          lastModifiedDate: currentDate,
          lastModifiedBy: session?.user?.name || 'system'
        });
      };

      initializeNewRole();
    }
  }, [role, open, generateRoleCode, session]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 권한 체크박스 변경 핸들러
  const handlePermissionChange = (id: string, type: 'viewCategory' | 'readData' | 'createData' | 'editOwn' | 'editOthers' | 'full') => {
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
            // 전체 클릭 시 모든 권한 함께 변경
            const newFullValue = !perm.full;
            return {
              ...perm,
              full: newFullValue,
              read: newFullValue,
              write: newFullValue,
              viewCategory: newFullValue,
              readData: newFullValue,
              createData: newFullValue,
              editOwn: newFullValue,
              editOthers: newFullValue
            };
          } else if (type === 'viewCategory') {
            // 카테고리 보기 클릭 시 개별 토글
            const newViewCategoryValue = !perm.viewCategory;
            // ✅ 카테고리 보기 해제 시 → 모든 하위 권한도 해제
            const newReadDataValue = newViewCategoryValue ? perm.readData : false;
            const newCreateDataValue = newViewCategoryValue ? perm.createData : false;
            const newEditOwnValue = newViewCategoryValue ? perm.editOwn : false;
            const newEditOthersValue = newViewCategoryValue ? perm.editOthers : false;
            const newReadValue = newViewCategoryValue || newReadDataValue;
            const newWriteValue = newCreateDataValue || newEditOwnValue;
            const allPermissionsTrue = newViewCategoryValue && newReadDataValue && newCreateDataValue && newEditOwnValue && newEditOthersValue;
            return {
              ...perm,
              viewCategory: newViewCategoryValue,
              readData: newReadDataValue,
              createData: newCreateDataValue,
              editOwn: newEditOwnValue,
              editOthers: newEditOthersValue,
              read: newReadValue,
              write: newWriteValue,
              full: allPermissionsTrue
            };
          } else if (type === 'readData') {
            // 데이터 조회 클릭 시 개별 토글
            const newReadDataValue = !perm.readData;
            // ✅ 데이터 조회 체크 시 → 카테고리 보기 자동 선택
            // ✅ 데이터 조회 해제 시 → 나의 데이터 추가/편집, 타인 데이터 편집 자동 해제
            const newViewCategoryValue = newReadDataValue ? true : perm.viewCategory;
            const newCreateDataValue = newReadDataValue ? perm.createData : false;
            const newEditOwnValue = newReadDataValue ? perm.editOwn : false;
            const newEditOthersValue = newReadDataValue ? perm.editOthers : false;
            const newReadValue = newViewCategoryValue || newReadDataValue;
            const newWriteValue = newCreateDataValue || newEditOwnValue;
            const allPermissionsTrue = newViewCategoryValue && newReadDataValue && newCreateDataValue && newEditOwnValue && newEditOthersValue;
            return {
              ...perm,
              viewCategory: newViewCategoryValue,
              readData: newReadDataValue,
              createData: newCreateDataValue,
              editOwn: newEditOwnValue,
              editOthers: newEditOthersValue,
              read: newReadValue,
              write: newWriteValue,
              full: allPermissionsTrue
            };
          } else if (type === 'createData') {
            // 데이터 새로쓰기 클릭 시 개별 토글
            const newCreateDataValue = !perm.createData;
            const newWriteValue = newCreateDataValue || perm.editOwn; // 둘 중 하나라도 true면 write true
            const allPermissionsTrue = perm.viewCategory && perm.readData && newCreateDataValue && perm.editOwn && perm.editOthers;
            return {
              ...perm,
              createData: newCreateDataValue,
              write: newWriteValue,
              full: allPermissionsTrue
            };
          } else if (type === 'editOwn') {
            // 나의 데이터 편집 클릭 시 개별 토글
            const newEditOwnValue = !perm.editOwn;
            const newWriteValue = perm.createData || newEditOwnValue; // 둘 중 하나라도 true면 write true
            const allPermissionsTrue = perm.viewCategory && perm.readData && perm.createData && newEditOwnValue && perm.editOthers;
            return {
              ...perm,
              editOwn: newEditOwnValue,
              write: newWriteValue,
              full: allPermissionsTrue
            };
          } else if (type === 'editOthers') {
            // 타인데이터 편집 클릭 시 개별 토글
            const newEditOthersValue = !perm.editOthers;
            // ✅ 타인데이터 편집 체크 시 → 나의 데이터 추가/편집, 데이터 조회, 카테고리 보기 자동 선택
            // ✅ 타인데이터 편집 해제 시 → 그대로 (다른 권한은 유지)
            const newCreateDataValue = newEditOthersValue ? true : perm.createData;
            const newEditOwnValue = newEditOthersValue ? true : perm.editOwn;
            const newReadDataValue = newEditOthersValue ? true : perm.readData;
            const newViewCategoryValue = newEditOthersValue ? true : perm.viewCategory;
            const newWriteValue = newCreateDataValue || newEditOwnValue;
            const newReadValue = newViewCategoryValue || newReadDataValue;
            // full은 모든 권한이 true일 때만 true
            const allPermissionsTrue = newViewCategoryValue && newReadDataValue && newCreateDataValue && newEditOwnValue && newEditOthersValue;
            return {
              ...perm,
              viewCategory: newViewCategoryValue,
              readData: newReadDataValue,
              createData: newCreateDataValue,
              editOwn: newEditOwnValue,
              editOthers: newEditOthersValue,
              read: newReadValue,
              write: newWriteValue,
              full: allPermissionsTrue
            };
          }
          // 기본 반환 (변경 없음)
          return perm;
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
                write: newFullValue,
                viewCategory: newFullValue,
                readData: newFullValue,
                createData: newFullValue,
                editOwn: newFullValue,
                editOthers: newFullValue
              };
            } else if (type === 'editOthers') {
              // 타인데이터 편집 클릭 시 (레벨 0 항목 → 하위 항목들에 적용)
              const newEditOthersValue = !clickedItem.editOthers;
              // ✅ 타인데이터 편집 체크 시 → 나의 데이터 추가/편집, 데이터 조회, 카테고리 보기 자동 선택
              // ✅ 타인데이터 편집 해제 시 → 그대로 (다른 권한은 유지)
              const newCreateDataValue = newEditOthersValue ? true : perm.createData;
              const newEditOwnValue = newEditOthersValue ? true : perm.editOwn;
              const newReadDataValue = newEditOthersValue ? true : perm.readData;
              const newViewCategoryValue = newEditOthersValue ? true : perm.viewCategory;
              const newWriteValue = newCreateDataValue || newEditOwnValue;
              const newReadValue = newViewCategoryValue || newReadDataValue;
              const allPermissionsTrue = newViewCategoryValue && newReadDataValue && newCreateDataValue && newEditOwnValue && newEditOthersValue;
              return {
                ...perm,
                viewCategory: newViewCategoryValue,
                readData: newReadDataValue,
                createData: newCreateDataValue,
                editOwn: newEditOwnValue,
                editOthers: newEditOthersValue,
                read: newReadValue,
                write: newWriteValue,
                full: allPermissionsTrue
              };
            } else if (type === 'viewCategory') {
              // 카테고리 보기 클릭 시 (레벨 0 항목 → 하위 항목들에 적용)
              const newViewCategoryValue = !clickedItem.viewCategory;
              // ✅ 카테고리 보기 해제 시 → 모든 하위 권한도 해제
              const newReadDataValue = newViewCategoryValue ? perm.readData : false;
              const newCreateDataValue = newViewCategoryValue ? perm.createData : false;
              const newEditOwnValue = newViewCategoryValue ? perm.editOwn : false;
              const newEditOthersValue = newViewCategoryValue ? perm.editOthers : false;
              const newReadValue = newViewCategoryValue || newReadDataValue;
              const newWriteValue = newCreateDataValue || newEditOwnValue;
              const allPermissionsTrue = newViewCategoryValue && newReadDataValue && newCreateDataValue && newEditOwnValue && newEditOthersValue;
              return {
                ...perm,
                viewCategory: newViewCategoryValue,
                readData: newReadDataValue,
                createData: newCreateDataValue,
                editOwn: newEditOwnValue,
                editOthers: newEditOthersValue,
                read: newReadValue,
                write: newWriteValue,
                full: allPermissionsTrue
              };
            } else if (type === 'readData') {
              // 데이터 조회 클릭 시 (레벨 0 항목 → 하위 항목들에 적용)
              const newReadDataValue = !clickedItem.readData;
              // ✅ 데이터 조회 체크 시 → 카테고리 보기 자동 선택
              // ✅ 데이터 조회 해제 시 → 나의 데이터 추가/편집, 타인 데이터 편집 자동 해제
              const newViewCategoryValue = newReadDataValue ? true : perm.viewCategory;
              const newCreateDataValue = newReadDataValue ? perm.createData : false;
              const newEditOwnValue = newReadDataValue ? perm.editOwn : false;
              const newEditOthersValue = newReadDataValue ? perm.editOthers : false;
              const newReadValue = newViewCategoryValue || newReadDataValue;
              const newWriteValue = newCreateDataValue || newEditOwnValue;
              const allPermissionsTrue = newViewCategoryValue && newReadDataValue && newCreateDataValue && newEditOwnValue && newEditOthersValue;
              return {
                ...perm,
                viewCategory: newViewCategoryValue,
                readData: newReadDataValue,
                createData: newCreateDataValue,
                editOwn: newEditOwnValue,
                editOthers: newEditOthersValue,
                read: newReadValue,
                write: newWriteValue,
                full: allPermissionsTrue
              };
            } else if (type === 'createData') {
              // 데이터 새로쓰기 클릭 시
              const newCreateDataValue = !clickedItem.createData;
              const newWriteValue = newCreateDataValue || perm.editOwn;
              const allPermissionsTrue = perm.viewCategory && perm.readData && newCreateDataValue && perm.editOwn && perm.editOthers;
              return {
                ...perm,
                createData: newCreateDataValue,
                write: newWriteValue,
                full: allPermissionsTrue
              };
            } else if (type === 'editOwn') {
              // 나의 데이터 편집 클릭 시
              const newEditOwnValue = !clickedItem.editOwn;
              const newWriteValue = perm.createData || newEditOwnValue;
              const allPermissionsTrue = perm.viewCategory && perm.readData && perm.createData && newEditOwnValue && perm.editOthers;
              return {
                ...perm,
                editOwn: newEditOwnValue,
                write: newWriteValue,
                full: allPermissionsTrue
              };
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
          console.log(`🔍 메뉴 ${perm.id} (${perm.category}): read=${perm.read}, write=${perm.write}, full=${perm.full}, viewCategory=${perm.viewCategory}, readData=${perm.readData}, createData=${perm.createData}, editOwn=${perm.editOwn}, editOthers=${perm.editOthers}`);
          return {
            menuId: perm.id,
            // 기존 3개 필드 (하위 호환성)
            canRead: perm.read,
            canWrite: perm.write,
            canFull: perm.full,
            // 새로운 5개 필드 (세밀한 권한 제어)
            canViewCategory: perm.viewCategory,
            canReadData: perm.readData,
            canCreateData: perm.createData,
            canEditOwn: perm.editOwn,
            canEditOthers: perm.editOthers
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
      PaperProps={{
        sx: {
          height: '840px',
          maxHeight: '840px',
          overflowY: 'auto'
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
          <Button
            onClick={handleClose}
            variant="outlined"
            size="small"
            disabled={!(canEditOwn || canEditOthers)}
            sx={{
              minWidth: '60px',
              '&.Mui-disabled': {
                borderColor: 'grey.300',
                color: 'grey.500'
              }
            }}
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            size="small"
            disabled={!(canEditOwn || canEditOthers)}
            sx={{
              minWidth: '60px',
              '&.Mui-disabled': {
                backgroundColor: 'grey.300',
                color: 'grey.500'
              }
            }}
          >
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
                          zIndex: 2,
                          fontSize: '11px'
                        }}
                      >
                        카테고리<br/>보기
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
                          zIndex: 2,
                          fontSize: '11px'
                        }}
                      >
                        데이터<br/>조회
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: '#f8f9fa',
                          py: 1.5,
                          width: 85,
                          borderTop: '1px solid #e0e0e0',
                          borderBottom: '1px solid #e0e0e0',
                          position: 'sticky',
                          top: 0,
                          zIndex: 2,
                          fontSize: '11px'
                        }}
                      >
                        나의 데이터<br/>추가/편집
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: '#f8f9fa',
                          py: 1.5,
                          width: 85,
                          borderTop: '1px solid #e0e0e0',
                          borderBottom: '1px solid #e0e0e0',
                          position: 'sticky',
                          top: 0,
                          zIndex: 2,
                          fontSize: '11px'
                        }}
                      >
                        타인데이터<br/>편집
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
                          zIndex: 2,
                          fontSize: '11px'
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
                              checked={menu.viewCategory}
                              onChange={() => handlePermissionChange(menu.id, 'viewCategory')}
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
                              checked={menu.readData}
                              onChange={() => handlePermissionChange(menu.id, 'readData')}
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
                              checked={menu.createData && menu.editOwn}
                              onChange={() => {
                                // ✅ createData와 editOwn을 동시에 토글
                                setPermissions((prev) => {
                                  const clickedItem = prev.find((p) => p.id === menu.id);
                                  if (!clickedItem) return prev;

                                  const isLevel0Item = clickedItem.level === 0;
                                  const newValue = !(clickedItem.createData && clickedItem.editOwn);

                                  return prev.map((perm) => {
                                    // 클릭된 항목 처리
                                    if (perm.id === menu.id) {
                                      // ✅ 나의 데이터 추가/편집 체크 시 → 데이터 조회, 카테고리 보기 자동 선택
                                      // ✅ 나의 데이터 추가/편집 해제 시 → 타인 데이터 편집 자동 해제
                                      const newReadDataValue = newValue ? true : perm.readData;
                                      const newViewCategoryValue = newValue ? true : perm.viewCategory;
                                      const newEditOthersValue = newValue ? perm.editOthers : false;
                                      const newWriteValue = newValue; // createData와 editOwn이 같은 값
                                      const newReadValue = newViewCategoryValue || newReadDataValue;
                                      const allPermissionsTrue = newViewCategoryValue && newReadDataValue && newValue && newValue && newEditOthersValue;
                                      return {
                                        ...perm,
                                        viewCategory: newViewCategoryValue,
                                        readData: newReadDataValue,
                                        createData: newValue,
                                        editOwn: newValue,
                                        editOthers: newEditOthersValue,
                                        read: newReadValue,
                                        write: newWriteValue,
                                        full: allPermissionsTrue
                                      };
                                    }

                                    // 레벨 0 항목의 권한 클릭 시 하위 항목들도 변경
                                    if (isLevel0Item && perm.level === 1 && perm.category === clickedItem.category) {
                                      // ✅ 하위 항목도 동일하게 자동 선택/해제
                                      const newReadDataValue = newValue ? true : perm.readData;
                                      const newViewCategoryValue = newValue ? true : perm.viewCategory;
                                      const newEditOthersValue = newValue ? perm.editOthers : false;
                                      const newWriteValue = newValue;
                                      const newReadValue = newViewCategoryValue || newReadDataValue;
                                      const allPermissionsTrue = newViewCategoryValue && newReadDataValue && newValue && newValue && newEditOthersValue;
                                      return {
                                        ...perm,
                                        viewCategory: newViewCategoryValue,
                                        readData: newReadDataValue,
                                        createData: newValue,
                                        editOwn: newValue,
                                        editOthers: newEditOthersValue,
                                        read: newReadValue,
                                        write: newWriteValue,
                                        full: allPermissionsTrue
                                      };
                                    }

                                    return perm;
                                  });
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
                          <TableCell align="center" sx={{ py: 0.625 }}>
                            <Checkbox
                              checked={menu.editOthers}
                              onChange={() => handlePermissionChange(menu.id, 'editOthers')}
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
