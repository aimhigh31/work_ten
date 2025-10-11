export interface SolutionData {
  id: number;
  no: number;
  registrationDate: string;
  startDate: string;
  code: string;
  solutionType: '웹개발' | '모바일앱' | '시스템통합' | '데이터분석' | '보안강화' | '인프라구축';
  developmentType: '신규개발' | '기능개선' | '유지보수' | '마이그레이션' | '최적화';
  detailContent: string;
  team: '개발팀' | '디자인팀' | '기획팀' | '마케팅팀';
  assignee: string;
  status: '대기' | '진행' | '완료' | '홀딩';
  completedDate: string;
  attachments: string[];
}

export interface SolutionTableData extends SolutionData {
  isEditing?: boolean;
  originalData?: SolutionData;
}

export type SolutionStatus = '대기' | '진행' | '완료' | '홀딩';
export type SolutionTeam = '개발팀' | '디자인팀' | '기획팀' | '마케팅팀';
export type SolutionType = '웹개발' | '모바일앱' | '시스템통합' | '데이터분석' | '보안강화' | '인프라구축';
export type DevelopmentType = '신규개발' | '기능개선' | '유지보수' | '마이그레이션' | '최적화';

export interface SolutionFilterOptions {
  solutionType?: SolutionType;
  status?: SolutionStatus;
  assignee?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}
