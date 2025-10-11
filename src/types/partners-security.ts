// 협력사보안관리 관련 타입 정의

export interface PartnersSecurityRecord {
  id: number;
  registrationDate: string;
  code: string;
  requestType: '하드웨어' | '소프트웨어' | '솔루션' | '그룹웨어' | '미들웨어' | '네트워크' | '전산서버' | '보안' | '단순문의';
  requestDepartment: string;
  requester: string;
  requestContent: string;
  actionContent: string;
  status: '대기' | '진행' | '완료' | '취소';
  assignee: string;
  completionDate: string;
  attachment: boolean;
  attachmentCount: number;
  attachments: AttachmentFile[];
  isNew?: boolean; // 새로 추가된 행 여부
}

export interface AttachmentFile {
  id: number;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
}

export interface PartnersSecurityStatistics {
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

// 협력사보안 요청 유형 옵션
export const requestTypeOptions = [
  '하드웨어',
  '소프트웨어',
  '솔루션',
  '그룹웨어',
  '미들웨어',
  '네트워크',
  '전산서버',
  '보안',
  '단순문의'
] as const;

// 상태 옵션
export const statusOptions = ['대기', '진행', '완료', '취소'] as const;

// 부서 옵션
export const departmentOptions = ['IT팀', '마케팅팀', '영업팀', '기획팀', '인사팀', '재무팀', '개발팀', '디자인팀'] as const;
