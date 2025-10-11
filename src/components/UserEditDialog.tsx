import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  LinearProgress,
  Tabs,
  Tab,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Avatar,
  Stack,
  Divider,
  Switch,
  Chip
} from '@mui/material';
import { CloseSquare } from '@wandersonalwes/iconsax-react';

// 프로필 설정 탭들을 import
import TabProfile from 'sections/apps/profiles/account/TabProfile';
import TabAccount from 'sections/apps/profiles/account/TabAccount';

// 마스터코드3 플랫 구조 훅 import
import { useSupabaseMasterCode3 } from 'hooks/useSupabaseMasterCode3';

// Supabase Storage 훅 import
import { useSupabaseStorage } from 'hooks/useSupabaseStorage';

// 현재 로그인 사용자 훅 import
import useUser from '../hooks/useUser';

// 사용자 데이터 타입
interface UserData {
  id: number;
  no: number;
  registrationDate: string;
  code: string;
  userAccount?: string;  // 사용자계정(ID)
  userNameWithId?: string;  // 사용자명(ID)
  userName: string;
  department: string;
  position: string;
  role: string;
  status: '활성' | '비활성' | '대기' | '취소';
  lastLogin: string;
  registrant: string;
  email?: string;
  phone?: string;
  country?: string;
  address?: string;
  currentPassword?: string;
  newPassword?: string;
  skills?: string[];
  education?: string;
  career?: string;
  profileImage?: string;
  profile_image_url?: string; // Supabase Storage URL
  assignedRole?: string[]; // 할당된 역할 목록
  rule?: string; // 역할 코드 (RULE-25-002 형식)
  auth_user_id?: string; // Supabase Auth users.id (UUID)
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
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `user-tab-${index}`,
    'aria-controls': `user-tabpanel-${index}`
  };
}

interface UserEditDialogProps {
  open: boolean;
  onClose: () => void;
  user: UserData | null;
  onSave: (user: UserData) => void;
  departments?: any[];
}

