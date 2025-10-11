export interface HardwareData {
  id: number;
  no: number;
  registrationDate: string;
  code: string;
  team: '개발팀' | '디자인팀' | '기획팀' | '마케팅팀';
  department: 'IT' | '기획';
  workContent: string;
  status: '사용' | '예비' | '수리' | '불량' | '폐기';
  assignee: string;
  startDate: string;
  completedDate: string;
  attachments: string[];
  assetCategory?: string;
  assetName?: string;
  assetDescription?: string;
  asset_category?: string; // DB 컬럼명
  asset_name?: string; // DB 컬럼명
  asset_description?: string; // DB 컬럼명
  location?: string;
  currentUser?: string;
  image_1_url?: string;
  image_2_url?: string;
  model?: string;
  manufacturer?: string;
  vendor?: string;
  detail_spec?: string;
  purchase_date?: string;
  warranty_end_date?: string;
  serial_number?: string;
  assigned_user?: string;
}

export interface HardwareTableData extends HardwareData {
  // 하드웨어 상세 필드들 추가
  model?: string;
  manufacturer?: string;
  vendor?: string;
  detailSpec?: string;
  purchaseDate?: string;
  warrantyEndDate?: string;
  serialNumber?: string;

  isEditing?: boolean;
  originalData?: HardwareData;
}

export type HardwareStatus = '대기' | '진행' | '완료' | '홀딩';
export type HardwareTeam = '개발팀' | '디자인팀' | '기획팀' | '마케팅팀';
export type HardwareDepartment = 'IT' | '기획';

export interface HardwareFilterOptions {
  department?: HardwareDepartment;
  status?: HardwareStatus;
  assignee?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

// 원래 하드웨어 다이얼로그용 타입들
export interface HardwareRecord {
  id: string;
  no: number;
  registrationDate: string;
  code: string;
  assetCategory: string;
  assetName: string;
  assetDescription: string;
  model: string;
  manufacturer: string;
  vendor: string;
  detailSpec: string;
  status: string;
  purchaseDate: string;
  warrantyEndDate: string;
  serialNumber: string;
  currentUser: string;
  location: string;
  team: string;
  assignee: string;
  registrant: string;
  image_1_url?: string;
  image_2_url?: string;
}

// 옵션 타입들
export interface UserOption {
  name: string;
  department: string;
  avatar: string;
}

// 자산 분류 옵션들
export const assetCategoryOptions = ['데스크톱', '노트북', '서버', '네트워크장비', '프린터', '모니터', '기타'];

// 상태 옵션들
export const statusOptions = ['예비', '사용', '수리', '불량', '폐기'];

// 담당자 옵션들
export const assigneeOptions: UserOption[] = [
  { name: '김철수', department: 'IT팀', avatar: '/assets/images/users/avatar-1.png' },
  { name: '이영희', department: '개발팀', avatar: '/assets/images/users/avatar-2.png' },
  { name: '박지훈', department: 'IT팀', avatar: '/assets/images/users/avatar-3.png' },
  { name: '최수진', department: '디자인팀', avatar: '/assets/images/users/avatar-4.png' }
];

// 현재 사용자 옵션들
export const currentUserOptions: UserOption[] = [
  { name: '홍길동', department: '영업팀', avatar: '/assets/images/users/avatar-5.png' },
  { name: '김민수', department: '마케팅팀', avatar: '/assets/images/users/avatar-6.png' },
  { name: '이정호', department: '기획팀', avatar: '/assets/images/users/avatar-7.png' },
  { name: '박영수', department: '개발팀', avatar: '/assets/images/users/avatar-8.png' }
];
