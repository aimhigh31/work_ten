// 메뉴 관리 타입 정의

// 데이터베이스 테이블 스키마 타입
export interface Admin_Systemsetting_Menu {
  id: number;
  created_at: string;
  updated_at: string;
  menu_level: number;
  menu_category: string;
  menu_icon: string;
  menu_page: string;
  menu_description: string;
  menu_url: string;
  is_enabled: boolean;
  display_order: number;
  created_by: string;
  updated_by: string;
}

// 프론트엔드에서 사용하는 메뉴 권한 타입
export interface MenuPermission {
  enabled: boolean;
}

// 프론트엔드 메뉴 데이터 타입
export interface MenuData {
  id: number;
  level: number;
  category: string;
  icon?: string;
  page: string;
  description: string;
  url: string;
  permissions: MenuPermission;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

// 데이터베이스 insert/update를 위한 타입
export interface MenuInsert {
  menu_level: number;
  menu_category: string;
  menu_icon?: string;
  menu_page: string;
  menu_description: string;
  menu_url: string;
  is_enabled: boolean;
  display_order: number;
  created_by: string;
  updated_by: string;
}

export interface MenuUpdate {
  menu_level?: number;
  menu_category?: string;
  menu_icon?: string;
  menu_page?: string;
  menu_description?: string;
  menu_url?: string;
  is_enabled?: boolean;
  display_order?: number;
  updated_by?: string;
  updated_at?: string;
}

// API 응답 타입
export interface MenuResponse {
  data: Admin_Systemsetting_Menu[];
  count: number;
  error?: string;
}

// 메뉴 필터 옵션
export interface MenuFilters {
  enabled?: boolean;
  level?: number;
  category?: string;
  search?: string;
}
