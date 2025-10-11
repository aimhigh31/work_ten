import { InvestmentData } from 'types/investment';

// 담당자 목록
export const investmentAssignees = ['김투자', '이분석', '박운용', '최리스크', '정자산', '한펀드', '오증권', '강채권'];

// 담당자 아바타 매핑
export const investmentAssigneeAvatars = {
  김투자: '/assets/images/users/avatar-1.png',
  이분석: '/assets/images/users/avatar-2.png',
  박운용: '/assets/images/users/avatar-3.png',
  최리스크: '/assets/images/users/avatar-4.png',
  정자산: '/assets/images/users/avatar-5.png',
  한펀드: '/assets/images/users/avatar-6.png',
  오증권: '/assets/images/users/avatar-7.png',
  강채권: '/assets/images/users/avatar-8.png'
} as const;

// 투자 데이터
export const investmentData: InvestmentData[] = [
  // 2025년 데이터
  {
    id: 1,
    no: 15,
    registrationDate: '2025-01-15',
    code: 'PLAN-INV-25-001',
    investmentType: '펀드',
    investmentName: 'AI 벤처 펀드 투자',
    description: 'AI 기술을 활용한 스타트업들을 대상으로 한 벤처 펀드 투자입니다. 딥러닝, 자연어처리, 컴퓨터 비전 등 다양한 AI 분야의 유망한 기업들에 분산 투자하여 높은 수익률을 기대하고 있습니다.',
    amount: 5000000000,
    team: '투자팀',
    assignee: '김투자',
    status: '대기',
    startDate: '2025-02-01',
    completedDate: '',
    expectedReturn: 25.5,
    riskLevel: '높음',
    attachments: ['investment_proposal.pdf', 'due_diligence.xlsx']
  },
  {
    id: 2,
    no: 14,
    registrationDate: '2025-01-10',
    code: 'PLAN-INV-25-002',
    investmentType: '부동산',
    investmentName: '부동산 리츠 투자',
    amount: 10000000000,
    team: '자산운용팀',
    assignee: '박운용',
    status: '진행',
    startDate: '2025-01-20',
    completedDate: '',
    expectedReturn: 8.5,
    riskLevel: '보통',
    attachments: ['reits_analysis.pdf', 'market_report.xlsx']
  },
  {
    id: 3,
    no: 13,
    registrationDate: '2025-01-08',
    code: 'PLAN-INV-25-003',
    investmentType: '채권',
    investmentName: '국채 포트폴리오',
    amount: 20000000000,
    team: '분석팀',
    assignee: '이분석',
    status: '진행',
    startDate: '2025-01-15',
    completedDate: '',
    expectedReturn: 4.2,
    riskLevel: '낮음',
    attachments: ['bond_portfolio.pdf']
  },

  // 2024년 데이터
  {
    id: 4,
    no: 12,
    registrationDate: '2024-12-20',
    code: 'PLAN-INV-24-001',
    team: '투자팀',
    department: '투자',
    investmentName: '글로벌 펀드',
    category: '펀드',
    status: '완료',
    assignee: '최리스크',
    startDate: '2024-11-01',
    completedDate: '2024-12-15',
    amount: 8000000000,
    expectedReturn: 15.0,
    actualReturn: 18.5,
    riskLevel: '높음',
    attachments: ['fund_report.pdf', 'performance.xlsx']
  },
  {
    id: 5,
    no: 11,
    registrationDate: '2024-12-18',
    code: 'PLAN-INV-24-002',
    team: '리스크관리팀',
    department: '운용',
    investmentName: '헤지펀드 투자',
    category: '헤지펀드',
    status: '완료',
    assignee: '정자산',
    startDate: '2024-11-15',
    completedDate: '2024-12-31',
    amount: 15000000000,
    expectedReturn: 12.0,
    actualReturn: 14.2,
    riskLevel: '매우높음',
    attachments: ['hedge_strategy.xlsx', 'risk_report.pdf']
  },
  {
    id: 6,
    no: 10,
    registrationDate: '2024-12-10',
    code: 'PLAN-INV-24-003',
    team: '자산운용팀',
    department: '운용',
    investmentName: '대형주 주식 포트폴리오',
    category: '주식',
    status: '홀딩',
    assignee: '한펀드',
    startDate: '2024-10-01',
    completedDate: '',
    amount: 25000000000,
    expectedReturn: 20.0,
    riskLevel: '높음',
    attachments: ['stock_analysis.pdf']
  },
  {
    id: 7,
    no: 9,
    registrationDate: '2024-11-25',
    code: 'PLAN-INV-24-004',
    team: '분석팀',
    department: '투자',
    investmentName: '원자재 선물 투자',
    category: '원자재',
    status: '완료',
    assignee: '오증권',
    startDate: '2024-09-01',
    completedDate: '2024-11-30',
    amount: 6000000000,
    expectedReturn: 10.0,
    actualReturn: 12.8,
    riskLevel: '보통',
    attachments: ['commodity_futures.pdf', 'market_analysis.xlsx']
  },
  {
    id: 8,
    no: 8,
    registrationDate: '2024-11-15',
    code: 'PLAN-INV-24-005',
    team: '투자팀',
    department: '투자',
    investmentName: '암호화폐 포트폴리오',
    category: '디지털자산',
    status: '완료',
    assignee: '강채권',
    startDate: '2024-08-15',
    completedDate: '2024-11-10',
    amount: 3000000000,
    expectedReturn: 30.0,
    actualReturn: 45.5,
    riskLevel: '매우높음',
    attachments: ['crypto_portfolio.xlsx', 'blockchain_analysis.pdf']
  },
  {
    id: 9,
    no: 7,
    registrationDate: '2024-10-20',
    code: 'PLAN-INV-24-006',
    team: '자산운용팀',
    department: '운용',
    investmentName: '인프라 투자',
    category: '인프라',
    status: '완료',
    assignee: '김투자',
    startDate: '2024-07-01',
    completedDate: '2024-10-15',
    amount: 30000000000,
    expectedReturn: 6.5,
    actualReturn: 7.2,
    riskLevel: '낮음',
    attachments: ['infra_project.xlsx']
  },
  {
    id: 10,
    no: 6,
    registrationDate: '2024-09-30',
    code: 'PLAN-INV-24-007',
    team: '리스크관리팀',
    department: '운용',
    investmentName: '외환 헤지 상품',
    category: '외환',
    status: '완료',
    assignee: '박운용',
    startDate: '2024-06-01',
    completedDate: '2024-09-25',
    amount: 12000000000,
    expectedReturn: 5.0,
    actualReturn: 5.8,
    riskLevel: '보통',
    attachments: ['fx_hedge.xlsx', 'currency_report.pdf']
  },

  // 2023년 데이터
  {
    id: 11,
    no: 5,
    registrationDate: '2023-12-15',
    code: 'PLAN-INV-23-001',
    team: '투자팀',
    department: '투자',
    investmentName: '그린에너지 펀드',
    category: '펀드',
    status: '완료',
    assignee: '이분석',
    startDate: '2023-08-01',
    completedDate: '2023-12-10',
    amount: 18000000000,
    expectedReturn: 11.0,
    actualReturn: 13.5,
    riskLevel: '보통',
    attachments: ['green_energy.pdf', 'esg_report.xlsx']
  },
  {
    id: 12,
    no: 4,
    registrationDate: '2023-11-20',
    code: 'PLAN-INV-23-002',
    team: '분석팀',
    department: '투자',
    investmentName: '회사채 투자',
    category: '채권',
    status: '완료',
    assignee: '최리스크',
    startDate: '2023-06-15',
    completedDate: '2023-11-15',
    amount: 22000000000,
    expectedReturn: 5.5,
    actualReturn: 6.2,
    riskLevel: '낮음',
    attachments: ['corporate_bond.pdf', 'credit_analysis.pdf']
  },
  {
    id: 13,
    no: 3,
    registrationDate: '2023-10-10',
    code: 'PLAN-INV-23-003',
    team: '자산운용팀',
    department: '운용',
    investmentName: '사모펀드 투자',
    category: '헤지펀드',
    status: '완료',
    assignee: '정자산',
    startDate: '2023-04-01',
    completedDate: '2023-10-05',
    amount: 35000000000,
    expectedReturn: 18.0,
    actualReturn: 22.3,
    riskLevel: '높음',
    attachments: ['private_equity.pdf', 'investment_memo.pdf']
  },
  {
    id: 14,
    no: 2,
    registrationDate: '2023-08-25',
    code: 'PLAN-INV-23-004',
    team: '리스크관리팀',
    department: '운용',
    investmentName: '구조화상품 투자',
    category: '파생상품',
    status: '완료',
    assignee: '한펀드',
    startDate: '2023-03-01',
    completedDate: '2023-08-20',
    amount: 16000000000,
    expectedReturn: 9.0,
    actualReturn: 10.5,
    riskLevel: '보통',
    attachments: ['structured_product.xlsx', 'derivative_analysis.pdf']
  },
  {
    id: 15,
    no: 1,
    registrationDate: '2023-07-15',
    code: 'PLAN-INV-23-005',
    team: '투자팀',
    department: '투자',
    investmentName: '벤처캐피털 투자',
    category: '벤처투자',
    status: '완료',
    assignee: '오증권',
    startDate: '2023-01-15',
    completedDate: '2023-07-10',
    amount: 7000000000,
    expectedReturn: 35.0,
    actualReturn: 42.5,
    riskLevel: '매우높음',
    attachments: ['vc_portfolio.pdf', 'startup_valuation.pdf']
  }
];

