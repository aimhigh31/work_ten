// 고객보안관리 관련 타입 정의

export interface CustomerSecurityRecord {
  id: number;
  registrationDate: string;
  code: string;
  inspectionType: '정기점검' | '비정기점검' | '특별점검' | '긴급점검';
  customerName: string; // 고객사 이름
  inspectionTitle: string;
  inspectionDate: string;
  status: '대기' | '진행' | '완료' | '취소';
  assignee: string;
  attachment: boolean;
  attachmentCount: number;
  attachments: AttachmentFile[];
  isNew?: boolean; // 새로 추가된 행 여부
  // 추가 필드
  purpose?: string;
  scope?: string;
  content?: string;
  checklist?: ChecklistItem[];
  records?: InspectionRecordEntry[];
  requestContent?: string; // 이전 버전 호환성
  requestDepartment?: string; // 이전 버전 호환성
  checklistEditorData?: ChecklistEditorItem[]; // 체크리스트 에디터 데이터
  selectedChecklistId?: number; // 선택된 체크리스트 ID
  oplData?: OPLItem[]; // OPL 데이터
  // 점검성과보고 필드
  achievements?: string; // 성과
  improvements?: string; // 개선사항
  feedback?: string; // 점검소감
  remarks?: string; // 비고
}

export interface AttachmentFile {
  id: number;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  file?: File; // 실제 파일 객체 (선택적)
}

export interface ChecklistItem {
  id: number;
  item: string;
  status: string;
  remark: string;
}

export interface InspectionRecordEntry {
  id: number;
  date: string;
  author: string;
  content: string;
}

export interface ChecklistEditorItem {
  id: number;
  majorCategory: string;
  minorCategory: string;
  item: string;
  evaluationContent: string;
  evaluation: string;
  score: number;
  attachments: AttachmentFile[];
}

export interface OPLItem {
  id: number;
  no: number;
  registrationDate: string;
  code: string;
  oplType: 'High' | 'Middle' | 'Low';
  issuePhoto: string | null;
  issueDetail: string;
  improvementPhoto: string | null;
  improvementAction: string;
  assignee: string;
  status: '대기' | '진행' | '완료' | '취소';
  completionDate: string;
  attachments: AttachmentFile[];
}

export interface CustomerSecurityStatistics {
  totalAmount: number;
  pendingAmount: number;
  completedAmount: number;
  byType: Record<string, { count: number; amount: number }>;
  byStatus: Record<string, { count: number; amount: number }>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
}

// 점검 유형 옵션
export const inspectionTypeOptions = ['정기점검', '비정기점검', '특별점검', '긴급점검'] as const;

// 상태 옵션
export const statusOptions = ['대기', '진행', '완료', '취소'] as const;

// 부서 옵션
export const departmentOptions = ['IT팀', '마케팅팀', '영업팀', '기획팀', '인사팀', '재무팀', '개발팀', '디자인팀'] as const;

// 고객사 옵션
export const customerOptions = [
  '삼성전자',
  'LG전자',
  'SK하이닉스',
  '현대자동차',
  '네이버',
  '카카오',
  '쿠팡',
  '배달의민족',
  'KT',
  'SKT'
] as const;
