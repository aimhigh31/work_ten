// 체크리스트 샘플 데이터
import { ChecklistRecord, ChecklistEditorItem } from 'types/checklist';

// 체크리스트 항목 템플릿 - 카테고리별 미리 정의된 항목들
export const checklistItemTemplates: Record<string, ChecklistEditorItem[]> = {
  '서버 보안 점검': [
    {
      id: 1,
      majorCategory: '시스템',
      minorCategory: '보안',
      title: '방화벽 설정 점검',
      description: '외부 침입 차단을 위한 방화벽 정책 및 룰 설정 상태 점검',
      evaluation: '',
      score: 0,
      attachments: []
    },
    {
      id: 2,
      majorCategory: '시스템',
      minorCategory: '보안',
      title: '안티바이러스 점검',
      description: '악성코드 차단을 위한 안티바이러스 소프트웨어 업데이트 상태 및 실시간 스캔 기능 점검',
      evaluation: '',
      score: 0,
      attachments: []
    },
    {
      id: 3,
      majorCategory: '시스템',
      minorCategory: '접근제어',
      title: '사용자 계정 점검',
      description: '불필요한 계정 존재 여부, 비밀번호 정책 준수, 권한 분리 적용 점검',
      evaluation: '',
      score: 0,
      attachments: []
    },
    {
      id: 4,
      majorCategory: '시스템',
      minorCategory: '패치',
      title: '보안 패치 점검',
      description: '운영체제 및 어플리케이션 보안 패치 적용 현황 점검',
      evaluation: '',
      score: 0,
      attachments: []
    },
    {
      id: 5,
      majorCategory: '네트워크',
      minorCategory: '보안',
      title: 'SSL/TLS 인증서 점검',
      description: 'SSL 인증서 유효성, 만료일, 암호화 강도 점검',
      evaluation: '',
      score: 0,
      attachments: []
    }
  ],
  '네트워크 성능 점검': [
    {
      id: 1,
      majorCategory: '네트워크',
      minorCategory: '성능',
      title: '대역폭 사용량 측정',
      description: '네트워크 대역폭 사용률 및 트래픽 패턴 분석',
      evaluation: '',
      score: 0,
      attachments: []
    },
    {
      id: 2,
      majorCategory: '네트워크',
      minorCategory: '안정성',
      title: '네트워크 장비 상태 점검',
      description: '라우터, 스위치, 방화벽 등 네트워크 장비 동작 상태 점검',
      evaluation: '',
      score: 0,
      attachments: []
    },
    {
      id: 3,
      majorCategory: '네트워크',
      minorCategory: '연결성',
      title: '네트워크 연결 품질 측정',
      description: '지연시간, 패킷 손실률, 처리량 측정 및 분석',
      evaluation: '',
      score: 0,
      attachments: []
    },
    {
      id: 4,
      majorCategory: '네트워크',
      minorCategory: '보안',
      title: 'WiFi 보안 점검',
      description: 'WiFi 암호화 프로토콜, 접근 제어, 불법 AP 탐지',
      evaluation: '',
      score: 0,
      attachments: []
    }
  ],
  '데이터베이스 점검': [
    {
      id: 1,
      majorCategory: '데이터베이스',
      minorCategory: '보안',
      title: '데이터베이스 접근 권한 점검',
      description: '데이터베이스 사용자 계정, 권한 설정, 접근 제어 점검',
      evaluation: '',
      score: 0,
      attachments: []
    },
    {
      id: 2,
      majorCategory: '데이터베이스',
      minorCategory: '성능',
      title: '데이터베이스 성능 점검',
      description: '쿼리 성능, 인덱스 최적화, 리소스 사용률 점검',
      evaluation: '',
      score: 0,
      attachments: []
    },
    {
      id: 3,
      majorCategory: '데이터베이스',
      minorCategory: '백업',
      title: '백업 및 복구 점검',
      description: '정기 백업 실행 여부, 백업 파일 무결성, 복구 테스트 점검',
      evaluation: '',
      score: 0,
      attachments: []
    }
  ],
  '웹 어플리케이션 보안 점검': [
    {
      id: 1,
      majorCategory: '웹보안',
      minorCategory: '인증',
      title: '사용자 인증 체계 점검',
      description: '로그인 보안, 세션 관리, 다중 인증 구현 점검',
      evaluation: '',
      score: 0,
      attachments: []
    },
    {
      id: 2,
      majorCategory: '웹보안',
      minorCategory: '취약점',
      title: 'OWASP Top 10 취약점 점검',
      description: 'SQL 인젝션, XSS, CSRF 등 주요 웹 취약점 점검',
      evaluation: '',
      score: 0,
      attachments: []
    },
    {
      id: 3,
      majorCategory: '웹보안',
      minorCategory: '암호화',
      title: '데이터 암호화 점검',
      description: '전송 구간 암호화, 저장 데이터 암호화 적용 점검',
      evaluation: '',
      score: 0,
      attachments: []
    }
  ],
  '월간 보고서 작성': [
    {
      id: 1,
      majorCategory: '업무',
      minorCategory: '문서작성',
      title: '데이터 수집 및 정리',
      description: '월간 성과 데이터 수집 및 체계적 정리',
      evaluation: '',
      score: 0,
      attachments: []
    },
    {
      id: 2,
      majorCategory: '업무',
      minorCategory: '분석',
      title: '성과 분석 및 트렌드 파악',
      description: '월간 성과 분석 및 지난 달 대비 트렌드 분석',
      evaluation: '',
      score: 0,
      attachments: []
    },
    {
      id: 3,
      majorCategory: '업무',
      minorCategory: '보고',
      title: '보고서 작성 및 검토',
      description: '최종 보고서 작성 및 내용 검토',
      evaluation: '',
      score: 0,
      attachments: []
    }
  ],
  '신제품 개발 계획 수립': [
    {
      id: 1,
      majorCategory: '프로젝트',
      minorCategory: '기획',
      title: '시장 조사 및 요구사항 분석',
      description: '목적 시장 조사 및 고객 요구사항 분석',
      evaluation: '',
      score: 0,
      attachments: []
    },
    {
      id: 2,
      majorCategory: '프로젝트',
      minorCategory: '계획',
      title: '개발 일정 및 리소스 계획',
      description: '개발 단계별 일정 및 필요 인력/자원 계획',
      evaluation: '',
      score: 0,
      attachments: []
    },
    {
      id: 3,
      majorCategory: '프로젝트',
      minorCategory: '위험관리',
      title: '프로젝트 위험요소 식별',
      description: '프로젝트 진행 시 발생 가능한 위험요소 식별 및 대응방안 수립',
      evaluation: '',
      score: 0,
      attachments: []
    }
  ],
  '팀 미팅 준비': [
    {
      id: 1,
      majorCategory: '회의',
      minorCategory: '준비',
      title: '안건 정리 및 자료 준비',
      description: '회의 안건 정리 및 관련 자료 준비',
      evaluation: '',
      score: 0,
      attachments: []
    },
    {
      id: 2,
      majorCategory: '회의',
      minorCategory: '참석자',
      title: '참석자 확정 및 일정 조율',
      description: '회의 참석자 확정 및 일정 조율',
      evaluation: '',
      score: 0,
      attachments: []
    }
  ],
  '고객 미팅 일정 조율': [
    {
      id: 1,
      majorCategory: '일정',
      minorCategory: '조율',
      title: '고객사 일정 확인',
      description: '고객사 담당자 일정 확인 및 가능한 시간대 파악',
      evaluation: '',
      score: 0,
      attachments: []
    },
    {
      id: 2,
      majorCategory: '일정',
      minorCategory: '확정',
      title: '최종 일정 확정 및 통보',
      description: '양측 일정을 고려한 최종 미팅 일정 확정',
      evaluation: '',
      score: 0,
      attachments: []
    }
  ]
};

