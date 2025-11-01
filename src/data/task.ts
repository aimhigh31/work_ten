import { TaskData } from 'types/task';

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

// 샘플 Task 데이터 - 빈 배열로 변경 (목업 데이터 사용 안함)
export const taskData: TaskData[] = [];

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
export const taskStatusOptions = ['대기', '진행', '완료', '홀딩'] as const;

// 상태별 색상 매핑 (TaskTable에서 사용)
export const taskStatusColors = statusColors;
