// 마스터코드 관련 타입 정의

export interface SubCode {
  id: string;
  sortOrder: number;
  subCode: string;
  selected?: boolean;
}

export interface MasterCode {
  id: string;
  code: string;
  name: string;
  description: string;
  codeGroup: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  subCodes?: SubCode[];
}

export interface CodeGroup {
  id: string;
  groupCode: string;
  groupName: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// 코드 그룹 옵션들
export const codeGroupOptions = [
  { value: 'STATUS', label: '상태' },
  { value: 'WORK_TYPE', label: '업무분류' },
  { value: 'PRIORITY', label: '우선순위' },
  { value: 'DEPARTMENT', label: '부서' },
  { value: 'POSITION', label: '직책' },
  { value: 'USER_ROLE', label: '사용자역할' }
];

// 상태 옵션들
export const statusOptions = ['활성', '비활성'] as const;

export type StatusType = (typeof statusOptions)[number];
