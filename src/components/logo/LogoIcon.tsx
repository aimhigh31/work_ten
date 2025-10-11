// material-ui
import { useTheme } from '@mui/material/styles';
import { useState, useEffect } from 'react';

/**
 * if you want to use image instead of <svg> uncomment following.
 *
 * import logoIconDark from 'assets/images/logo-icon-dark.svg';
 * import logoIcon from 'assets/images/logo-icon.svg';
 *
 */

// ==============================|| LOGO ICON SVG ||============================== //

export default function LogoIcon() {
  const theme = useTheme();
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  useEffect(() => {
    // localStorage에서 커스텀 로고 불러오기
    const savedLogo = localStorage.getItem('systemLogo');

    if (savedLogo) {
      setCustomLogo(savedLogo);
    }

    // 로고 업데이트 이벤트 리스너 추가
    const handleLogoUpdate = () => {
      const newLogo = localStorage.getItem('systemLogo');

      if (newLogo) {
        setCustomLogo(newLogo);
      } else {
        setCustomLogo(null);
      }
    };

    window.addEventListener('logoUpdated', handleLogoUpdate);

    return () => {
      window.removeEventListener('logoUpdated', handleLogoUpdate);
    };
  }, []);

  return (
    /**
     * if you want to use image instead of svg uncomment following, and comment out <svg> element.
     *
     * <img src={theme.palette.mode === ThemeMode.DARK ? logoIconDark : logoIcon} alt="icon logo" width="100" />
     *
     */
    <>
      {customLogo ? (
        <img
          src={customLogo}
          alt="커스텀 로고"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            objectFit: 'contain'
          }}
        />
      ) : (
        <div
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: theme.palette.primary.main,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            fontFamily: theme.typography.fontFamily
          }}
        >
          N
        </div>
      )}
    </>
  );
}
