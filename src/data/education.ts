import { EducationData, EducationStatus, EducationRequestType } from 'types/education';

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

// 샘플 Education 데이터
export const educationData: EducationData[] = [
  // 2025년 데이터
  {
    id: 1,
    no: 20,
    registrationDate: '2025-01-15',
    startDate: '2025-01-18',
    code: 'MAIN-EDU-25-001',
    requestType: '기능개선',
    requestDepartment: '영업팀',
    requester: '홍길동',
    requestContent: 'CRM 시스템에 고객 등급별 알림 기능을 추가해주세요',
    actionContent: '고객 등급 분류 및 알림 모듈 개발 진행 중입니다',
    status: '진행중',
    team: '개발팀',
    assignee: '김민수',
    completedDate: '',
    attachments: ['crm_spec.pdf', 'notification_design.png']
  },
  {
    id: 2,
    no: 19,
    registrationDate: '2025-01-12',
    startDate: '2025-01-15',
    code: 'MAIN-EDU-25-002',
    requestType: '오류신고',
    requestDepartment: '회계팀',
    requester: '김영희',
    requestContent: '전자세금계산서 발행 시 금액 계산 오류가 발생합니다',
    actionContent: '세금계산 로직 검토 및 수정 완료',
    status: '완료',
    team: '개발팀',
    assignee: '이영희',
    completedDate: '2025-01-20',
    attachments: ['tax_error_log.xlsx', 'fix_report.pdf']
  },
  {
    id: 3,
    no: 18,
    registrationDate: '2025-01-08',
    startDate: '2025-01-10',
    code: 'MAIN-EDU-25-003',
    requestType: '문의',
    requestDepartment: '마케팅팀',
    requester: '박철수',
    requestContent: '월별 매출 통계 데이터를 Excel로 추출하는 방법을 알려주세요',
    actionContent: '데이터 추출 매뉴얼 작성 및 교육 실시 완료',
    status: '완료',
    team: '기획팀',
    assignee: '박지훈',
    completedDate: '2025-01-12',
    attachments: ['export_manual.pdf', 'training_video.mp4']
  },
  {
    id: 4,
    no: 17,
    registrationDate: '2025-01-05',
    startDate: '2025-02-01',
    code: 'MAIN-EDU-25-004',
    requestType: '기능개선',
    requestDepartment: 'HR팀',
    requester: '최민정',
    requestContent: '직원 근태관리 시스템의 모바일 접근성을 개선해주세요',
    actionContent: '모바일 UI 개선안 검토 중입니다',
    status: '접수',
    team: '디자인팀',
    assignee: '최수진',
    completedDate: '',
    attachments: ['mobile_feedback.pdf', 'accessibility_guide.docx']
  },
  {
    id: 5,
    no: 16,
    registrationDate: '2025-01-03',
    startDate: '2025-02-15',
    code: 'MAIN-EDU-25-005',
    requestType: '오류신고',
    requestDepartment: '구매팀',
    requester: '정우진',
    requestContent: '구매요청 승인 프로세스에서 메일 알림이 오지 않습니다',
    actionContent: '메일 서버 점검 예정',
    status: '보류',
    team: '개발팀',
    assignee: '정우진',
    completedDate: '',
    attachments: ['mail_log.txt']
  },
  {
    id: 6,
    no: 15,
    registrationDate: '2025-01-02',
    startDate: '2025-01-25',
    code: 'MAIN-EDU-25-006',
    requestType: '기능개선',
    requestDepartment: '고객서비스팀',
    requester: '한나라',
    requestContent: '고객 문의 티켓 시스템에 우선순위 설정 기능을 추가해주세요',
    actionContent: '티켓 우선순위 로직 설계 중',
    status: '진행중',
    team: '개발팀',
    assignee: '한나라',
    completedDate: '',
    attachments: ['ticket_priority_spec.pdf']
  },
  {
    id: 7,
    no: 14,
    registrationDate: '2024-12-28',
    startDate: '2025-01-05',
    code: 'MAIN-EDU-24-014',
    requestType: '문의',
    requestDepartment: '법무팀',
    requester: '신동욱',
    requestContent: '계약서 관리 시스템의 버전 관리 기능 사용법을 알려주세요',
    actionContent: '계약서 버전 관리 가이드 제공',
    status: '완료',
    team: '기획팀',
    assignee: '신동욱',
    completedDate: '2025-01-08',
    attachments: ['version_control_guide.pdf']
  },

  // 2024년 데이터
  {
    id: 8,
    no: 13,
    registrationDate: '2024-12-20',
    startDate: '2024-12-22',
    code: 'MAIN-EDU-24-013',
    requestType: '오류신고',
    requestDepartment: '영업팀',
    requester: '오세영',
    requestContent: '견적서 생성 시 할인율 계산이 잘못되어 나옵니다',
    actionContent: '할인율 계산 로직 수정 및 테스트 완료',
    status: '완료',
    team: '개발팀',
    assignee: '오세영',
    completedDate: '2024-12-25',
    attachments: ['discount_fix.sql', 'test_result.xlsx']
  },
  {
    id: 9,
    no: 12,
    registrationDate: '2024-12-18',
    startDate: '2024-12-20',
    code: 'MAIN-EDU-24-012',
    requestType: '기능개선',
    requestDepartment: '기획팀',
    requester: '김태현',
    requestContent: '프로젝트 관리 시스템에 간트차트 기능을 추가해주세요',
    actionContent: '간트차트 라이브러리 검토 및 구현 완료',
    status: '완료',
    team: '개발팀',
    assignee: '김민수',
    completedDate: '2024-12-30',
    attachments: ['gantt_chart.js', 'implementation_guide.pdf']
  },
  {
    id: 10,
    no: 11,
    registrationDate: '2024-12-15',
    startDate: '2024-12-18',
    code: 'MAIN-EDU-24-011',
    requestType: '문의',
    requestDepartment: '회계팀',
    requester: '이수진',
    requestContent: '월별 손익계산서 자동생성 기능 사용 방법을 알려주세요',
    actionContent: '자동생성 기능 매뉴얼 제공 및 개별 교육 실시',
    status: '완료',
    team: '기획팀',
    assignee: '박지훈',
    completedDate: '2024-12-20',
    attachments: ['pl_auto_manual.pdf', 'training_record.docx']
  },
  {
    id: 11,
    no: 10,
    registrationDate: '2024-12-10',
    startDate: '2024-11-15',
    code: 'MAIN-EDU-24-010',
    requestType: '기능개선',
    requestDepartment: 'IT팀',
    requester: '박민호',
    requestContent: '시스템 로그 모니터링 대시보드에 실시간 알람 기능을 추가해주세요',
    actionContent: '실시간 알람 시스템 구축 완료',
    status: '완료',
    team: '개발팀',
    assignee: '이영희',
    completedDate: '2024-12-15',
    attachments: ['alarm_system.py', 'monitoring_dashboard.html']
  },
  {
    id: 12,
    no: 9,
    registrationDate: '2024-12-08',
    startDate: '2024-10-20',
    code: 'MAIN-EDU-24-009',
    requestType: '오류신고',
    requestDepartment: '제조팀',
    requester: '최영수',
    requestContent: '생산계획 시스템에서 자재 소요량 계산이 부정확합니다',
    actionContent: 'BOM 계산 알고리즘 수정 및 검증 완료',
    status: '완료',
    team: '개발팀',
    assignee: '최수진',
    completedDate: '2024-12-12',
    attachments: ['bom_calculation.xlsx', 'algorithm_fix.sql']
  },
  {
    id: 13,
    no: 8,
    registrationDate: '2024-12-05',
    startDate: '2024-09-15',
    code: 'MAIN-EDU-24-008',
    requestType: '문의',
    requestDepartment: '품질팀',
    requester: '김혜진',
    requestContent: '품질검사 결과를 Excel로 일괄 다운로드하는 방법을 알려주세요',
    actionContent: '일괄 다운로드 기능 개발 및 사용법 안내',
    status: '완료',
    team: '기획팀',
    assignee: '정우진',
    completedDate: '2024-12-08',
    attachments: ['batch_download.pdf', 'quality_export_guide.docx']
  },
  {
    id: 14,
    no: 7,
    registrationDate: '2024-11-28',
    startDate: '2024-08-10',
    code: 'MAIN-EDU-24-007',
    requestType: '기능개선',
    requestDepartment: '물류팀',
    requester: '이재훈',
    requestContent: '재고관리 시스템에 안전재고 알림 기능을 추가해주세요',
    actionContent: '안전재고 알림 모듈 개발 완료',
    status: '완료',
    team: '개발팀',
    assignee: '한나라',
    completedDate: '2024-12-02',
    attachments: ['safety_stock_alert.js', 'inventory_notification.pdf']
  },
  {
    id: 15,
    no: 6,
    registrationDate: '2024-11-25',
    startDate: '2024-07-20',
    code: 'MAIN-EDU-24-006',
    requestType: '기타',
    requestDepartment: '총무팀',
    requester: '정현우',
    requestContent: '사내 시설 예약 시스템 사용자 매뉴얼을 업데이트해주세요',
    actionContent: '최신 기능 반영한 매뉴얼 업데이트 완료',
    status: '완료',
    team: '기획팀',
    assignee: '신동욱',
    completedDate: '2024-11-30',
    attachments: ['facility_manual_v2.pdf', 'feature_update_log.txt']
  }
];

// 상태별 색상 매핑
const statusColors = {
  접수: '#FFF3E0',
  진행중: '#E3F2FD',
  완료: '#E8F5E8',
  보류: '#FCE4EC'
} as const;

// 팀 색상 매핑
const teamColors = {
  개발팀: 'primary',
  디자인팀: 'secondary',
  기획팀: 'info',
  마케팅팀: 'warning'
} as const;

// 요청유형 색상 매핑
const requestTypeColors = {
  기능개선: 'primary',
  오류신고: 'error',
  문의: 'info',
  기타: 'secondary'
} as const;

// 팀 목록
export const teams = ['개발팀', '디자인팀', '기획팀', '마케팅팀'] as const;

// 상태 옵션 목록
export const educationStatusOptions = ['접수', '진행중', '완료', '보류'] as const;

// 요청유형 옵션 목록
export const requestTypeOptions = ['기능개선', '오류신고', '문의', '기타'] as const;

// 상태별 색상 매핑 (EducationDataTable에서 사용)
export const educationStatusColors = statusColors;

// 팀별 색상 매핑
export const educationTeamColors = teamColors;

// 요청유형별 색상 매핑
export const educationRequestTypeColors = requestTypeColors;
