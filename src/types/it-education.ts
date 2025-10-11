export type ITEducationStatus = '계획' | '진행중' | '완료' | '취소';
export type ITEducationType = '온라인' | '오프라인' | '혼합' | '세미나' | '워크샵';
export type ITEducationTeam = '개발팀' | '디자인팀' | '기획팀' | '마케팅팀';
export type ITEducationDepartment = 'IT' | '기획';

// IT교육 통합 Record 타입 (비용관리 CostRecord 방식)
export interface ITEducationRecord {
  id: number;
  no?: number;
  registrationDate: string;
  code: string;
  educationType: ITEducationType;
  educationName: string;
  description?: string;
  location: string;
  participantCount: number;
  executionDate: string;
  status: ITEducationStatus;
  assignee: string;
  team?: string;
  department?: ITEducationDepartment;
  attachment?: boolean;
  attachmentCount?: number;
  attachments?: string[];
  isNew?: boolean;
  isEditing?: boolean;
  originalData?: ITEducationRecord;
}

export interface ITEducationFilterOptions {
  department?: ITEducationDepartment;
  status?: ITEducationStatus;
  assignee?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

// 하위 호환성을 위한 타입 별칭
export type ITEducationData = ITEducationRecord;
export type ITEducationTableData = ITEducationRecord;

// 커리큘럼 항목 인터페이스
export interface CurriculumItem {
  id: string;
  educationDate: string;
  time: string;
  instructor: string;
  title: string;
  content: string;
  notes: string;
  attachments: number;
}

// 참석자 항목 인터페이스
export interface ParticipantItem {
  id: string;
  no: number;
  participant: string;
  position: string;
  department: string;
  attendanceCheck: string;
  opinion: string;
  notes: string;
}

// 교육실적보고서 인터페이스
export interface EducationReport {
  achievements: string;      // 성과
  improvements: string;      // 개선사항
  feedback: string;          // 교육소감 (education_feedback)
  notes: string;            // 비고 (report_notes)
}

// 기타 옵션들
export const educationTypeOptions = ['온라인', '오프라인', '혼합', '세미나', '워크샵'];
export const statusOptions = ['계획', '진행중', '완료', '취소'];
export const assigneeOptions = ['김철수', '이영희', '박민수', '정수연'];
export const attendanceOptions = ['참석', '불참', '예정'];
export const positionOptions = ['사원', '대리', '과장', '차장', '부장'];
export const departmentOptions = ['IT팀', '개발팀', '기획팀', '마케팅팀', '인사팀', '영업팀', '기술지원팀'];
