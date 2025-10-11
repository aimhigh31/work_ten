// ==============================|| KANBAN - 개선된 데이터 ||============================== //

import { KanbanColumn, KanbanItem, KanbanComment, KanbanProfile, KanbanUserStory } from 'types/kanban';

// 팀 멤버 프로필 데이터
export const profiles: KanbanProfile[] = [
  {
    id: 'profile-1',
    name: '김민수 (FE)',
    avatar: '/assets/images/users/avatar-1.png',
    time: '5분 전'
  },
  {
    id: 'profile-2',
    name: '이영희 (BE)',
    avatar: '/assets/images/users/avatar-2.png',
    time: '15분 전'
  },
  {
    id: 'profile-3',
    name: '박지훈 (UI/UX)',
    avatar: '/assets/images/users/avatar-3.png',
    time: '30분 전'
  },
  {
    id: 'profile-4',
    name: '최수진 (QA)',
    avatar: '/assets/images/users/avatar-4.png',
    time: '1시간 전'
  },
  {
    id: 'profile-5',
    name: '정우진 (DevOps)',
    avatar: '/assets/images/users/avatar-5.png',
    time: '2시간 전'
  },
  {
    id: 'profile-6',
    name: '한서연 (PM)',
    avatar: '/assets/images/users/avatar-6.png',
    time: '어제'
  }
];

// 댓글 데이터
export const comments: KanbanComment[] = [
  {
    id: 'comment-1',
    comment: 'JWT 토큰 만료 처리 로직도 함께 구현해야겠습니다. 리프레시 토큰 전략도 논의가 필요해요.',
    profileId: 'profile-1'
  },
  {
    id: 'comment-2',
    comment: 'Chart.js로 구현하되, 반응형 디자인을 고려해서 작업하겠습니다.',
    profileId: 'profile-3'
  },
  {
    id: 'comment-3',
    comment: 'PostgreSQL 연결 풀 설정과 트랜잭션 처리가 완료되었습니다.',
    profileId: 'profile-2'
  },
  {
    id: 'comment-4',
    comment: 'ERD 검토 완료했습니다. 인덱스 최적화 제안사항 첨부드렸어요.',
    profileId: 'profile-4'
  },
  {
    id: 'comment-5',
    comment: 'Jest + RTL 조합으로 커버리지 90% 이상 달성했습니다.',
    profileId: 'profile-4'
  },
  {
    id: 'comment-6',
    comment: 'Docker 컨테이너화 완료, K8s 배포 준비 중입니다.',
    profileId: 'profile-5'
  },
  {
    id: 'comment-7',
    comment: 'PWA 적용으로 모바일 경험이 많이 개선되었네요!',
    profileId: 'profile-3'
  },
  {
    id: 'comment-8',
    comment: '보안 감사 결과, 모든 취약점 패치 완료되었습니다.',
    profileId: 'profile-2'
  },
  {
    id: 'comment-9',
    comment: 'API 문서 업데이트와 함께 포스트맨 컬렉션도 공유드렸습니다.',
    profileId: 'profile-2'
  },
  {
    id: 'comment-10',
    comment: '성능 테스트 결과, 응답속도 300ms 이하로 최적화되었습니다.',
    profileId: 'profile-5'
  }
];

