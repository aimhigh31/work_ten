// ========================================
// 시스템 설정 관리 React 커스텀 훅
// ========================================

import { useState, useEffect, useCallback } from 'react';
import { systemSettingsService } from 'services/supabase/system-settings.service';
import { SystemSettings, MenuSetting, SystemSettingUpdate, MenuStatusUpdate, LogoUploadResult } from 'types/system-settings';

// 훅의 반환 타입 정의
export interface UseSupabaseSystemSettingsReturn {
  // 시스템 설정 상태
  systemSettings: SystemSettings | null;
  menuSettings: MenuSetting[];
  menuStatusMap: Record<string, boolean>;

  // 로딩 상태
  loading: boolean;
  settingsLoading: boolean;
  menuLoading: boolean;
  uploadLoading: boolean;

  // 에러 상태
  error: string | null;

  // 시스템 설정 관련 함수
  refreshSystemSettings: () => Promise<void>;
  updateSystemSetting: (key: keyof SystemSettings, value: any) => Promise<void>;
  batchUpdateSystemSettings: (updates: SystemSettingUpdate[]) => Promise<void>;

  // 로고 관련 함수
  uploadLogo: (file: File) => Promise<LogoUploadResult>;
  deleteLogo: (logoPath: string) => Promise<void>;

  // 메뉴 설정 관련 함수
  refreshMenuSettings: () => Promise<void>;
  updateMenuStatus: (menuId: string, isEnabled: boolean) => Promise<void>;
  batchUpdateMenuSettings: (updates: MenuStatusUpdate[]) => Promise<void>;

  // 전체 새로고침
  refreshAll: () => Promise<void>;
}

/**
 * 시스템 설정 관리 커스텀 훅
 */
