// ========================================
// 마스터코드 관리 타입 정의 (Supabase DB 연동)
// ========================================

// 기본 타입들
export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

// ========================================
// 마스터코드 메인 데이터 타입
// ========================================
export interface MasterCodeData extends BaseEntity {
  code_group: string; // 코드 그룹
  code_group_name: string; // 코드 그룹명
  code_group_description?: string; // 코드 그룹 설명
  display_order: number; // 표시 순서
  is_active: boolean; // 활성화 여부
  is_system: boolean; // 시스템 기본 코드 여부
}

// ========================================
// 서브코드 타입
// ========================================
export interface SubCodeData extends BaseEntity {
  mastercode_id: number; // 마스터코드 ID (외래키)
  sub_code: string; // 서브코드
  sub_code_name: string; // 서브코드명
  sub_code_description?: string; // 서브코드 설명
  code_value1?: string; // 추가 값1 (색상, 아이콘 등)
  code_value2?: string; // 추가 값2
  code_value3?: string; // 추가 값3
  display_order: number; // 표시 순서
  is_active: boolean; // 활성화 여부
  is_system: boolean; // 시스템 기본 코드 여부
}

// ========================================
// 조인된 데이터 타입 (마스터코드 + 서브코드)
// ========================================
export interface MasterCodeWithSubCodes extends MasterCodeData {
  subcodes: SubCodeData[]; // 서브코드 목록
  subcodes_count: number; // 서브코드 개수
}

// ========================================
// API 요청/응답 타입들
// ========================================

// 마스터코드 생성/업데이트 요청
export interface CreateMasterCodeRequest {
  code_group: string;
  code_group_name: string;
  code_group_description?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface UpdateMasterCodeRequest extends Partial<CreateMasterCodeRequest> {
  id: number;
}

// 서브코드 생성/업데이트 요청
export interface CreateSubCodeRequest {
  mastercode_id: number;
  sub_code: string;
  sub_code_name: string;
  sub_code_description?: string;
  code_value1?: string;
  code_value2?: string;
  code_value3?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface UpdateSubCodeRequest extends Partial<CreateSubCodeRequest> {
  id: number;
}

// ========================================
// 테이블 행 데이터 타입 (UI용)
// ========================================
export interface MasterCodeTableRow {
  id: number;
  code_group: string;
  code_group_name: string;
  code_group_description?: string;
  subcodes_count: number;
  is_active: boolean;
  is_system: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SubCodeTableRow {
  id: number;
  mastercode_id: number;
  sub_code: string;
  sub_code_name: string;
  sub_code_description?: string;
  code_value1?: string;
  code_value2?: string;
  code_value3?: string;
  is_active: boolean;
  is_system: boolean;
  display_order: number;
  created_at: string;
}

// ========================================
// 팝업/다이얼로그 상태 타입
// ========================================
export interface MasterCodeDialogState {
  open: boolean;
  mode: 'create' | 'edit' | 'view';
  data: MasterCodeData | null;
}

export interface SubCodeDialogState {
  open: boolean;
  mode: 'create' | 'edit' | 'view';
  mastercode_id: number | null;
  data: SubCodeData | null;
}

// ========================================
// 서비스 응답 타입
// ========================================
export interface MasterCodeServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// API 오류 타입
export interface MasterCodeError {
  code: string;
  message: string;
  details?: any;
}

// ========================================
// 검색 및 필터 타입
// ========================================
export interface MasterCodeSearchFilter {
  search?: string; // 검색어 (코드그룹, 그룹명에서 검색)
  is_active?: boolean; // 활성화 여부 필터
  is_system?: boolean; // 시스템 코드 여부 필터
  limit?: number; // 페이지당 개수
  offset?: number; // 페이지 오프셋
}

export interface SubCodeSearchFilter {
  mastercode_id?: number; // 마스터코드 ID 필터
  search?: string; // 검색어 (서브코드, 서브코드명에서 검색)
  is_active?: boolean; // 활성화 여부 필터
  is_system?: boolean; // 시스템 코드 여부 필터
  limit?: number; // 페이지당 개수
  offset?: number; // 페이지 오프셋
}

// ========================================
// 드롭다운/선택 옵션 타입
// ========================================
export interface MasterCodeSelectOption {
  value: string; // code_group
  label: string; // code_group_name
  description?: string; // code_group_description
  disabled?: boolean; // is_active의 반대
}

export interface SubCodeSelectOption {
  value: string; // sub_code
  label: string; // sub_code_name
  description?: string; // sub_code_description
  color?: string; // code_value1 (색상인 경우)
  disabled?: boolean; // is_active의 반대
}

// ========================================
// 통계/대시보드 타입
// ========================================
export interface MasterCodeStats {
  total_master_codes: number;
  total_sub_codes: number;
  active_master_codes: number;
  active_sub_codes: number;
  system_codes: number;
  custom_codes: number;
}

// ========================================
// 레거시 호환성을 위한 타입들 (기존 코드와의 호환성)
// ========================================
export interface SubCode {
  id: string;
  sortOrder: number;
  subCode: string;
  selected?: boolean;
}

export interface MasterCode {
  id: string;
  code: string;
  name: string;
  description: string;
  codeGroup: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  subCodes?: SubCode[];
}

export interface CodeGroup {
  id: string;
  groupCode: string;
  groupName: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// 코드 그룹 옵션들 (실제 DB 데이터 기반으로 업데이트됨)
export const codeGroupOptions = [
  { value: 'USER_STATUS', label: '사용자 상태' },
  { value: 'DEPT_TYPE', label: '부서 유형' },
  { value: 'PROJECT_STATUS', label: '프로젝트 상태' },
  { value: 'TASK_PRIORITY', label: '업무 우선순위' },
  { value: 'EDUCATION_TYPE', label: '교육 유형' }
];

// 상태 옵션들
export const statusOptions = ['활성', '비활성'] as const;

export type StatusType = (typeof statusOptions)[number];
