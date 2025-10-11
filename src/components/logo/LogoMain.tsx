// material-ui
import { useTheme } from '@mui/material/styles';
import { useState, useEffect } from 'react';
import { systemSettingsService } from 'services/supabase/system-settings.service';

/**
 * if you want to use image instead of <svg> uncomment following.
 *
 * import logoDark from 'assets/images/logo-dark.svg';
 * import logo from 'assets/images/logo.svg';
 *
 */

// ==============================|| LOGO SVG ||============================== //

export default function LogoMain({ reverse }: { reverse?: boolean }) {
  const theme = useTheme();
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [siteName, setSiteName] = useState('NEXWORK');

  // Supabase에서 시스템 설정 불러오기
  const loadSystemSettings = async () => {
    try {
      const settings = await systemSettingsService.getFormattedSystemSettings();

      if (settings.site_name) {
        setSiteName(settings.site_name);
        // localStorage에도 저장 (캐시용)
        localStorage.setItem('systemSiteName', settings.site_name);
      }

      if (settings.site_logo) {
        setCustomLogo(settings.site_logo);
        // localStorage에도 저장 (캐시용)
        localStorage.setItem('systemLogo', settings.site_logo);
      } else {
        // 로고가 삭제된 경우 상태와 localStorage 정리
        setCustomLogo(null);
        localStorage.removeItem('systemLogo');
      }
    } catch (error) {
      console.error('Failed to load system settings:', error);
      // 실패시 localStorage에서 불러오기 (폴백)
      const savedLogo = localStorage.getItem('systemLogo');
      const savedSiteName = localStorage.getItem('systemSiteName');

      if (savedLogo) {
        setCustomLogo(savedLogo);
      } else {
        // localStorage에도 로고가 없으면 null로 설정하여 기본 로고 표시
        setCustomLogo(null);
      }

      if (savedSiteName) {
        setSiteName(savedSiteName);
      }
    }
  };

  useEffect(() => {
    // 초기 로드
    loadSystemSettings();

    // 시스템 설정 업데이트 이벤트 리스너 추가
    const handleSettingsUpdate = () => {
      // 시스템 설정이 변경되면 다시 로드
      loadSystemSettings();
    };

    // 로고 업데이트와 일반 설정 업데이트 이벤트 리스너 등록
    window.addEventListener('logoUpdated', handleSettingsUpdate);
    window.addEventListener('systemSettingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('logoUpdated', handleSettingsUpdate);
      window.removeEventListener('systemSettingsUpdated', handleSettingsUpdate);
    };
  }, []);

  return (
    /**
     * if you want to use image instead of svg uncomment following, and comment out <svg> element.
     *
     * <img src={theme.palette.mode === ThemeMode.DARK ? logoDark : logo} alt="icon logo" width="100" />
     *
     */

    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        color: theme.palette.primary.main,
        fontFamily: theme.typography.fontFamily
      }}
    >
      {customLogo ? (
        <img
          src={customLogo}
          alt="커스텀 로고"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            marginRight: '8px',
            objectFit: 'contain'
          }}
        />
      ) : (
        <div
          style={{
            width: '32px',
            height: '32px',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '8px',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
          }}
        >
          {siteName ? siteName.charAt(0).toUpperCase() : 'N'}
        </div>
      )}
      <span>{siteName}</span>
    </div>
  );
}
