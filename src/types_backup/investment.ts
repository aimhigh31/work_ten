export interface InvestmentData {
  id: number;
  no: number;
  registrationDate: string;
  code: string;
  investmentType: '주식' | '채권' | '펀드' | '부동산' | '원자재' | '기타';
  investmentName: string;
  amount: number;
  team: '투자팀' | '분석팀' | '자산운용팀' | '리스크관리팀';
  assignee: string;
  status: '대기' | '진행' | '완료' | '홀딩';
  startDate: string;
  completedDate: string;
  expectedReturn: number;
  actualReturn?: number;
  riskLevel: '낮음' | '보통' | '높음' | '매우높음';
  attachments: string[];
}

export interface InvestmentTableData extends InvestmentData {
  isEditing?: boolean;
  originalData?: InvestmentData;
}

export type InvestmentStatus = '대기' | '진행' | '완료' | '홀딩';
export type InvestmentTeam = '투자팀' | '분석팀' | '자산운용팀' | '리스크관리팀';
export type InvestmentType = '주식' | '채권' | '펀드' | '부동산' | '원자재' | '기타';
export type RiskLevel = '낮음' | '보통' | '높음' | '매우높음';

export interface InvestmentFilterOptions {
  investmentType?: InvestmentType;
  status?: InvestmentStatus;
  assignee?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}
