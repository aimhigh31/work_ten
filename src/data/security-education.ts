import { SecurityEducationData } from 'types/security-education';

// 샘플 담당자 목록
export const assignees = ['김민수', '이영희', '박지훈', '최수진', '정우진', '한나라', '신동욱', '오세영'];

// 담당자별 아바타 정보 (각 사용자마다 고유한 아바타 매핑)
export const assigneeAvatars = {
  김민수: '/assets/images/users/avatar-1.png',
  이영희: '/assets/images/users/avatar-2.png',
  박지훈: '/assets/images/users/avatar-3.png',
  최수진: '/assets/images/users/avatar-4.png',
  정우진: '/assets/images/users/avatar-5.png',
  한나라: '/assets/images/users/avatar-6.png',
  신동욱: '/assets/images/users/avatar-7.png',
  오세영: '/assets/images/users/avatar-8.png',
  안개식: '/assets/images/users/avatar-9.png'
} as const;

// 샘플 보안교육 데이터
export const securityEducationData: SecurityEducationData[] = [
  // 2025년 데이터
  {
    id: 1,
    no: 15,
    registrationDate: '2025-01-15',
    code: 'SEC-25-001',
    educationType: '온라인',
    educationName: '정보보안 인식제고 교육',
    description: '전 직원을 대상으로 하는 정보보안 인식제고 교육입니다. 최신 보안 위협과 대응 방안에 대해 다룹니다.',
    location: 'Zoom 온라인',
    attendeeCount: 11,
    executionDate: '2025-02-01',
    status: '대기',
    assignee: '김민수'
  },
  {
    id: 2,
    no: 14,
    registrationDate: '2025-01-10',
    code: 'SEC-25-002',
    educationType: '오프라인',
    educationName: '개인정보보호법 준수 교육',
    description: '개인정보보호법의 핵심 내용과 회사 내 개인정보 처리 절차에 대한 교육입니다.',
    location: '교육실 A',
    attendeeCount: 11,
    executionDate: '2025-01-25',
    status: '진행',
    assignee: '이영희'
  },
  {
    id: 3,
    no: 13,
    registrationDate: '2025-01-08',
    code: 'SEC-25-003',
    educationType: '혼합',
    educationName: '피싱 메일 대응 훈련',
    description: '실제 피싱 메일 사례를 통한 대응 훈련 및 예방 방법에 대한 실습 교육입니다.',
    location: '교육실 B / Zoom',
    attendeeCount: 11,
    executionDate: '2025-01-30',
    status: '진행',
    assignee: '박지훈'
  },

  // 2024년 데이터
  {
    id: 4,
    no: 12,
    registrationDate: '2024-12-20',
    code: 'SEC-24-001',
    educationType: '세미나',
    educationName: '보안사고 대응 절차 교육',
    location: '대강당',
    attendeeCount: 11,
    executionDate: '2024-12-25',
    status: '완료',
    assignee: '최수진'
  },
  {
    id: 5,
    no: 11,
    registrationDate: '2024-12-18',
    code: 'SEC-24-002',
    educationType: '워크샵',
    educationName: '암호화 기술 적용 워크샵',
    location: '실습실 1',
    attendeeCount: 11,
    executionDate: '2024-12-20',
    status: '완료',
    assignee: '정우진'
  },
  {
    id: 6,
    no: 10,
    registrationDate: '2024-12-10',
    code: 'SEC-24-003',
    educationType: '온라인',
    educationName: '보안 위협 동향 분석',
    location: 'Teams 온라인',
    attendeeCount: 11,
    executionDate: '2024-12-15',
    status: '홀딩',
    assignee: '한나라'
  },
  {
    id: 7,
    no: 9,
    registrationDate: '2024-11-25',
    code: 'SEC-24-004',
    educationType: '오프라인',
    educationName: '네트워크 보안 강화 교육',
    location: '교육실 C',
    attendeeCount: 11,
    executionDate: '2024-12-01',
    status: '완료',
    assignee: '신동욱'
  },
  {
    id: 8,
    no: 8,
    registrationDate: '2024-11-15',
    code: 'SEC-24-005',
    educationType: '혼합',
    educationName: '보안 코딩 가이드라인',
    location: '교육실 A / 온라인',
    attendeeCount: 11,
    executionDate: '2024-11-20',
    status: '완료',
    assignee: '오세영'
  },
  {
    id: 9,
    no: 7,
    registrationDate: '2024-10-20',
    code: 'SEC-24-006',
    educationType: '세미나',
    educationName: '클라우드 보안 아키텍처',
    location: '중강당',
    attendeeCount: 11,
    executionDate: '2024-10-25',
    status: '완료',
    assignee: '김민수'
  },
  {
    id: 10,
    no: 6,
    registrationDate: '2024-09-30',
    code: 'SEC-24-007',
    educationType: '워크샵',
    educationName: '웹 애플리케이션 보안 점검',
    location: '실습실 2',
    attendeeCount: 11,
    executionDate: '2024-10-05',
    status: '완료',
    assignee: '이영희'
  },

  // 2023년 데이터
  {
    id: 11,
    no: 5,
    registrationDate: '2023-12-15',
    code: 'SEC-23-001',
    educationType: '온라인',
    educationName: 'ISMS-P 인증 준비 교육',
    location: 'Zoom 온라인',
    attendeeCount: 22,
    executionDate: '2023-12-20',
    status: '완료',
    assignee: '박지훈'
  },
  {
    id: 12,
    no: 4,
    registrationDate: '2023-11-20',
    code: 'SEC-23-002',
    educationType: '오프라인',
    educationName: '침입차단시스템 관리 교육',
    location: '교육실 B',
    attendeeCount: 16,
    executionDate: '2023-11-25',
    status: '완료',
    assignee: '최수진'
  },
  {
    id: 13,
    no: 3,
    registrationDate: '2023-10-10',
    code: 'SEC-23-003',
    educationType: '세미나',
    educationName: '클라우드 보안 모니터링',
    location: '대강당',
    attendeeCount: 35,
    executionDate: '2023-10-15',
    status: '완료',
    assignee: '정우진'
  },
  {
    id: 14,
    no: 2,
    registrationDate: '2023-08-25',
    code: 'SEC-23-004',
    educationType: '혼합',
    educationName: 'API 보안 설계 가이드',
    location: '교육실 A / 온라인',
    attendeeCount: 14,
    executionDate: '2023-09-01',
    status: '완료',
    assignee: '한나라'
  },
  {
    id: 15,
    no: 1,
    registrationDate: '2023-07-15',
    code: 'SEC-23-005',
    educationType: '워크샵',
    educationName: '모바일 앱 보안 테스팅',
    location: '실습실 3',
    attendeeCount: 11,
    executionDate: '2023-07-20',
    status: '완료',
    assignee: '신동욱'
  }
];

// 상태별 색상 매핑
export const statusColors = {
  대기: 'warning',
  진행: 'info',
  완료: 'success',
  홀딩: 'error'
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
export const securityEducationStatusOptions = ['대기', '진행', '완료', '홀딩'] as const;

// 교육유형 옵션 목록
export const educationTypeOptions = ['온라인', '오프라인', '혼합', '세미나', '워크샵'] as const;

// 상태별 색상 매핑 (테이블에서 사용)
export const securityEducationStatusColors = statusColors;
