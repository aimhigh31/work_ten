// ========================================
// 시스템 설정 관리를 위한 TypeScript 타입 정의
// ========================================

// 시스템 설정 타입
export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any; // JSONB 값
  setting_type: 'general' | 'notification' | 'maintenance' | 'appearance';
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 메뉴 설정 타입
export interface MenuSetting {
  id: string;
  menu_id: string;
  menu_title: string;
  menu_level: number;
  menu_url: string | null;
  parent_group: string | null;
  menu_type: 'group' | 'collapse' | 'item';
  icon_name: string | null;
  is_enabled: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// 시스템 설정 값들의 구조화된 타입
export interface SystemSettings {
  // 일반 설정
  site_name: string;
  site_description: string;
  site_logo: string | null;

  // 유지보수 설정
  maintenance_mode: boolean;
  maintenance_message: string;

  // 알림 설정
  email_notifications: boolean;
  sms_notifications: boolean;
}

// 프론트엔드에서 사용할 설정 업데이트 타입
export interface SystemSettingUpdate {
  setting_key: keyof SystemSettings;
  setting_value: any;
  setting_type?: 'general' | 'notification' | 'maintenance' | 'appearance';
}

// 메뉴 상태 업데이트 타입
export interface MenuStatusUpdate {
  menu_id: string;
  is_enabled: boolean;
}

// 로고 업로드 결과 타입
export interface LogoUploadResult {
  url: string;
  path: string;
}

// API 응답 타입
export interface SystemSettingsResponse {
  data: SystemSetting[] | null;
  error: string | null;
}

export interface MenuSettingsResponse {
  data: MenuSetting[] | null;
  error: string | null;
}

// 에러 클래스
export class SystemSettingsError extends Error {
  code?: string;
  details?: any;

  constructor({ message, code, details }: { message: string; code?: string; details?: any }) {
    super(message);
    this.name = 'SystemSettingsError';
    this.code = code;
    this.details = details;
  }
}
