// VOC 데이터 타입 정의

// 데이터베이스 스키마와 일치하는 타입
export interface DbVocData {
  id: number;
  no: number;
  code: string; // IT-VOC-YY-NNN 형식

  // 기본 정보
  registration_date: string;
  reception_date: string | null;
  customer_name: string | null;
  company_name: string | null;

  // VOC 유형 및 내용
  voc_type: string | null;
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
export interface VocData {
  id: number;
  no: number;
  code: string; // IT-VOC-YY-NNN 형식

  // 기본 정보
  registrationDate: string;
  receptionDate: string;
  customerName: string;
  companyName: string;

  // VOC 유형 및 내용
  vocType: string;
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

  // 권한 체크용
  createdBy?: string; // 데이터 생성자 (권한 체크용)
}

// VOCTableData는 VocData의 alias (기존 코드 호환성을 위해)
export type VOCTableData = VocData;

// VOC 상태 타입
export type VOCStatus = typeof VOC_STATUS[number];

// VOC 타입 옵션
export const VOC_TYPES = ['문의', '불만', '개선요청', '칭찬', '제안', '기타'];

// 채널 옵션
export const VOC_CHANNELS = ['전화', '이메일', '채팅', '방문', 'SNS', '홈페이지'];

// 상태 옵션 (DB 실제 값에 맞게 수정)
export const VOC_STATUS = ['대기', '진행', '완료', '홀딩', '취소'];

// 우선순위 옵션
export const VOC_PRIORITIES = ['긴급', '높음', '보통', '낮음'];
