// 체크리스트 관련 타입 정의

export interface ChecklistRecord {
  id: number;
  registrationDate: string;
  code: string;
  category: '업무' | '프로젝트' | '일정' | '회의' | '점검' | '기타';
  title: string;
  description: string;
  priority: '높음' | '보통' | '낮음';
  status: '대기' | '진행' | '완료' | '취소';
  assignee: string; // 등록자 (로그인 사용자)
  dueDate: string;
  completionDate: string;
  attachment: boolean;
  attachmentCount: number;
  attachments: AttachmentFile[];
  isNew?: boolean; // 새로 추가된 행 여부
  editorData?: ChecklistEditorItem[]; // 각 체크리스트별 에디터 데이터
}

export interface AttachmentFile {
  id: number;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
}

export interface ChecklistEditorItem {
  id: number;
  majorCategory: string;
  minorCategory: string;
  title: string;
  description: string;
  evaluation: string;
  score: number;
  attachments: AttachmentFile[];
}

export interface ChecklistStatistics {
  totalAmount: number;
  pendingAmount: number;
  completedAmount: number;
  byCategory: Record<string, { count: number; amount: number }>;
  byStatus: Record<string, { count: number; amount: number }>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
}

// 체크리스트 카테고리 옵션
export const categoryOptions = ['업무', '프로젝트', '일정', '회의', '점검', '기타'] as const;

// 우선순위 옵션
export const priorityOptions = ['높음', '보통', '낮음'] as const;

// 상태 옵션
export const statusOptions = ['대기', '진행', '완료', '취소'] as const;

// 부서 옵션
export const departmentOptions = ['IT팀', '마케팅팀', '영업팀', '기획팀', '인사팀', '재무팀', '개발팀', '디자인팀'] as const;
