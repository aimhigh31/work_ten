export interface RegulationData {
  id: number;
  no: number;
  registrationDate: string;
  code: string;
  team: '개발팀' | '디자인팀' | '기획팀' | '마케팅팀';
  department: 'IT' | '기획';
  workContent: string;
  type: string; // 문서유형 (정책서, 지침서, 매뉴얼 등)
  status: '대기' | '진행' | '완료' | '홀딩';
  assignee: string;
  startDate: string;
  completedDate: string;
  attachments: string[];
  lastRevision?: string; // 최종리비전
  revisionModifiedDate?: string; // 리비전수정일
}

export interface RegulationTableData extends RegulationData {
  isEditing?: boolean;
  originalData?: RegulationData;
}

export type RegulationStatus = '대기' | '진행' | '완료' | '홀딩';
export type RegulationTeam = '개발팀' | '디자인팀' | '기획팀' | '마케팅팀';
export type RegulationDepartment = 'IT' | '기획';

export interface RegulationFilterOptions {
  department?: RegulationDepartment;
  status?: RegulationStatus;
  assignee?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}
