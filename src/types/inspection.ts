export interface InspectionData {
  id: number;
  no: number;
  registrationDate: string;
  code: string;
  inspectionType: '보안점검' | '취약점점검' | '침투테스트' | '컴플라이언스점검';
  inspectionTarget: '고객사' | '내부' | '파트너사';
  inspectionContent: string;
  team: '개발팀' | '디자인팀' | '기획팀' | '마케팅팀';
  assignee: string;
  status: '대기' | '진행' | '완료' | '홀딩';
  inspectionDate: string;
  details?: string; // 세부설명
  performance?: string; // 점검성과보고 - 성과
  improvements?: string; // 점검성과보고 - 개선사항
  thoughts?: string; // 점검성과보고 - 점검소감
  notes?: string; // 점검성과보고 - 비고
  attachments: string[];
}

export interface InspectionTableData extends InspectionData {
  isEditing?: boolean;
  originalData?: InspectionData;
}

export type InspectionStatus = '대기' | '진행' | '완료' | '홀딩';
export type InspectionType = '보안점검' | '취약점점검' | '침투테스트' | '컴플라이언스점검';
export type InspectionTarget = '고객사' | '내부' | '파트너사';

// 성능 최적화를 위한 메모화된 데이터 타입
export interface OptimizedInspectionData {
  id: number;
  inspectionContent: string;
  assignee: string;
  status: InspectionStatus;
  progress: number;
}

// Edit 모드에서 사용하는 타입
export interface EditableInspectionData extends InspectionTableData {
  progress: number;
}

// 월간 일정을 위한 타입
export interface MonthlyInspectionEvent {
  id: number;
  title: string;
  date: string;
  status: InspectionStatus;
  team: string;
}

// 대시보드 차트 데이터 타입
export interface InspectionChartData {
  name: string;
  value: number;
  color?: string;
}

// 변경 로그 데이터 타입
export interface InspectionChangeLog {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  target: string;
  description: string;
  team: string;
}
