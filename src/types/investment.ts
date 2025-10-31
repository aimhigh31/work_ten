export interface InvestmentData {
  id: number;
  no: number;
  registrationDate: string;
  code: string;
  investmentType: string;
  investmentName: string;
  description?: string;
  amount: number;
  team: string;
  assignee: string;
  status: string;
  startDate: string;
  completedDate: string;
  expectedReturn: number;
  actualReturn?: number;
  riskLevel: '낮음' | '보통' | '높음' | '매우높음';
  attachments: string[];
  createdBy?: string; // 데이터 생성자 (권한 체크용)
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
  investmentType?: string;
  status?: string;
  assignee?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

// DB 테이블 타입 (Supabase DB 구조)
export interface DbInvestmentData {
  id: number;
  no: number;
  registration_date: string;
  code: string;
  investment_type: string;
  investment_name: string;
  description?: string | null;
  amount: number;
  team: string;
  assignee: string | null;
  status: string;
  start_date: string | null;
  completed_date: string | null;
  expected_return: number;
  actual_return: number | null;
  risk_level: RiskLevel;
  attachments: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  is_active: boolean;
}