export default function UserEditDialog({ open, onClose, user, onSave, departments = [] }: UserEditDialogProps) {
  const [tabValue, setTabValue] = useState(0);
  const [tempImageFile, setTempImageFile] = useState<File | null>(null);
  const [isImageChanged, setIsImageChanged] = useState(false);

  // 유효성 검증 상태
  const [emailError, setEmailError] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');

  // 중복체크 상태
  const [userAccountCheckResult, setUserAccountCheckResult] = useState<{
    checked: boolean;
    isDuplicate: boolean;
    message: string;
  } | null>(null);
  const [emailCheckResult, setEmailCheckResult] = useState<{
    checked: boolean;
    isDuplicate: boolean;
    message: string;
  } | null>(null);
  const [checking, setChecking] = useState(false);

  // 비밀번호 관련 상태
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

  // 현재 로그인한 사용자 정보
  const currentUser = useUser();

  // 마스터코드3 플랫 구조 Supabase 훅 사용
  const { subCodes: allSubCodes } = useSupabaseMasterCode3();

  // Supabase Storage 훅 사용
  const { uploadProfileImage, deleteProfileImage, uploading, uploadProgress } = useSupabaseStorage();

  // 역할별 권한 데이터 상태
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  // 메뉴 정보 상태
  const [menuData, setMenuData] = useState<any[]>([]);

  // admin_users_rules 테이블에서 역할 데이터 가져오기
  const [roles, setRoles] = useState<any[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // 선택된 역할 상태 (오른쪽 패널에서 권한 표시용)
  const [selectedRoleForPermission, setSelectedRoleForPermission] = useState<string | null>(null);

  // 역할 데이터 가져오기 함수
  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    setLoadingPermissions(true);
    try {
      const response = await fetch('/api/role-permissions');
      const data = await response.json();

      if (data.success) {
        // 권한 데이터 저장 (원본 그대로)
        setRolePermissions(data.roles);
        // 메뉴 데이터 저장
        setMenuData(data.menus || []);

        console.log('🔍 API에서 받은 역할 데이터:', data.roles);
        console.log('🔍 API에서 받은 메뉴 데이터:', data.menus);

        // admin_users_rules 데이터를 UI 포맷으로 변환
        const formattedRoles = data.roles.map((role: any, index: number) => {
          console.log(`🔧 역할 ${role.role_code} is_active 값:`, role.is_active, typeof role.is_active);
          const isActive = (role.is_active === true || role.is_active === 'true' || role.is_active === 1);
          console.log(`🔧 역할 ${role.role_code} 최종 상태:`, isActive ? '활성' : '비활성');

          return {
            id: index + 1,
            no: index + 1,
            registrationDate: role.created_at ? new Date(role.created_at).toISOString().split('T')[0] : '2025-09-01',
            code: role.role_code,
            role: role.role_name,
            description: role.role_description || '',
            userCount: 0, // 실제 사용자 수는 별도 계산 필요
            permissionCount: role.permissions ? Object.keys(role.permissions).length : 0,
            status: isActive ? '활성' as const : '비활성' as const,
            registeredBy: role.created_by || '시스템',
            lastModifiedDate: role.updated_at ? new Date(role.updated_at).toISOString().split('T')[0] : '2025-09-01',
            lastModifiedBy: role.updated_by || '시스템'
          };
        });

        console.log('✅ 변환된 역할 데이터:', formattedRoles);
        setRoles(formattedRoles);
      }
    } catch (error) {
      console.error('역할 데이터 로드 실패:', error);
    } finally {
      setRolesLoading(false);
      setLoadingPermissions(false);
    }
  }, []);

  // 컴포넌트 마운트 시 역할 데이터 로드
  useEffect(() => {
    if (open) {
      fetchRoles();
    }
  }, [open, fetchRoles]);

  // GROUP003 서브코드만 필터링 (직급 목록)
  const userLevelOptions = useMemo(() => {
    const userLevelSubs = allSubCodes
      .filter((sub) => sub.group_code === 'GROUP003');
    console.log('🔍 UserEditDialog GROUP003 서브코드들:', userLevelSubs);

    const mappedSubs = userLevelSubs.map(sub => ({
      id: sub.id,
      code_name: sub.subcode_name,
      code_value: sub.subcode,
      description: sub.subcode_description,
      disabled: sub.subcode_status !== 'active'
    }));

    console.log('🎯 UserEditDialog 매핑된 USER_LEVEL 옵션들:', mappedSubs);
    return mappedSubs.sort((a, b) => a.subcode_order - b.subcode_order);
  }, [allSubCodes]);

  // GROUP004 서브코드만 필터링 (직책 목록)
  const userPositionOptions = useMemo(() => {
    const userPositionSubs = allSubCodes
      .filter((sub) => sub.group_code === 'GROUP004');
    console.log('🔍 UserEditDialog GROUP004 서브코드들:', userPositionSubs);

    const mappedSubs = userPositionSubs.map(sub => ({
      id: sub.id,
      code_name: sub.subcode_name,
      code_value: sub.subcode,
      description: sub.subcode_description,
      disabled: sub.subcode_status !== 'active'
    }));

    console.log('🎯 UserEditDialog 매핑된 USER_POSITION 옵션들:', mappedSubs);
    return mappedSubs.sort((a, b) => a.subcode_order - b.subcode_order);
  }, [allSubCodes]);

  // GROUP005 서브코드만 필터링 (국가 목록)
  const nationalOptions = useMemo(() => {
    const nationalSubs = allSubCodes
      .filter((sub) => sub.group_code === 'GROUP005');
    console.log('🔍 UserEditDialog GROUP005 서브코드들:', nationalSubs);

    const mappedSubs = nationalSubs
      .filter(sub => sub.subcode_name && sub.subcode_name.trim() !== '') // 빈 값 제외
      .map(sub => ({
        id: sub.id,
        code_name: sub.subcode_name,
        code_value: sub.subcode,
        description: sub.subcode_description,
        disabled: sub.subcode_status !== 'active'
      }));

    console.log('🎯 UserEditDialog 매핑된 NATIONAL 옵션들:', mappedSubs);
    return mappedSubs.sort((a, b) => a.code_name.localeCompare(b.code_name, 'ko'));
  }, [allSubCodes]);

  // 폴백 직급 데이터 (마스터코드가 없는 경우 사용)
  const fallbackUserLevels = [
    { id: 1, code_name: '사원', code_value: 'E1' },
    { id: 2, code_name: '주임', code_value: 'E2' },
    { id: 3, code_name: '대리', code_value: 'E3' },
    { id: 4, code_name: '과장', code_value: 'E4' },
    { id: 5, code_name: '차장', code_value: 'E5' },
    { id: 6, code_name: '부장', code_value: 'E6' }
  ];

  // 폴백 직책 데이터 (마스터코드가 없는 경우 사용)
  const fallbackUserPositions = [
    { id: 1, code_name: '경영진', code_value: 'CEO' },
    { id: 2, code_name: '본부장', code_value: 'DIRECTOR' },
    { id: 3, code_name: '팀장', code_value: 'TEAM_LEADER' },
    { id: 4, code_name: '파트장', code_value: 'PART_LEADER' },
    { id: 5, code_name: '프로', code_value: 'SPECIALIST' },
    { id: 6, code_name: '관리자', code_value: 'ADMIN' }
  ];

  // 실제 사용할 직급 데이터
  const actualUserLevels = userLevelOptions && userLevelOptions.length > 0 ? userLevelOptions : fallbackUserLevels;

  // 실제 사용할 직책 데이터
  const actualUserPositions = userPositionOptions && userPositionOptions.length > 0 ? userPositionOptions : fallbackUserPositions;

  // 디버깅용 로그
  console.log('🏢 UserEditDialog departments:', departments);
  console.log('⚡ UserEditDialog actualUserLevels:', actualUserLevels);
  console.log('💼 UserEditDialog actualUserPositions:', actualUserPositions);
  
  // 역할 데이터는 정적 데이터로 변경됨 (무한 루프 해결)

  // 역할별 권한 가져오기 함수 - fetchRoles와 통합됨

  // 탭 값 범위 체크
  useEffect(() => {
    if (tabValue > 1) {
      setTabValue(0);
    }
  }, [tabValue]);
  const [formData, setFormData] = useState<UserData>({
    id: 0,
    no: 0,
    registrationDate: new Date().toISOString().split('T')[0],
    code: '',
    userAccount: '',
    userName: '',
    department: departments && departments.length > 0 ? departments[0].department_name : '개발팀',
    position: '사원',
    role: '프로',
    status: '활성',
    lastLogin: '',
    registrant: ''
  });

  // user가 변경될 때 formData 업데이트
  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        userAccount: user.userAccount || '',
        phone: user.phone || '',
        country: user.country || '',
        address: user.address || '',
        email: user.email || ''
      });
      // 에러 상태 초기화
      setEmailError('');
      setPhoneError('');
      // 중복체크 결과 초기화
      setUserAccountCheckResult(null);
      setEmailCheckResult(null);
    } else {
      // 새 사용자 생성시 초기값
      const currentDate = new Date().toISOString().split('T')[0];
      const currentYear = new Date().getFullYear();
      const yearSuffix = currentYear.toString().slice(-2);

      setFormData({
        id: Date.now(),
        no: 0,
        registrationDate: currentDate,
        code: `USER-${yearSuffix}-001`,
        userAccount: '',
        userName: '',
        department: departments && departments.length > 0 ? departments[0].department_name : '개발팀',
        position: '사원',
        role: '프로',
        status: '활성',
        lastLogin: '',
        registrant: currentUser && typeof currentUser !== 'boolean' ? currentUser.name || '' : ''
      });
      // 에러 상태 초기화
      setEmailError('');
      setPhoneError('');
      // 중복체크 결과 초기화
      setUserAccountCheckResult(null);
      setEmailCheckResult(null);
    }
  }, [user, departments?.length, actualUserLevels?.length, actualUserPositions?.length, currentUser && typeof currentUser !== 'boolean' ? currentUser.name : null]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    // 탭이 2개만 있으므로 최대값을 1로 제한
    const safeValue = Math.min(newValue, 1);
    setTabValue(safeValue);
  };

  const handleInputChange = (field: keyof UserData) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSelectChange = (field: keyof UserData) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  // 이메일 유효성 검증
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 이메일 입력 핸들러
  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const email = event.target.value;
    setFormData(prev => ({ ...prev, email }));

    if (email && !validateEmail(email)) {
      setEmailError('올바른 이메일 형식을 입력해주세요 (예: user@company.com)');
    } else {
      setEmailError('');
    }
  };

  // 전화번호 입력 핸들러 (숫자, 하이픈, 공백만 허용)
  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let phone = event.target.value;
    // 숫자, 하이픈, 공백만 허용
    phone = phone.replace(/[^0-9\-\s]/g, '');

    setFormData(prev => ({ ...prev, phone }));

    if (phone && phone.replace(/[\-\s]/g, '').length < 10) {
      setPhoneError('전화번호는 최소 10자리 숫자를 입력해주세요');
    } else {
      setPhoneError('');
    }
  };

  // 사용자계정 입력 핸들러
  const handleUserAccountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const userAccount = event.target.value;
    setFormData(prev => ({ ...prev, userAccount }));
    // 입력값 변경 시 중복체크 결과 초기화
    setUserAccountCheckResult(null);
  };

  // 이메일 입력 핸들러 (중복체크 결과 초기화 추가)
  const handleEmailChangeWithCheck = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleEmailChange(event);
    // 입력값 변경 시 중복체크 결과 초기화
    setEmailCheckResult(null);
  };

  // 사용자계정 중복체크
  const handleCheckUserAccount = async () => {
    if (!formData.userAccount || !formData.userAccount.trim()) {
      alert('사용자계정을 입력해주세요.');
      return;
    }

    setChecking(true);
    try {
      const response = await fetch('/api/check-duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'userAccount',
          value: formData.userAccount,
          currentUserId: user?.id
        })
      });

      const result = await response.json();

      if (result.success) {
        setUserAccountCheckResult({
          checked: true,
          isDuplicate: result.isDuplicate,
          message: result.message
        });
        alert(result.message);
      } else {
        alert('중복체크 실패: ' + result.error);
      }
    } catch (error) {
      console.error('중복체크 오류:', error);
      alert('중복체크 중 오류가 발생했습니다.');
    } finally {
      setChecking(false);
    }
  };

  // 이메일 중복체크
  const handleCheckEmail = async () => {
    if (!formData.email || !formData.email.trim()) {
      alert('이메일을 입력해주세요.');
      return;
    }

    if (emailError) {
      alert('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setChecking(true);
    try {
      const response = await fetch('/api/check-duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'email',
          value: formData.email,
          currentUserId: user?.id
        })
      });

      const result = await response.json();

      if (result.success) {
        setEmailCheckResult({
          checked: true,
          isDuplicate: result.isDuplicate,
          message: result.message
        });
        alert(result.message);
      } else {
        alert('중복체크 실패: ' + result.error);
      }
    } catch (error) {
      console.error('중복체크 오류:', error);
      alert('중복체크 중 오류가 발생했습니다.');
    } finally {
      setChecking(false);
    }
  };

  const handleSave = async () => {
    // 필수값 검증
    if (!formData.email || !formData.email.trim()) {
      alert('이메일은 필수 입력 항목입니다.');
      return;
    }

    if (!formData.profileImage && !tempImageFile) {
      alert('프로필 사진은 필수 입력 항목입니다.');
      return;
    }

    if (!formData.department || !formData.department.trim()) {
      alert('부서는 필수 선택 항목입니다.');
      return;
    }

    if (!formData.position || !formData.position.trim()) {
      alert('직급은 필수 선택 항목입니다.');
      return;
    }

    if (!formData.role || !formData.role.trim()) {
      alert('직책은 필수 선택 항목입니다.');
      return;
    }

    // 중복체크 필수 검증
    if (!userAccountCheckResult || !userAccountCheckResult.checked) {
      alert('사용자계정 중복체크를 해주세요.');
      return;
    }

    if (userAccountCheckResult.isDuplicate) {
      alert('사용자계정이 중복됩니다. 다른 계정을 사용해주세요.');
      return;
    }

    if (!emailCheckResult || !emailCheckResult.checked) {
      alert('이메일 중복체크를 해주세요.');
      return;
    }

    if (emailCheckResult.isDuplicate) {
      alert('이메일이 중복됩니다. 다른 이메일을 사용해주세요.');
      return;
    }

    // 유효성 검증
    if (formData.email && !validateEmail(formData.email)) {
      alert('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    if (formData.phone && formData.phone.replace(/[\-\s]/g, '').length < 10) {
      alert('전화번호는 최소 10자리 숫자를 입력해주세요.');
      return;
    }

    let finalImageUrl = formData.profileImage;

    // 이미지가 변경되었고 새 파일이 있으면 업로드
    if (isImageChanged && tempImageFile) {
      const userId = formData.code || `user-${Date.now()}`;
      const uploadResult = await uploadProfileImage(tempImageFile, userId);

      if (uploadResult.error) {
        alert(`이미지 업로드 실패: ${uploadResult.error}`);
        return;
      }

      // 기존 이미지가 Supabase Storage URL이면 삭제
      if (user?.profileImage && user.profileImage.includes('supabase')) {
        await deleteProfileImage(user.profileImage);
      }

      finalImageUrl = uploadResult.url;
    } else if (isImageChanged && !formData.profileImage) {
      // 이미지가 제거된 경우
      if (user?.profileImage && user.profileImage.includes('supabase')) {
        await deleteProfileImage(user.profileImage);
      }
      finalImageUrl = undefined;
    }

    // 최종 데이터 저장
    const finalData = {
      ...formData,
      profileImage: finalImageUrl,
      profile_image_url: finalImageUrl // Supabase Storage URL을 별도 필드에도 저장
    };

    onSave(finalData);

    // 상태 초기화
    setTempImageFile(null);
    setIsImageChanged(false);
  };

  // 비밀번호 초기화 핸들러
  const handlePasswordReset = async () => {
    if (!formData.auth_user_id) {
      alert('Auth 사용자 ID가 없습니다. 이 사용자는 Auth 시스템과 연결되지 않았습니다.');
      return;
    }

    if (!confirm('비밀번호를 "123456"으로 초기화하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch('/api/update-user-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          auth_user_id: formData.auth_user_id,
          new_password: '123456'
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('비밀번호 초기화 오류:', result.error);
        alert(`비밀번호 초기화 실패: ${result.error}`);
        return;
      }

      alert('비밀번호가 "123456"으로 초기화되었습니다.');
    } catch (error) {
      console.error('비밀번호 초기화 예외:', error);
      alert('비밀번호 초기화 중 오류가 발생했습니다.');
    }
  };

  // 비밀번호 변경 다이얼로그 열기
  const handlePasswordChangeOpen = () => {
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setPasswordDialogOpen(true);
  };

  // 비밀번호 변경 다이얼로그 닫기
  const handlePasswordChangeClose = () => {
    setPasswordDialogOpen(false);
    setNewPasswordInput('');
    setConfirmPasswordInput('');
  };

  // 비밀번호 변경 핸들러
  const handlePasswordChange = async () => {
    if (!newPasswordInput.trim()) {
      alert('새 비밀번호를 입력해주세요.');
      return;
    }

    if (newPasswordInput.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      alert('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    if (!formData.auth_user_id) {
      alert('Auth 사용자 ID가 없습니다. 이 사용자는 Auth 시스템과 연결되지 않았습니다.');
      return;
    }

    try {
      const response = await fetch('/api/update-user-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          auth_user_id: formData.auth_user_id,
          new_password: newPasswordInput
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('비밀번호 변경 오류:', result.error);
        alert(`비밀번호 변경 실패: ${result.error}`);
        return;
      }

      alert('비밀번호가 성공적으로 변경되었습니다.');
      handlePasswordChangeClose();
    } catch (error) {
      console.error('비밀번호 변경 예외:', error);
      alert('비밀번호 변경 중 오류가 발생했습니다.');
    }
  };

  const handleClose = () => {
    setTabValue(0);
    onClose();
  };

  return (
    <>
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
          <Typography variant="h6" component="div" sx={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.75)', fontWeight: 500 }}>
            사용자관리 편집
          </Typography>
          {user && (
            <Typography variant="body2" sx={{ fontSize: '12px', color: '#666666', fontWeight: 500, mt: 0.5 }}>
              {user.userName} ({user.code})
            </Typography>
          )}
        </Box>

        {/* 취소, 저장 버튼을 오른쪽 상단으로 이동 */}
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          <Button onClick={handleClose} variant="outlined" size="small" sx={{ minWidth: '60px' }}>
            취소
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            size="small"
            sx={{ minWidth: '60px' }}
            disabled={uploading}
          >
            {uploading ? '업로드 중...' : '저장'}
          </Button>
        </Box>
      </DialogTitle>

      {/* 업로드 진행 표시 */}
      {uploading && uploadProgress > 0 && (
        <LinearProgress
          variant="determinate"
          value={uploadProgress}
          sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1500 }}
        />
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="사용자 편집 탭">
          <Tab label="개요" {...a11yProps(0)} />
          <Tab label="역할설정" {...a11yProps(1)} />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
        <Box sx={{ height: '100%', overflow: 'hidden' }}>
          <TabPanel value={tabValue} index={0}>
            {/* 개요 탭 - 좌우 분할 레이아웃 */}
            <Box sx={{ height: '650px', overflowY: 'auto', pr: 1, px: 3, py: 3 }}>
              <Stack direction="row" spacing={3} sx={{ height: '100%' }}>
                {/* 왼쪽 섹션 - 프로필 사진 */}
                <Box sx={{ width: '250px', flexShrink: 0 }}>
                  <Stack spacing={2} alignItems="center">
                    {/* 프로필 사진 제목과 제거 버튼 */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        프로필 사진 <span style={{ color: 'red' }}>*</span>
                      </Typography>
                      {formData.profileImage && (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, profileImage: undefined }));
                            setTempImageFile(null);
                            setIsImageChanged(true);
                          }}
                        >
                          사진 제거
                        </Button>
                      )}
                    </Box>
                    
                    {/* 프로필 사진 영역 */}
                    <Box
                      sx={{
                        width: 200,
                        height: 200,
                        border: '2px dashed #ddd',
                        borderRadius: '50%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'border-color 0.3s',
                        '&:hover': {
                          borderColor: '#1976d2'
                        },
                        backgroundImage: formData.profileImage ? `url(${formData.profileImage})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative'
                      }}
                      onClick={() => document.getElementById('profile-upload')?.click()}
                    >
                      {!formData.profileImage && (
                        <>
                          <Avatar sx={{ width: 60, height: 60, mb: 1, bgcolor: '#f5f5f5', color: '#999' }}>
                            📷
                          </Avatar>
                          <Typography variant="body2" color="textSecondary" textAlign="center">
                            클릭하여<br />사진 업로드
                          </Typography>
                        </>
                      )}
                      {formData.profileImage && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 8,
                            right: 8,
                            bgcolor: 'rgba(0,0,0,0.7)',
                            borderRadius: '50%',
                            p: 0.5
                          }}
                        >
                          <Typography variant="caption" color="white">
                            📷
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* 숨겨진 파일 입력 */}
                    <input
                      id="profile-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // 파일 크기 체크 (10MB) - 업로드 시 자동 압축됨
                          if (file.size > 10 * 1024 * 1024) {
                            alert('파일 크기는 10MB 이하여야 합니다.\n(업로드 시 자동으로 압축됩니다)');
                            return;
                          }

                          // 파일 저장
                          setTempImageFile(file);
                          setIsImageChanged(true);

                          // 미리보기용 로컬 URL 생성
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setFormData(prev => ({ ...prev, profileImage: event.target?.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />


                    {/* 사용자 정보 */}
                    <Box sx={{ width: '100%', mt: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                      <Stack spacing={1.5} alignItems="center">
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                          {formData.userName || '사용자명'}
                        </Typography>

                        <Box sx={{ width: '100%' }}>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                            Code
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {formData.code || '코드'}
                          </Typography>
                        </Box>

                        <Box sx={{ width: '100%' }}>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                            사용자계정(ID)
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {formData.userAccount || '계정ID'}
                          </Typography>
                        </Box>

                        <Box sx={{ width: '100%' }}>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                            이메일
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: 'break-all' }}>
                            {formData.email || '이메일 주소'}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    {/* 비밀번호 변경 버튼 */}
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={handlePasswordChangeOpen}
                    >
                      비밀번호 변경
                    </Button>

                    {/* 비밀번호 초기화 버튼 */}
                    <Button
                      variant="outlined"
                      color="warning"
                      fullWidth
                      sx={{ mt: 1 }}
                      onClick={handlePasswordReset}
                    >
                      비밀번호 초기화
                    </Button>
                  </Stack>
                </Box>

                {/* 오른쪽 섹션 - 사용자 정보 */}
                <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
                  <Stack spacing={3} sx={{ pt: 1 }}>
                    {/* 코드 - 사용자계정(ID) (중복체크) */}
                    <Stack direction="row" spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <TextField
                          fullWidth
                          label="코드"
                          value={formData.code || ''}
                          variant="outlined"
                          InputLabelProps={{ shrink: true }}
                          disabled
                          sx={{
                            '& .MuiInputLabel-root': {
                              transform: 'translate(14px, -9px) scale(0.75)',
                              backgroundColor: 'white',
                              px: 1,
                              zIndex: 1
                            },
                            '& .MuiOutlinedInput-notchedOutline legend': {
                              width: '35px'
                            }
                          }}
                        />
                      </Box>

                      <Box sx={{ flex: 1, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <TextField
                          fullWidth
                          label={
                            <span>
                              사용자계정(ID) <span style={{ color: 'red' }}>*</span>
                            </span>
                          }
                          value={formData.userAccount || ''}
                          onChange={handleUserAccountChange}
                          variant="outlined"
                          InputLabelProps={{ shrink: true }}
                          placeholder="로그인 계정 ID"
                          error={userAccountCheckResult?.checked && userAccountCheckResult?.isDuplicate}
                          helperText={
                            userAccountCheckResult?.checked
                              ? userAccountCheckResult?.message
                              : ''
                          }
                        />
                        <Button
                          variant="outlined"
                          onClick={handleCheckUserAccount}
                          disabled={checking || !formData.userAccount || (userAccountCheckResult?.checked && !userAccountCheckResult?.isDuplicate)}
                          sx={{
                            minWidth: '90px',
                            height: '56px',
                            flexShrink: 0,
                            fontSize: '0.875rem',
                            bgcolor: (userAccountCheckResult?.checked && !userAccountCheckResult?.isDuplicate) ? '#e0e0e0' : 'transparent'
                          }}
                        >
                          {(userAccountCheckResult?.checked && !userAccountCheckResult?.isDuplicate) ? '완료' : '중복체크'}
                        </Button>
                      </Box>
                    </Stack>

                    {/* 사용자명 - 이메일 (중복체크) */}
                    <Stack direction="row" spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <TextField
                          fullWidth
                          label={
                            <span>
                              사용자명 <span style={{ color: 'red' }}>*</span>
                            </span>
                          }
                          value={formData.userName || ''}
                          onChange={handleInputChange('userName')}
                          variant="outlined"
                          InputLabelProps={{ shrink: true }}
                          placeholder="실명 또는 닉네임"
                        />
                      </Box>

                      <Box sx={{ flex: 1, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <TextField
                          fullWidth
                          label={
                            <span>
                              이메일 <span style={{ color: 'red' }}>*</span>
                            </span>
                          }
                          type="email"
                          value={formData.email || ''}
                          onChange={handleEmailChangeWithCheck}
                          variant="outlined"
                          InputLabelProps={{ shrink: true }}
                          error={!!emailError || (emailCheckResult?.checked && emailCheckResult?.isDuplicate)}
                          helperText={
                            emailError ||
                            (emailCheckResult?.checked ? emailCheckResult?.message : '')
                          }
                          placeholder="user@company.com"
                        />
                        <Button
                          variant="outlined"
                          onClick={handleCheckEmail}
                          disabled={checking || !formData.email || !!emailError || (emailCheckResult?.checked && !emailCheckResult?.isDuplicate)}
                          sx={{
                            minWidth: '90px',
                            height: '56px',
                            flexShrink: 0,
                            fontSize: '0.875rem',
                            bgcolor: (emailCheckResult?.checked && !emailCheckResult?.isDuplicate) ? '#e0e0e0' : 'transparent'
                          }}
                        >
                          {(emailCheckResult?.checked && !emailCheckResult?.isDuplicate) ? '완료' : '중복체크'}
                        </Button>
                      </Box>
                    </Stack>

                    {/* 부서, 직급, 직책 - 3등분 배치 */}
                    <Stack direction="row" spacing={2}>
                      <FormControl fullWidth>
                        <InputLabel shrink>
                          부서 <span style={{ color: 'red' }}>*</span>
                        </InputLabel>
                        <Select
                          value={formData.department || ''}
                          label="부서 *"
                          onChange={handleSelectChange('department')}
                        >
                          {departments && departments.length > 0 ? (
                            departments.map((dept) => (
                              <MenuItem key={dept.id} value={dept.department_name}>
                                {dept.department_name}
                              </MenuItem>
                            ))
                          ) : (
                            <>
                              <MenuItem value="개발팀">개발팀</MenuItem>
                              <MenuItem value="디자인팀">디자인팀</MenuItem>
                              <MenuItem value="기획팀">기획팀</MenuItem>
                              <MenuItem value="마케팅팀">마케팅팀</MenuItem>
                            </>
                          )}
                        </Select>
                      </FormControl>

                      <FormControl fullWidth>
                        <InputLabel shrink>
                          직급 <span style={{ color: 'red' }}>*</span>
                        </InputLabel>
                        <Select
                          value={formData.position || ''}
                          label="직급 *"
                          onChange={handleSelectChange('position')}
                        >
                          {actualUserLevels && actualUserLevels.length > 0 ? (
                            actualUserLevels.map((level) => (
                              <MenuItem key={level.id} value={level.code_name}>
                                {level.code_name}
                              </MenuItem>
                            ))
                          ) : (
                            <>
                              <MenuItem value="사원">사원</MenuItem>
                              <MenuItem value="주임">주임</MenuItem>
                              <MenuItem value="대리">대리</MenuItem>
                              <MenuItem value="과장">과장</MenuItem>
                              <MenuItem value="차장">차장</MenuItem>
                              <MenuItem value="부장">부장</MenuItem>
                            </>
                          )}
                        </Select>
                      </FormControl>

                      <FormControl fullWidth>
                        <InputLabel shrink>
                          직책 <span style={{ color: 'red' }}>*</span>
                        </InputLabel>
                        <Select
                          value={formData.role || ''}
                          label="직책 *"
                          onChange={handleSelectChange('role')}
                        >
                          {actualUserPositions && actualUserPositions.length > 0 ? (
                            actualUserPositions.map((position) => (
                              <MenuItem key={position.id} value={position.code_name} disabled={position.disabled}>
                                {position.code_name}
                              </MenuItem>
                            ))
                          ) : (
                            <>
                              <MenuItem value="경영진">경영진</MenuItem>
                              <MenuItem value="본부장">본부장</MenuItem>
                              <MenuItem value="팀장">팀장</MenuItem>
                              <MenuItem value="파트장">파트장</MenuItem>
                              <MenuItem value="프로">프로</MenuItem>
                              <MenuItem value="관리자">관리자</MenuItem>
                            </>
                          )}
                        </Select>
                      </FormControl>
                    </Stack>

                    {/* 전화번호 - 국가 */}
                    <Stack direction="row" spacing={2}>
                      <TextField
                        fullWidth
                        label="전화번호"
                        value={formData.phone || ''}
                        onChange={handlePhoneChange}
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        error={!!phoneError}
                        helperText={phoneError || '숫자, 하이픈(-), 공백만 입력 가능'}
                        placeholder="010-1234-5678"
                      />

                      <FormControl fullWidth variant="outlined">
                        <InputLabel shrink>국가</InputLabel>
                        <Select
                          value={formData.country || ''}
                          onChange={(e) => handleInputChange('country')(e as any)}
                          label="국가"
                          displayEmpty
                        >
                          {nationalOptions.map((option) => (
                            <MenuItem key={option.id} value={option.code_name}>
                              {option.code_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>

                    {/* 주소 - 전체 너비 */}
                    <TextField
                      fullWidth
                      label="주소"
                      value={formData.address || ''}
                      onChange={handleInputChange('address')}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      sx={{ mb: 2 }}
                    />

                    {/* 등록자, 상태 - 2등분 배치 */}
                    <Stack direction="row" spacing={2}>
                      <TextField
                        fullWidth
                        label="등록자"
                        value={formData.registrant || ''}
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        disabled
                      />

                      <FormControl fullWidth>
                        <InputLabel shrink>상태</InputLabel>
                        <Select
                          value={formData.status || '활성'}
                          label="상태"
                          onChange={handleSelectChange('status')}
                          renderValue={(selected) => {
                            const statusConfig = {
                              '대기': { bgColor: '#f5f5f5', color: '#616161' },
                              '활성': { bgColor: '#e3f2fd', color: '#1565c0' },
                              '비활성': { bgColor: '#fff8e1', color: '#f57c00' },
                              '취소': { bgColor: '#ffebee', color: '#c62828' }
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
                              sx={{ bgcolor: '#f5f5f5', color: '#616161', fontWeight: 500, border: 'none' }} 
                            />
                          </MenuItem>
                          <MenuItem value="활성">
                            <Chip 
                              label="활성" 
                              size="small" 
                              sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 500, border: 'none' }} 
                            />
                          </MenuItem>
                          <MenuItem value="비활성">
                            <Chip 
                              label="비활성" 
                              size="small" 
                              sx={{ bgcolor: '#fff8e1', color: '#f57c00', fontWeight: 500, border: 'none' }} 
                            />
                          </MenuItem>
                          <MenuItem value="취소">
                            <Chip 
                              label="취소" 
                              size="small" 
                              sx={{ bgcolor: '#ffebee', color: '#c62828', fontWeight: 500, border: 'none' }} 
                            />
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>

                    {/* 등록일, 코드 - 2등분 배치 */}
                    <Stack direction="row" spacing={2}>
                      <TextField
                        fullWidth
                        label="등록일"
                        type="date"
                        value={formData.registrationDate || ''}
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        disabled
                      />

                      <TextField
                        fullWidth
                        label="코드"
                        value={formData.code || ''}
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        disabled
                      />
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {/* 역할설정 탭 - 좌우 분할 레이아웃 */}
            <Box sx={{ height: '650px', px: 3, py: 3 }}>
              <Stack direction="row" spacing={3} sx={{ height: '100%' }}>

                {/* 왼쪽 패널 - 역할 설정/해제 */}
                <Box sx={{ width: '50%', height: '100%', overflowY: 'auto', pr: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    역할 설정
                  </Typography>


                  {/* 역할 리스트 */}
                  <Stack spacing={2}>
                    {roles.map((role) => (
                      <Box
                        key={role.id}
                        sx={{
                          p: 2,
                          border: '1px solid #e0e0e0',
                          borderRadius: 2,
                          bgcolor: (formData.assignedRole || []).includes(role.code) ? '#e3f2fd' : 'white',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          '&:hover': {
                            borderColor: '#1976d2',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }
                        }}
                        onClick={() => setSelectedRoleForPermission(role.code)}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            {/* 첫 번째 줄: 제목, 상태, 코드 */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {role.role}
                                </Typography>
                                <Chip
                                  label={role.status}
                                  size="small"
                                  sx={{
                                    bgcolor: role.status === '활성' ? '#e3f2fd' : '#fff8e1',
                                    color: role.status === '활성' ? '#1565c0' : '#f57c00',
                                    fontWeight: 500,
                                    height: '20px'
                                  }}
                                />
                              </Box>
                              <Typography variant="caption" color="textSecondary">
                                {role.code}
                              </Typography>
                            </Box>

                            {/* 두 번째 줄: 설명 + 추가 정보 */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ color: 'text.secondary', flex: 1, mr: 1 }}>
                                {role.description}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {(() => {
                                  // 해당 역할의 실제 권한 개수 계산
                                  const rolePermission = rolePermissions.find(rp => rp.role_code === role.code);
                                  const permissionCount = rolePermission?.detailed_permissions ? rolePermission.detailed_permissions.length : 0;
                                  return `${permissionCount}개 권한`;
                                })()}
                              </Typography>
                            </Box>
                          </Box>

                          <Button
                            variant={(formData.assignedRole || []).includes(role.code) ? 'contained' : 'outlined'}
                            size="small"
                            disabled={role.status !== '활성'}
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData(prev => {
                                const currentRoles = prev.assignedRole || [];
                                const hasRole = currentRoles.includes(role.code);
                                const newRoles = hasRole
                                  ? currentRoles.filter(r => r !== role.code)
                                  : [...currentRoles, role.code];

                                return {
                                  ...prev,
                                  assignedRole: newRoles,
                                  rule: newRoles.length > 0 ? newRoles[0] : 'RULE-25-003'
                                };
                              });
                            }}
                            sx={{ minWidth: '60px' }}
                          >
                            {role.status !== '활성' ? '비활성' :
                             (formData.assignedRole || []).includes(role.code) ? '해제' : '설정'}
                          </Button>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                {/* 오른쪽 패널 - 선택된 역할의 메뉴 권한 */}
                <Box sx={{ width: '50%', height: '100%', overflowY: 'auto', pl: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    메뉴 권한
                  </Typography>

                  {selectedRoleForPermission ? (
                    (() => {
                      const rolePermission = rolePermissions.find(rp => rp.role_code === selectedRoleForPermission);
                      const selectedRole = roles.find(r => r.code === selectedRoleForPermission);

                      console.log('🔍 선택된 역할:', selectedRoleForPermission);
                      console.log('🔍 찾은 rolePermission:', rolePermission);
                      console.log('🔍 찾은 selectedRole:', selectedRole);
                      console.log('🔍 detailed_permissions:', rolePermission?.detailed_permissions);

                      if (!rolePermission || !selectedRole) {
                        return (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography color="textSecondary">
                              선택된 역할의 권한 정보를 찾을 수 없습니다.
                            </Typography>
                          </Box>
                        );
                      }

                      return (
                        <Box>
                          {/* 선택된 역할 정보 */}
                          <Box sx={{
                            p: 2,
                            bgcolor: '#f8f9fa',
                            borderRadius: 2,
                            mb: 2,
                            border: '2px solid #1976d2'
                          }}>
                            {/* 첫 번째 줄: 역할명 + 권한 개수 */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                                {selectedRole.role}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {rolePermission.detailed_permissions ? rolePermission.detailed_permissions.length : 0}개 권한
                              </Typography>
                            </Box>
                            {/* 두 번째 줄: 설명 + 코드 */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" color="textSecondary" sx={{ flex: 1, mr: 1 }}>
                                {selectedRole.description}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {selectedRole.code}
                              </Typography>
                            </Box>
                          </Box>

                          {/* 메뉴별 권한 목록 */}
                          <Stack spacing={1}>
                            {rolePermission.detailed_permissions && rolePermission.detailed_permissions.length > 0 ? (
                              rolePermission.detailed_permissions.map((permission: any, index: number) => {
                                // 권한 레벨 결정 함수
                                const getPermissionLevel = (canRead: boolean, canWrite: boolean, canFull: boolean) => {
                                  if (canFull) return '전체';
                                  if (canWrite) return '쓰기';
                                  if (canRead) return '읽기';
                                  return '없음';
                                };

                                const permissionLevel = getPermissionLevel(
                                  permission.can_read,
                                  permission.can_write,
                                  permission.can_full
                                );

                                // 권한이 없는 경우 표시하지 않음
                                if (permissionLevel === '없음') return null;

                                return (
                                  <Box
                                    key={`${permission.menu_id}-${index}`}
                                    sx={{
                                      p: 2,
                                      bgcolor: 'white',
                                      borderRadius: 1,
                                      border: '1px solid #eee',
                                      '&:hover': {
                                        bgcolor: '#f8f9fa'
                                      }
                                    }}
                                  >
                                    {/* 첫 번째 줄: 메뉴카테고리 - 페이지명 + 권한 */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {permission.menu_category} > {permission.menu_page}
                                      </Typography>
                                      <Chip
                                        label={permissionLevel}
                                        size="small"
                                        color={
                                          permissionLevel === '전체' ? 'success' :
                                          permissionLevel === '쓰기' ? 'primary' :
                                          permissionLevel === '읽기' ? 'warning' : 'default'
                                        }
                                        sx={{ minWidth: '60px', fontWeight: 600 }}
                                    />
                                  </Box>
                                  {/* 두 번째 줄: 메뉴 설명 */}
                                  <Typography variant="caption" color="textSecondary">
                                    {permission.menu_description || '설명 없음'}
                                  </Typography>
                                </Box>
                              );
                            })) : (
                              <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography color="textSecondary">
                                  이 역할에 설정된 메뉴 권한이 없습니다.
                                </Typography>
                              </Box>
                            )}
                          </Stack>
                        </Box>
                      );
                    })()
                  ) : (formData.assignedRole || []).length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                        역할을 선택하세요
                      </Typography>
                      <Typography color="textSecondary">
                        왼쪽에서 역할을 클릭하면 해당 역할의 메뉴 권한을 확인할 수 있습니다.
                      </Typography>
                    </Box>
                  ) : null}
                </Box>

              </Stack>
            </Box>
          </TabPanel>
        </Box>
      </DialogContent>

    </Dialog>

    {/* 비밀번호 변경 다이얼로그 */}
    <Dialog
      open={passwordDialogOpen}
      onClose={handlePasswordChangeClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>비밀번호 변경</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="새 비밀번호"
            type="password"
            value={newPasswordInput}
            onChange={(e) => setNewPasswordInput(e.target.value)}
            placeholder="새 비밀번호를 입력하세요"
            autoFocus
          />
          <TextField
            fullWidth
            label="새 비밀번호 확인"
            type="password"
            value={confirmPasswordInput}
            onChange={(e) => setConfirmPasswordInput(e.target.value)}
            placeholder="새 비밀번호를 다시 입력하세요"
            error={confirmPasswordInput !== '' && newPasswordInput !== confirmPasswordInput}
            helperText={
              confirmPasswordInput !== '' && newPasswordInput !== confirmPasswordInput
                ? '비밀번호가 일치하지 않습니다'
                : ''
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handlePasswordChangeClose} color="inherit">
          취소
        </Button>
        <Button onClick={handlePasswordChange} variant="contained" color="primary">
          변경
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}