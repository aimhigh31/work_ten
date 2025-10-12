// 공통 피드백/기록 타입 정의

export interface FeedbackData {
  id: string;
  page: string; // 페이지 식별자 (예: 'security_education', 'it_education', 'hardware')
  record_id: string; // 해당 페이지의 레코드 ID
  action_type: string; // 액션 타입 (예: '생성', '수정', '삭제', '상태변경')
  description: string; // 설명
  user_id?: string; // 사용자 ID
  user_name: string; // 사용자명
  team?: string; // 팀
  created_at: string; // 생성일시
  metadata?: Record<string, any>; // 추가 메타데이터 (JSON)
  // 사용자 추가 정보 (metadata에서 추출하거나 별도 저장)
  user_department?: string; // 부서명
  user_position?: string; // 직책
  user_profile_image?: string; // 프로필 이미지 URL
}

export interface CreateFeedbackInput {
  page: string;
  record_id: string;
  action_type: string;
  description: string;
  user_id?: string;
  user_name: string;
  team?: string;
  metadata?: Record<string, any>;
  user_department?: string;
  user_position?: string;
  user_profile_image?: string;
}

export interface UpdateFeedbackInput {
  action_type?: string;
  description?: string;
  user_name?: string;
  team?: string;
  metadata?: Record<string, any>;
}

// 페이지 식별자 상수
export const PAGE_IDENTIFIERS = {
  SECURITY_EDUCATION: 'security_education',
  IT_EDUCATION: 'it_education',
  HARDWARE: 'it_hardware',
  SOFTWARE: 'it_software',
  SOLUTION: 'it_solution',
  VOC: 'voc',
  IT_VOC: 'it_voc',
  INVESTMENT: 'plan_investment',
  SALES: 'plan_sales',
  COST: 'main_cost',
  EDUCATION: 'main_education',
  KPI: 'main_kpi',
  TASK: 'main_task',
  CHECKLIST: 'checklist',
  SECURITY_INCIDENT: 'security_incident',
  SECURITY_ACCIDENT: 'security_accident',
  SECURITY_INSPECTION: 'security_inspection',
  SECURITY_REGULATION: 'security_regulation'
} as const;

export type PageIdentifier = typeof PAGE_IDENTIFIERS[keyof typeof PAGE_IDENTIFIERS];
