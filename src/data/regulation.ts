import { RegulationData } from 'types/regulation';

// 샘플 담당자 목록 (보안규정관리에 맞는 담당자)
export const assignees = ['박영희', '김민수', '이영수', '최지연', '정현우', '강민정', '윤성호', '송민정'];

// 담당자별 아바타 정보
export const assigneeAvatars = {
  박영희: '/assets/images/users/avatar-1.png',
  김민수: '/assets/images/users/avatar-2.png',
  이영수: '/assets/images/users/avatar-3.png',
  최지연: '/assets/images/users/avatar-4.png',
  정현우: '/assets/images/users/avatar-5.png',
  강민정: '/assets/images/users/avatar-6.png',
  윤성호: '/assets/images/users/avatar-7.png',
  송민정: '/assets/images/users/avatar-8.png'
} as const;

// 샘플 Regulation 데이터 (보안규정관리에 맞는 데이터만)
export const regulationData: RegulationData[] = [];

// 팀 목록 (보안규정관리에 맞는 팀)
export const teams = ['보안팀', 'IT팀', '관리팀', '운영팀'] as const;

// 상태 옵션들 (보안규정관리에 맞는 상태)
export const regulationStatusOptions = [
  { value: '대기', label: '대기' },
  { value: '진행', label: '진행' },
  { value: '승인', label: '승인' },
  { value: '취소', label: '취소' }
] as const;

// 상태별 색상 매핑
export const regulationStatusColors = {
  대기: '#757575', // grey
  진행: '#1976D2', // blue
  승인: '#388E3C', // green
  취소: '#D32F2F' // red
} as const;
