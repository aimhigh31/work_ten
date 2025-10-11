import { EducationRecord, CurriculumItem, ParticipantItem, EducationResult } from 'types/education';

// 교육관리 샘플 데이터
export const educationData: EducationRecord[] = [
  {
    id: 1,
    registrationDate: '2024-12-01',
    startDate: '2024-01-10',
    code: 'EDU-I-24-001',
    educationType: '신입교육',
    content: '신입사원 기초 교육과정',
    participants: 15,
    location: '대회의실',
    status: '완료',
    completionDate: '2024-12-15',
    assignee: '김인사',
    curriculum: [
      {
        id: 1,
        time: '09:00-10:30',
        subject: '회사 소개 및 조직문화',
        instructor: '김인사',
        content: '회사 역사, 비전, 조직문화 이해',
        attachment: 'company_intro.pdf'
      },
      {
        id: 2,
        time: '10:45-12:00',
        subject: '업무 프로세스 교육',
        instructor: '이기술',
        content: '기본 업무 프로세스 및 시스템 사용법',
        attachment: 'process_guide.pdf'
      },
      {
        id: 3,
        time: '13:00-14:30',
        subject: '안전 및 보안 교육',
        instructor: '박안전',
        content: '직장 내 안전수칙 및 정보보안'
      },
      {
        id: 4,
        time: '14:45-16:00',
        subject: '질의응답 및 멘토링',
        instructor: '김인사',
        content: '궁금한 사항 해결 및 멘토 배정'
      }
    ],
    participantList: [
      {
        id: 1,
        name: '김신입',
        department: 'IT팀',
        position: '사원',
        attendance: '참석',
        report: 'newcomer_report_001.pdf',
        note: '적극적 참여'
      },
      {
        id: 2,
        name: '이신규',
        department: '마케팅팀',
        position: '사원',
        attendance: '참석',
        report: 'newcomer_report_002.pdf'
      },
      {
        id: 3,
        name: '박신인',
        department: '영업팀',
        position: '사원',
        attendance: '불참',
        note: '개인사정으로 불참'
      }
    ],
    result: {
      performance:
        '신입사원들의 회사 적응도가 크게 향상되었으며, 업무 이해도가 평균 85% 증가했습니다. 특히 조직문화 이해 부분에서 높은 만족도를 보였습니다.',
      improvement:
        '실습 시간을 늘리고, 더 많은 상호작용 시간이 필요합니다. 멘토링 프로그램을 체계화하여 지속적인 지원이 가능하도록 개선이 필요합니다.',
      feedback:
        '신입사원들이 회사에 대한 이해가 높아졌고, 동료들과의 유대감 형성에 도움이 되었다는 긍정적인 피드백을 받았습니다. 향후 정기적인 후속 교육 요청이 있었습니다.'
    }
  },
  {
    id: 2,
    registrationDate: '2024-12-05',
    startDate: '2024-02-15',
    code: 'EDU-S-24-001',
    educationType: '담당자교육',
    content: '업무 전문성 향상 교육',
    participants: 12,
    location: '소회의실A',
    status: '진행',
    completionDate: '2024-12-20',
    assignee: '이기술',
    curriculum: [
      {
        id: 1,
        time: '09:00-10:30',
        subject: '업무 효율성 향상',
        instructor: '이기술',
        content: '업무 프로세스 최적화 및 도구 활용법'
      },
      {
        id: 2,
        time: '10:45-12:00',
        subject: '커뮤니케이션 스킬',
        instructor: '정마케팅',
        content: '효과적인 의사소통 및 협업 방법'
      }
    ],
    participantList: [
      {
        id: 1,
        name: '최담당',
        department: 'IT팀',
        position: '대리',
        attendance: '예정'
      },
      {
        id: 2,
        name: '송전문',
        department: '기획팀',
        position: '과장',
        attendance: '예정'
      }
    ],
    result: {
      performance: '',
      improvement: '',
      feedback: ''
    }
  },
  {
    id: 3,
    registrationDate: '2024-12-10',
    startDate: '2024-03-20',
    code: 'EDU-M-24-001',
    educationType: '관리자교육',
    content: '리더십 및 팀 관리 교육',
    participants: 8,
    location: '임원회의실',
    status: '예정',
    completionDate: '2024-12-25',
    assignee: '최리더',
    curriculum: [
      {
        id: 1,
        time: '09:00-10:30',
        subject: '리더십 이론과 실무',
        instructor: '외부전문가',
        content: '현대적 리더십 이론 및 실무 적용'
      },
      {
        id: 2,
        time: '10:45-12:00',
        subject: '팀 빌딩과 동기부여',
        instructor: '외부전문가',
        content: '효과적인 팀 관리 및 구성원 동기부여'
      },
      {
        id: 3,
        time: '13:00-14:30',
        subject: '갈등 관리와 해결',
        instructor: '외부전문가',
        content: '조직 내 갈등 상황 관리 및 해결 방안'
      }
    ],
    participantList: [
      {
        id: 1,
        name: '김부장',
        department: 'IT팀',
        position: '부장',
        attendance: '예정'
      },
      {
        id: 2,
        name: '이팀장',
        department: '마케팅팀',
        position: '팀장',
        attendance: '예정'
      }
    ],
    result: {
      performance: '',
      improvement: '',
      feedback: ''
    }
  },
  {
    id: 4,
    registrationDate: '2024-12-12',
    startDate: '2024-04-05',
    code: 'EDU-A-24-001',
    educationType: '수시교육',
    content: '신기술 동향 세미나',
    participants: 20,
    location: '온라인',
    status: '예정',
    completionDate: '2024-12-22',
    assignee: '김디지털',
    curriculum: [
      {
        id: 1,
        time: '14:00-15:30',
        subject: 'AI 기술 동향',
        instructor: '김디지털',
        content: '최신 AI 기술 트렌드 및 활용 사례'
      },
      {
        id: 2,
        time: '15:45-17:00',
        subject: '클라우드 기술 소개',
        instructor: '이개발',
        content: '클라우드 서비스 및 마이그레이션 전략'
      }
    ],
    participantList: [
      {
        id: 1,
        name: '정개발',
        department: 'IT팀',
        position: '사원',
        attendance: '예정'
      },
      {
        id: 2,
        name: '한기술',
        department: 'IT팀',
        position: '대리',
        attendance: '예정'
      }
    ],
    result: {
      performance: '',
      improvement: '',
      feedback: ''
    }
  },
  {
    id: 5,
    registrationDate: '2024-11-20',
    startDate: '2024-05-18',
    code: 'EDU-I-24-002',
    educationType: '신입교육',
    content: '신입사원 IT 시스템 교육',
    participants: 10,
    location: 'IT교육실',
    status: '완료',
    completionDate: '2024-11-30',
    assignee: '이개발',
    curriculum: [
      {
        id: 1,
        time: '09:00-10:30',
        subject: '사내 시스템 소개',
        instructor: '이개발',
        content: 'ERP, 그룹웨어 등 사내 시스템 사용법'
      },
      {
        id: 2,
        time: '10:45-12:00',
        subject: '보안 정책 교육',
        instructor: '송보안',
        content: '정보보안 정책 및 준수사항'
      }
    ],
    participantList: [
      {
        id: 1,
        name: '박IT',
        department: 'IT팀',
        position: '사원',
        attendance: '참석',
        report: 'it_training_report_001.pdf'
      }
    ],
    result: {
      performance: 'IT 시스템 활용 능력이 90% 향상되었으며, 업무 처리 속도가 크게 개선되었습니다.',
      improvement: '실습 환경을 더욱 현실적으로 구성하고, 개인별 맞춤 교육이 필요합니다.',
      feedback: '실무에 바로 적용할 수 있는 내용으로 구성되어 매우 유익했습니다.'
    }
  },
  {
    id: 6,
    registrationDate: '2024-11-25',
    startDate: '2024-06-22',
    code: 'EDU-S-24-002',
    educationType: '담당자교육',
    content: '고객 서비스 향상 교육',
    participants: 18,
    location: '교육센터',
    status: '완료',
    completionDate: '2024-12-05',
    assignee: '한영업',
    curriculum: [
      {
        id: 1,
        time: '09:00-10:30',
        subject: '고객 응대 스킬',
        instructor: '한영업',
        content: '효과적인 고객 응대 방법 및 CS 마인드'
      }
    ],
    participantList: [
      {
        id: 1,
        name: '임서비스',
        department: '영업팀',
        position: '대리',
        attendance: '참석'
      }
    ],
    result: {
      performance: '고객 만족도가 15% 향상되었으며, 고객 응대 품질이 크게 개선되었습니다.',
      improvement: '다양한 고객 유형별 응대 시나리오를 추가로 다뤄야 합니다.',
      feedback: '실제 고객 응대 상황에서 바로 활용할 수 있는 실용적인 교육이었습니다.'
    }
  },
  {
    id: 7,
    registrationDate: '2024-12-01',
    startDate: '2024-07-12',
    code: 'EDU-A-24-002',
    educationType: '수시교육',
    content: '업무 스트레스 관리 워크샵',
    participants: 25,
    location: '복지관',
    status: '완료',
    completionDate: '2024-12-10',
    assignee: '김인사',
    curriculum: [
      {
        id: 1,
        time: '14:00-15:30',
        subject: '스트레스 이해와 관리',
        instructor: '외부상담사',
        content: '스트레스의 원인 파악 및 관리 방법'
      }
    ],
    participantList: [
      {
        id: 1,
        name: '조힐링',
        department: '전체',
        position: '전직원',
        attendance: '참석'
      }
    ],
    result: {
      performance: '직원들의 스트레스 수준이 평균 20% 감소하고, 업무 만족도가 향상되었습니다.',
      improvement: '정기적인 후속 프로그램과 개인 상담 서비스가 필요합니다.',
      feedback: '일상에서 바로 적용할 수 있는 실용적인 스트레스 관리법을 배울 수 있어 좋았습니다.'
    }
  },
  {
    id: 8,
    registrationDate: '2024-12-15',
    startDate: '2024-08-25',
    code: 'EDU-M-24-002',
    educationType: '관리자교육',
    content: '성과 관리 및 평가 교육',
    participants: 6,
    location: '소회의실B',
    status: '예정',
    completionDate: '2024-12-28',
    assignee: '정마케팅',
    curriculum: [
      {
        id: 1,
        time: '09:00-12:00',
        subject: '성과 관리 시스템',
        instructor: '외부컨설턴트',
        content: '효과적인 성과 관리 및 평가 방법론'
      }
    ],
    participantList: [
      {
        id: 1,
        name: '이관리',
        department: '전체',
        position: '관리자',
        attendance: '예정'
      }
    ],
    result: {
      performance: '',
      improvement: '',
      feedback: ''
    }
  }
];

// 교육관리 통계 계산 함수
export const getEducationStatistics = (records: EducationRecord[]) => {
  const totalCount = records.length;
  const planningCount = records.filter((record) => record.status === '계획').length;
  const completedCount = records.filter((record) => record.status === '완료').length;
  const inProgressCount = records.filter((record) => record.status === '진행').length;

  // 교육유형별 통계
  const byType = records.reduce(
    (acc, record) => {
      if (!acc[record.educationType]) {
        acc[record.educationType] = { count: 0, amount: 0 };
      }
      acc[record.educationType].count++;
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
      amount: 0, // 교육관리에서는 금액 개념이 없으므로 0
      count: monthRecords.length
    });
  }

  return {
    totalAmount: totalCount,
    planningAmount: planningCount,
    completedAmount: completedCount,
    byType,
    byStatus,
    monthlyTrend
  };
};
