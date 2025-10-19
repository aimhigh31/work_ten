// =====================================================
// 변경로그 타입 정의
// =====================================================

// 변경로그 데이터 인터페이스
export interface ChangeLogData {
  id: string;
  page: string;
  record_id: string;
  action_type: string;
  description: string;
  before_value?: string;
  after_value?: string;
  changed_field?: string;
  title?: string;
  user_id?: string;
  user_name: string;
  team?: string;
  user_department?: string;
  user_position?: string;
  user_profile_image?: string;
  metadata?: ChangeLogMetadata;
  created_at: string;
}

// 메타데이터 인터페이스
export interface ChangeLogMetadata {
  targetId?: string; // 대상 ID (커리큘럼 ID, 참석자 ID 등)
  targetName?: string; // 대상 이름
  changeType?: 'create' | 'update' | 'delete'; // 변경 타입
  fieldName?: string; // 변경된 필드명
  [key: string]: any; // 추가 메타데이터
}

// 변경로그 생성 입력 인터페이스
export interface CreateChangeLogInput {
  page: string;
  record_id: string;
  action_type: string;
  description: string;
  before_value?: string;
  after_value?: string;
  changed_field?: string;
  title?: string;
  user_id?: string;
  user_name: string;
  team?: string;
  user_department?: string;
  user_position?: string;
  user_profile_image?: string;
  metadata?: ChangeLogMetadata;
}

// =====================================================
// Action Type 상수 정의
// =====================================================

export const CHANGE_LOG_ACTIONS = {
  // 개요탭
  EDUCATION_CREATE: '교육생성',
  EDUCATION_UPDATE: '교육수정',
  EDUCATION_DELETE: '교육삭제',
  EDUCATION_NAME_CHANGE: '교육명변경',
  STATUS_CHANGE: '상태변경',
  ASSIGNEE_CHANGE: '담당자변경',
  TEAM_CHANGE: '팀변경',
  EDUCATION_TYPE_CHANGE: '교육유형변경',
  LOCATION_CHANGE: '장소변경',
  DESCRIPTION_CHANGE: '설명변경',
  DATE_CHANGE: '날짜변경',
  PARTICIPANT_COUNT_CHANGE: '참석인원변경',

  // 커리큘럼탭
  CURRICULUM_ADD: '커리큘럼추가',
  CURRICULUM_UPDATE: '커리큘럼수정',
  CURRICULUM_DELETE: '커리큘럼삭제',

  // 참석자탭
  ATTENDEE_ADD: '참석자추가',
  ATTENDEE_REMOVE: '참석자삭제',
  ATTENDANCE_CHECK: '출석확인',
  ATTENDANCE_UNCHECK: '출석취소',

  // 교육실적보고탭
  REPORT_UPDATE: '실적보고수정',
  ACHIEVEMENT_UPDATE: '성과수정',
  IMPROVEMENT_UPDATE: '개선사항수정',
  FEEDBACK_UPDATE: '교육소감수정',

  // 기록탭
  COMMENT_ADD: '기록추가',
  COMMENT_UPDATE: '기록수정',
  COMMENT_DELETE: '기록삭제',

  // 자료탭
  FILE_UPLOAD: '파일업로드',
  FILE_DELETE: '파일삭제',
  FILE_UPDATE: '파일수정'
} as const;

export type ChangeLogAction = (typeof CHANGE_LOG_ACTIONS)[keyof typeof CHANGE_LOG_ACTIONS];

// =====================================================
// 필드명 한글 매핑
// =====================================================

export const FIELD_NAMES_KR: Record<string, string> = {
  // 개요탭 필드
  educationName: '교육명',
  educationType: '교육유형',
  description: '설명',
  location: '장소',
  participantCount: '참석인원',
  executionDate: '실시일',
  status: '상태',
  assignee: '담당자',
  team: '팀',
  registrationDate: '등록일',

  // 교육실적보고탭 필드
  achievements: '성과',
  improvements: '개선사항',
  feedback: '교육소감',

  // 기타
  code: '코드',
  attended: '출석여부'
};

// 필드명을 한글로 변환하는 헬퍼 함수
export const getFieldNameKR = (fieldName: string): string => {
  return FIELD_NAMES_KR[fieldName] || fieldName;
};
