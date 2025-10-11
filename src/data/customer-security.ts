import { CustomerSecurityRecord } from 'types/customer-security';

// 고객보안관리 샘플 데이터
export const customerSecurityData: CustomerSecurityRecord[] = [
  {
    id: 1,
    registrationDate: '2024-12-01',
    code: 'CSI-24-001',
    inspectionType: '정기점검',
    customerName: '삼성전자',
    inspectionTitle: '삼성전자 4분기 정기 보안점검',
    inspectionDate: '2024-12-05',
    status: '완료',
    assignee: '김철수',
    attachment: true,
    attachmentCount: 3,
    attachments: [
      {
        id: 1,
        name: '삼성전자_보안점검_결과보고서.pdf',
        type: 'application/pdf',
        size: '2.5 MB',
        uploadDate: '2024-12-05'
      },
      {
        id: 2,
        name: '점검_체크리스트_삼성전자.xlsx',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: '156 KB',
        uploadDate: '2024-12-05'
      },
      {
        id: 3,
        name: '개선사항_요약.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: '89 KB',
        uploadDate: '2024-12-06'
      }
    ]
  },
  {
    id: 2,
    registrationDate: '2024-12-02',
    code: 'CSI-24-002',
    inspectionType: '특별점검',
    customerName: 'LG전자',
    inspectionTitle: 'LG전자 보안사고 대응 특별점검',
    inspectionDate: '2024-12-03',
    status: '진행',
    assignee: '이민수',
    attachment: true,
    attachmentCount: 2,
    attachments: [
      {
        id: 4,
        name: 'LG전자_특별점검_계획서.pdf',
        type: 'application/pdf',
        size: '1.8 MB',
        uploadDate: '2024-12-02'
      },
      {
        id: 5,
        name: '사고대응_프로세스.pptx',
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        size: '3.2 MB',
        uploadDate: '2024-12-03'
      }
    ]
  },
  {
    id: 3,
    registrationDate: '2024-12-05',
    code: 'CSI-24-003',
    inspectionType: '정기점검',
    customerName: 'SK하이닉스',
    inspectionTitle: 'SK하이닉스 상반기 보안점검',
    inspectionDate: '2024-12-10',
    status: '대기',
    assignee: '송민호',
    attachment: false,
    attachmentCount: 0,
    attachments: []
  },
  {
    id: 4,
    registrationDate: '2024-12-07',
    code: 'CSI-24-004',
    inspectionType: '긴급점검',
    customerName: '현대자동차',
    inspectionTitle: '현대자동차 랜섬웨어 위협 긴급점검',
    inspectionDate: '2024-12-07',
    status: '완료',
    assignee: '박영희',
    attachment: true,
    attachmentCount: 4,
    attachments: [
      {
        id: 6,
        name: '긴급점검_보고서_현대차.pdf',
        type: 'application/pdf',
        size: '1.2 MB',
        uploadDate: '2024-12-07'
      },
      {
        id: 7,
        name: '위협분석_리포트.pdf',
        type: 'application/pdf',
        size: '890 KB',
        uploadDate: '2024-12-07'
      },
      {
        id: 8,
        name: '조치사항_권고안.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: '456 KB',
        uploadDate: '2024-12-08'
      },
      {
        id: 9,
        name: '후속조치_계획.xlsx',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: '234 KB',
        uploadDate: '2024-12-08'
      }
    ]
  },
  {
    id: 5,
    registrationDate: '2024-12-08',
    code: 'CSI-24-005',
    inspectionType: '비정기점검',
    customerName: '네이버',
    inspectionTitle: '네이버 클라우드 보안 점검',
    inspectionDate: '2024-12-15',
    status: '대기',
    assignee: '최윤정',
    attachment: false,
    attachmentCount: 0,
    attachments: []
  },
  {
    id: 6,
    registrationDate: '2024-12-10',
    code: 'CSI-24-006',
    inspectionType: '정기점검',
    customerName: '카카오',
    inspectionTitle: '카카오 연말 정기 보안점검',
    inspectionDate: '2024-12-20',
    status: '대기',
    assignee: '김철수',
    attachment: true,
    attachmentCount: 1,
    attachments: [
      {
        id: 10,
        name: '카카오_점검계획서.pdf',
        type: 'application/pdf',
        size: '1.1 MB',
        uploadDate: '2024-12-10'
      }
    ]
  },
  {
    id: 7,
    registrationDate: '2024-12-12',
    code: 'CSI-24-007',
    inspectionType: '특별점검',
    customerName: '쿠팡',
    inspectionTitle: '쿠팡 물류센터 보안시스템 점검',
    inspectionDate: '2024-12-18',
    status: '진행',
    assignee: '이민수',
    attachment: true,
    attachmentCount: 2,
    attachments: [
      {
        id: 11,
        name: '물류센터_보안현황.pdf',
        type: 'application/pdf',
        size: '2.1 MB',
        uploadDate: '2024-12-12'
      },
      {
        id: 12,
        name: '접근통제_점검리스트.xlsx',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: '345 KB',
        uploadDate: '2024-12-13'
      }
    ]
  },
  {
    id: 8,
    registrationDate: '2024-12-13',
    code: 'CSI-24-008',
    inspectionType: '정기점검',
    customerName: '배달의민족',
    inspectionTitle: '배달의민족 개인정보보호 점검',
    inspectionDate: '2024-12-22',
    status: '대기',
    assignee: '송민호',
    attachment: false,
    attachmentCount: 0,
    attachments: []
  },
  {
    id: 9,
    registrationDate: '2024-12-14',
    code: 'CSI-24-009',
    inspectionType: '비정기점검',
    customerName: 'KT',
    inspectionTitle: 'KT 네트워크 보안 점검',
    inspectionDate: '2024-12-16',
    status: '진행',
    assignee: '박영희',
    attachment: true,
    attachmentCount: 1,
    attachments: [
      {
        id: 13,
        name: 'KT_네트워크_구성도.pdf',
        type: 'application/pdf',
        size: '1.7 MB',
        uploadDate: '2024-12-14'
      }
    ]
  },
  {
    id: 10,
    registrationDate: '2024-12-15',
    code: 'CSI-24-010',
    inspectionType: '긴급점검',
    customerName: 'SKT',
    inspectionTitle: 'SKT 보안사고 대응 긴급점검',
    inspectionDate: '2024-12-15',
    status: '완료',
    assignee: '최윤정',
    attachment: true,
    attachmentCount: 3,
    attachments: [
      {
        id: 14,
        name: 'SKT_사고분석_보고서.pdf',
        type: 'application/pdf',
        size: '1.9 MB',
        uploadDate: '2024-12-15'
      },
      {
        id: 15,
        name: '긴급조치_내역.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: '567 KB',
        uploadDate: '2024-12-15'
      },
      {
        id: 16,
        name: '재발방지_대책.pptx',
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        size: '2.3 MB',
        uploadDate: '2024-12-16'
      }
    ]
  }
];
