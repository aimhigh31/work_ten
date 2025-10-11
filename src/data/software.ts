import { TaskData } from 'types/task';

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

// 소프트웨어 샘플 데이터
export const taskData: TaskData[] = [
  // 2025년 데이터
  {
    id: 1,
    no: 15,
    registrationDate: '2025-01-15',
    code: 'SW-25-001',
    team: '개발팀',
    department: 'IT',
    workContent: 'Microsoft Office 365 Business Premium',
    softwareName: 'Microsoft Office 365',
    description: '업무용 오피스 소프트웨어 패키지',
    softwareCategory: '오피스',
    spec: 'Business Premium 라이선스 50개',
    currentUser: '전 직원',
    solutionProvider: 'Microsoft',
    userCount: 50,
    licenseType: '연간구독',
    licenseKey: 'XXXXX-XXXXX-XXXXX-XXXXX',
    status: '사용중',
    assignee: '김민수',
    startDate: '2025-01-01',
    completedDate: '',
    attachments: ['license_agreement.pdf', 'user_guide.pdf']
  },
  {
    id: 2,
    no: 14,
    registrationDate: '2025-01-10',
    code: 'SW-25-002',
    team: '디자인팀',
    department: '기획',
    workContent: 'Adobe Creative Suite',
    softwareName: 'Adobe Creative Suite',
    description: '디자인 및 크리에이티브 작업용 소프트웨어',
    softwareCategory: '디자인',
    spec: 'All Apps 라이선스 10개',
    currentUser: '디자인팀',
    solutionProvider: 'Adobe',
    userCount: 10,
    licenseType: '연간구독',
    licenseKey: 'ADOBE-XXXXX-XXXXX-XXXXX',
    status: '사용중',
    assignee: '이영희',
    startDate: '2025-01-05',
    completedDate: '',
    attachments: ['adobe_license.pdf', 'installation_guide.pdf']
  },
  {
    id: 3,
    no: 13,
    registrationDate: '2025-01-08',
    code: 'SW-25-003',
    team: '기획팀',
    department: '기획',
    workContent: 'Notion Team Workspace',
    softwareName: 'Notion',
    description: '협업 및 문서 작성 플랫폼',
    softwareCategory: '협업도구',
    spec: 'Team 플랜 무제한 사용자',
    currentUser: '전 직원',
    solutionProvider: 'Notion Labs',
    userCount: 50,
    licenseType: '연간구독',
    licenseKey: 'NOTION-TEAM-XXXXX',
    status: '대기',
    assignee: '최수진',
    startDate: '2025-01-01',
    completedDate: '',
    attachments: ['notion_setup.pdf']
  },

  // 2024년 데이터
  {
    id: 4,
    no: 12,
    registrationDate: '2024-12-20',
    code: 'SW-24-001',
    team: '개발팀',
    department: 'IT',
    workContent: 'Visual Studio Professional',
    softwareName: 'Visual Studio Professional',
    description: '통합 개발 환경 (IDE)',
    softwareCategory: '개발도구',
    spec: 'Professional 라이선스 15개',
    currentUser: '개발팀',
    solutionProvider: 'Microsoft',
    userCount: 15,
    licenseType: '영구라이선스',
    licenseKey: 'VS-PROF-XXXXX-XXXXX',
    status: '사용만료',
    assignee: '박지훈',
    startDate: '2024-01-01',
    completedDate: '2024-12-31',
    attachments: ['vs_license.pdf', 'installation_log.txt']
  },
  {
    id: 5,
    no: 11,
    registrationDate: '2024-12-18',
    code: 'SW-24-002',
    team: '마케팅팀',
    department: '기획',
    workContent: 'HubSpot Marketing Hub',
    softwareName: 'HubSpot Marketing',
    description: '마케팅 자동화 플랫폼',
    softwareCategory: '마케팅',
    spec: 'Professional 플랜',
    currentUser: '마케팅팀',
    solutionProvider: 'HubSpot',
    userCount: 5,
    licenseType: '연간구독',
    licenseKey: 'HUBSPOT-MKT-XXXXX',
    status: '사용중',
    assignee: '한나라',
    startDate: '2024-01-01',
    completedDate: '',
    attachments: ['hubspot_setup.pdf', 'training_materials.pdf']
  },
  {
    id: 6,
    no: 10,
    registrationDate: '2024-12-10',
    code: 'SW-24-003',
    team: '개발팀',
    department: 'IT',
    workContent: 'IntelliJ IDEA Ultimate',
    softwareName: 'IntelliJ IDEA Ultimate',
    description: 'Java 통합 개발 환경',
    softwareCategory: '개발도구',
    spec: 'Ultimate Edition 라이선스 8개',
    currentUser: '개발팀',
    solutionProvider: 'JetBrains',
    userCount: 8,
    licenseType: '연간구독',
    licenseKey: 'INTELLIJ-ULT-XXXXX',
    status: '폐기',
    assignee: '정우진',
    startDate: '2024-01-01',
    completedDate: '',
    attachments: ['intellij_license.pdf']
  },
  {
    id: 7,
    no: 9,
    registrationDate: '2024-11-25',
    code: 'SW-24-004',
    team: '디자인팀',
    department: '기획',
    workContent: 'Figma Professional',
    softwareName: 'Figma Professional',
    description: 'UI/UX 디자인 협업 도구',
    softwareCategory: '디자인',
    spec: 'Professional 플랜 10개 에디터',
    currentUser: '디자인팀',
    solutionProvider: 'Figma',
    userCount: 10,
    licenseType: '연간구독',
    licenseKey: 'FIGMA-PRO-XXXXX',
    status: '사용중',
    assignee: '신동욱',
    startDate: '2024-01-01',
    completedDate: '',
    attachments: ['figma_setup.pdf', 'team_guidelines.pdf']
  },
  {
    id: 8,
    no: 8,
    registrationDate: '2024-11-15',
    code: 'SW-24-005',
    team: '기획팀',
    department: '기획',
    workContent: 'Jira Software Premium',
    softwareName: 'Jira Software',
    description: '프로젝트 관리 및 이슈 트래킹',
    softwareCategory: '프로젝트관리',
    spec: 'Premium 플랜 30명',
    currentUser: '전 직원',
    solutionProvider: 'Atlassian',
    userCount: 30,
    licenseType: '연간구독',
    licenseKey: 'JIRA-PREM-XXXXX',
    status: '사용중',
    assignee: '오세영',
    startDate: '2024-01-01',
    completedDate: '',
    attachments: ['jira_config.pdf', 'workflow_setup.pdf']
  },
  {
    id: 9,
    no: 7,
    registrationDate: '2024-10-20',
    code: 'SW-24-006',
    team: '개발팀',
    department: 'IT',
    workContent: 'GitHub Enterprise',
    softwareName: 'GitHub Enterprise',
    description: '소스 코드 관리 및 협업 플랫폼',
    softwareCategory: '개발도구',
    spec: 'Enterprise Cloud 50명',
    currentUser: '개발팀',
    solutionProvider: 'GitHub',
    userCount: 20,
    licenseType: '연간구독',
    licenseKey: 'GITHUB-ENT-XXXXX',
    status: '사용중',
    assignee: '김민수',
    startDate: '2024-01-01',
    completedDate: '',
    attachments: ['github_setup.pdf']
  },
  {
    id: 10,
    no: 6,
    registrationDate: '2024-09-30',
    code: 'SW-24-007',
    team: '마케팅팀',
    department: '기획',
    workContent: 'Slack Business+',
    softwareName: 'Slack Business+',
    description: '팀 커뮤니케이션 및 협업 플랫폼',
    softwareCategory: '협업도구',
    spec: 'Business+ 플랜 50명',
    currentUser: '전 직원',
    solutionProvider: 'Slack',
    userCount: 50,
    licenseType: '연간구독',
    licenseKey: 'SLACK-BIZ-XXXXX',
    status: '사용중',
    assignee: '이영희',
    startDate: '2024-01-01',
    completedDate: '',
    attachments: ['slack_setup.pdf', 'workspace_config.pdf']
  },

  // 2023년 데이터
  {
    id: 11,
    no: 5,
    registrationDate: '2023-12-15',
    code: 'SW-23-001',
    team: '개발팀',
    department: 'IT',
    workContent: 'Docker Desktop Pro',
    softwareName: 'Docker Desktop',
    description: '컨테이너화 개발 플랫폼',
    softwareCategory: '개발도구',
    spec: 'Pro 라이선스 10개',
    currentUser: '개발팀',
    solutionProvider: 'Docker',
    userCount: 10,
    licenseType: '연간구독',
    licenseKey: 'DOCKER-PRO-XXXXX',
    status: '사용만료',
    assignee: '박지훈',
    startDate: '2023-01-01',
    completedDate: '2023-12-31',
    attachments: ['docker_license.pdf', 'usage_report.pdf']
  },
  {
    id: 12,
    no: 4,
    registrationDate: '2023-11-20',
    code: 'SW-23-002',
    team: '디자인팀',
    department: '기획',
    workContent: 'Sketch for Teams',
    softwareName: 'Sketch',
    description: '벡터 기반 UI/UX 디자인 도구',
    softwareCategory: '디자인',
    spec: 'Team 플랜 5개 에디터',
    currentUser: '디자인팀',
    solutionProvider: 'Sketch',
    userCount: 5,
    licenseType: '연간구독',
    licenseKey: 'SKETCH-TEAM-XXXXX',
    status: '사용만료',
    assignee: '최수진',
    startDate: '2023-01-01',
    completedDate: '2023-12-31',
    attachments: ['sketch_license.pdf', 'migration_guide.pdf']
  },
  {
    id: 13,
    no: 3,
    registrationDate: '2023-10-10',
    code: 'SW-23-003',
    team: '기획팀',
    department: '기획',
    workContent: 'Monday.com Pro',
    softwareName: 'Monday.com',
    description: '업무 관리 및 협업 플랫폼',
    softwareCategory: '프로젝트관리',
    spec: 'Pro 플랜 25명',
    currentUser: '기획팀',
    solutionProvider: 'Monday.com',
    userCount: 25,
    licenseType: '연간구독',
    licenseKey: 'MONDAY-PRO-XXXXX',
    status: '사용만료',
    assignee: '한나라',
    startDate: '2023-01-01',
    completedDate: '2023-12-31',
    attachments: ['monday_setup.pdf', 'workflow_templates.pdf']
  },
  {
    id: 14,
    no: 2,
    registrationDate: '2023-08-25',
    code: 'SW-23-004',
    team: '마케팅팀',
    department: '기획',
    workContent: 'Google Workspace Business',
    softwareName: 'Google Workspace',
    description: '클라우드 기반 오피스 스위트',
    softwareCategory: '오피스',
    spec: 'Business Standard 50명',
    currentUser: '전 직원',
    solutionProvider: 'Google',
    userCount: 50,
    licenseType: '연간구독',
    licenseKey: 'GOOGLE-WS-XXXXX',
    status: '사용만료',
    assignee: '정우진',
    startDate: '2023-01-01',
    completedDate: '2023-12-31',
    attachments: ['workspace_setup.pdf', 'migration_report.pdf']
  },
  {
    id: 15,
    no: 1,
    registrationDate: '2023-07-15',
    code: 'SW-23-005',
    team: '개발팀',
    department: 'IT',
    workContent: 'AWS Developer Support',
    softwareName: 'AWS Developer Support',
    description: '클라우드 개발자 기술 지원 서비스',
    softwareCategory: '클라우드',
    spec: 'Developer Support Plan',
    currentUser: '개발팀',
    solutionProvider: 'Amazon Web Services',
    userCount: 15,
    licenseType: '월간구독',
    licenseKey: 'AWS-DEV-XXXXX',
    status: '사용만료',
    assignee: '신동욱',
    startDate: '2023-01-01',
    completedDate: '2023-12-31',
    attachments: ['aws_support_plan.pdf', 'usage_analytics.pdf']
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

// 업무 상태 옵션 목록
export const taskStatusOptions = ['대기', '진행', '완료', '홀딩'] as const;

// 소프트웨어 상태 옵션 목록 (DB와 일치)
export const softwareStatusOptions = ['대기', '진행', '사용중', '사용만료', '폐기'] as const;

// 소프트웨어 상태별 색상 매핑
export const softwareStatusColors = {
  대기: 'default',
  진행: 'warning',
  사용중: 'info',
  사용만료: 'success',
  폐기: 'error'
} as const;

// 소프트웨어 카테고리 옵션
export const softwareCategoryOptions = ['오피스', '디자인', '개발도구', '협업도구', '마케팅', '프로젝트관리', '클라우드'] as const;

// 라이선스 유형 옵션
export const licenseTypeOptions = ['연간구독', '월간구독', '영구라이선스', '무료'] as const;

// 상태별 색상 매핑 (TaskTable에서 사용)
export const taskStatusColors = statusColors;
