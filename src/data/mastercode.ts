// 마스터코드 샘플 데이터
import { MasterCode, CodeGroup } from 'types/mastercode';

export const sampleCodeGroups: CodeGroup[] = [
  {
    id: '1',
    groupCode: 'STATUS',
    groupName: '상태',
    description: '업무 및 프로젝트 상태 코드',
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01 09:00',
    createdBy: '관리자'
  },
  {
    id: '2',
    groupCode: 'WORK_TYPE',
    groupName: '업무분류',
    description: '업무 유형 분류 코드',
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01 09:00',
    createdBy: '관리자'
  },
  {
    id: '3',
    groupCode: 'PRIORITY',
    groupName: '우선순위',
    description: '업무 우선순위 코드',
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01 09:00',
    createdBy: '관리자'
  },
  {
    id: '4',
    groupCode: 'DEPARTMENT',
    groupName: '부서',
    description: '조직 부서 코드',
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01 09:00',
    createdBy: '관리자'
  },
  {
    id: '5',
    groupCode: 'POSITION',
    groupName: '직책',
    description: '직책 분류 코드',
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01 09:00',
    createdBy: '관리자'
  },
  {
    id: '6',
    groupCode: 'USER_ROLE',
    groupName: '사용자역할',
    description: '시스템 사용자 역할 코드',
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01 09:00',
    createdBy: '관리자'
  }
];

export const sampleMasterCodes: MasterCode[] = [
  // 상태 코드
  {
    id: '1',
    code: 'WAIT',
    name: '대기',
    description: '작업 대기 상태',
    codeGroup: 'STATUS',
    sortOrder: 1,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01 09:00',
    createdBy: '관리자'
  },
  {
    id: '2',
    code: 'PROGRESS',
    name: '진행',
    description: '작업 진행 중 상태',
    codeGroup: 'STATUS',
    sortOrder: 2,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01 09:00',
    createdBy: '관리자'
  },
  {
    id: '3',
    code: 'COMPLETE',
    name: '완료',
    description: '작업 완료 상태',
    codeGroup: 'STATUS',
    sortOrder: 3,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01 09:00',
    createdBy: '관리자'
  },
  {
    id: '4',
    code: 'CANCEL',
    name: '취소',
    description: '작업 취소 상태',
    codeGroup: 'STATUS',
    sortOrder: 4,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01 09:00',
    createdBy: '관리자'
  },
  // 업무분류 코드
  {
    id: '5',
    code: 'WORK',
    name: '업무',
    description: '일반 업무',
    codeGroup: 'WORK_TYPE',
    sortOrder: 1,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01 09:00',
    createdBy: '관리자'
  },
  {
    id: '6',
    code: 'PROJECT',
    name: '프로젝트',
    description: '프로젝트 업무',
    codeGroup: 'WORK_TYPE',
    sortOrder: 2,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01 09:00',
    createdBy: '관리자'
  },
  {
    id: '7',
    code: 'SCHEDULE',
    name: '일정',
    description: '일정 관리',
    codeGroup: 'WORK_TYPE',
    sortOrder: 3,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01 09:00',
    createdBy: '관리자'
  },
  {
    id: '8',
    code: 'MEETING',
    name: '회의',
    description: '회의 관련 업무',
    codeGroup: 'WORK_TYPE',
    sortOrder: 4,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01 09:00',
    createdBy: '관리자'
  },
  {
    id: '9',
    code: 'INSPECTION',
    name: '점검',
    description: '점검 업무',
    codeGroup: 'WORK_TYPE',
    sortOrder: 5,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01 09:00',
    createdBy: '관리자'
  },
  {
    id: '10',
    code: 'ETC',
    name: '기타',
    description: '기타 업무',
    codeGroup: 'WORK_TYPE',
    sortOrder: 6,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01 09:00',
    createdBy: '관리자'
  },
  // 우선순위 코드
  {
    id: '11',
    code: 'HIGH',
    name: '높음',
    description: '높은 우선순위',
    codeGroup: 'PRIORITY',
    sortOrder: 1,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01 09:00',
    createdBy: '관리자'
  },
  {
    id: '12',
    code: 'MEDIUM',
    name: '보통',
    description: '보통 우선순위',
    codeGroup: 'PRIORITY',
    sortOrder: 2,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01 09:00',
    createdBy: '관리자'
  },
  {
    id: '13',
    code: 'LOW',
    name: '낮음',
    description: '낮은 우선순위',
    codeGroup: 'PRIORITY',
    sortOrder: 3,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01 09:00',
    createdBy: '관리자'
  },
  // 부서 코드
  {
    id: '14',
    code: 'IT',
    name: 'IT팀',
    description: 'IT 개발팀',
    codeGroup: 'DEPARTMENT',
    sortOrder: 1,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01 09:00',
    createdBy: '관리자'
  },
  {
    id: '15',
    code: 'MARKETING',
    name: '마케팅팀',
    description: '마케팅팀',
    codeGroup: 'DEPARTMENT',
    sortOrder: 2,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01 09:00',
    createdBy: '관리자'
  },
  {
    id: '16',
    code: 'HR',
    name: '인사팀',
    description: '인사관리팀',
    codeGroup: 'DEPARTMENT',
    sortOrder: 3,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01 09:00',
    createdBy: '관리자'
  },
  {
    id: '17',
    code: 'FINANCE',
    name: '재무팀',
    description: '재무관리팀',
    codeGroup: 'DEPARTMENT',
    sortOrder: 4,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01 09:00',
    createdBy: '관리자'
  }
];

// 통계 데이터
export const sampleMasterCodeStatistics = {
  totalGroups: sampleCodeGroups.length,
  totalCodes: sampleMasterCodes.length,
  activeGroups: sampleCodeGroups.filter((g) => g.isActive).length,
  activeCodes: sampleMasterCodes.filter((c) => c.isActive).length,
  byGroup: {
    STATUS: sampleMasterCodes.filter((c) => c.codeGroup === 'STATUS').length,
    WORK_TYPE: sampleMasterCodes.filter((c) => c.codeGroup === 'WORK_TYPE').length,
    PRIORITY: sampleMasterCodes.filter((c) => c.codeGroup === 'PRIORITY').length,
    DEPARTMENT: sampleMasterCodes.filter((c) => c.codeGroup === 'DEPARTMENT').length,
    POSITION: sampleMasterCodes.filter((c) => c.codeGroup === 'POSITION').length,
    USER_ROLE: sampleMasterCodes.filter((c) => c.codeGroup === 'USER_ROLE').length
  }
};
