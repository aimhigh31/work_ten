'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

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
import UserEditDialog from 'components/UserEditDialog';

// Hooks
import { useSupabaseUserManagement, UserProfile } from 'hooks/useSupabaseUserManagement';
import { useCommonData } from 'contexts/CommonDataContext'; // 🏪 공용 창고
import { useSupabaseMasterCode3 } from 'hooks/useSupabaseMasterCode3';

// 사용자 데이터 타입 정의 (기존 호환성 유지)
interface UserData {
  id: number;
  no: number;
  registrationDate: string;
  code: string;
  userName: string;
  department: string;
  position: string;
  role: string;
  status: '활성' | '비활성' | '대기';
  lastLogin: string;
  registrant: string;
  profileImage?: string;
  profile_image_url?: string;
  userAccount?: string;
  email?: string;
  phone?: string;
  country?: string;
  address?: string;
  assignedRole?: string[];
  rule?: string;
}

// 컬럼 너비 정의
const columnWidths = {
  checkbox: 50,
  no: 60,
  registrationDate: 100,
  code: 120,
  userName: 120,
  department: 100,
  position: 100,
  role: 120,
  status: 90,
  lastLogin: 130,
  registrant: 100,
  action: 80
};

// Props 타입 정의
interface UserManagementTableProps {
  selectedYear?: string;
  selectedTeam?: string;
  selectedStatus?: string;
  selectedAssignee?: string;
  users?: UserData[];
  setUsers?: React.Dispatch<React.SetStateAction<UserData[]>>;
  addChangeLog?: (action: string, target: string, description: string, team?: string) => void;
}

// UserProfile을 UserData로 변환하는 함수
const transformUserProfile = (profile: UserProfile, index: number, totalCount: number): UserData => {
  const statusMap = {
    active: '활성' as const,
    inactive: '비활성' as const,
    pending: '대기' as const
  };

  return {
    id: profile.id,
    no: totalCount - index, // 역순 번호 (최신이 더 큰 번호)
    registrationDate: profile.created_at.split('T')[0],
    code: profile.user_code,
    userName: profile.user_name,
    department: profile.department || '',
    position: profile.position || '',
    role: profile.role,
    status: statusMap[profile.status] || '활성',
    lastLogin: profile.last_login
      ? new Date(profile.last_login)
          .toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
          .replace(/\. /g, '-')
          .replace(/\./g, '')
          .replace(' ', ' ')
      : '-',
    registrant: profile.created_by,
    userAccount: profile.user_account_id,
    email: profile.email,
    phone: profile.phone,
    country: profile.country,
    address: profile.address,
    profileImage: profile.profile_image_url || profile.avatar_url,
    profile_image_url: profile.profile_image_url,
    assignedRole: profile.assignedRole || [],
    rule: profile.rule || 'RULE-25-003'
  };
};

