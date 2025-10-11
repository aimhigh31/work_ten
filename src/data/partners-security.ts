import { PartnersSecurityRecord } from 'types/partners-security';

// 협력사보안관리 샘플 데이터
export const partnersSecurityData: PartnersSecurityRecord[] = [
  {
    id: 1,
    registrationDate: '2024-12-01',
    code: 'PRT-24-001',
    requestType: '하드웨어',
    requestDepartment: '마케팅팀',
    requester: '박영희',
    requestContent: '노트북 화면이 깜빡이는 문제 발생',
    actionContent: '디스플레이 케이블 교체 완료',
    status: '완료',
    assignee: '김철수',
    completionDate: '2024-12-02',
    attachment: true,
    attachmentCount: 2,
    attachments: [
      {
        id: 1,
        name: '문제_스크린샷.png',
        type: 'image/png',
        size: '1.2 MB',
        uploadDate: '2024-12-01'
      },
      {
        id: 2,
        name: '수리_보고서.pdf',
        type: 'application/pdf',
        size: '856 KB',
        uploadDate: '2024-12-02'
      }
    ]
  },
  {
    id: 2,
    registrationDate: '2024-12-03',
    code: 'PRT-24-002',
    requestType: '소프트웨어',
    requestDepartment: '영업팀',
    requester: '최윤정',
    requestContent: 'CRM 시스템 로그인 불가 문제',
    actionContent: '계정 권한 재설정 및 패스워드 초기화',
    status: '완료',
    assignee: '이민수',
    completionDate: '2024-12-03',
    attachment: false,
    attachmentCount: 0,
    attachments: []
  },
  {
    id: 3,
    registrationDate: '2024-12-05',
    code: 'PRT-24-003',
    requestType: '네트워크',
    requestDepartment: 'IT팀',
    requester: '송민호',
    requestContent: '사무실 WiFi 연결 불안정',
    actionContent: '네트워크 장비 점검 및 설정 조정 중',
    status: '진행',
    assignee: '김철수',
    completionDate: '2024-12-10',
    attachment: true,
    attachmentCount: 1,
    attachments: [
      {
        id: 3,
        name: '네트워크_진단_보고서.pdf',
        type: 'application/pdf',
        size: '2.1 MB',
        uploadDate: '2024-12-05'
      }
    ]
  },
  {
    id: 4,
    registrationDate: '2024-12-07',
    code: 'PRT-24-004',
    requestType: '그룹웨어',
    requestDepartment: '기획팀',
    requester: '정상현',
    requestContent: '메신저 알림 기능 오작동',
    actionContent: '',
    status: '대기',
    assignee: '이민수',
    completionDate: '2024-12-15',
    attachment: false,
    attachmentCount: 0,
    attachments: []
  },
  {
    id: 5,
    registrationDate: '2024-12-09',
    code: 'PRT-24-005',
    requestType: '보안',
    requestDepartment: '인사팀',
    requester: '노수진',
    requestContent: '백신 프로그램 업데이트 요청',
    actionContent: '전사 백신 프로그램 일괄 업데이트 완료',
    status: '완료',
    assignee: '송민호',
    completionDate: '2024-12-10',
    attachment: true,
    attachmentCount: 1,
    attachments: [
      {
        id: 4,
        name: '백신_업데이트_가이드.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: '1.8 MB',
        uploadDate: '2024-12-10'
      }
    ]
  },
  {
    id: 6,
    registrationDate: '2024-12-11',
    code: 'PRT-24-006',
    requestType: '솔루션',
    requestDepartment: '재무팀',
    requester: '김혜진',
    requestContent: '회계 시스템 데이터 백업 요청',
    actionContent: '정기 백업 스케줄 설정 및 수동 백업 실행',
    status: '진행',
    assignee: '김철수',
    completionDate: '2024-12-20',
    attachment: false,
    attachmentCount: 0,
    attachments: []
  },
  {
    id: 7,
    registrationDate: '2024-12-13',
    code: 'PRT-24-007',
    requestType: '전산서버',
    requestDepartment: '개발팀',
    requester: '이준호',
    requestContent: '개발 서버 성능 저하 문제',
    actionContent: '서버 리소스 증설 및 최적화 작업 진행',
    status: '진행',
    assignee: '이민수',
    completionDate: '2024-12-25',
    attachment: true,
    attachmentCount: 2,
    attachments: [
      {
        id: 5,
        name: '서버_성능_분석.xlsx',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: '3.2 MB',
        uploadDate: '2024-12-13'
      },
      {
        id: 6,
        name: '최적화_계획서.pdf',
        type: 'application/pdf',
        size: '1.9 MB',
        uploadDate: '2024-12-13'
      }
    ]
  },
  {
    id: 8,
    registrationDate: '2024-12-15',
    code: 'PRT-24-008',
    requestType: '단순문의',
    requestDepartment: '디자인팀',
    requester: '한지민',
    requestContent: '프린터 사용법 문의',
    actionContent: '프린터 사용 가이드 제공 및 교육 실시',
    status: '완료',
    assignee: '송민호',
    completionDate: '2024-12-15',
    attachment: false,
    attachmentCount: 0,
    attachments: []
  },
  {
    id: 9,
    registrationDate: '2024-12-17',
    code: 'PRT-24-009',
    requestType: '미들웨어',
    requestDepartment: 'IT팀',
    requester: '김철수',
    requestContent: 'API 연동 오류 해결 요청',
    actionContent: '',
    status: '대기',
    assignee: '이민수',
    completionDate: '2024-12-30',
    attachment: true,
    attachmentCount: 1,
    attachments: [
      {
        id: 7,
        name: '에러_로그.txt',
        type: 'text/plain',
        size: '245 KB',
        uploadDate: '2024-12-17'
      }
    ]
  },
  {
    id: 10,
    registrationDate: '2024-12-19',
    code: 'PRT-24-010',
    requestType: '하드웨어',
    requestDepartment: '마케팅팀',
    requester: '박영희',
    requestContent: '마우스 교체 요청',
    actionContent: '새 마우스 지급 완료',
    status: '완료',
    assignee: '송민호',
    completionDate: '2024-12-19',
    attachment: false,
    attachmentCount: 0,
    attachments: []
  }
];

