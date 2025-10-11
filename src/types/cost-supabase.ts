// Supabase 호환 비용관리 타입 정의

export interface UserProfile {
  id: string; // UUID
  email: string;
  name: string;
  avatar_url?: string;
  role: 'admin' | 'manager' | 'user';
  department?: string;
  position?: string;
  created_at: string;
  updated_at: string;
}

export interface CostRecord {
  id: string; // UUID
  registration_date: string; // DATE
  start_date: string; // DATE
  code: string;
  team: string;
  assignee_id: string | null; // UUID 참조
  cost_type: '솔루션' | '하드웨어' | '출장경비' | '행사경비' | '사무경비';
  content: string;
  quantity: number;
  unit_price: number;
  amount: number;
  status: '대기' | '진행' | '완료' | '취소';
  completion_date?: string | null; // DATE
  created_at: string;
  updated_at: string;
  created_by: string | null; // UUID 참조

  // 관계 데이터 (JOIN 시 포함)
  assignee?: UserProfile;
  created_by_user?: UserProfile;
  amount_details?: AmountDetail[];
  comments?: CostComment[];
  attachments?: CostAttachment[];
}

export interface AmountDetail {
  id: string; // UUID
  cost_record_id: string; // UUID 참조
  code: string;
  cost_type: string;
  content: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface CostComment {
  id: string; // UUID
  cost_record_id: string; // UUID 참조
  author_id: string; // UUID 참조
  content: string;
  timestamp: string;

  // 관계 데이터
  author?: UserProfile;
}

export interface CostAttachment {
  id: string; // UUID
  cost_record_id: string; // UUID 참조
  name: string;
  file_type: string;
  file_size: number; // bytes
  storage_path: string;
  storage_bucket: string;
  upload_date: string;
  uploaded_by: string; // UUID 참조

  // 관계 데이터
  uploaded_by_user?: UserProfile;
}

// Insert 타입 (새 레코드 생성용)
export interface CostRecordInsert {
  registration_date: string;
  start_date: string;
  code?: string; // 자동 생성 가능
  team: string;
  assignee_id?: string | null;
  cost_type: '솔루션' | '하드웨어' | '출장경비' | '행사경비' | '사무경비';
  content: string;
  quantity: number;
  unit_price: number;
  amount: number;
  status?: '대기' | '진행' | '완료' | '취소';
  completion_date?: string | null;
}

// Update 타입 (기존 레코드 수정용)
export interface CostRecordUpdate {
  registration_date?: string;
  start_date?: string;
  team?: string;
  assignee_id?: string | null;
  cost_type?: '솔루션' | '하드웨어' | '출장경비' | '행사경비' | '사무경비';
  content?: string;
  quantity?: number;
  unit_price?: number;
  amount?: number;
  status?: '대기' | '진행' | '완료' | '취소';
  completion_date?: string | null;
}

// 필터 타입
export interface CostRecordFilter {
  team?: string;
  status?: string;
  assignee_id?: string;
  date_from?: string;
  date_to?: string;
  cost_type?: string;
  page?: number;
  limit?: number;
}

// 통계 타입
export interface CostStatistics {
  totalAmount: number;
  totalCount: number;
  statusBreakdown: { [key: string]: number };
  typeBreakdown: { [key: string]: number };
  teamBreakdown: { [key: string]: number };
  monthlyTrend: {
    month: string;
    amount: number;
    count: number;
  }[];
}

// API 응답 타입
export interface CostRecordsResponse {
  data: CostRecord[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 비용 유형 옵션
export const costTypeOptions = ['솔루션', '하드웨어', '출장경비', '행사경비', '사무경비'] as const;

// 상태 옵션
export const statusOptions = ['대기', '진행', '완료', '취소'] as const;

// 팀 옵션 (실제 팀 목록으로 업데이트 필요)
export const teamOptions = ['IT팀', '마케팅팀', '영업팀', '기획팀', '인사팀'] as const;
