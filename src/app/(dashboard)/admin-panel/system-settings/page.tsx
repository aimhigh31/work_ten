'use client';

// material-ui
import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import LinearProgress from '@mui/material/LinearProgress';
import Backdrop from '@mui/material/Backdrop';

// project-imports
import { GRID_COMMON_SPACING } from 'config';
import menuItems from 'menu-items';
import { useSupabaseSystemSettings } from 'hooks/useSupabaseSystemSettings';

// assets
import { Setting2, Notification, Camera, DocumentUpload, Category2 } from '@wandersonalwes/iconsax-react';

// components
import SystemMenuPermissionsTable, { SystemMenuPermissionsTableRef } from 'components/SystemMenuPermissionsTable';

// ==============================|| 시스템 설정 페이지 ||============================== //

export default function SystemSettings() {
  const theme = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuTableRef = useRef<SystemMenuPermissionsTableRef>(null);

  // 탭 상태
  const [tabValue, setTabValue] = useState(0);

  // 스낵바 상태
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Supabase 시스템 설정 훅 사용
  const {
    systemSettings,
    menuSettings,
    menuStatusMap,
    loading,
    settingsLoading,
    menuLoading,
    uploadLoading,
    error,
    updateSystemSetting,
    uploadLogo,
    deleteLogo,
    updateMenuStatus,
    refreshSystemSettings,
    refreshAll
  } = useSupabaseSystemSettings();

  // 로컬 설정 상태 (폼 입력용)
  const [localSettings, setLocalSettings] = useState({
    siteName: '',
    siteDescription: '',
    maintenanceMode: false
  });

  // ========================================
  // 효과 및 초기화
  // ========================================

  // 시스템 설정이 로드되면 로컬 상태 초기화
  useEffect(() => {
    if (systemSettings) {
      setLocalSettings({
        siteName: systemSettings.site_name || '',
        siteDescription: systemSettings.site_description || '',
        maintenanceMode: systemSettings.maintenance_mode || false
      });
    }
  }, [systemSettings]);

  // 에러 발생시 스낵바 표시
  useEffect(() => {
    if (error) {
      setSnackbar({
        open: true,
        message: error,
        severity: 'error'
      });
    }
  }, [error]);

  // ========================================
  // 이벤트 핸들러
  // ========================================

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleLocalSettingChange = (key: string, value: any) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({
        open: true,
        message: '파일 크기는 5MB 이하여야 합니다.',
        severity: 'warning'
      });
      return;
    }

    // 파일 형식 체크
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setSnackbar({
        open: true,
        message: 'JPG, PNG, GIF, WEBP 형식의 이미지만 업로드 가능합니다.',
        severity: 'warning'
      });
      return;
    }

    try {
      // Supabase Storage 업로드 시도
      const result = await uploadLogo(file);

      // 성공한 경우 시스템 설정 업데이트
      await updateSystemSetting('site_logo', result.url);

      setSnackbar({
        open: true,
        message: '로고가 성공적으로 업로드되었습니다.',
        severity: 'success'
      });
    } catch (err: any) {
      console.log('로고 업로드 Storage 실패, localStorage 사용:', err?.message);

      // Storage 버킷이 없는 경우 localStorage 사용 (임시 방법)
      if (err?.code === 'BUCKET_NOT_FOUND' || err?.message?.includes('버킷')) {
        // FileReader를 사용하여 Base64로 변환
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Logo = e.target?.result as string;

          try {
            // localStorage에 저장
            localStorage.setItem('systemLogo', base64Logo);

            // 시스템 설정 업데이트 (DB + 로컬 상태 둘 다 처리)
            await updateSystemSetting('site_logo', base64Logo);

            // 로고 업데이트 이벤트 발생
            window.dispatchEvent(new Event('logoUpdated'));

            setSnackbar({
              open: true,
              message: '로고가 저장되었습니다.',
              severity: 'success'
            });
          } catch (updateErr) {
            console.log('로고 설정 업데이트 실패:', updateErr);

            // 실패해도 localStorage는 저장하고 상태 업데이트
            localStorage.setItem('systemLogo', base64Logo);
            await updateSystemSetting('site_logo', base64Logo);
            window.dispatchEvent(new Event('logoUpdated'));

            setSnackbar({
              open: true,
              message: '로고가 로컬에 저장되었습니다.',
              severity: 'info'
            });
          }
        };
        reader.readAsDataURL(file);
      } else {
        setSnackbar({
          open: true,
          message: '로고 업로드 중 오류가 발생했습니다.',
          severity: 'error'
        });
      }
    }
  };

  const handleLogoRemove = async () => {
    if (!systemSettings?.site_logo) return;

    try {
      // Storage에서 삭제 시도 (Storage 버킷이 있는 경우)
      if (systemSettings.site_logo.includes('supabase')) {
        const url = new URL(systemSettings.site_logo);
        const pathParts = url.pathname.split('/');
        const filePath = `system/${pathParts[pathParts.length - 1]}`;
        await deleteLogo(filePath);
      }

      // localStorage에서 제거
      localStorage.removeItem('systemLogo');

      // 시스템 설정 업데이트 (이 함수가 로컬 상태도 즉시 업데이트함)
      await updateSystemSetting('site_logo', null);

      // 로고 업데이트 이벤트 발생
      window.dispatchEvent(new Event('logoUpdated'));

      setSnackbar({
        open: true,
        message: '로고가 삭제되었습니다.',
        severity: 'success'
      });
    } catch (err) {
      console.log('로고 삭제 실패:', err);

      // 어떤 경우든 localStorage에서는 제거하고 상태 업데이트
      localStorage.removeItem('systemLogo');
      await updateSystemSetting('site_logo', null);
      window.dispatchEvent(new Event('logoUpdated'));

      setSnackbar({
        open: true,
        message: '로고가 삭제되었습니다.',
        severity: 'success'
      });
    }
  };

  const handleSave = async () => {
    try {
      let allSuccess = true;
      const messages: string[] = [];

      // 일반설정 탭 저장
      if (tabValue === 0) {
        // localStorage에 사이트 설정 저장
        localStorage.setItem('systemSiteName', localSettings.siteName);
        localStorage.setItem('systemSiteDescription', localSettings.siteDescription);
        localStorage.setItem('systemMaintenanceMode', String(localSettings.maintenanceMode));

        // 데이터베이스 업데이트 시도 (테이블이 있는 경우)
        const updates = [];

        if (localSettings.siteName !== systemSettings?.site_name) {
          updates.push(
            updateSystemSetting('site_name', localSettings.siteName).catch((err) =>
              console.log('DB 업데이트 실패, localStorage 사용:', err)
            )
          );
        }
        if (localSettings.siteDescription !== systemSettings?.site_description) {
          updates.push(
            updateSystemSetting('site_description', localSettings.siteDescription).catch((err) =>
              console.log('DB 업데이트 실패, localStorage 사용:', err)
            )
          );
        }
        if (localSettings.maintenanceMode !== systemSettings?.maintenance_mode) {
          updates.push(
            updateSystemSetting('maintenance_mode', localSettings.maintenanceMode).catch((err) =>
              console.log('DB 업데이트 실패, localStorage 사용:', err)
            )
          );
        }

        if (updates.length > 0) {
          await Promise.allSettled(updates); // 실패해도 계속 진행
        }

        messages.push('일반설정이 저장되었습니다.');
      }

      // 메뉴관리 탭 저장 (메뉴 설명 변경사항)
      if (tabValue === 1 && menuTableRef.current) {
        if (menuTableRef.current.hasPendingChanges()) {
          const menuSaveSuccess = await menuTableRef.current.savePendingChanges();
          if (menuSaveSuccess) {
            messages.push('메뉴 설정이 저장되었습니다.');
          } else {
            allSuccess = false;
          }
        }
      }

      // 모든 탭 저장 (탭에 관계없이)
      if (tabValue === 0) {
        // 일반설정 탭에서 저장 버튼 클릭 시, 메뉴관리 탭의 변경사항도 함께 저장
        if (menuTableRef.current && menuTableRef.current.hasPendingChanges()) {
          const menuSaveSuccess = await menuTableRef.current.savePendingChanges();
          if (menuSaveSuccess) {
            messages.push('메뉴 설정도 함께 저장되었습니다.');
          }
        }
      }

      if (messages.length > 0) {
        setSnackbar({
          open: true,
          message: messages.join(' '),
          severity: allSuccess ? 'success' : 'warning'
        });
      } else {
        setSnackbar({
          open: true,
          message: '저장할 변경사항이 없습니다.',
          severity: 'info'
        });
      }

      // 이벤트 발생 (사이드바 업데이트 등)
      setTimeout(() => {
        window.dispatchEvent(new Event('logoUpdated'));
        window.dispatchEvent(new Event('systemSettingsUpdated'));
        window.dispatchEvent(new Event('menuUpdated'));
      }, 100);
    } catch (err) {
      console.log('설정 저장 실패:', err);

      // 실패해도 localStorage는 업데이트하고 성공으로 처리
      if (tabValue === 0) {
        localStorage.setItem('systemSiteName', localSettings.siteName);
        localStorage.setItem('systemSiteDescription', localSettings.siteDescription);
        localStorage.setItem('systemMaintenanceMode', String(localSettings.maintenanceMode));
      }

      setSnackbar({
        open: true,
        message: '설정 저장 중 오류가 발생했습니다.',
        severity: 'error'
      });

      // 이벤트 발생
      setTimeout(() => {
        window.dispatchEvent(new Event('logoUpdated'));
        window.dispatchEvent(new Event('systemSettingsUpdated'));
        window.dispatchEvent(new Event('menuUpdated'));
      }, 100);
    }
  };

  const handleCancel = () => {
    // 시스템 설정에서 다시 로드
    if (systemSettings) {
      setLocalSettings({
        siteName: systemSettings.site_name || '',
        siteDescription: systemSettings.site_description || '',
        maintenanceMode: systemSettings.maintenance_mode || false
      });
    }
  };

  const handleMenuStatusChange = async (menuId: string, enabled: boolean) => {
    // 관리자 메뉴는 필수 사용으로 변경 불가
    if (menuId === 'group-admin-panel' || menuId.includes('admin-panel')) {
      return;
    }

    try {
      await updateMenuStatus(menuId, enabled);
      setSnackbar({
        open: true,
        message: `메뉴 상태가 업데이트되었습니다.`,
        severity: 'success'
      });
    } catch (err) {
      console.error('메뉴 상태 업데이트 실패:', err);
    }
  };

  // ========================================
  // 렌더링
  // ========================================

  // 로딩 중 표시
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 3,
        height: '100%',
        overflow: 'auto'
      }}
    >
      {/* 로딩 백드롭 */}
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={settingsLoading || menuLoading || uploadLoading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* 페이지 타이틀 */}
      <Box sx={{ mb: 3, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography variant="h2" component="h1" sx={{ fontWeight: 700 }}>
            시스템 설정
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ pb: 0.5 }}>
            관리자메뉴 &gt; 시스템 설정
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={1.2}>
        {/* 페이지 헤더 */}
        <Grid size={12}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1.2,
              borderBottom: 1,
              borderColor: 'divider'
            }}
          >
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: theme.palette.primary.main
                }
              }}
            >
              <Tab icon={<Setting2 size={18} />} iconPosition="start" label="일반설정" sx={{ minHeight: 48 }} />
              <Tab icon={<Category2 size={18} />} iconPosition="start" label="메뉴 관리" sx={{ minHeight: 48 }} />
            </Tabs>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" onClick={handleCancel}>
                취소
              </Button>
              <Button variant="contained" onClick={handleSave} disabled={settingsLoading}>
                설정 저장
              </Button>
            </Box>
          </Box>
        </Grid>

        {/* 탭 패널 - 일반설정 */}
        {tabValue === 0 && (
          <>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Setting2 size={20} />
                    일반 설정
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="사이트 이름"
                      value={localSettings.siteName}
                      onChange={(e) => handleLocalSettingChange('siteName', e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="사이트 설명"
                      value={localSettings.siteDescription}
                      onChange={(e) => handleLocalSettingChange('siteDescription', e.target.value)}
                      fullWidth
                      multiline
                      rows={3}
                      InputLabelProps={{ shrink: true }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={localSettings.maintenanceMode}
                          onChange={(e) => handleLocalSettingChange('maintenanceMode', e.target.checked)}
                        />
                      }
                      label="유지보수 모드"
                    />
                    {localSettings.maintenanceMode && (
                      <Alert severity="warning">유지보수 모드가 활성화되면 일반 사용자는 사이트에 접근할 수 없습니다.</Alert>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* 로고 설정 */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Camera size={20} />
                    로고 설정
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 120,
                        height: 120,
                        borderRadius: 2,
                        border: `2px dashed ${theme.palette.divider}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        backgroundColor: systemSettings?.site_logo ? 'transparent' : theme.palette.background.paper,
                        overflow: 'hidden'
                      }}
                    >
                      {systemSettings?.site_logo ? (
                        <img
                          src={systemSettings.site_logo}
                          alt="Site Logo"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      ) : (
                        <DocumentUpload size={40} color={theme.palette.text.secondary} />
                      )}
                    </Box>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                    <Button
                      variant="outlined"
                      startIcon={<Camera size={16} />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadLoading}
                      fullWidth
                    >
                      로고 업로드
                    </Button>
                    {systemSettings?.site_logo && (
                      <Button variant="outlined" color="error" onClick={handleLogoRemove} disabled={uploadLoading} fullWidth>
                        로고 삭제
                      </Button>
                    )}
                    <Typography variant="caption" color="text.secondary" align="center">
                      JPG, PNG, GIF, WEBP
                      <br />
                      최대 5MB
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {/* 탭 패널 - 메뉴 관리 */}
        {tabValue === 1 && (
          <Grid size={12}>
            {menuLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <SystemMenuPermissionsTable ref={menuTableRef} />
            )}
          </Grid>
        )}
      </Grid>

      {/* 스낵바 */}
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