// 개발 태스크 데이터
export const items: KanbanItem[] = [
  {
    id: 'item-1',
    title: '🔐 사용자 인증 시스템 구현',
    description:
      'JWT 기반 로그인/로그아웃 구현\n- 소셜 로그인 (Google, Kakao, Naver) 연동\n- 리프레시 토큰 자동 갱신\n- 비밀번호 재설정 기능',
    priority: 'high',
    dueDate: new Date('2024-12-20'),
    assign: 'profile-1',
    commentIds: ['comment-1'],
    attachments: [],
    image: false
  },
  {
    id: 'item-2',
    title: '📊 실시간 대시보드 개발',
    description: '관리자용 분석 대시보드 구현\n- 실시간 사용자 통계\n- 매출/방문자 차트\n- 반응형 위젯 시스템',
    priority: 'high',
    dueDate: new Date('2024-12-18'),
    assign: 'profile-3',
    commentIds: ['comment-2'],
    attachments: [],
    image: false
  },
  {
    id: 'item-3',
    title: '⚡ REST API 서버 구축',
    description: 'Node.js + Express 백엔드 API 개발\n- CRUD 엔드포인트 구현\n- 미들웨어 및 에러 핸들링\n- API 문서화 (Swagger)',
    priority: 'high',
    dueDate: new Date('2024-12-15'),
    assign: 'profile-2',
    commentIds: ['comment-3', 'comment-9'],
    attachments: [],
    image: false
  },
  {
    id: 'item-4',
    title: '🗄️ 데이터베이스 설계',
    description: 'PostgreSQL DB 스키마 설계 및 구축\n- ERD 작성 및 정규화\n- 마이그레이션 스크립트\n- 인덱스 최적화',
    priority: 'medium',
    dueDate: new Date('2024-12-22'),
    assign: 'profile-2',
    commentIds: ['comment-4'],
    attachments: [],
    image: false
  },
  {
    id: 'item-5',
    title: '🧪 테스트 케이스 작성',
    description: '포괄적인 테스트 스위트 구축\n- 단위 테스트 (Jest)\n- 통합 테스트\n- E2E 테스트 (Cypress)',
    priority: 'medium',
    dueDate: new Date('2024-12-25'),
    assign: 'profile-4',
    commentIds: ['comment-5'],
    attachments: [],
    image: false
  },
  {
    id: 'item-6',
    title: '🚀 배포 파이프라인 구축',
    description: 'CI/CD 자동화 및 인프라 구축\n- GitHub Actions 워크플로우\n- Docker 컨테이너화\n- AWS ECS 배포',
    priority: 'medium',
    dueDate: new Date('2024-12-30'),
    assign: 'profile-5',
    commentIds: ['comment-6'],
    attachments: [],
    image: false
  },
  {
    id: 'item-7',
    title: '📱 PWA 및 모바일 최적화',
    description: '모바일 사용성 극대화\n- PWA 매니페스트 적용\n- 서비스 워커 구현\n- 터치 인터페이스 최적화',
    priority: 'low',
    dueDate: new Date('2024-12-28'),
    assign: 'profile-3',
    commentIds: ['comment-7'],
    attachments: [],
    image: false
  },
  {
    id: 'item-8',
    title: '🛡️ 보안 강화 및 감사',
    description: '애플리케이션 보안 점검 및 개선\n- OWASP 보안 가이드라인 적용\n- SQL 인젝션 방어\n- XSS 및 CSRF 보호',
    priority: 'high',
    dueDate: new Date('2024-12-27'),
    assign: 'profile-2',
    commentIds: ['comment-8'],
    attachments: [],
    image: false
  },
  {
    id: 'item-9',
    title: '⚡ 성능 최적화',
    description: '웹 애플리케이션 성능 튜닝\n- 코드 스플리팅 적용\n- 이미지 최적화\n- 캐싱 전략 구현',
    priority: 'medium',
    dueDate: new Date('2024-12-26'),
    assign: 'profile-1',
    commentIds: ['comment-10'],
    attachments: [],
    image: false
  },
  {
    id: 'item-10',
    title: '📚 사용자 가이드 작성',
    description: '사용자 매뉴얼 및 개발 문서 작성\n- 사용자 가이드\n- API 문서\n- 개발자 온보딩 가이드',
    priority: 'low',
    dueDate: new Date('2024-12-29'),
    assign: 'profile-6',
    commentIds: [],
    attachments: [],
    image: false
  },
  {
    id: 'item-11',
    title: '🎨 디자인 시스템 구축',
    description: '일관된 UI/UX를 위한 디자인 시스템\n- 컴포넌트 라이브러리\n- 스타일 가이드\n- Storybook 구축',
    priority: 'medium',
    dueDate: new Date('2024-12-23'),
    assign: 'profile-3',
    commentIds: [],
    attachments: [],
    image: false
  },
  {
    id: 'item-12',
    title: '🔔 알림 시스템 구현',
    description: '실시간 알림 및 이메일 시스템\n- WebSocket 실시간 알림\n- 이메일 템플릿 시스템\n- 푸시 알림 (PWA)',
    priority: 'low',
    dueDate: new Date('2024-12-31'),
    assign: 'profile-2',
    commentIds: [],
    attachments: [],
    image: false
  }
];

