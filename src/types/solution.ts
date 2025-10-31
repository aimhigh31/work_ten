export interface SolutionData {
  id: number;
  no: number;
  registrationDate: string;
  startDate: string;
  code: string;
  solutionType: '웹개발' | '모바일앱' | '시스템통합' | '데이터분석' | '보안강화' | '인프라구축';
  developmentType: '신규개발' | '기능개선' | '유지보수' | '마이그레이션' | '최적화';
  title: string;
  detailContent: string;
  team: '개발팀' | '디자인팀' | '기획팀' | '마케팅팀';
  assignee: string;
  status: '대기' | '진행' | '완료' | '홀딩';
  progress: number;
  completedDate: string;
  attachments: string[];
  createdBy?: string; // 데이터 생성자 (권한 체크용)
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

// DB 스키마에 맞는 타입 정의 (it_solution_data 테이블)
export interface DbSolutionData {
  id: number;
  no: number;
  registration_date: string;
  start_date: string | null;
  code: string;
  solution_type: SolutionType;
  development_type: DevelopmentType;
  title: string;
  detail_content: string;
  team: SolutionTeam;
  assignee: string;
  status: SolutionStatus;
  completed_date: string | null;
  attachments: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  is_active: boolean;
}
