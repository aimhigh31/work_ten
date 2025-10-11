// 교육 관련 타입 정의

// 교육유형 (변경됨)
export type EducationType = '신입교육' | '담당자교육' | '관리자교육' | '수시교육';

// 참석여부 상태
export type AttendanceStatus = '예정' | '참석' | '불참';

// 교육 상태
export type EducationStatus = '예정' | '진행' | '완료' | '취소';

// 커리큘럼 항목
export interface CurriculumItem {
  id: number;
  time: string; // 시간 (예: "09:00-10:30")
  subject: string; // 과목명
  instructor: string; // 강사
  content: string; // 내용
  attachment?: string; // 첨부파일 (선택적)
}

// 참석자 항목
export interface ParticipantItem {
  id: number;
  name: string; // 담당자
  department: string; // 부서
  position: string; // 직급
  attendance: AttendanceStatus; // 참석여부
  report?: string; // Report 파일 (선택적)
  note?: string; // 비고 (선택적)
}

// 교육실적
export interface EducationResult {
  performance: string; // 성과
  improvement: string; // 개선
  feedback: string; // 교육소감
}

// 메인 교육 레코드
export interface EducationRecord {
  id: number;
  registrationDate: string; // 등록일
  startDate: string; // 시작일
  code: string; // 코드 (EDU-I-24-001 형식)
  educationType: EducationType; // 교육유형
  content: string; // 교육명
  participants: number; // 참석수
  location: string; // 장소
  status: EducationStatus; // 상태
  completionDate: string; // 완료일
  assignee: string; // 담당자

  // 새로 추가된 상세 정보
  curriculum: CurriculumItem[]; // 커리큘럼 목록
  participantList: ParticipantItem[]; // 참석자 목록
  result: EducationResult; // 교육실적

  isNew?: boolean; // 새 레코드 여부
}

// 교육유형 옵션 (변경됨)
export const educationTypeOptions: EducationType[] = ['신입교육', '담당자교육', '관리자교육', '수시교육'];

// 참석여부 옵션
export const attendanceStatusOptions: AttendanceStatus[] = ['예정', '참석', '불참'];

// 교육 상태 옵션
export const statusOptions: EducationStatus[] = ['예정', '진행', '완료', '취소'];

// 교육유형별 코드 매핑
export const educationTypeCodeMap: Record<EducationType, string> = {
  신입교육: 'I', // Initiation
  담당자교육: 'S', // Staff
  관리자교육: 'M', // Manager
  수시교육: 'A' // Anytime
};
