import { CostRecord } from 'types/cost';

// 비용관리 샘플 데이터
export const costData: CostRecord[] = [
  {
    id: 1,
    registrationDate: '2024-12-01',
    startDate: '2024-01-15',
    code: 'COST-24-001',
    team: 'IT팀',
    assignee: '김철수',
    costType: '솔루션',
    content: '프로젝트 관리 소프트웨어 라이선스',
    quantity: 10,
    unitPrice: 150000,
    amount: 1500000,
    status: '완료',
    completionDate: '2024-12-05',
    attachment: true,
    attachmentCount: 2,
    attachments: [
      {
        id: 1,
        name: '라이선스_계약서.pdf',
        type: 'application/pdf',
        size: '2.5 MB',
        uploadDate: '2024-12-01'
      },
      {
        id: 2,
        name: '견적서.xlsx',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: '1.2 MB',
        uploadDate: '2024-12-01'
      }
    ]
  },
  {
    id: 2,
    registrationDate: '2024-12-03',
    startDate: '2024-02-20',
    code: 'COST-24-002',
    team: '마케팅팀',
    assignee: '박영희',
    costType: '행사경비',
    content: '신제품 론칭 이벤트 비용',
    quantity: 1,
    unitPrice: 5000000,
    amount: 5000000,
    status: '진행',
    completionDate: '2024-12-20',
    attachment: true,
    attachmentCount: 3,
    attachments: [
      {
        id: 3,
        name: '이벤트_기획서.pptx',
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        size: '8.7 MB',
        uploadDate: '2024-12-03'
      },
      {
        id: 4,
        name: '예산_계획서.pdf',
        type: 'application/pdf',
        size: '1.8 MB',
        uploadDate: '2024-12-03'
      },
      {
        id: 5,
        name: '장소_계약서.pdf',
        type: 'application/pdf',
        size: '3.2 MB',
        uploadDate: '2024-12-03'
      }
    ]
  },
  {
    id: 3,
    registrationDate: '2024-12-05',
    startDate: '2024-03-10',
    code: 'COST-24-003',
    team: 'IT팀',
    assignee: '이민수',
    costType: '하드웨어',
    content: '서버 장비 구매',
    quantity: 2,
    unitPrice: 3000000,
    amount: 6000000,
    status: '대기',
    completionDate: '2024-12-25',
    attachment: false,
    attachmentCount: 0,
    attachments: []
  },
  {
    id: 4,
    registrationDate: '2024-12-07',
    startDate: '2024-04-25',
    code: 'COST-24-004',
    team: '영업팀',
    assignee: '최윤정',
    costType: '출장경비',
    content: '해외 거래처 방문 출장비',
    quantity: 3,
    unitPrice: 800000,
    amount: 2400000,
    status: '완료',
    completionDate: '2024-12-10',
    attachment: true,
    attachmentCount: 1,
    attachments: [
      {
        id: 6,
        name: '출장_보고서.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: '2.1 MB',
        uploadDate: '2024-12-10'
      }
    ]
  },
  {
    id: 5,
    registrationDate: '2024-12-09',
    startDate: '2024-05-08',
    code: 'COST-24-005',
    team: '기획팀',
    assignee: '정상현',
    costType: '사무경비',
    content: '사무용품 및 소모품 구매',
    quantity: 1,
    unitPrice: 500000,
    amount: 500000,
    status: '진행',
    completionDate: '2024-12-15',
    attachment: false,
    attachmentCount: 0,
    attachments: []
  },
  {
    id: 6,
    registrationDate: '2024-12-10',
    startDate: '2024-06-12',
    code: 'COST-24-006',
    team: '마케팅팀',
    assignee: '김혜진',
    costType: '솔루션',
    content: '마케팅 자동화 플랫폼 도입',
    quantity: 1,
    unitPrice: 2000000,
    amount: 2000000,
    status: '대기',
    completionDate: '2024-12-30',
    attachment: true,
    attachmentCount: 2,
    attachments: [
      {
        id: 7,
        name: '솔루션_제안서.pdf',
        type: 'application/pdf',
        size: '4.5 MB',
        uploadDate: '2024-12-10'
      },
      {
        id: 8,
        name: '기능_비교표.xlsx',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: '1.8 MB',
        uploadDate: '2024-12-10'
      }
    ]
  },
  {
    id: 7,
    registrationDate: '2024-12-11',
    startDate: '2024-07-18',
    code: 'COST-24-007',
    team: 'IT팀',
    assignee: '송민호',
    costType: '하드웨어',
    content: '네트워크 장비 교체',
    quantity: 5,
    unitPrice: 400000,
    amount: 2000000,
    status: '취소',
    completionDate: '',
    attachment: false,
    attachmentCount: 0,
    attachments: []
  },
  {
    id: 8,
    registrationDate: '2024-12-12',
    startDate: '2024-08-30',
    code: 'COST-24-008',
    team: '인사팀',
    assignee: '노수진',
    costType: '행사경비',
    content: '연말 회식 및 시상식 비용',
    quantity: 1,
    unitPrice: 3500000,
    amount: 3500000,
    status: '진행',
    completionDate: '2024-12-28',
    attachment: true,
    attachmentCount: 1,
    attachments: [
      {
        id: 9,
        name: '행사_계획서.pdf',
        type: 'application/pdf',
        size: '2.3 MB',
        uploadDate: '2024-12-12'
      }
    ]
  }
];

// 담당자별 비용 통계 계산 함수
export const getCostStatistics = (records: CostRecord[]) => {
  const totalAmount = records.reduce((sum, record) => sum + record.amount, 0);
  const pendingAmount = records.filter((record) => record.status === '대기').reduce((sum, record) => sum + record.amount, 0);
  const completedAmount = records.filter((record) => record.status === '완료').reduce((sum, record) => sum + record.amount, 0);

  // 비용 유형별 통계
  const byType = records.reduce(
    (acc, record) => {
      if (!acc[record.costType]) {
        acc[record.costType] = { count: 0, amount: 0 };
      }
      acc[record.costType].count++;
      acc[record.costType].amount += record.amount;
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
      acc[record.status].amount += record.amount;
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
      amount: monthRecords.reduce((sum, record) => sum + record.amount, 0),
      count: monthRecords.length
    });
  }

  return {
    totalAmount,
    pendingAmount,
    completedAmount,
    byType,
    byStatus,
    monthlyTrend
  };
};