// 협력사보안 통계 계산 함수
export const getPartnersSecurityStatistics = (records: PartnersSecurityRecord[]) => {
  const totalCount = records.length;
  const pendingCount = records.filter((record) => record.status === '대기').length;
  const completedCount = records.filter((record) => record.status === '완료').length;
  const inProgressCount = records.filter((record) => record.status === '진행').length;

  // 요청 유형별 통계
  const byType = records.reduce(
    (acc, record) => {
      if (!acc[record.requestType]) {
        acc[record.requestType] = { count: 0, amount: 0 };
      }
      acc[record.requestType].count++;
      return acc;
    },
    {} as Record<string, { count: number; amount: number }>
  );

  // 상태별 통계
  const byStatus = records.reduce(
    (acc, record) => {
      if (!acc[record.status]) {
        acc[record.status] = { count: 0, amount: 0 };
      }
      acc[record.status].count++;
      return acc;
    },
    {} as Record<string, { count: number; amount: number }>
  );

  // 월별 트렌드 (최근 6개월)
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const monthRecords = records.filter((record) => record.registrationDate.startsWith(monthStr));

    monthlyTrend.push({
      month: monthStr,
      amount: 0, // 협력사보안에서는 금액 개념이 없으므로 0
      count: monthRecords.length
    });
  }

  return {
    totalAmount: totalCount,
    pendingAmount: pendingCount,
    completedAmount: completedCount,
    byType,
    byStatus,
    monthlyTrend
  };
};