export const sampleChecklistData: ChecklistRecord[] = [
  {
    id: 1,
    registrationDate: '2024-01-15',
    code: 'CHECK-24-001',
    category: '업무',
    title: '월간 보고서 작성',
    description: '2024년 1월 월간 보고서 작성 및 제출',
    priority: '높음',
    status: '완료',
    assignee: '김철수',
    dueDate: '2024-01-31',
    completionDate: '2024-01-30',
    attachment: true,
    attachmentCount: 2,
    attachments: [
      {
        id: 1,
        name: '월간보고서_1월.pdf',
        type: 'application/pdf',
        size: '1.2MB',
        uploadDate: '2024-01-30'
      },
      {
        id: 2,
        name: '데이터_분석.xlsx',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: '850KB',
        uploadDate: '2024-01-30'
      }
    ]
  },
  {
    id: 2,
    registrationDate: '2024-01-20',
    code: 'CHECK-24-002',
    category: '프로젝트',
    title: '신제품 개발 계획 수립',
    description: '2024년 신제품 개발 로드맵 및 일정 계획 수립',
    priority: '높음',
    status: '진행',
    assignee: '이영희',
    dueDate: '2024-02-15',
    completionDate: '',
    attachment: false,
    attachmentCount: 0,
    attachments: []
  },
  {
    id: 3,
    registrationDate: '2024-01-25',
    code: 'CHECK-24-003',
    category: '회의',
    title: '팀 미팅 준비',
    description: '주간 팀 미팅 자료 준비 및 안건 정리',
    priority: '보통',
    status: '대기',
    assignee: '박민수',
    dueDate: '2024-02-01',
    completionDate: '',
    attachment: false,
    attachmentCount: 0,
    attachments: []
  },
  {
    id: 4,
    registrationDate: '2024-01-28',
    code: 'CHECK-24-004',
    category: '점검',
    title: '서버 보안 점검',
    description: '월간 서버 보안 상태 점검 및 보고',
    priority: '높음',
    status: '진행',
    assignee: '최보안',
    dueDate: '2024-02-05',
    completionDate: '',
    attachment: true,
    attachmentCount: 1,
    attachments: [
      {
        id: 3,
        name: '보안점검_체크리스트.pdf',
        type: 'application/pdf',
        size: '650KB',
        uploadDate: '2024-01-28'
      }
    ],
    editorData: checklistItemTemplates['서버 보안 점검']
  },
  {
    id: 5,
    registrationDate: '2024-02-01',
    code: 'CHECK-24-005',
    category: '일정',
    title: '고객 미팅 일정 조율',
    description: '주요 고객사와의 미팅 일정 조율 및 확정',
    priority: '보통',
    status: '완료',
    assignee: '정영업',
    dueDate: '2024-02-10',
    completionDate: '2024-02-08',
    attachment: false,
    attachmentCount: 0,
    attachments: []
  },
  {
    id: 6,
    registrationDate: '2024-02-05',
    code: 'CHECK-24-006',
    category: '기타',
    title: '사무용품 구매 요청',
    description: '팀 사무용품 재고 확인 및 구매 요청 처리',
    priority: '낮음',
    status: '대기',
    assignee: '김관리',
    dueDate: '2024-02-20',
    completionDate: '',
    attachment: false,
    attachmentCount: 0,
    attachments: []
  },
  {
    id: 7,
    registrationDate: '2024-02-08',
    code: 'CHECK-24-007',
    category: '업무',
    title: '신입사원 교육 자료 준비',
    description: '2024년 신입사원 온보딩 교육 자료 준비',
    priority: '보통',
    status: '진행',
    assignee: '이교육',
    dueDate: '2024-02-25',
    completionDate: '',
    attachment: true,
    attachmentCount: 3,
    attachments: [
      {
        id: 4,
        name: '신입사원_매뉴얼.pdf',
        type: 'application/pdf',
        size: '2.1MB',
        uploadDate: '2024-02-08'
      },
      {
        id: 5,
        name: '교육_일정표.xlsx',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: '420KB',
        uploadDate: '2024-02-08'
      },
      {
        id: 6,
        name: '조직도.png',
        type: 'image/png',
        size: '890KB',
        uploadDate: '2024-02-08'
      }
    ]
  },
  {
    id: 8,
    registrationDate: '2024-02-12',
    code: 'CHECK-24-008',
    category: '프로젝트',
    title: '웹사이트 리뉴얼 기획',
    description: '회사 웹사이트 리뉴얼 기획 및 요구사항 정의',
    priority: '높음',
    status: '대기',
    assignee: '박웹팀',
    dueDate: '2024-03-01',
    completionDate: '',
    attachment: false,
    attachmentCount: 0,
    attachments: []
  },
  {
    id: 9,
    registrationDate: '2024-02-15',
    code: 'CHECK-24-009',
    category: '점검',
    title: '네트워크 성능 점검',
    description: '사무실 네트워크 성능 점검 및 최적화',
    priority: '보통',
    status: '취소',
    assignee: '최네트워크',
    dueDate: '2024-02-28',
    completionDate: '',
    attachment: false,
    attachmentCount: 0,
    attachments: [],
    editorData: checklistItemTemplates['네트워크 성능 점검']
  },
  {
    id: 10,
    registrationDate: '2024-02-18',
    code: 'CHECK-24-010',
    category: '회의',
    title: '분기별 성과 검토 회의',
    description: '1분기 성과 검토 및 2분기 계획 수립 회의',
    priority: '높음',
    status: '진행',
    assignee: '김성과',
    dueDate: '2024-03-05',
    completionDate: '',
    attachment: true,
    attachmentCount: 1,
    attachments: [
      {
        id: 7,
        name: '1분기_성과보고서.pptx',
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        size: '3.2MB',
        uploadDate: '2024-02-18'
      }
    ]
  },
  // 추가 체크리스트 항목들
  {
    id: 11,
    registrationDate: '2024-03-01',
    code: 'CHECK-24-011',
    category: '점검',
    title: '데이터베이스 점검',
    description: '데이터베이스 보안 및 성능 점검',
    priority: '높음',
    status: '대기',
    assignee: '김데이터',
    dueDate: '2024-03-15',
    completionDate: '',
    attachment: false,
    attachmentCount: 0,
    attachments: [],
    editorData: checklistItemTemplates['데이터베이스 점검']
  },
  {
    id: 12,
    registrationDate: '2024-03-05',
    code: 'CHECK-24-012',
    category: '점검',
    title: '웹 어플리케이션 보안 점검',
    description: '웹 어플리케이션 보안 취약점 점검',
    priority: '높음',
    status: '진행',
    assignee: '이웹보안',
    dueDate: '2024-03-20',
    completionDate: '',
    attachment: true,
    attachmentCount: 2,
    attachments: [
      {
        id: 8,
        name: 'web_security_scan.pdf',
        type: 'application/pdf',
        size: '1.8MB',
        uploadDate: '2024-03-05'
      },
      {
        id: 9,
        name: 'vulnerability_report.xlsx',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: '720KB',
        uploadDate: '2024-03-05'
      }
    ],
    editorData: checklistItemTemplates['웹 어플리케이션 보안 점검']
  }
];

// 통계 데이터 (전체 12개 체크리스트 기준)
export const sampleChecklistStatistics = {
  totalAmount: 12,
  pendingAmount: 4,
  completedAmount: 3,
  byCategory: {
    업무: { count: 2, amount: 2 },
    프로젝트: { count: 2, amount: 2 },
    회의: { count: 2, amount: 2 },
    점검: { count: 4, amount: 4 }, // 점검 카테고리 4개로 증가
    일정: { count: 1, amount: 1 },
    기타: { count: 1, amount: 1 }
  },
  byStatus: {
    대기: { count: 4, amount: 4 }, // 대기 상태 4개로 증가
    진행: { count: 4, amount: 4 },
    완료: { count: 3, amount: 3 },
    취소: { count: 1, amount: 1 }
  },
  monthlyTrend: [
    { month: '2024-01', amount: 4, count: 4 },
    { month: '2024-02', amount: 6, count: 6 },
    { month: '2024-03', amount: 2, count: 2 } // 3월 추가 데이터
  ]
};