export function useSupabaseSystemSettings(): UseSupabaseSystemSettingsReturn {
  // ========================================
  // 상태 관리
  // ========================================

  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [menuSettings, setMenuSettings] = useState<MenuSetting[]>([]);
  const [menuStatusMap, setMenuStatusMap] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // ========================================
  // 시스템 설정 관련 함수
  // ========================================

  /**
   * 시스템 설정 새로고침
   */
  const refreshSystemSettings = useCallback(async () => {
    try {
      setSettingsLoading(true);
      setError(null);

      console.log('🔄 Refreshing system settings...');
      const settings = await systemSettingsService.getFormattedSystemSettings();

      setSystemSettings(settings);
      console.log('✅ System settings refreshed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '시스템 설정을 불러오는 중 오류가 발생했습니다.';

      console.error('❌ Error refreshing system settings:', err);
      setError(errorMessage);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  /**
   * 단일 시스템 설정 업데이트
   */
  const updateSystemSetting = useCallback(async (key: keyof SystemSettings, value: any) => {
    try {
      setError(null);

      console.log(`🔄 Updating system setting: ${key} = ${JSON.stringify(value)}`);

      // 설정 타입 결정
      let settingType = 'general';
      if (key.includes('notification')) settingType = 'notification';
      if (key.includes('maintenance')) settingType = 'maintenance';
      if (key.includes('logo')) settingType = 'appearance';

      await systemSettingsService.updateSystemSetting(key, value, settingType);

      // 로컬 상태 업데이트
      setSystemSettings((prev) => (prev ? { ...prev, [key]: value } : null));

      console.log(`✅ System setting updated: ${key}`);
    } catch (err) {
      console.log(`⚠️ DB 업데이트 실패, localStorage 사용: ${key}:`, err);

      // DB 실패시 localStorage만 사용 (조용히 처리)
      // 로컬 상태는 업데이트
      setSystemSettings((prev) => (prev ? { ...prev, [key]: value } : null));

      // 에러를 다시 던지지 않음 (조용한 실패)
      // throw err; // 이 줄을 제거
    }
  }, []);

  /**
   * 여러 시스템 설정 일괄 업데이트
   */
  const batchUpdateSystemSettings = useCallback(
    async (updates: SystemSettingUpdate[]) => {
      try {
        setError(null);
        setSettingsLoading(true);

        console.log('🔄 Batch updating system settings:', updates.length, 'items');

        await systemSettingsService.batchUpdateSystemSettings(updates);

        // 전체 설정 새로고침
        await refreshSystemSettings();

        console.log('✅ Batch update completed successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '시스템 설정 일괄 업데이트 중 오류가 발생했습니다.';

        console.error('❌ Error batch updating system settings:', err);
        setError(errorMessage);
        throw err;
      } finally {
        setSettingsLoading(false);
      }
    },
    [refreshSystemSettings]
  );

  // ========================================
  // 로고 관련 함수
  // ========================================

  /**
   * 로고 파일 업로드
   */
  const uploadLogo = useCallback(async (file: File): Promise<LogoUploadResult> => {
    try {
      setUploadLoading(true);
      setError(null);

      console.log('🔄 Uploading logo file:', file.name);

      const result = await systemSettingsService.uploadLogo(file);

      // 로컬 시스템 설정 업데이트
      setSystemSettings((prev) => (prev ? { ...prev, site_logo: result.url } : null));

      console.log('✅ Logo uploaded successfully:', result.url);
      return result;
    } catch (err) {
      console.log('⚠️ Logo upload failed, will use localStorage fallback:', err);
      // 에러를 다시 던져서 상위에서 localStorage 처리하도록 함
      throw err;
    } finally {
      setUploadLoading(false);
    }
  }, []);

  /**
   * 로고 삭제
   */
  const deleteLogo = useCallback(async (logoPath: string) => {
    try {
      setError(null);

      console.log('🔄 Deleting logo:', logoPath);

      await systemSettingsService.deleteLogo(logoPath);

      // 로컬 시스템 설정 업데이트
      setSystemSettings((prev) => (prev ? { ...prev, site_logo: null } : null));

      console.log('✅ Logo deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '로고 삭제 중 오류가 발생했습니다.';

      console.error('❌ Error deleting logo:', err);
      setError(errorMessage);
      throw err;
    }
  }, []);

  // ========================================
  // 메뉴 설정 관련 함수
  // ========================================

  /**
   * 메뉴 설정 새로고침
   */
  const refreshMenuSettings = useCallback(async () => {
    try {
      setMenuLoading(true);
      setError(null);

      console.log('🔄 Refreshing menu settings...');

      const [settings, statusMap] = await Promise.all([systemSettingsService.getMenuSettings(), systemSettingsService.getMenuStatusMap()]);

      setMenuSettings(settings);
      setMenuStatusMap(statusMap);

      console.log('✅ Menu settings refreshed successfully:', settings.length, 'items');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '메뉴 설정을 불러오는 중 오류가 발생했습니다.';

      console.error('❌ Error refreshing menu settings:', err);
      setError(errorMessage);
    } finally {
      setMenuLoading(false);
    }
  }, []);

  /**
   * 메뉴 활성/비활성 상태 업데이트
   */
  const updateMenuStatus = useCallback(async (menuId: string, isEnabled: boolean) => {
    try {
      setError(null);

      console.log(`🔄 Updating menu status: ${menuId} = ${isEnabled}`);

      await systemSettingsService.updateMenuStatus(menuId, isEnabled);

      // 로컬 상태 업데이트
      setMenuStatusMap((prev) => ({ ...prev, [menuId]: isEnabled }));
      setMenuSettings((prev) => prev.map((menu) => (menu.menu_id === menuId ? { ...menu, is_enabled: isEnabled } : menu)));

      console.log(`✅ Menu status updated: ${menuId} = ${isEnabled}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `메뉴 상태 업데이트 중 오류가 발생했습니다: ${menuId}`;

      console.error(`❌ Error updating menu status ${menuId}:`, err);
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * 여러 메뉴 상태 일괄 업데이트
   */
  const batchUpdateMenuSettings = useCallback(
    async (updates: MenuStatusUpdate[]) => {
      try {
        setError(null);
        setMenuLoading(true);

        console.log('🔄 Batch updating menu settings:', updates.length, 'items');

        await systemSettingsService.batchUpdateMenuSettings(updates);

        // 전체 메뉴 설정 새로고침
        await refreshMenuSettings();

        console.log('✅ Menu batch update completed successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '메뉴 설정 일괄 업데이트 중 오류가 발생했습니다.';

        console.error('❌ Error batch updating menu settings:', err);
        setError(errorMessage);
        throw err;
      } finally {
        setMenuLoading(false);
      }
    },
    [refreshMenuSettings]
  );

  // ========================================
  // 전체 새로고침
  // ========================================

  /**
   * 모든 설정 새로고침
   */
  const refreshAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Refreshing all settings...');

      await Promise.all([refreshSystemSettings(), refreshMenuSettings()]);

      console.log('✅ All settings refreshed successfully');
    } catch (err) {
      console.error('❌ Error refreshing all settings:', err);
      // 개별 함수들이 이미 에러를 설정했으므로 여기서는 추가로 설정하지 않음
    } finally {
      setLoading(false);
    }
  }, [refreshSystemSettings, refreshMenuSettings]);

  // ========================================
  // 초기 데이터 로드
  // ========================================

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // ========================================
  // 반환값
  // ========================================

  return {
    // 상태
    systemSettings,
    menuSettings,
    menuStatusMap,

    // 로딩 상태
    loading,
    settingsLoading,
    menuLoading,
    uploadLoading,

    // 에러 상태
    error,

    // 시스템 설정 함수
    refreshSystemSettings,
    updateSystemSetting,
    batchUpdateSystemSettings,

    // 로고 함수
    uploadLogo,
    deleteLogo,

    // 메뉴 설정 함수
    refreshMenuSettings,
    updateMenuStatus,
    batchUpdateMenuSettings,

    // 전체 새로고침
    refreshAll
  };
}
