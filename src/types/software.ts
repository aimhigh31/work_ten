export interface TaskData {
  id: number;
  no: number;
  registrationDate: string;
  code: string;
  team: '개발팀' | '디자인팀' | '기획팀' | '마케팅팀';
  department: 'IT' | '기획';
  workContent: string;
  status: '대기' | '진행' | '사용중' | '완료' | '홀딩22' | '사용완료' | '중단' | '계획중';
  assignee: string;
  startDate: string;
  completedDate: string;
  attachments: string[];
  createdBy?: string; // 데이터 생성자 (권한 체크용)

  // 소프트웨어 관리를 위한 추가 필드
  softwareName?: string;
  description?: string;
  softwareCategory?: string;
  spec?: string;
  currentUser?: string;
  solutionProvider?: string;
  userCount?: number;
  licenseType?: string;
  licenseKey?: string;
}

export interface TaskTableData extends TaskData {
  isEditing?: boolean;
  originalData?: TaskData;
}

export type TaskStatus = '대기' | '진행' | '사용중' | '완료' | '홀딩22' | '사용완료' | '중단' | '계획중';
export type SoftwareStatus = '대기' | '진행' | '사용중' | '완료' | '홀딩22' | '사용완료' | '중단' | '계획중';
export type TaskTeam = '개발팀' | '디자인팀' | '기획팀' | '마케팅팀';
export type TaskDepartment = 'IT' | '기획';

export interface TaskFilterOptions {
  department?: TaskDepartment;
  status?: TaskStatus;
  assignee?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}
