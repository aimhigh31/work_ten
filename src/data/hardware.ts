import { HardwareData } from 'types/hardware';

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

// 샘플 Hardware 데이터 (하드웨어 관리용)
export const hardwareData: HardwareData[] = [
  // 2025년 데이터
  {
    id: 1,
    no: 15,
    registrationDate: '2025-01-15',
    code: 'HW-25-001',
    team: '개발팀',
    department: 'IT',
    workContent: 'Dell OptiPlex 3090',
    status: '사용',
    assignee: '김민수',
    startDate: '2025-01-15',
    completedDate: '',
    attachments: ['hardware_spec.pdf'],
    assetCategory: '데스크톱',
    assetName: 'Dell OptiPlex 3090',
    location: 'IT실-A101',
    currentUser: '김민수'
  },
  {
    id: 2,
    no: 14,
    registrationDate: '2025-01-10',
    code: 'HW-25-002',
    team: '디자인팀',
    department: 'IT',
    workContent: 'MacBook Pro 14인치',
    status: '사용',
    assignee: '이영희',
    startDate: '2025-01-10',
    completedDate: '',
    attachments: ['macbook_spec.pdf'],
    assetCategory: '노트북',
    assetName: 'MacBook Pro 14인치',
    location: '디자인실-B203',
    currentUser: '이영희'
  },
  {
    id: 3,
    no: 13,
    registrationDate: '2025-01-08',
    code: 'HW-25-003',
    team: '기획팀',
    department: '기획',
    workContent: 'HP LaserJet Pro M404n',
    status: '예비',
    assignee: '최수진',
    startDate: '2025-01-08',
    completedDate: '',
    attachments: ['printer_manual.pdf'],
    assetCategory: '프린터',
    assetName: 'HP LaserJet Pro M404n',
    location: '사무실-공용',
    currentUser: '공용장비'
  },

  // 2024년 데이터
  {
    id: 4,
    no: 12,
    registrationDate: '2024-12-20',
    code: 'HW-24-001',
    team: '개발팀',
    department: 'IT',
    workContent: 'LG 모니터 27인치',
    status: '사용',
    assignee: '박지훈',
    startDate: '2024-12-20',
    completedDate: '',
    attachments: ['monitor_spec.pdf'],
    assetCategory: '모니터',
    assetName: 'LG 27GL850-B',
    location: 'IT실-A102',
    currentUser: '박지훈'
  },
  {
    id: 5,
    no: 11,
    registrationDate: '2024-12-18',
    code: 'HW-24-002',
    team: '마케팅팀',
    department: 'IT',
    workContent: 'HP EliteBook 850',
    status: '수리',
    assignee: '한나라',
    startDate: '2024-12-18',
    completedDate: '',
    attachments: ['repair_request.pdf'],
    assetCategory: '노트북',
    assetName: 'HP EliteBook 850 G8',
    location: '수리센터',
    currentUser: '수리중'
  },
  {
    id: 6,
    no: 10,
    registrationDate: '2024-12-10',
    code: 'TASK-24-003',
    team: '개발팀',
    department: 'IT',
    workContent: '보안 강화 시스템',
    status: '홀딩',
    assignee: '정우진',
    startDate: '2024-10-01',
    completedDate: '',
    attachments: ['security_audit.pdf']
  },
  {
    id: 7,
    no: 9,
    registrationDate: '2024-11-25',
    code: 'TASK-24-004',
    team: '디자인팀',
    department: '기획',
    workContent: '브랜딩 가이드라인 개선',
    status: '완료',
    assignee: '신동욱',
    startDate: '2024-09-01',
    completedDate: '2024-11-30',
    attachments: ['brand_guide_v2.pdf', 'color_palette.ai']
  },
  {
    id: 8,
    no: 8,
    registrationDate: '2024-11-15',
    code: 'TASK-24-005',
    team: '기획팀',
    department: '기획',
    workContent: '사용자 피드백 분석',
    status: '완료',
    assignee: '오세영',
    startDate: '2024-08-15',
    completedDate: '2024-11-10',
    attachments: ['feedback_analysis.xlsx', 'user_survey.pdf']
  },
  {
    id: 9,
    no: 7,
    registrationDate: '2024-10-20',
    code: 'TASK-24-006',
    team: '개발팀',
    department: 'IT',
    workContent: '모바일 앱 성능 최적화',
    status: '완료',
    assignee: '김민수',
    startDate: '2024-07-01',
    completedDate: '2024-10-15',
    attachments: ['performance_metrics.xlsx']
  },
  {
    id: 10,
    no: 6,
    registrationDate: '2024-09-30',
    code: 'TASK-24-007',
    team: '마케팅팀',
    department: '기획',
    workContent: 'Q4 마케팅 전략',
    status: '완료',
    assignee: '이영희',
    startDate: '2024-06-01',
    completedDate: '2024-09-25',
    attachments: ['q4_strategy.pptx', 'market_research.pdf']
  },

  // 2023년 데이터
  {
    id: 11,
    no: 5,
    registrationDate: '2023-12-15',
    code: 'TASK-23-001',
    team: '개발팀',
    department: 'IT',
    workContent: '레거시 시스템 마이그레이션',
    status: '완료',
    assignee: '박지훈',
    startDate: '2023-08-01',
    completedDate: '2023-12-10',
    attachments: ['migration_plan.pdf', 'test_results.xlsx']
  },
  {
    id: 12,
    no: 4,
    registrationDate: '2023-11-20',
    code: 'TASK-23-002',
    team: '디자인팀',
    department: '기획',
    workContent: 'UI 컴포넌트 라이브러리',
    status: '완료',
    assignee: '최수진',
    startDate: '2023-06-15',
    completedDate: '2023-11-15',
    attachments: ['component_lib.figma', 'style_guide.pdf']
  },
  {
    id: 13,
    no: 3,
    registrationDate: '2023-10-10',
    code: 'TASK-23-003',
    team: '기획팀',
    department: '기획',
    workContent: '비즈니스 프로세스 개선',
    status: '완료',
    assignee: '한나라',
    startDate: '2023-04-01',
    completedDate: '2023-10-05',
    attachments: ['process_map.pdf', 'improvement_plan.docx']
  },
  {
    id: 14,
    no: 2,
    registrationDate: '2023-08-25',
    code: 'TASK-23-004',
    team: '마케팅팀',
    department: '기획',
    workContent: '고객 세그먼테이션 분석',
    status: '완료',
    assignee: '정우진',
    startDate: '2023-03-01',
    completedDate: '2023-08-20',
    attachments: ['segment_analysis.xlsx', 'customer_profile.pdf']
  },
  {
    id: 15,
    no: 1,
    registrationDate: '2023-07-15',
    code: 'TASK-23-005',
    team: '개발팀',
    department: 'IT',
    workContent: '클라우드 인프라 구축',
    status: '완료',
    assignee: '신동욱',
    startDate: '2023-01-15',
    completedDate: '2023-07-10',
    attachments: ['infrastructure_design.pdf', 'deployment_guide.md']
  }
];

// 하드웨어 상태별 색상 매핑
export const statusColors = {
  사용: 'success',
  예비: 'info',
  수리: 'warning',
  불량: 'error',
  폐기: 'default'
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
export const hardwareStatusOptions = ['사용', '예비', '수리', '불량', '폐기'] as const;

// 상태별 색상 매핑 (TaskTable에서 사용)
export const hardwareStatusColors = statusColors;
