// ========================================
// 시스템 설정 관리 Supabase 서비스 모듈
// ========================================

import { supabase } from 'lib/supabase';
import { SystemSetting, MenuSetting, SystemSettings, SystemSettingUpdate, MenuStatusUpdate, LogoUploadResult } from 'types/system-settings';

export class SystemSettingsService {
  // ========================================
  // 시스템 설정 관련 메서드
  // ========================================

  /**
   * 모든 시스템 설정 조회
   */
  async getSystemSettings(): Promise<SystemSetting[]> {
    try {
      console.log('🔄 Fetching system settings from Supabase...');

      const { data, error } = await supabase.from('admin_systemsetting_system').select('*').eq('is_active', true).order('setting_key');

      if (error) {
        console.error('❌ Error fetching system settings:', error);
        throw new Error('Failed to fetch system settings');
      }

      console.log('✅ System settings fetched successfully:', data?.length, 'records');
      return data || [];
    } catch (error) {
      console.error('❌ System settings fetch error:', error);
      throw error;
    }
  }

  /**
   * 특정 설정값 조회
   */
  async getSystemSetting(settingKey: string): Promise<SystemSetting | null> {
    try {
      const { data, error } = await supabase
        .from('admin_systemsetting_system')
        .select('*')
        .eq('setting_key', settingKey)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116은 "not found" 에러
        throw new Error(`Failed to fetch setting: ${settingKey}`);
      }

      return data;
    } catch (error) {
      console.error(`❌ Error fetching setting ${settingKey}:`, error);
      throw error;
    }
  }

  /**
   * 구조화된 시스템 설정 조회 (프론트엔드 친화적)
   */
  async getFormattedSystemSettings(): Promise<SystemSettings> {
    try {
      const settings = await this.getSystemSettings();

      // 기본값 설정
      const defaultSettings: SystemSettings = {
        site_name: 'Admin Dashboard',
        site_description: 'Next.js 관리자 시스템',
        site_logo: null,
        maintenance_mode: false,
        maintenance_message: '시스템 점검 중입니다. 잠시 후 다시 시도해 주세요.',
        email_notifications: true,
        sms_notifications: false
      };

      // 데이터베이스 설정을 기본값에 덮어쓰기
      settings.forEach((setting) => {
        if (setting.setting_key in defaultSettings) {
          (defaultSettings as any)[setting.setting_key] = setting.setting_value;
        }
      });

      return defaultSettings;
    } catch (error) {
      console.error('❌ Error formatting system settings:', error);
      throw error;
    }
  }

  /**
   * 시스템 설정 업데이트 (upsert 방식)
   */
  async updateSystemSetting(settingKey: string, value: any, settingType?: string): Promise<SystemSetting> {
    try {
      console.log(`🔄 Updating system setting: ${settingKey} = ${JSON.stringify(value)}`);
      console.log(`Setting type: ${settingType || 'general'}`);

      // upsert를 위한 데이터 준비
      const upsertData = {
        setting_key: settingKey,
        setting_value: value,
        setting_type: settingType || 'general',
        is_active: true,
        updated_at: new Date().toISOString()
      };

      console.log('Upsert data:', JSON.stringify(upsertData, null, 2));

      // upsert 사용 - 존재하면 업데이트, 없으면 생성
      const { data, error } = await supabase
        .from('admin_systemsetting_system')
        .upsert(upsertData, {
          onConflict: 'setting_key'
        })
        .select()
        .single();

      if (error) {
        console.log(`⚠️ Error updating setting ${settingKey}:`, error);
        console.log('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        // 테이블이 없는 경우
        throw new Error(`설정 업데이트 실패: ${settingKey} - ${error.message}`);
      }

      console.log(`✅ System setting updated successfully: ${settingKey}`, data);
      return data;
    } catch (error) {
      console.log(`⚠️ Update system setting error:`, error);
      throw error;
    }
  }

  /**
   * 새로운 시스템 설정 생성
   */
  async createSystemSetting(settingKey: string, value: any, settingType: string = 'general'): Promise<SystemSetting> {
    try {
      console.log(`🔄 Creating system setting: ${settingKey}`);

      const { data, error } = await supabase
        .from('admin_systemsetting_system')
        .insert({
          setting_key: settingKey,
          setting_value: value,
          setting_type: settingType,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create setting: ${settingKey}`);
      }

      console.log(`✅ System setting created successfully: ${settingKey}`);
      return data;
    } catch (error) {
      console.log(`⚠️ Create system setting error:`, error);
      throw error;
    }
  }

  /**
   * 여러 설정을 일괄 업데이트
   */
  async batchUpdateSystemSettings(updates: SystemSettingUpdate[]): Promise<SystemSetting[]> {
    try {
      console.log('🔄 Batch updating system settings:', updates.length, 'items');

      const promises = updates.map((update) => this.updateSystemSetting(update.setting_key, update.setting_value, update.setting_type));

      const results = await Promise.all(promises);
      console.log('✅ Batch update completed successfully');
      return results;
    } catch (error) {
      console.log('⚠️ Batch update error:', error);
      throw error;
    }
  }

  // ========================================
  // 로고 업로드 관련 메서드
  // ========================================

  /**
   * 로고 파일 업로드 (Supabase Storage 사용)
   */
  async uploadLogo(file: File): Promise<LogoUploadResult> {
    try {
      console.log('🔄 Uploading logo file:', file.name);

      // 파일명 생성 (타임스탬프 + 원본명)
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `logo_${timestamp}.${fileExtension}`;
      const filePath = `system/${fileName}`;

      // 먼저 버킷 존재 확인
      let bucketExists = false;
      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        if (!bucketsError && buckets) {
          bucketExists = buckets.some((bucket) => bucket.name === 'system-assets');
        }
      } catch (bucketsError) {
        console.warn('Failed to check buckets, proceeding with upload attempt:', bucketsError);
      }

      if (!bucketExists) {
        console.log('⚠️ Storage bucket "system-assets" does not exist, will use localStorage fallback');
        throw new Error('Storage 버킷이 존재하지 않습니다.');
      }

      // Supabase Storage에 업로드
      const { data: uploadData, error: uploadError } = await supabase.storage.from('system-assets').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // 덮어쓰기 허용
      });

      if (uploadError) {
        console.error('Upload error details:', {
          message: uploadError.message,
          error: uploadError,
          filePath,
          fileSize: file.size,
          fileType: file.type
        });

        // 더 친화적인 에러 메시지
        throw new Error(`로고 업로드 실패: ${uploadError.message}`);
      }

      // 공개 URL 생성
      const { data: urlData } = supabase.storage.from('system-assets').getPublicUrl(filePath);

      const result: LogoUploadResult = {
        url: urlData.publicUrl,
        path: filePath
      };

      // 시스템 설정에 로고 URL 저장
      await this.updateSystemSetting('site_logo', result.url, 'appearance');

      console.log('✅ Logo uploaded successfully:', result.url);
      return result;
    } catch (error) {
      console.log('⚠️ Logo upload error:', error);
      throw error;
    }
  }

  /**
   * 기존 로고 삭제
   */
  async deleteLogo(logoPath: string): Promise<void> {
    try {
      console.log('🔄 Deleting existing logo:', logoPath);

      const { error } = await supabase.storage.from('system-assets').remove([logoPath]);

      if (error) {
        console.warn('⚠️ Warning: Failed to delete old logo file:', error);
        // 로고 파일 삭제 실패는 치명적이지 않으므로 경고만 출력
      }

      // 시스템 설정에서 로고 URL 제거
      await this.updateSystemSetting('site_logo', null, 'appearance');

      console.log('✅ Logo deleted successfully');
    } catch (error) {
      console.log('⚠️ Logo deletion error:', error);
      throw error;
    }
  }

  // ========================================
  // 메뉴 설정 관련 메서드
  // ========================================

  /**
   * 모든 메뉴 설정 조회
   */
  async getMenuSettings(): Promise<MenuSetting[]> {
    try {
      console.log('🔄 Fetching menu settings from Supabase...');

      const { data, error } = await supabase.from('admin_systemsetting_menu').select('*').order('display_order');

      if (error) {
        console.error('❌ Error fetching menu settings:', error);
        throw new Error('Failed to fetch menu settings');
      }

      console.log('✅ Menu settings fetched successfully:', data?.length, 'records');
      return data || [];
    } catch (error) {
      console.error('❌ Menu settings fetch error:', error);
      throw error;
    }
  }

  /**
   * 메뉴 활성/비활성 상태 업데이트
   */
  async updateMenuStatus(menuId: string, isEnabled: boolean): Promise<MenuSetting> {
    try {
      console.log(`🔄 Updating menu status: ${menuId} = ${isEnabled}`);

      const { data, error } = await supabase
        .from('admin_systemsetting_menu')
        .update({
          is_enabled: isEnabled,
          updated_at: new Date().toISOString()
        })
        .eq('menu_id', menuId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update menu status: ${menuId}`);
      }

      console.log(`✅ Menu status updated successfully: ${menuId} = ${isEnabled}`);
      return data;
    } catch (error) {
      console.error(`❌ Update menu status error:`, error);
      throw error;
    }
  }

  /**
   * 여러 메뉴 상태를 일괄 업데이트
   */
  async batchUpdateMenuSettings(updates: MenuStatusUpdate[]): Promise<MenuSetting[]> {
    try {
      console.log('🔄 Batch updating menu settings:', updates.length, 'items');

      const promises = updates.map((update) => this.updateMenuStatus(update.menu_id, update.is_enabled));

      const results = await Promise.all(promises);
      console.log('✅ Menu batch update completed successfully');
      return results;
    } catch (error) {
      console.error('❌ Menu batch update error:', error);
      throw error;
    }
  }

  /**
   * 메뉴 설정을 Key-Value 형태로 반환 (프론트엔드 친화적)
   */
  async getMenuStatusMap(): Promise<Record<string, boolean>> {
    try {
      const menuSettings = await this.getMenuSettings();
      const statusMap: Record<string, boolean> = {};

      menuSettings.forEach((menu) => {
        statusMap[menu.menu_id] = menu.is_enabled;
      });

      return statusMap;
    } catch (error) {
      console.error('❌ Error creating menu status map:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const systemSettingsService = new SystemSettingsService();