// 상태별 색상 매핑
export const investmentStatusColors = {
  대기: 'warning',
  진행: 'info',
  완료: 'success',
  홀딩: 'error'
} as const;

// 팀별 색상 매핑
export const investmentTeamColors = {
  투자팀: 'primary',
  분석팀: 'secondary',
  자산운용팀: 'info',
  리스크관리팀: 'success'
} as const;

// 부서별 색상 매핑
// 투자유형별 색상 매핑
export const investmentTypeColors = {
  주식: 'primary',
  채권: 'secondary',
  펀드: 'info',
  부동산: 'success',
  원자재: 'warning',
  기타: 'default'
} as const;

// 위험도별 색상 매핑
export const riskLevelColors = {
  낮음: 'success',
  보통: 'info',
  높음: 'warning',
  매우높음: 'error'
} as const;

// 팀 목록
export const investmentTeams = ['투자팀', '분석팀', '자산운용팀', '리스크관리팀'] as const;

// 상태 옵션 목록
export const investmentStatusOptions = ['대기', '진행', '완료', '홀딩'] as const;

// 투자유형 목록
export const investmentTypes = ['주식', '채권', '펀드', '부동산', '원자재', '기타'] as const;

// 위험도 목록
export const riskLevels = ['낮음', '보통', '높음', '매우높음'] as const;
