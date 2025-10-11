export interface VOCData {
  id: number;
  no: number;
  registrationDate: string;
  startDate: string;
  code: string;
  requestType: '기능개선' | '오류신고' | '문의' | '기타';
  requestDepartment: string;
  requester: string;
  requestContent: string;
  actionContent: string;
  status: '접수' | '진행중' | '완료' | '보류';
  team: '개발팀' | '디자인팀' | '기획팀' | '마케팅팀';
  assignee: string;
  completedDate: string;
  attachments: string[];
}

export interface VOCTableData extends VOCData {
  isEditing?: boolean;
  originalData?: VOCData;
}

export type VOCStatus = '접수' | '진행중' | '완료' | '보류';
export type VOCRequestType = '기능개선' | '오류신고' | '문의' | '기타';
export type VOCTeam = '개발팀' | '디자인팀' | '기획팀' | '마케팅팀';

export interface VOCFilterOptions {
  requestType?: VOCRequestType;
  status?: VOCStatus;
  assignee?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}