export default function UserManagementTable({
  selectedYear = '전체',
  selectedTeam = '전체',
  selectedStatus = '전체',
  selectedAssignee = '전체',
  users,
  setUsers,
  addChangeLog
}: UserManagementTableProps) {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // 🏪 공용 창고에서 데이터 가져오기 (중복 로딩 방지!)
  const { users: supabaseUsers, departments: supabaseDepartments } = useCommonData();

  // Supabase 훅 사용 (데이터 수정 함수만)
  const {
    loading,
    error,
    clearError,
    fetchUsers,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser
  } = useSupabaseUserManagement();

  // 마스터코드3 Supabase 훅 사용 (플랫 구조)
  const { subCodes: allSubCodes } = useSupabaseMasterCode3();

  console.log('🔍 전체 서브코드 데이터:', allSubCodes);

  // USER_LEVEL 서브코드만 필터링 (GROUP003)
  const userLevelOptions = useMemo(() => {
    const userLevelSubs = allSubCodes
      .filter(
        (sub) => sub.group_code === 'GROUP003' // USER_LEVEL 그룹 코드
      )
      .map((sub) => ({
        id: sub.id,
        code_name: sub.subcode_name,
        code_value: sub.subcode,
        description: sub.subcode_description,
        disabled: !sub.is_active
      }));

    console.log('🎯 UserManagementTable USER_LEVEL 옵션들:', userLevelSubs);
    return userLevelSubs.sort((a, b) => a.subcode_order - b.subcode_order);
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

  // 실제 사용할 직급 데이터는 더 이상 필요하지 않음 (UserEditDialog에서 직접 처리)

  // 변환된 사용자 데이터
  const transformedUsers = useMemo(() => {
    return supabaseUsers.map((profile, index) => transformUserProfile(profile, index, supabaseUsers.length));
  }, [supabaseUsers]);

  const [data, setData] = useState<UserData[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState('');

  // Edit 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  // Excel 다운로드 기능
  const handleExcelDownload = () => {
    try {
      const excelData = filteredData.map((user, index) => ({
        NO: index + 1,
        등록일: user.registrationDate,
        코드: user.code,
        사용자: user.userName,
        부서: user.department,
        직급: user.position,
        직책: user.role,
        상태: user.status,
        마지막로그인: user.lastLogin,
        등록자: user.registrant
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
      link.setAttribute('download', `사용자관리_${new Date().toISOString().slice(0, 10)}.csv`);
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

  // Supabase 데이터 또는 props 데이터 사용
  useEffect(() => {
    if (users && users.length > 0) {
      setData([...users]);
    } else if (transformedUsers.length > 0) {
      setData([...transformedUsers]);
    }
  }, [users, transformedUsers]);

  // 에러 처리 (로딩 완료 후에만 에러 표시)
  useEffect(() => {
    if (error && !loading) {
      console.error('사용자 데이터 에러:', error);
      // 에러를 일정 시간 후 자동 클리어
      setTimeout(() => {
        clearError();
      }, 5000);
    }
  }, [error, loading, clearError]);

  // 필터링된 데이터 (원본 순서 유지 - 최신 데이터가 먼저)
  const filteredData = useMemo(() => {
    const filtered = data.filter((user) => {
      // 연도 필터
      if (selectedYear !== '전체') {
        const userYear = new Date(user.registrationDate).getFullYear().toString();
        if (userYear !== selectedYear) return false;
      }

      const statusMatch = selectedStatus === '전체' || user.status === selectedStatus;
      const teamMatch = selectedTeam === '전체' || user.department === selectedTeam;
      return statusMatch && teamMatch;
    });
    // 원본 순서 유지 (API에서 이미 created_at DESC로 정렬됨)
    return filtered;
  }, [data, selectedYear || '전체', selectedStatus, selectedTeam]);

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
  }, [selectedYear || '전체', selectedStatus, selectedTeam]);

  // URL 파라미터로 프로필 다이얼로그 자동 열기
  useEffect(() => {
    const openProfile = searchParams.get('openProfile');

    console.log('🔍 Profile Dialog Debug:', {
      openProfile,
      hasEmail: !!session?.user?.email,
      email: session?.user?.email,
      dataLength: data.length,
      allEmails: data.map(u => u.email)
    });

    if (openProfile === 'true' && session?.user?.email && data.length > 0) {
      // 현재 로그인한 사용자 찾기
      const currentUser = data.find(user => user.email === session.user.email);

      console.log('🎯 Found current user:', currentUser);

      if (currentUser) {
        console.log('✅ Opening profile dialog for:', currentUser.userName);
        setEditingUser(currentUser);
        setEditDialog(true);

        // URL에서 파라미터 제거 (한 번만 실행되도록)
        router.replace('/apps/user-management');
      } else {
        console.log('❌ Current user not found in data');
      }
    }
  }, [searchParams, session, data, router]);

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

    if (confirm(`선택된 ${selected.length}개의 사용자를 삭제하시겠습니까?`)) {
      // 변경로그 기록
      if (addChangeLog) {
        const deletedUsers = data.filter((user) => selected.includes(user.id));
        deletedUsers.forEach((user) => {
          addChangeLog('사용자 삭제', user.code || `USER-${user.id}`, `${user.userName || '사용자'} 삭제`, user.department);
        });
      }

      // Supabase에서 삭제
      const deletePromises = selected.map((id) => deleteUser(id));
      await Promise.all(deletePromises);

      setSelected([]);
    }
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingUser(null);
  };

  // 사용자 저장
  const handleEditUserSave = async (updatedUser: UserData) => {
    const existingUser = data.find((user) => user.id === updatedUser.id);

    if (existingUser) {
      // 기존 사용자 업데이트
      const statusMap = {
        활성: 'active' as const,
        비활성: 'inactive' as const,
        대기: 'pending' as const
      };

      const updateData = {
        id: updatedUser.id,
        user_code: updatedUser.code,
        user_name: updatedUser.userName,
        email: updatedUser.email || `${updatedUser.userName}@company.com`,
        department: updatedUser.department,
        position: updatedUser.position,
        role: updatedUser.role,
        status: statusMap[updatedUser.status] || 'active',
        phone: updatedUser.phone,
        country: updatedUser.country,
        address: updatedUser.address,
        user_account_id: updatedUser.userAccount,
        profile_image_url: updatedUser.profile_image_url || updatedUser.profileImage,
        assignedRole: updatedUser.assignedRole || [],
        rule: updatedUser.rule || 'RULE-25-003'
      };

      const success = await updateUser(updateData);

      if (success && addChangeLog) {
        addChangeLog(
          '사용자 정보 수정',
          updatedUser.code || `USER-${updatedUser.id}`,
          `${updatedUser.userName || '사용자'} 정보 수정`,
          updatedUser.department
        );
      }
    } else {
      // 새 사용자 추가 - Supabase Auth로 생성
      try {
        // 이메일이 없으면 사용자계정 기반으로 고유한 이메일 생성
        let baseEmail = updatedUser.email;
        if (!baseEmail) {
          const accountId = updatedUser.userAccount || `user${Date.now()}`;
          baseEmail = `${accountId}@company.local`;
        }

        // 기본 비밀번호 설정 (나중에 변경하도록 안내)
        const defaultPassword = '123456';

        // Supabase Auth에 사용자 생성 (API 호출)
        const response = await fetch('/api/create-auth-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: baseEmail,
            password: defaultPassword,
            user_name: updatedUser.userName,
            department: updatedUser.department,
            position: updatedUser.position,
            role: updatedUser.role,
            user_account_id: updatedUser.userAccount,
            phone: updatedUser.phone,
            country: updatedUser.country,
            address: updatedUser.address,
            profile_image_url: updatedUser.profile_image_url || updatedUser.profileImage
          })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          console.error('Auth 사용자 생성 실패:', result.error);

          // 이메일 중복 오류인 경우 특별 처리
          if (result.error && result.error.includes('already been registered')) {
            alert(`이메일 중복 오류: 이미 사용 중인 이메일입니다.\n이메일: ${baseEmail}\n\n다른 이메일 주소를 입력하거나, 이메일을 비워두면 자동으로 생성됩니다.`);
          } else {
            alert(`사용자 생성 실패: ${result.error}`);
          }
          return;
        }

        console.log('✅ Auth 사용자 생성 성공, 트리거에 의해 프로필도 자동 생성됨');

        // 사용자 목록 새로고침
        await fetchUsers();

        if (addChangeLog) {
          addChangeLog('새 사용자 생성', result.auth_user_id, `${updatedUser.userName || '새 사용자'} 생성`, updatedUser.department);
        }

        alert(`사용자가 생성되었습니다.\n이메일: ${baseEmail}\n초기 비밀번호: ${defaultPassword}\n(로그인 후 비밀번호를 변경해주세요)`);
      } catch (error: any) {
        console.error('사용자 생성 중 오류:', error);
        alert('사용자 생성 중 오류가 발생했습니다.');
      }
    }

    handleEditDialogClose();
  };

  // 새 User 추가
  const addNewUser = () => {
    setEditingUser(null);
    setEditDialog(true);
  };

  // 편집 핸들러
  const handleEditUser = (user: UserData) => {
    setEditingUser(user);
    setEditDialog(true);
  };

  // 상태 색상
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

  // 부서 색상 (파스텔톤 제거)
  const getDepartmentColor = (department: string) => {
    return { color: '#333333' };
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 상단 정보 및 액션 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, mt: 3, flexShrink: 0 }}>
        <Typography variant="body2" color="text.secondary">
          총 {filteredData.length}건
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
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
          <Button variant="contained" startIcon={<Add size={16} />} size="small" onClick={addNewUser} sx={{ px: 2 }}>
            추가
          </Button>
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
        </Box>
      </Box>

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
            minWidth: 1400
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
                  checked={paginatedData.length > 0 && paginatedData.every((user) => selected.includes(user.id))}
                  indeterminate={selected.length > 0 && selected.length < paginatedData.length}
                  onChange={handleSelectAllClick}
                  size="small"
                />
              </TableCell>
              <TableCell sx={{ width: columnWidths.no, fontWeight: 600 }}>NO</TableCell>
              <TableCell sx={{ width: columnWidths.registrationDate, fontWeight: 600 }}>등록일</TableCell>
              <TableCell sx={{ width: columnWidths.code, fontWeight: 600 }}>코드</TableCell>
              <TableCell sx={{ width: columnWidths.userName, fontWeight: 600 }}>사용자</TableCell>
              <TableCell sx={{ width: columnWidths.department, fontWeight: 600 }}>부서</TableCell>
              <TableCell sx={{ width: columnWidths.position, fontWeight: 600 }}>직급</TableCell>
              <TableCell sx={{ width: columnWidths.role, fontWeight: 600 }}>직책</TableCell>
              <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: columnWidths.lastLogin, fontWeight: 600 }}>마지막로그인</TableCell>
              <TableCell sx={{ width: columnWidths.registrant, fontWeight: 600 }}>등록자</TableCell>
              <TableCell sx={{ width: columnWidths.action, fontWeight: 600 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((user) => (
                <TableRow
                  key={user.id}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(user.id)}
                      onChange={(event) => {
                        const selectedIndex = selected.indexOf(user.id);
                        let newSelected: number[] = [];

                        if (selectedIndex === -1) {
                          newSelected = newSelected.concat(selected, user.id);
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
                      {user.no}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {user.registrationDate}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {user.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar src={user.profileImage || user.profile_image_url || ''} sx={{ width: 24, height: 24, fontSize: '12px' }}>
                        {user.userName?.charAt(0)}
                      </Avatar>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '13px',
                          color: 'text.primary',
                          fontWeight: 500
                        }}
                      >
                        {user.userName}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.department}
                      size="small"
                      sx={{
                        ...getDepartmentColor(user.department),
                        fontWeight: 400,
                        fontSize: '12px',
                        backgroundColor: 'transparent',
                        border: 'none'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {user.position}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {user.role}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.status}
                      size="small"
                      sx={{
                        ...getStatusColor(user.status),
                        fontWeight: 500,
                        fontSize: '13px'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {user.lastLogin}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                      {user.registrant}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="수정">
                        <IconButton size="small" onClick={() => handleEditUser(user)} sx={{ color: 'primary.main' }}>
                          <Edit size={16} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : loading ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                  <LinearProgress sx={{ width: '100%', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    사용자 데이터를 불러오는 중...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="error">
                    {error}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
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

      {/* 사용자 편집 다이얼로그 */}
      {editDialog && (
        <UserEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          user={editingUser}
          onSave={handleEditUserSave}
          departments={supabaseDepartments}
        />
      )}
    </Box>
  );
}
