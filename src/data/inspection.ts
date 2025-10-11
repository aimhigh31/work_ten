import { InspectionData } from 'types/inspection';

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

// 점검 유형 옵션
export const inspectionTypeOptions = ['보안점검', '취약점점검', '침투테스트', '컴플라이언스점검'] as const;

// 점검 대상 옵션
export const inspectionTargetOptions = ['고객사', '내부', '파트너사'] as const;

// 점검 유형별 색상 매핑
export const inspectionTypeColors = {
  보안점검: 'primary',
  취약점점검: 'warning',
  침투테스트: 'error',
  컴플라이언스점검: 'info'
} as const;

// 점검 대상별 색상 매핑
export const inspectionTargetColors = {
  고객사: 'primary',
  내부: 'secondary',
  파트너사: 'info'
} as const;

// 샘플 Inspection 데이터
export const inspectionData: InspectionData[] = [
  // 2025년 데이터
  {
    id: 1,
    no: 15,
    registrationDate: '2025-01-15',
    code: 'SEC-25-001',
    inspectionType: '보안점검',
    inspectionTarget: '고객사',
    inspectionContent: '방화벽 보안 점검',
    team: '개발팀',
    assignee: '김민수',
    status: '대기',
    inspectionDate: '2025-02-01',
    attachments: ['firewall_checklist.pdf', 'network_diagram.png']
  },
  {
    id: 2,
    no: 14,
    registrationDate: '2025-01-10',
    code: 'SEC-25-002',
    inspectionType: '취약점점검',
    inspectionTarget: '내부',
    inspectionContent: '서버 취약점 스캔',
    team: '개발팀',
    assignee: '이영희',
    status: '진행',
    inspectionDate: '2025-01-20',
    attachments: ['vulnerability_report.pdf', 'scan_results.xlsx']
  },
  {
    id: 3,
    no: 13,
    registrationDate: '2025-01-08',
    code: 'SEC-25-003',
    inspectionType: '침투테스트',
    inspectionTarget: '파트너사',
    inspectionContent: '웹 애플리케이션 침투테스트',
    team: '개발팀',
    assignee: '최수진',
    status: '진행',
    inspectionDate: '2025-01-15',
    attachments: ['pentest_plan.pdf', 'app_security.docx']
  },

  // 2024년 데이터
  {
    id: 4,
    no: 12,
    registrationDate: '2024-12-20',
    code: 'SEC-24-001',
    inspectionType: '컴플라이언스점검',
    inspectionTarget: '고객사',
    inspectionContent: 'ISMS-P 인증 점검',
    team: '기획팀',
    assignee: '박지훈',
    status: '완료',
    inspectionDate: '2024-12-15',
    attachments: ['isms_checklist.xlsx', 'compliance_report.pdf']
  },
  {
    id: 5,
    no: 11,
    registrationDate: '2024-12-18',
    code: 'SEC-24-002',
    inspectionType: '보안점검',
    inspectionTarget: '파트너사',
    inspectionContent: '출입통제시스템 점검',
    team: '기획팀',
    assignee: '한나라',
    status: '완료',
    inspectionDate: '2024-12-31',
    attachments: ['access_control_log.xlsx', 'physical_security_report.pdf']
  },
  {
    id: 6,
    no: 10,
    registrationDate: '2024-12-10',
    code: 'SEC-24-003',
    inspectionType: '취약점점검',
    inspectionTarget: '내부',
    inspectionContent: 'DDoS 방어시스템 점검',
    team: '개발팀',
    assignee: '정우진',
    status: '홀딩',
    inspectionDate: '2024-10-01',
    attachments: ['ddos_protection_audit.pdf']
  },
  {
    id: 7,
    no: 9,
    registrationDate: '2024-11-25',
    code: 'SEC-24-004',
    inspectionType: '침투테스트',
    inspectionTarget: '고객사',
    inspectionContent: '데이터베이스 보안 점검',
    team: '개발팀',
    assignee: '신동욱',
    status: '완료',
    inspectionDate: '2024-11-30',
    attachments: ['db_security_report.pdf', 'sql_injection_test.xlsx']
  },
  {
    id: 8,
    no: 8,
    registrationDate: '2024-11-15',
    code: 'SEC-24-005',
    inspectionType: '보안점검',
    inspectionTarget: '내부',
    inspectionContent: '모바일 앱 보안 점검',
    team: '개발팀',
    assignee: '오세영',
    status: '완료',
    inspectionDate: '2024-11-10',
    attachments: ['mobile_security_report.pdf', 'app_scan_results.xlsx']
  },
  {
    id: 9,
    no: 7,
    registrationDate: '2024-10-20',
    code: 'SEC-24-006',
    inspectionType: '컴플라이언스점검',
    inspectionTarget: '파트너사',
    inspectionContent: '개인정보보호 점검',
    team: '기획팀',
    assignee: '김민수',
    status: '완료',
    inspectionDate: '2024-10-15',
    attachments: ['privacy_audit.xlsx', 'gdpr_compliance.pdf']
  },
  {
    id: 10,
    no: 6,
    registrationDate: '2024-09-30',
    code: 'SEC-24-007',
    inspectionType: '취약점점검',
    inspectionTarget: '고객사',
    inspectionContent: 'API 보안 취약점 점검',
    team: '개발팀',
    assignee: '이영희',
    status: '완료',
    inspectionDate: '2024-09-25',
    attachments: ['api_security_scan.pdf', 'vulnerability_fix.docx']
  },

  // 2023년 데이터
  {
    id: 11,
    no: 5,
    registrationDate: '2023-12-15',
    code: 'SEC-23-001',
    inspectionType: '보안점검',
    inspectionTarget: '내부',
    inspectionContent: '인프라 보안 점검',
    team: '개발팀',
    assignee: '박지훈',
    status: '완료',
    inspectionDate: '2023-12-10',
    attachments: ['infra_security_audit.pdf', 'system_hardening.xlsx']
  },
  {
    id: 12,
    no: 4,
    registrationDate: '2023-11-20',
    code: 'SEC-23-002',
    inspectionType: '침투테스트',
    inspectionTarget: '파트너사',
    inspectionContent: '내부 네트워크 침투테스트',
    team: '개발팀',
    assignee: '최수진',
    status: '완료',
    inspectionDate: '2023-11-15',
    attachments: ['network_pentest.pdf', 'vulnerability_report.xlsx']
  },
  {
    id: 13,
    no: 3,
    registrationDate: '2023-10-10',
    code: 'SEC-23-003',
    inspectionType: '컴플라이언스점검',
    inspectionTarget: '내부',
    inspectionContent: 'ISO 27001 인증 점검',
    team: '기획팀',
    assignee: '한나라',
    status: '완료',
    inspectionDate: '2023-10-05',
    attachments: ['iso27001_audit.pdf', 'compliance_gap_analysis.docx']
  },
  {
    id: 14,
    no: 2,
    registrationDate: '2023-08-25',
    code: 'SEC-23-004',
    inspectionType: '보안점검',
    inspectionTarget: '고객사',
    inspectionContent: 'CCTV 시스템 보안 점검',
    team: '기획팀',
    assignee: '정우진',
    status: '완료',
    inspectionDate: '2023-08-20',
    attachments: ['cctv_audit.xlsx', 'physical_access_log.pdf']
  },
  {
    id: 15,
    no: 1,
    registrationDate: '2023-07-15',
    code: 'SEC-23-005',
    inspectionType: '취약점점검',
    inspectionTarget: '내부',
    inspectionContent: '클라우드 보안 취약점 점검',
    team: '개발팀',
    assignee: '신동욱',
    status: '완료',
    inspectionDate: '2023-07-10',
    attachments: ['cloud_security_audit.pdf', 'aws_config_review.xlsx']
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
export const inspectionStatusOptions = ['대기', '진행', '완료', '홀딩'] as const;

// 상태별 색상 매핑 (InspectionTable에서 사용)
export const inspectionStatusColors = statusColors;
