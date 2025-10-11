import { SolutionData } from 'types/solution';

// 샘플 담당자 목록
export const assignees = ['김민수', '이영희', '박지훈', '최수진', '정우진', '한나라', '신동욱', '오세영'];

// 담당자별 아바타 정보
export const assigneeAvatars = {
  김민수: '/assets/images/users/avatar-1.png',
  이영희: '/assets/images/users/avatar-2.png',
  박지훈: '/assets/images/users/avatar-3.png',
  최수진: '/assets/images/users/avatar-4.png',
  정우진: '/assets/images/users/avatar-5.png',
  한나라: '/assets/images/users/avatar-6.png',
  신동욱: '/assets/images/users/avatar-7.png',
  오세영: '/assets/images/users/avatar-8.png'
} as const;

// 샘플 Solution 데이터
export const solutionData: SolutionData[] = [
  // 2025년 데이터
  {
    id: 1,
    no: 15,
    registrationDate: '2025-01-15',
    startDate: '2025-02-01',
    code: 'SOL-25-001',
    solutionType: '웹개발',
    developmentType: '신규개발',
    detailContent: 'AI 기반 추천 시스템 구축',
    team: '개발팀',
    status: '대기',
    assignee: '김민수',
    completedDate: '',
    attachments: ['ai_spec.pdf', 'ml_model.py']
  },
  {
    id: 2,
    no: 14,
    registrationDate: '2025-01-10',
    startDate: '2025-01-20',
    code: 'SOL-25-002',
    solutionType: '웹개발',
    developmentType: '기능개선',
    detailContent: 'UX 리뉴얼 프로젝트',
    team: '디자인팀',
    status: '진행',
    assignee: '이영희',

    completedDate: '',
    attachments: ['ux_research.figma', 'user_flow.pdf']
  },
  {
    id: 3,
    no: 13,
    registrationDate: '2025-01-08',
    startDate: '2025-01-25',
    code: 'SOL-25-003',
    solutionType: '데이터분석',
    developmentType: '신규개발',
    detailContent: '2025 신사업 전략 수립',
    team: '기획팀',
    status: '진행',
    assignee: '최수진',

    completedDate: '',
    attachments: ['strategy_draft.pptx']
  },

  // 2024년 데이터
  {
    id: 4,
    no: 12,
    registrationDate: '2024-12-20',
    startDate: '2024-12-22',
    code: 'SOL-24-001',
    solutionType: '시스템통합',
    developmentType: '신규개발',
    detailContent: 'API 게이트웨이 구축',
    team: '개발팀',
    status: '완료',
    assignee: '박지훈',

    completedDate: '2024-12-15',
    attachments: ['gateway_config.yml', 'api_docs.pdf']
  },
  {
    id: 5,
    no: 11,
    registrationDate: '2024-12-18',
    startDate: '2024-12-20',
    code: 'SOL-24-002',
    solutionType: '웹개발',
    developmentType: '기능개선',
    detailContent: '연말 마케팅 캠페인',
    team: '마케팅팀',
    status: '완료',
    assignee: '한나라',

    completedDate: '2024-12-31',
    attachments: ['campaign_results.xlsx', 'performance_report.pdf']
  },
  {
    id: 6,
    no: 10,
    registrationDate: '2024-12-10',
    startDate: '2024-12-15',
    code: 'SOL-24-003',
    solutionType: '보안강화',
    developmentType: '신규개발',
    detailContent: '보안 강화 시스템',
    team: '개발팀',
    status: '홀딩',
    assignee: '정우진',

    completedDate: '',
    attachments: ['security_audit.pdf']
  },
  {
    id: 7,
    no: 9,
    registrationDate: '2024-11-25',
    startDate: '2024-11-28',
    code: 'SOL-24-004',
    solutionType: '웹개발',
    developmentType: '기능개선',
    detailContent: '브랜딩 가이드라인 개선',
    team: '디자인팀',
    status: '완료',
    assignee: '신동욱',

    completedDate: '2024-11-30',
    attachments: ['brand_guide_v2.pdf', 'color_palette.ai']
  },
  {
    id: 8,
    no: 8,
    registrationDate: '2024-11-15',
    startDate: '2024-11-18',
    code: 'SOL-24-005',
    solutionType: '데이터분석',
    developmentType: '신규개발',
    detailContent: '사용자 피드백 분석',
    team: '기획팀',
    status: '완료',
    assignee: '오세영',

    completedDate: '2024-11-10',
    attachments: ['feedback_analysis.xlsx', 'user_survey.pdf']
  },
  {
    id: 9,
    no: 7,
    registrationDate: '2024-10-20',
    startDate: '2024-10-25',
    code: 'SOL-24-006',
    solutionType: '모바일앱',
    developmentType: '최적화',
    detailContent: '모바일 앱 성능 최적화',
    team: '개발팀',
    status: '완료',
    assignee: '김민수',

    completedDate: '2024-10-15',
    attachments: ['performance_metrics.xlsx']
  },
  {
    id: 10,
    no: 6,
    registrationDate: '2024-09-30',
    startDate: '2024-10-05',
    code: 'SOL-24-007',
    solutionType: '데이터분석',
    developmentType: '신규개발',
    detailContent: 'Q4 마케팅 전략',
    team: '마케팅팀',
    status: '완료',
    assignee: '이영희',

    completedDate: '2024-09-25',
    attachments: ['q4_strategy.pptx', 'market_research.pdf']
  },

  // 2023년 데이터
  {
    id: 11,
    no: 5,
    registrationDate: '2023-12-15',
    startDate: '2023-12-18',
    code: 'SOL-23-001',
    solutionType: '시스템통합',
    developmentType: '마이그레이션',
    detailContent: '레거시 시스템 마이그레이션',
    team: '개발팀',
    status: '완료',
    assignee: '박지훈',

    completedDate: '2023-12-10',
    attachments: ['migration_plan.pdf', 'test_results.xlsx']
  },
  {
    id: 12,
    no: 4,
    registrationDate: '2023-11-20',
    startDate: '2023-11-25',
    code: 'SOL-23-002',
    solutionType: '웹개발',
    developmentType: '신규개발',
    detailContent: 'UI 컴포넌트 라이브러리',
    team: '디자인팀',
    status: '완료',
    assignee: '최수진',

    completedDate: '2023-11-15',
    attachments: ['component_lib.figma', 'style_guide.pdf']
  },
  {
    id: 13,
    no: 3,
    registrationDate: '2023-10-10',
    startDate: '2023-10-15',
    code: 'SOL-23-003',
    solutionType: '시스템통합',
    developmentType: '기능개선',
    detailContent: '비즈니스 프로세스 개선',
    team: '기획팀',
    status: '완료',
    assignee: '한나라',

    completedDate: '2023-10-05',
    attachments: ['process_map.pdf', 'improvement_plan.docx']
  },
  {
    id: 14,
    no: 2,
    registrationDate: '2023-08-25',
    startDate: '2023-08-30',
    code: 'SOL-23-004',
    solutionType: '데이터분석',
    developmentType: '신규개발',
    detailContent: '고객 세그먼테이션 분석',
    team: '마케팅팀',
    status: '완료',
    assignee: '정우진',

    completedDate: '2023-08-20',
    attachments: ['segment_analysis.xlsx', 'customer_profile.pdf']
  },
  {
    id: 15,
    no: 1,
    registrationDate: '2023-07-15',
    startDate: '2023-07-20',
    code: 'SOL-23-005',
    solutionType: '인프라구축',
    developmentType: '신규개발',
    detailContent: '클라우드 인프라 구축',
    team: '개발팀',
    status: '완료',
    assignee: '신동욱',

    completedDate: '2023-07-10',
    attachments: ['infrastructure_design.pdf', 'deployment_guide.md']
  }
];

// 상태별 색상 매핑
export const statusColors = {
  대기: 'warning',
  진행: 'info',
  완료: 'success',
  홀딩: 'error'
} as const;

// 팀별 색상 매핑
export const teamColors = {
  개발팀: 'primary',
  디자인팀: 'secondary',
  기획팀: 'info',
  마케팅팀: 'success'
} as const;

// 부서별 색상 매핑
export const departmentColors = {
  IT: 'primary',
  기획: 'secondary'
} as const;

// 팀 목록
export const teams = ['개발팀', '디자인팀', '기획팀', '마케팅팀'] as const;

// 상태 옵션 목록
export const solutionStatusOptions = ['대기', '진행', '완료', '홀딩'] as const;

// 상태별 색상 매핑 (SolutionTable에서 사용)
export const solutionStatusColors = statusColors;
