export interface SecurityEducationData {
  id: number;
  no: number;
  registrationDate: string;
  code: string;
  educationType: '온라인' | '오프라인' | '혼합' | '세미나' | '워크샵';
  educationName: string;
  location: string;
  attendeeCount: number;
  executionDate: string;
  status: '대기' | '진행' | '완료' | '홀딩';
  assignee: string;
  team?: '보안팀' | 'IT팀' | '개발팀' | '관리팀';
  department?: 'IT' | '보안';
  attachments?: string[];
}

export interface SecurityEducationTableData extends SecurityEducationData {
  isEditing?: boolean;
  originalData?: SecurityEducationData;
  likes?: number;
  likedBy?: string[];
  views?: number;
  viewedBy?: string[];
  comments?: any[];
}

export type SecurityEducationStatus = '대기' | '진행' | '완료' | '홀딩';
export type SecurityEducationType = '온라인' | '오프라인' | '혼합' | '세미나' | '워크샵';
export type SecurityEducationTeam = '보안팀' | 'IT팀' | '개발팀' | '관리팀';
export type SecurityEducationDepartment = 'IT' | '보안';

export interface SecurityEducationFilterOptions {
  department?: SecurityEducationDepartment;
  status?: SecurityEducationStatus;
  assignee?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

// 보안교육 편집 다이얼로그용 Record 타입
export interface SecurityEducationRecord {
  id: number;
  registrationDate: string;
  code: string;
  educationType: SecurityEducationType;
  educationName: string;
  location: string;
  participantCount: number;
  executionDate: string;
  status: SecurityEducationStatus;
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
export const statusOptions = ['대기', '진행', '완료', '홀딩'];
export const assigneeOptions = ['김철수', '이영희', '박민수', '정수연'];
export const attendanceOptions = ['참석', '불참', '예정'];
export const positionOptions = ['사원', '대리', '과장', '차장', '부장'];
export const departmentOptions = ['보안팀', 'IT팀', '개발팀', '관리팀', '인사팀', '영업팀', '기술지원팀'];