// 워크플로우 컬럼 데이터
export const columns: KanbanColumn[] = [
  {
    id: 'column-1',
    title: '📋 백로그 (Backlog)',
    itemIds: ['item-4', 'item-10', 'item-11', 'item-12']
  },
  {
    id: 'column-2',
    title: '🚀 진행 중 (In Progress)',
    itemIds: ['item-1', 'item-2', 'item-3']
  },
  {
    id: 'column-3',
    title: '👀 코드 리뷰 (Review)',
    itemIds: ['item-5', 'item-7', 'item-9']
  },
  {
    id: 'column-4',
    title: '✅ 완료 (Done)',
    itemIds: ['item-6', 'item-8']
  }
];

// 사용자 스토리 데이터
export const userStories: KanbanUserStory[] = [
  {
    id: 'story-1',
    title: '사용자 인증 및 권한 관리',
    description: '안전하고 편리한 사용자 인증 시스템 구축',
    acceptance: '사용자는 이메일/소셜 로그인으로 안전하게 인증할 수 있고, 역할별 권한에 따라 기능에 접근할 수 있어야 합니다.',
    columnId: 'column-2',
    itemIds: ['item-1', 'item-8'],
    priority: 'high',
    dueDate: new Date('2024-12-20'),
    assign: 'profile-1',
    commentIds: []
  },
  {
    id: 'story-2',
    title: '관리자 대시보드 시스템',
    description: '실시간 데이터 모니터링 및 분석 도구',
    acceptance: '관리자는 실시간으로 사용자 활동, 시스템 상태, 비즈니스 지표를 모니터링하고 분석할 수 있어야 합니다.',
    columnId: 'column-2',
    itemIds: ['item-2', 'item-3'],
    priority: 'high',
    dueDate: new Date('2024-12-18'),
    assign: 'profile-3',
    commentIds: []
  },
  {
    id: 'story-3',
    title: '품질 보증 및 배포 자동화',
    description: '안정적인 서비스 운영을 위한 QA 및 DevOps',
    acceptance: '모든 코드는 자동화된 테스트를 통과해야 하고, 무중단 배포가 가능해야 합니다.',
    columnId: 'column-3',
    itemIds: ['item-5', 'item-6'],
    priority: 'medium',
    dueDate: new Date('2024-12-30'),
    assign: 'profile-4',
    commentIds: []
  },
  {
    id: 'story-4',
    title: '사용자 경험 최적화',
    description: '모바일 및 웹에서의 최적화된 사용자 경험',
    acceptance: '사용자는 모든 디바이스에서 빠르고 직관적인 인터페이스를 경험할 수 있어야 합니다.',
    columnId: 'column-1',
    itemIds: ['item-7', 'item-9', 'item-11'],
    priority: 'medium',
    dueDate: new Date('2024-12-28'),
    assign: 'profile-3',
    commentIds: []
  }
];

// 메인 백로그 데이터
export const kanbanData = {
  backlogs: {
    columns,
    columnsOrder: ['column-1', 'column-2', 'column-3', 'column-4'],
    items,
    itemsOrder: items.map((item) => item.id),
    profiles,
    comments,
    userStory: userStories,
    userStoryOrder: userStories.map((story) => story.id)
  }
};

export default kanbanData;
