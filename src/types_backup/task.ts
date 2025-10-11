export interface TaskData {
  id: number;
  no: number;
  registrationDate: string;
  code: string;
  team: '개발팀' | '디자인팀' | '기획팀' | '마케팅팀';
  department: 'IT' | '기획';
  workContent: string;
  status: '대기' | '진행' | '완료' | '홀딩';
  assignee: string;
  startDate: string;
  completedDate: string;
  attachments: string[];
}

export interface TaskTableData extends TaskData {
  isEditing?: boolean;
  originalData?: TaskData;
}

export type TaskStatus = '대기' | '진행' | '완료' | '홀딩';
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
