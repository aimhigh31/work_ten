// 보안사고관리 관련 타입 정의

export interface SecurityIncidentRecord {
  id: number;
  no?: number;
  registrationDate: string;
  code: string;
  incidentType: '악성코드' | '랜섬웨어' | '정보유출' | '계정탈취' | '디도스' | 'DB손상';
  requestContent?: string; // 요청내용
  mainContent: string;
  severity: '높음' | '중간' | '낮음';
  status: '대기' | '진행' | '완료' | '홀딩';
  assignee: string;
  createdBy?: string; // 데이터 생성자 (권한 체크용)
  team?: string; // 팀
  occurrenceDate?: string; // 발생일자
  completedDate?: string; // 완료일자
  startDate?: string; // 시작일자
  progress?: number; // 진행율
  attachment: boolean;
  attachmentCount: number;
  attachments: AttachmentFile[];
  isNew?: boolean; // 새로 추가된 행 여부
  comments?: any[]; // 코멘트
  discoverer?: string; // 발견자
  impactScope?: string; // 영향범위
  causeAnalysis?: string; // 원인분석
  preventionPlan?: string; // 재발방지계획
  responseAction?: string; // 대응조치
  description?: string; // 세부설명
  responseStage?: '사고 탐지' | '현황 분석' | '개선 조치 중' | '즉시 해결' | '근본개선'; // 대응 단계
  // 통계 데이터
  likes?: number; // 좋아요 수
  likedBy?: string[]; // 좋아요 누른 사용자 목록
  views?: number; // 조회수
  viewedBy?: string[]; // 조회한 사용자 목록
  // 사고보고 데이터
  incidentReport?: {
    discoveryDateTime: string;
    discoverer: string;
    discoveryCircumstances: string;
    affectedSystems: string[];
    affectedUsers: string;
    dataLeakage: string;
    actionStartTime: string;
    actionEndTime: string;
    initialResponse: string;
    securityTeamReport: string;
    managementReport: string;
    externalReport: string;
  };
  // 사후대책 데이터
  postMeasures?: {
    rootCauseAnalysis: string;
    systemImprovements: string;
    policyChanges: string;
    trainingPlan: string;
    preventiveMeasures: string;
    monitoringEnhancement: string;
    responsiblePerson: string;
    implementationDeadline: string;
    budgetRequired: string;
    riskAssessment: string;
    lessonsLearned: string;
  };
}

export interface AttachmentFile {
  id: number;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
}

export interface SecurityIncidentStatistics {
  totalAmount: number;
  pendingAmount: number;
  completedAmount: number;
  byType: Record<string, { count: number; amount: number }>;
  byStatus: Record<string, { count: number; amount: number }>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
}

// 사고분류 옵션
export const incidentTypeOptions = ['악성코드', '랜섬웨어', '정보유출', '계정탈취', '디도스', 'DB손상'] as const;

// 심각도 옵션
export const severityOptions = ['높음', '중간', '낮음'] as const;

// 상태 옵션
export const statusOptions = ['대기', '진행', '완료', '홀딩'] as const;

// 부서 옵션
export const departmentOptions = ['IT팀', '마케팅팀', '영업팀', '기획팀', '인사팀', '재무팀', '개발팀', '디자인팀'] as const;
