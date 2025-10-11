// 비용관리 관련 타입 정의

export interface CostRecord {
  id: number;
  registrationDate: string;
  startDate: string;
  code: string;
  team: string;
  assignee: string;
  costType: '솔루션' | '하드웨어' | '출장경비' | '행사경비' | '사무경비';
  content: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  status: '대기' | '진행' | '완료' | '취소';
  completionDate: string;
  attachment: boolean;
  attachmentCount: number;
  attachments: AttachmentFile[];
  isNew?: boolean; // 새로 추가된 행 여부
  amountDetails?: AmountDetail[]; // 금액 상세 정보
  comments?: Comment[]; // 기록(코멘트) 정보
}

export interface Comment {
  id: number;
  author: string;
  content: string;
  timestamp: string;
  avatar?: string;
}

export interface AmountDetail {
  id: number;
  code: string;
  costType: string;
  content: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface AttachmentFile {
  id: number;
  name: string;
  type: string;
  size: string;
  file?: File;
  uploadDate: string;
}

export interface CostStatistics {
  totalAmount: number;
  pendingAmount: number;
  completedAmount: number;
  byType: {
    [key: string]: {
      count: number;
      amount: number;
    };
  };
  byStatus: {
    [key: string]: {
      count: number;
      amount: number;
    };
  };
  monthlyTrend: {
    month: string;
    amount: number;
    count: number;
  }[];
}

// 비용 유형 옵션
export const costTypeOptions = ['솔루션', '하드웨어', '출장경비', '행사경비', '사무경비'] as const;

// 상태 옵션
export const statusOptions = ['대기', '진행', '완료', '취소'] as const;

// 팀 옵션
export const teamOptions = ['IT팀', '마케팅팀', '영업팀', '기획팀', '인사팀'] as const;
