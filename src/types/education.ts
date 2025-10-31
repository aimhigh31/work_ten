// Education 데이터 타입 정의

// 데이터베이스 스키마와 일치하는 타입
export interface DbEducationData {
  id: number;
  no: number;

  // 기본 정보
  registration_date: string;
  reception_date: string | null;
  customer_name: string | null;
  company_name: string | null;

  // Education 유형 및 내용
  education_type: string | null;
  channel: string | null;
  title: string;
  content: string | null;

  // 처리 정보
  team: string | null;
  assignee: string | null;
  status: string;
  priority: string;

  // 응대 정보
  response_content: string | null;
  resolution_date: string | null;
  satisfaction_score: number | null;

  // 파일 첨부
  attachments: any[];

  // 시스템 필드
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  is_active: boolean;
}

// 프론트엔드에서 사용하는 타입
export interface EducationData {
  id: number;
  no: number;

  // 기본 정보
  registrationDate: string;
  receptionDate: string;
  customerName: string;
  companyName: string;

  // Education 유형 및 내용
  educationType: string;
  channel: string;
  title: string;
  content: string;

  // 처리 정보
  team: string;
  assignee: string;
  status: string;
  priority: string;

  // 응대 정보
  responseContent: string;
  resolutionDate: string;
  satisfactionScore: number | null;

  // 파일 첨부
  attachments: any[];

  // 시스템 필드 (선택적)
  createdBy?: string;
  updatedBy?: string;
}

// 테이블 데이터 타입 (EducationData와 동일)
export type EducationTableData = EducationData;

// 상태 타입
export type EducationStatus = '대기' | '진행' | '완료' | '홀딩';

// 요청 유형 타입 (개인교육관리는 교육 유형을 사용)
export type EducationRequestType = string;

// Education 타입 옵션
export const Education_TYPES = ['문의', '불만', '개선요청', '칭찬', '제안', '기타'];

// 채널 옵션
export const Education_CHANNELS = ['전화', '이메일', '채팅', '방문', 'SNS', '홈페이지'];

// 상태 옵션
export const Education_STATUS = ['대기', '진행', '완료', '홀딩'];

// 우선순위 옵션
export const Education_PRIORITIES = ['긴급', '높음', '보통', '낮음'];
