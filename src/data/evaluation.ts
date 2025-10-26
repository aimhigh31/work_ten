import { EvaluationData } from 'types/evaluation';

// 팀 목록
export const teams = ['개발팀', '디자인팀', '기획팀', '마케팅팀'] as const;

// 상태 옵션
export const evaluationStatusOptions = ['대기', '진행', '완료', '홀딩'] as const;

// 상태별 색상 매핑
export const evaluationStatusColors = {
  대기: 'default',
  진행: 'primary',
  완료: 'success',
  홀딩: 'error'
} as const;

// 평가 유형 옵션
export const evaluationTypeOptions = ['직원평가', '부서평가', '프로젝트평가', '역량평가'] as const;

// 관리 분류 옵션
export const managementCategoryOptions = ['상반기', '하반기', '분기별', '수시평가'] as const;

// 평가 유형별 색상 매핑
export const evaluationTypeColors = {
  직원평가: 'primary',
  부서평가: 'warning',
  프로젝트평가: 'error',
  역량평가: 'info'
} as const;

// 관리 분류별 색상 매핑
export const managementCategoryColors = {
  상반기: 'primary',
  하반기: 'secondary',
  분기별: 'info',
  수시평가: 'warning'
} as const;

// 샘플 Evaluation 데이터
export const evaluationData: EvaluationData[] = [];
