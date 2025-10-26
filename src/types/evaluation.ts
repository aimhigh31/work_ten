export interface EvaluationData {
  id: number;
  no: number;
  registrationDate: string;
  code: string;
  evaluationType: '직원평가' | '부서평가' | '프로젝트평가' | '역량평가';
  managementCategory: '상반기' | '하반기' | '분기별' | '수시평가';
  evaluationTitle: string;
  team: '개발팀' | '디자인팀' | '기획팀' | '마케팅팀';
  assignee: string;
  status: '대기' | '진행' | '완료' | '홀딩';
  inspectionDate: string;
  details?: string; // 세부설명
  performance?: string; // 평가성과보고 - 성과
  improvements?: string; // 평가성과보고 - 개선사항
  thoughts?: string; // 평가성과보고 - 평가소감
  notes?: string; // 평가성과보고 - 비고
  checklistGuide?: string; // 체크리스트 안내가이드
  attachments: string[];
  startDate?: string; // 시작일
  endDate?: string; // 종료일
  evaluationDataId?: number; // hr_evaluation_data 테이블 ID
}

export interface EvaluationTableData extends EvaluationData {
  isEditing?: boolean;
  originalData?: EvaluationData;
}

export type EvaluationStatus = '대기' | '진행' | '완료' | '홀딩';
export type EvaluationType = '직원평가' | '부서평가' | '프로젝트평가' | '역량평가';
export type ManagementCategory = '상반기' | '하반기' | '분기별' | '수시평가';

// 성능 최적화를 위한 메모화된 데이터 타입
export interface OptimizedEvaluationData {
  id: number;
  evaluationTitle: string;
  assignee: string;
  status: EvaluationStatus;
  progress: number;
}

// Edit 모드에서 사용하는 타입
export interface EditableEvaluationData extends EvaluationTableData {
  progress: number;
}

// 월간 일정을 위한 타입
export interface MonthlyEvaluationEvent {
  id: number;
  title: string;
  date: string;
  status: EvaluationStatus;
  team: string;
}

// 대시보드 차트 데이터 타입
export interface EvaluationChartData {
  name: string;
  value: number;
  color?: string;
}

// 변경 로그 데이터 타입
export interface EvaluationChangeLog {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  target: string;
  description: string;
  team: string;
}
