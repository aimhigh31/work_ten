export interface TaskData {
  id: number; // string에서 number로 변경
  no: number;
  registrationDate: string; // registration_date를 camelCase로
  code: string;
  team: string; // 더 유연한 타입으로 변경
  department: string; // 더 유연한 타입으로 변경
  workContent: string;
  description?: string; // 설명 필드 추가
  status: string; // 더 유연한 타입으로 변경
  assignee: string; // assignee_id를 assignee로 변경
  startDate?: string; // start_date를 camelCase로
  dueDate?: string; // 마감일 추가
  completedDate?: string; // completed_date를 camelCase로
  progress: number; // 진척율 추가
  attachments: any[]; // 첨부파일
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
