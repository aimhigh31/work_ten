'use client';

import { useEffect, useState } from 'react';

// next
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

// material-ui
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

// project-imports
import { handlerActiveItem, useGetMenuMaster } from 'api/menu';
import { GRID_COMMON_SPACING } from 'config';
import { useSupabaseUserManagement } from 'hooks/useSupabaseUserManagement';
import { useSupabaseStorage } from 'hooks/useSupabaseStorage';

// assets
import { Profile } from '@wandersonalwes/iconsax-react';

type Props = {
  tab: string;
};

// ==============================|| PROFILE - ACCOUNT ||============================== //

export default function AccountProfile({ tab }: Props) {
  const pathname = usePathname();
  const { menuMaster } = useGetMenuMaster();
  const { data: session } = useSession();

  const { users, updateUser } = useSupabaseUserManagement();
  const { uploadProfileImage, deleteProfileImage } = useSupabaseStorage();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [tempImageFile, setTempImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // disabled TextField 스타일
  const disabledTextFieldStyle = {
    '& .MuiInputBase-input.Mui-disabled': {
      WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
      color: 'rgba(0, 0, 0, 0.87)'
    },
    '& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(0, 0, 0, 0.23)'
    },
    '& .MuiInputLabel-root.Mui-disabled': {
      color: 'rgba(0, 0, 0, 0.6)',
      backgroundColor: 'white',
      paddingLeft: '8px',
      paddingRight: '8px'
    }
  };

  useEffect(() => {
    if (menuMaster.openedItem !== 'account-profile') handlerActiveItem('account-profile');
    // eslint-disable-next-line
  }, [pathname]);

  useEffect(() => {
    if (session?.user?.email && users.length > 0) {
      const user = users.find((u) => u.email === session.user.email);
      if (user) {
        // 모든 필드를 확실하게 정의된 값으로 설정
        const normalizedUser = {
          ...user,
          user_code: user.user_code ?? '',
          user_account_id: user.user_account_id ?? '',
          user_name: user.user_name ?? '',
          department: user.department ?? '',
          position: user.position ?? '',
          role: user.role ?? '',
          email: user.email ?? '',
          phone: user.phone ?? '',
          country: user.country ?? '',
          address: user.address ?? '',
          created_by: user.created_by ?? '',
          status: user.status ?? '',
          created_at: user.created_at ?? '',
          profile_image_url: user.profile_image_url ?? null,
          avatar_url: user.avatar_url ?? null
        };
        setCurrentUser(normalizedUser);
        setIsUserLoaded(true);
      }
    }
  }, [session, users]);

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

  // 비밀번호 변경
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

    if (!currentUser?.auth_user_id) {
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
          auth_user_id: currentUser.auth_user_id,
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

  // 비밀번호 초기화
  const handlePasswordReset = async () => {
    if (!currentUser?.auth_user_id) {
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
          auth_user_id: currentUser.auth_user_id,
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

  // 프로필 사진 업로드
  const handleImageUpload = async (file: File) => {
    if (!currentUser?.id) {
      alert('사용자 정보가 없습니다.');
      return;
    }

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    try {
      // 파일 저장
      setTempImageFile(file);

      // 미리보기용 로컬 URL 생성 (Promise로 래핑)
      const previewUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            resolve(event.target.result as string);
          } else {
            reject(new Error('파일 읽기 실패'));
          }
        };
        reader.onerror = () => {
          reject(new Error('파일 읽기 중 오류 발생'));
        };
        reader.readAsDataURL(file);
      });

      setPreviewImageUrl(previewUrl);

      // 실제 업로드
      const userId = currentUser.user_code || `user-${Date.now()}`;
      const uploadResult = await uploadProfileImage(file, userId);

      if (uploadResult.error) {
        alert(`이미지 업로드 실패: ${uploadResult.error}`);
        setTempImageFile(null);
        setPreviewImageUrl(null);
        return;
      }

      // 기존 이미지가 Supabase Storage URL이면 삭제
      if (currentUser.profile_image_url && currentUser.profile_image_url.includes('supabase')) {
        await deleteProfileImage(currentUser.profile_image_url);
      }

      // DB 업데이트
      const success = await updateUser({
        id: currentUser.id,
        user_code: currentUser.user_code,
        user_name: currentUser.user_name,
        email: currentUser.email,
        profile_image_url: uploadResult.url
      } as any);

      if (success) {
        alert('프로필 사진이 업로드되었습니다.');
        setCurrentUser({ ...currentUser, profile_image_url: uploadResult.url });
        setTempImageFile(null);
        setPreviewImageUrl(null);
      } else {
        alert('프로필 사진 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('프로필 사진 업로드 예외:', error);
      alert('프로필 사진 업로드 중 오류가 발생했습니다.');
      setTempImageFile(null);
      setPreviewImageUrl(null);
    }
  };

  // 프로필 사진 제거
  const handleRemoveProfileImage = async () => {
    if (!currentUser?.id) {
      alert('사용자 정보가 없습니다.');
      return;
    }

    if (!confirm('프로필 사진을 제거하시겠습니까?')) {
      return;
    }

    try {
      // Supabase Storage에서 이미지 삭제
      if (currentUser.profile_image_url && currentUser.profile_image_url.includes('supabase')) {
        await deleteProfileImage(currentUser.profile_image_url);
      }

      // DB 업데이트
      const success = await updateUser({
        id: currentUser.id,
        user_code: currentUser.user_code,
        user_name: currentUser.user_name,
        email: currentUser.email,
        profile_image_url: null
      } as any);

      if (success) {
        alert('프로필 사진이 제거되었습니다.');
        setCurrentUser({ ...currentUser, profile_image_url: null, avatar_url: null });
        setPreviewImageUrl(null);
      } else {
        alert('프로필 사진 제거에 실패했습니다.');
      }
    } catch (error) {
      console.error('프로필 사진 제거 예외:', error);
      alert('프로필 사진 제거 중 오류가 발생했습니다.');
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 페이지 타이틀 및 브레드크럼 */}
      <Box sx={{ pt: 2, mb: 2, flexShrink: 0, px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
          <Typography variant="h2" sx={{ fontWeight: 700 }}>
            개인프로필
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ pb: 0.5 }}>
            관리자메뉴 &gt; 사용자설정
          </Typography>
        </Box>
      </Box>

      {/* 탭 네비게이션 */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
          mt: 1,
          px: 3
        }}
      >
        <Tabs
          value="basic"
          aria-label="개인프로필 탭"
          sx={{
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontSize: '0.91rem',
              fontWeight: 500
            }
          }}
        >
          <Tab
            icon={<Profile size={19} />}
            iconPosition="start"
            label="프로필"
            value="basic"
            sx={{
              gap: 0.8,
              '& .MuiTab-iconWrapper': {
                margin: 0
              }
            }}
          />
        </Tabs>
      </Box>

      {/* 탭 컨텐츠 */}
      <Box sx={{ pt: 3, px: 3, flex: 1, overflow: 'auto' }}>
        {isUserLoaded && currentUser ? (
          <Stack direction="row" spacing={3} key={currentUser.id}>
            {/* 왼쪽 섹션 - 프로필 사진 */}
            <Box sx={{ width: '250px', flexShrink: 0 }}>
              <Stack spacing={2} alignItems="center">
                {/* 프로필 사진 제목과 제거 버튼 */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    프로필 사진
                  </Typography>
                  {(previewImageUrl || currentUser.profile_image_url) && (
                    <Button variant="outlined" color="error" size="small" onClick={handleRemoveProfileImage}>
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
                    backgroundImage:
                      previewImageUrl || currentUser.profile_image_url
                        ? `url(${previewImageUrl || currentUser.profile_image_url})`
                        : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative'
                  }}
                  onClick={() => {
                    try {
                      const input = document.getElementById('profile-upload') as HTMLInputElement;
                      if (input) {
                        input.click();
                      }
                    } catch (error) {
                      console.error('파일 선택 창 열기 오류:', error);
                    }
                  }}
                >
                  {!previewImageUrl && !currentUser.profile_image_url && (
                    <>
                      <Avatar sx={{ width: 60, height: 60, mb: 1, bgcolor: '#f5f5f5', color: '#999' }}>📷</Avatar>
                      <Typography variant="body2" color="textSecondary" textAlign="center">
                        클릭하여
                        <br />
                        사진 업로드
                      </Typography>
                    </>
                  )}
                  {(previewImageUrl || currentUser.profile_image_url) && (
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
                    try {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                      // 같은 파일을 다시 선택할 수 있도록 input 값 리셋
                      e.target.value = '';
                    } catch (error) {
                      console.error('파일 선택 중 오류:', error);
                      alert('파일 선택 중 오류가 발생했습니다.');
                      e.target.value = '';
                    }
                  }}
                />

                {/* 사용자 정보 */}
                <Box sx={{ width: '100%', mt: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Stack spacing={1.5} alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                      {currentUser.user_name || '사용자명'}
                    </Typography>

                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                        Code
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {currentUser.user_code || '코드'}
                      </Typography>
                    </Box>

                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                        사용자계정(ID)
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {currentUser.user_account_id || '계정ID'}
                      </Typography>
                    </Box>

                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                        이메일
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: 'break-all' }}>
                        {currentUser.email || '이메일 주소'}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* 비밀번호 변경 버튼 */}
                <Button variant="outlined" color="primary" fullWidth sx={{ mt: 2 }} onClick={handlePasswordChangeOpen}>
                  비밀번호 변경
                </Button>

                {/* 비밀번호 초기화 버튼 */}
                <Button variant="outlined" color="warning" fullWidth sx={{ mt: 1 }} onClick={handlePasswordReset}>
                  비밀번호 초기화
                </Button>
              </Stack>
            </Box>

            {/* 오른쪽 섹션 - 사용자 정보 */}
            <Box sx={{ flex: 1, overflowY: 'auto', pt: 6 }}>
              <Stack spacing={3}>
                {/* code */}
                <TextField
                  fullWidth
                  label="code"
                  value={currentUser.user_code || ''}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  disabled
                  sx={disabledTextFieldStyle}
                />

                {/* 사용자계정(ID), 사용자명 */}
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label="사용자계정(ID)"
                    value={currentUser.user_account_id || ''}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    disabled
                    sx={disabledTextFieldStyle}
                  />

                  <TextField
                    fullWidth
                    label="사용자명"
                    value={currentUser.user_name || ''}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    disabled
                    sx={disabledTextFieldStyle}
                  />
                </Stack>

                {/* 부서, 직급, 직책 */}
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label="부서"
                    value={currentUser.department || ''}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    disabled
                    sx={disabledTextFieldStyle}
                  />

                  <TextField
                    fullWidth
                    label="직급"
                    value={currentUser.position || ''}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    disabled
                    sx={disabledTextFieldStyle}
                  />

                  <TextField
                    fullWidth
                    label="직책"
                    value={currentUser.role || ''}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    disabled
                    sx={disabledTextFieldStyle}
                  />
                </Stack>

                {/* 이메일, 전화번호, 국가 */}
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label="이메일"
                    value={currentUser.email || ''}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    disabled
                    sx={disabledTextFieldStyle}
                  />

                  <TextField
                    fullWidth
                    label="전화번호"
                    value={currentUser.phone || ''}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    disabled
                    sx={disabledTextFieldStyle}
                  />

                  <TextField
                    fullWidth
                    label="국가"
                    value={currentUser.country || ''}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    disabled
                    sx={disabledTextFieldStyle}
                  />
                </Stack>

                {/* 주소 */}
                <TextField
                  fullWidth
                  label="주소"
                  value={currentUser.address || ''}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  disabled
                  sx={disabledTextFieldStyle}
                />

                {/* 등록자, 상태 */}
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label="등록자"
                    value={currentUser.created_by || ''}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    disabled
                    sx={disabledTextFieldStyle}
                  />

                  <TextField
                    fullWidth
                    label="상태"
                    value={currentUser.status || ''}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    disabled
                    sx={disabledTextFieldStyle}
                  />
                </Stack>

                {/* 등록일, 코드 */}
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label="등록일"
                    value={currentUser.created_at ? new Date(currentUser.created_at).toISOString().split('T')[0] : ''}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    disabled
                    sx={disabledTextFieldStyle}
                  />

                  <TextField
                    fullWidth
                    label="코드"
                    value={currentUser.user_code || ''}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    disabled
                    sx={disabledTextFieldStyle}
                  />
                </Stack>
              </Stack>
            </Box>
          </Stack>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <Typography variant="body1" color="textSecondary">
              사용자 정보를 불러오는 중...
            </Typography>
          </Box>
        )}
      </Box>

      {/* 비밀번호 변경 다이얼로그 */}
      <Dialog open={passwordDialogOpen} onClose={handlePasswordChangeClose} maxWidth="xs" fullWidth>
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
              helperText={confirmPasswordInput !== '' && newPasswordInput !== confirmPasswordInput ? '비밀번호가 일치하지 않습니다' : ''}
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
    </Box>
  );
}
