import { ITEducationData } from 'types/it-education';

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

// 샘플 IT교육 데이터
export const itEducationData: ITEducationData[] = [
  // 2025년 데이터
  {
    id: 1,
    no: 15,
    registrationDate: '2025-01-15',
    code: 'EDU-25-001',
    educationType: '온라인',
    educationName: 'React 고급 개발 과정',
    location: 'Zoom 온라인',
    attendeeCount: 11,
    executionDate: '2025-02-01',
    status: '계획',
    assignee: '김민수'
  },
  {
    id: 2,
    no: 14,
    registrationDate: '2025-01-10',
    code: 'EDU-25-002',
    educationType: '오프라인',
    educationName: 'Node.js 백엔드 개발',
    location: '교육실 A',
    attendeeCount: 8,
    executionDate: '2025-01-25',
    status: '진행중',
    assignee: '이영희'
  },
  {
    id: 3,
    no: 13,
    registrationDate: '2025-01-08',
    code: 'EDU-25-003',
    educationType: '혼합',
    educationName: 'AWS 클라우드 아키텍처',
    location: '교육실 B / Zoom',
    attendeeCount: 15,
    executionDate: '2025-01-30',
    status: '진행중',
    assignee: '박지훈'
  },

  // 2024년 데이터
  {
    id: 4,
    no: 12,
    registrationDate: '2024-12-20',
    code: 'EDU-24-001',
    educationType: '세미나',
    educationName: 'AI/ML 트렌드 세미나',
    location: '대강당',
    attendeeCount: 42,
    executionDate: '2024-12-25',
    status: '완료',
    assignee: '최수진'
  },
  {
    id: 5,
    no: 11,
    registrationDate: '2024-12-18',
    code: 'EDU-24-002',
    educationType: '워크샵',
    educationName: 'DevOps 실무 워크샵',
    location: '실습실 1',
    attendeeCount: 6,
    executionDate: '2024-12-20',
    status: '완료',
    assignee: '정우진'
  },
  {
    id: 6,
    no: 10,
    registrationDate: '2024-12-10',
    code: 'EDU-24-003',
    educationType: '온라인',
    educationName: 'Python 데이터 분석',
    location: 'Teams 온라인',
    attendeeCount: 0,
    executionDate: '2024-12-15',
    status: '취소',
    assignee: '한나라'
  },
  {
    id: 7,
    no: 9,
    registrationDate: '2024-11-25',
    code: 'EDU-24-004',
    educationType: '오프라인',
    educationName: 'Docker & Kubernetes',
    location: '교육실 C',
    attendeeCount: 14,
    executionDate: '2024-12-01',
    status: '완료',
    assignee: '신동욱'
  },
  {
    id: 8,
    no: 8,
    registrationDate: '2024-11-15',
    code: 'EDU-24-005',
    educationType: '혼합',
    educationName: '보안 코딩 가이드라인',
    location: '교육실 A / 온라인',
    attendeeCount: 24,
    executionDate: '2024-11-20',
    status: '완료',
    assignee: '오세영'
  },
  {
    id: 9,
    no: 7,
    registrationDate: '2024-10-20',
    code: 'EDU-24-006',
    educationType: '세미나',
    educationName: '마이크로서비스 아키텍처',
    location: '중강당',
    attendeeCount: 35,
    executionDate: '2024-10-25',
    status: '완료',
    assignee: '김민수'
  },
  {
    id: 10,
    no: 6,
    registrationDate: '2024-09-30',
    code: 'EDU-24-007',
    educationType: '워크샵',
    educationName: 'Vue.js 실전 프로젝트',
    location: '실습실 2',
    attendeeCount: 8,
    executionDate: '2024-10-05',
    status: '완료',
    assignee: '이영희'
  },

  // 2023년 데이터
  {
    id: 11,
    no: 5,
    registrationDate: '2023-12-15',
    code: 'EDU-23-001',
    educationType: '온라인',
    educationName: 'TypeScript 마스터 클래스',
    location: 'Zoom 온라인',
    attendeeCount: 18,
    executionDate: '2023-12-20',
    status: '완료',
    assignee: '박지훈'
  },
  {
    id: 12,
    no: 4,
    registrationDate: '2023-11-20',
    code: 'EDU-23-002',
    educationType: '오프라인',
    educationName: 'Spring Boot 심화 과정',
    location: '교육실 B',
    attendeeCount: 12,
    executionDate: '2023-11-25',
    status: '완료',
    assignee: '최수진'
  },
  {
    id: 13,
    no: 3,
    registrationDate: '2023-10-10',
    code: 'EDU-23-003',
    educationType: '세미나',
    educationName: '클라우드 네이티브 개발',
    location: '대강당',
    attendeeCount: 28,
    executionDate: '2023-10-15',
    status: '완료',
    assignee: '정우진'
  },
  {
    id: 14,
    no: 2,
    registrationDate: '2023-08-25',
    code: 'EDU-23-004',
    educationType: '혼합',
    educationName: 'GraphQL API 설계',
    location: '교육실 A / 온라인',
    attendeeCount: 10,
    executionDate: '2023-09-01',
    status: '완료',
    assignee: '한나라'
  },
  {
    id: 15,
    no: 1,
    registrationDate: '2023-07-15',
    code: 'EDU-23-005',
    educationType: '워크샵',
    educationName: '모바일 앱 개발 기초',
    location: '실습실 3',
    attendeeCount: 9,
    executionDate: '2023-07-20',
    status: '완료',
    assignee: '신동욱'
  }
];

// 상태별 색상 매핑
export const statusColors = {
  계획: 'warning',
  진행중: 'info',
  완료: 'success',
  취소: 'error'
} as const;

// 교육유형별 색상 매핑
export const educationTypeColors = {
  온라인: 'primary',
  오프라인: 'secondary',
  혼합: 'info',
  세미나: 'success',
  워크샵: 'warning'
} as const;

// 교육유형 목록 (팀 필터에서 사용)
export const teams = ['온라인', '오프라인', '혼합', '세미나', '워크샵'] as const;

// 상태 옵션 목록
export const itEducationStatusOptions = ['계획', '진행중', '완료', '취소'] as const;

// 교육유형 옵션 목록
export const educationTypeOptions = ['온라인', '오프라인', '혼합', '세미나', '워크샵'] as const;

// 상태별 색상 매핑 (테이블에서 사용)
export const itEducationStatusColors = statusColors;
