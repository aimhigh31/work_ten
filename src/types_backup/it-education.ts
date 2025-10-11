export interface ITEducationData {
  id: number;
  no: number;
  registrationDate: string;
  code: string;
  educationType: '온라인' | '오프라인' | '혼합' | '세미나' | '워크샵';
  educationName: string;
  location: string;
  attendeeCount: number;
  executionDate: string;
  status: '계획' | '진행중' | '완료' | '취소';
  assignee: string;
  team?: '개발팀' | '디자인팀' | '기획팀' | '마케팅팀';
  department?: 'IT' | '기획';
  attachments?: string[];
}

export interface ITEducationTableData extends ITEducationData {
  isEditing?: boolean;
  originalData?: ITEducationData;
}

export type ITEducationStatus = '계획' | '진행중' | '완료' | '취소';
export type ITEducationType = '온라인' | '오프라인' | '혼합' | '세미나' | '워크샵';
export type ITEducationTeam = '개발팀' | '디자인팀' | '기획팀' | '마케팅팀';
export type ITEducationDepartment = 'IT' | '기획';

export interface ITEducationFilterOptions {
  department?: ITEducationDepartment;
  status?: ITEducationStatus;
  assignee?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

// IT교육 편집 다이얼로그용 Record 타입
export interface ITEducationRecord {
  id: number;
  registrationDate: string;
  code: string;
  educationType: ITEducationType;
  educationName: string;
  location: string;
  participantCount: number;
  executionDate: string;
  status: ITEducationStatus;
  assignee: string;
  attachment: boolean;
  attachmentCount: number;
  attachments: string[];
  isNew?: boolean;
}

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
  achievements: string;
  improvements: string;
  nextSteps: string;
  feedback: string;
}

// 기타 옵션들
export const educationTypeOptions = ['온라인', '오프라인', '혼합', '세미나', '워크샵'];
export const statusOptions = ['계획', '진행중', '완료', '취소'];
export const assigneeOptions = ['김철수', '이영희', '박민수', '정수연'];
export const attendanceOptions = ['참석', '불참', '예정'];
export const positionOptions = ['사원', '대리', '과장', '차장', '부장'];
export const departmentOptions = ['IT팀', '개발팀', '기획팀', '마케팅팀', '인사팀', '영업팀', '기술지원팀'];
