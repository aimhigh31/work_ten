# 🚀 MAINLY 백엔드/DB 완전 구현 계획서 (v3.0 - 치명적 위험 해결판)

## 🆕 **v3.0 치명적 위험 개선사항 (2025-09-11 추가)**

### 🔥 **신규 추가 기능 (치명적 위험 3개 해결)**
1. ✅ **권한 위임 시스템** - 휴가/출장 시 업무 연속성 보장
   - `permission_delegations` 테이블 추가
   - 한시적 권한 위임 API 구현
   - 승인 프로세스 포함

2. ✅ **팀 변경 데이터 처리** - 조직개편 시 체계적 처리
   - 팀 변경 프로세스 API (`/api/users/:id/team-change`)
   - 업무 인수인계 자동화
   - 권한 재조정 로직

3. ✅ **사용자 퇴사 프로세스** - 업무 공백 방지
   - `resignation_processes` 테이블 추가
   - 퇴사 체크리스트 자동 생성
   - 업무/파일/권한 이관 추적

### 🛠️ **개선 사항 (약점 3개 보완)**
4. ✅ **복수 팀 소속 지원** - 협업/겸직 시나리오 대응
   - `user_team_mappings` 테이블 추가
   - 주/부 소속팀 구분
   - 팀별 역할 분리

5. ✅ **KPI-업무 동기화 강화** - 데이터 일관성 보장
   - `KpiTaskSyncService` 구현
   - KPI 삭제 정책 명확화
   - 변경 이력 자동 추적

6. ✅ **현실적 일정 조정** - 9-10주로 확대
   - 권한 체계 구현 시간 추가 (0.5주)
   - 업무관리 버퍼 추가 (0.5주)
   - 필수 리스크 버퍼 확보 (1.5주)

## 📋 **v2.0 주요 개선사항 (검증 결과 반영)**

### 🔥 **긴급 수정사항 (HIGH Priority)**
1. ✅ **체크리스트 `progress_rate INTEGER` 필드 추가** - 진척율 관리 기능 복원
2. ✅ **체크리스트 `expanded BOOLEAN` 필드 추가** - UI 상태 관리 지원
3. ✅ **필수 성능 인덱스 설계 추가** - 검색 성능 대폭 향상
4. ✅ **파일 업로드 보안 정책 강화** - 화이트리스트 기반 검증
5. ✅ **현실적 구현 일정 조정** - 5-6주 → 7-8주 (40% 증가)

### 🛠️ **구조적 개선사항 (MEDIUM Priority)**
6. ✅ **파일 시스템 FK 관계 개선** - 다형성 → 개별 테이블로 데이터 무결성 보장
7. ✅ **API 권한 Guard 구현 세부사항 명시** - RolesGuard, TeamAccessGuard 구체화
8. ✅ **캐싱 전략 수립** - Redis 기반 마스터코드/권한 캐싱
9. ✅ **쿼리 최적화 전략** - CTE 기반 계층구조 효율적 조회

### 📈 **성능 최적화 추가**
10. ✅ **20개 핵심 인덱스 설계** - 업무/KPI/체크리스트/파일 조회 최적화
11. ✅ **논리삭제 인덱스 추가** - WHERE deleted_at IS NULL 성능 보장
12. ✅ **감사로그 파티셔닝 고려** - 장기 성능 저하 방지

### 🔐 **보안 강화 추가**
13. ✅ **파일 타입 화이트리스트** - PDF, Office, 이미지만 허용
14. ✅ **파일명 검증 정규식** - 경로 조작 공격 방지
15. ✅ **압축파일 스캔 정책** - ZIP/RAR 등 악성코드 스캔 필수

### ⏰ **일정 현실화**
16. ✅ **MVP 우선순위 전략** - 업무관리+KPI관리 완벽 구현 우선
17. ✅ **위험 완화 전략** - 단계적 복잡도 증가 (기본→고급→최적화)
18. ✅ **연동 시간 충분 확보** - 프론트엔드 연동 1주일 전용

## 📊 **기술 스택 & 아키텍처**

### 핵심 기술
```
Backend: NestJS (Node.js 18+)
Database: PostgreSQL 15
ORM: Prisma
Authentication: JWT + Passport
File Storage: Local Server (100MB limit) → 향후 AWS S3 마이그레이션
API Docs: Swagger/OpenAPI
Caching: Redis (세션, 임시데이터)
Scheduler: @nestjs/schedule (Cron jobs)
AI Integration: External API 연동
```

### 폴더 구조
```
mainly-backend/
├── src/
│   ├── auth/              # 인증 모듈
│   ├── admin/             # 관리자 메뉴 모듈
│   ├── main/              # 메인 메뉴 모듈  
│   ├── planning/          # 기획 메뉴 모듈
│   ├── it/                # IT 메뉴 모듈
│   ├── security/          # 보안 메뉴 모듈
│   ├── ai/                # AI 대화 모듈
│   ├── common/            # 공통 모듈
│   ├── files/             # 파일 처리
│   └── notifications/     # 알림 시스템
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seeds/
└── uploads/               # 파일 저장소
```

## 🗄️ **데이터베이스 설계 (현재 프론트엔드 기반)**

### Phase 1: 기반 + 관리자 메뉴 테이블

```sql
-- 사용자 & 조직 (현재 코드 기반)
users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  position VARCHAR(50), -- '본부장', '팀장', '파트장', '프로'
  team VARCHAR(50), -- '개발팀', '디자인팀', '기획팀', '마케팅팀'
  department VARCHAR(50), -- 'IT', '기획'
  role VARCHAR(20) DEFAULT 'member', -- 'system_admin', 'team_leader', 'part_leader', 'member'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

-- 마스터코드 (향후 확장용)
master_codes (
  id BIGSERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL, -- 'position', 'team', 'department', 'task_status' 등
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  parent_id BIGINT REFERENCES master_codes(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL,
  UNIQUE(category, code)
);

-- 시스템 설정
system_settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  setting_type VARCHAR(50), -- 'string', 'number', 'boolean', 'json'
  updated_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 체크리스트 템플릿
checklist_templates (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  template_data JSONB, -- 템플릿 구조 저장
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

-- 사용자 설정
user_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, setting_key)
);

-- 파일 시스템 (🔥 검증 결과 개선)
-- 방법 1: 개별 테이블 (데이터 무결성 보장)
task_files (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT REFERENCES tasks(id) ON DELETE CASCADE,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  uploaded_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

kpi_files (
  id BIGSERIAL PRIMARY KEY,
  kpi_id BIGINT REFERENCES kpis(id) ON DELETE CASCADE,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  uploaded_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

cost_files (
  id BIGSERIAL PRIMARY KEY,
  cost_id BIGINT REFERENCES costs(id) ON DELETE CASCADE,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  uploaded_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

-- 감사로그 (모든 변경사항 추적)
audit_logs (
  id BIGSERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL, -- 'task', 'kpi', 'cost' 등
  entity_id BIGINT NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  user_id BIGINT REFERENCES users(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Phase 2: 메인 메뉴 테이블 (현재 프론트엔드와 완전 일치)

```sql
-- 업무관리 (TaskEditDialog 기반)
tasks (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  work_content TEXT NOT NULL, -- 프론트엔드의 workContent
  description TEXT,
  task_type VARCHAR(10) DEFAULT '일반', -- '일반', 'KPI'
  status VARCHAR(20) DEFAULT '대기', -- '대기', '진행', '완료', '홀딩'
  assignee VARCHAR(100), -- 담당자명 (현재는 문자열)
  team VARCHAR(50), -- '개발팀', '디자인팀', '기획팀', '마케팅팀'
  department VARCHAR(50), -- 'IT', '기획'
  progress INTEGER DEFAULT 0, -- 0-100
  priority VARCHAR(20), -- 'High', 'Medium', 'Low'
  registration_date DATE, -- 등록일 (프론트엔드 필드)
  start_date DATE, -- 시작일
  completed_date DATE, -- 완료일
  loaded_kpi_title VARCHAR(200), -- KPI 불러오기에서 가져온 제목
  loaded_kpi_id BIGINT, -- 연결된 KPI ID (향후 FK 추가 예정)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

-- 업무 체크리스트 (계층구조 지원)
task_checklists (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  checked BOOLEAN DEFAULT false,
  parent_id BIGINT REFERENCES task_checklists(id),
  level INTEGER DEFAULT 0, -- 0: 최상위, 1: 1단계 하위...
  weight INTEGER, -- 비중도 (%)
  priority VARCHAR(20), -- 'High', 'Medium', 'Low'
  status VARCHAR(20) DEFAULT '대기', -- '대기', '진행', '완료', '취소'
  progress_rate INTEGER DEFAULT 0, -- 0-100 진척율 (🔥 검증 결과 추가)
  assignee VARCHAR(100), -- 담당자
  team VARCHAR(50), -- 팀
  start_date DATE,
  due_date DATE,
  sort_order INTEGER DEFAULT 0, -- 드래그앤드롭 순서
  expanded BOOLEAN DEFAULT true, -- UI 확장/축소 상태
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

-- 업무 댓글/코멘트
task_comments (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author VARCHAR(100) NOT NULL,
  author_id BIGINT REFERENCES users(id),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

-- KPI관리 (KpiEditDialog 기반)
kpis (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  work_content TEXT NOT NULL, -- KPI 제목 (TaskData와 동일 필드명)
  description TEXT,
  status VARCHAR(20) DEFAULT '대기', -- '대기', '진행', '완료', '홀딩'
  assignee VARCHAR(100), -- 담당자명
  team VARCHAR(50), -- '개발팀', '디자인팀', '기획팀', '마케팅팀'
  department VARCHAR(50), -- 'IT', '기획'
  progress INTEGER DEFAULT 0, -- 0-100
  weight INTEGER DEFAULT 100, -- 비중도 (%)
  priority VARCHAR(20), -- 'High', 'Medium', 'Low'
  registration_date DATE, -- 등록일
  start_date DATE, -- 시작일
  completed_date DATE, -- 완료일
  is_locked BOOLEAN DEFAULT false, -- 업무에서 불러온 경우 true
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

-- KPI 체크리스트 (tasks와 동일 구조)
kpi_checklists (
  id BIGSERIAL PRIMARY KEY,
  kpi_id BIGINT REFERENCES kpis(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  checked BOOLEAN DEFAULT false,
  parent_id BIGINT REFERENCES kpi_checklists(id),
  level INTEGER DEFAULT 0,
  weight INTEGER,
  priority VARCHAR(20),
  status VARCHAR(20) DEFAULT '대기',
  progress_rate INTEGER DEFAULT 0, -- 0-100 진척율 (🔥 검증 결과 추가)
  assignee VARCHAR(100),
  team VARCHAR(50),
  start_date DATE,
  due_date DATE,
  sort_order INTEGER DEFAULT 0, -- 드래그앤드롭 순서
  expanded BOOLEAN DEFAULT true, -- UI 확장/축소 상태
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

-- KPI 댓글/코멘트
kpi_comments (
  id BIGSERIAL PRIMARY KEY,
  kpi_id BIGINT REFERENCES kpis(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author VARCHAR(100) NOT NULL,
  author_id BIGINT REFERENCES users(id),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

-- 일정관리
calendar_events (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  all_day BOOLEAN DEFAULT false,
  location VARCHAR(200),
  attendees JSONB, -- 참석자 목록
  event_type VARCHAR(50), -- 이벤트 유형
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

-- 개인교육관리
personal_educations (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  education_type VARCHAR(50), -- '온라인', '오프라인', '혼합'
  status VARCHAR(20) DEFAULT '계획', -- '계획', '진행중', '완료', '취소'
  start_date DATE,
  end_date DATE,
  instructor VARCHAR(100),
  location VARCHAR(200),
  participant_id BIGINT REFERENCES users(id),
  completion_rate INTEGER DEFAULT 0, -- 이수율 0-100
  score INTEGER, -- 점수
  certificate_issued BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

-- 비용관리
costs (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(100), -- '인건비', '운영비', '개발비', '마케팅비', '기타'
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT '신청', -- '신청', '승인', '반려', '완료'
  payment_method VARCHAR(50), -- '카드', '현금', '계좌이체'
  requested_by BIGINT REFERENCES users(id),
  approved_by BIGINT REFERENCES users(id),
  request_date DATE DEFAULT CURRENT_DATE,
  approval_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

-- 대시보드 위젯 설정
dashboard_widgets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  widget_type VARCHAR(50) NOT NULL, -- 'my_tasks', 'team_kpi', 'cost_status', 'schedule', 'notice'
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER DEFAULT 1,
  height INTEGER DEFAULT 1,
  config_json JSONB, -- 위젯별 설정 저장
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Phase 3: 기획 메뉴 테이블

```sql
-- 매출관리
sales (id, period, revenue, target, category_id, region, created_by, notes, deleted_at)
sales_details (id, sales_id, product_name, quantity, unit_price, total_amount)

-- 투자관리
investments (id, project_name, category_id, investment_amount, expected_return, start_date, end_date, status_id, manager_id, deleted_at)
investment_milestones (id, investment_id, milestone_name, target_date, completion_date, status_id, notes)
```

### Phase 4: IT 메뉴 테이블

```sql
-- VOC관리
vocs (id, title, content, customer_name, contact, voc_type_id, channel_id, priority_id, status_id, assignee_id, received_date, resolved_date, deleted_at)
voc_responses (id, voc_id, response_content, responder_id, response_date)

-- 솔루션관리
solutions (id, name, vendor, version, category_id, license_type_id, purchase_date, expiry_date, license_count, assigned_count, status_id, deleted_at)
solution_assignments (id, solution_id, user_id, assigned_date, returned_date, notes)

-- 하드웨어관리
hardware_assets (id, asset_tag, name, category_id, model, serial_number, purchase_date, warranty_expiry, status_id, location, assignee_id, deleted_at)
hardware_maintenance (id, hardware_id, maintenance_type, maintenance_date, next_due_date, vendor, cost, notes)

-- 소프트웨어관리
software_assets (id, name, vendor, version, category_id, license_type_id, license_key, purchase_date, expiry_date, license_count, installed_count, status_id, deleted_at)
software_licenses (id, software_id, user_id, installation_date, activation_key, status_id)

-- IT교육관리
it_educations (id, title, category_id, instructor, start_date, end_date, max_participants, status_id, deleted_at)
it_education_participants (id, education_id, user_id, enrollment_date, completion_date, score, status_id)
```

### Phase 5: 보안 메뉴 테이블

```sql
-- 보안점검관리
security_inspections (id, title, category_id, inspection_date, next_due_date, inspector_id, status_id, overall_score, deleted_at)
inspection_items (id, inspection_id, item_name, check_result, score, notes, checked_by)

-- 보안교육관리
security_educations (id, title, education_type_id, mandatory, start_date, end_date, instructor, max_participants, deleted_at)
security_education_participants (id, education_id, user_id, enrollment_date, completion_date, certificate_issued, status_id)

-- 보안사고관리
security_incidents (id, incident_title, incident_type_id, severity_id, occurred_date, detected_date, reporter_id, assignee_id, status_id, resolution_date, deleted_at)
incident_actions (id, incident_id, action_description, action_date, performer_id, action_type_id)

-- 보안규정관리
security_regulations (id, title, category_id, version, effective_date, approval_date, approved_by, status_id, deleted_at)
regulation_views (id, regulation_id, user_id, viewed_date, acknowledged)
```

### Phase 6: AI 대화 테이블

```sql
-- AI 대화
ai_conversations (id, user_id, session_id, user_message, ai_response, context_data_json, created_at)
ai_prompts (id, name, category, prompt_template, is_active, created_by, created_at)
```

## 🗂️ **하이브리드 마스터코드 관리 전략**

### **Phase 1: 현재 코드 기반 (즉시 구현 가능)**
```sql
-- 1단계: 현재 프론트엔드와 일치하는 고정값 사용
-- 백엔드에서 validation으로 제한
```

#### **기본 코드들 (고정값 → 마스터코드)**
```typescript
// 현재: 하드코딩
const POSITIONS = ['본부장', '팀장', '파트장', '프로'];
const TEAMS = ['개발팀', '디자인팀', '기획팀', '마케팅팀'];
const DEPARTMENTS = ['IT', '기획'];
const TASK_STATUS = ['대기', '진행', '완료', '홀딩'];
const PRIORITIES = ['High', 'Medium', 'Low'];

// 향후: 마스터코드 확장
GET /api/master-codes/positions
GET /api/master-codes/teams
GET /api/master-codes/departments
GET /api/master-codes/task-status
GET /api/master-codes/priorities
```

#### **업무관리 관련**
```typescript
const TASK_TYPES = ['일반', 'KPI'];
const TASK_CATEGORIES = ['개발', '디자인', '기획', '마케팅', '기타'];
```

#### **비용관리 관련**
```typescript
const COST_CATEGORIES = ['인건비', '운영비', '개발비', '마케팅비', '기타'];
const COST_STATUS = ['신청', '승인', '반려', '완료'];
const PAYMENT_METHODS = ['카드', '현금', '계좌이체'];
```

#### **교육관리 관련**
```typescript
const EDUCATION_TYPES = ['온라인', '오프라인', '혼합'];
const EDUCATION_STATUS = ['계획', '진행중', '완료', '취소'];
const EDUCATION_TARGETS = ['전직원', '신입', '팀장급', '선택'];
```

### **Phase 2: 점진적 마스터코드 도입**
```sql
-- 마스터코드 초기 데이터 삽입
INSERT INTO master_codes (category, code, name, sort_order) VALUES
-- 직급
('position', 'executive', '본부장', 1),
('position', 'team_leader', '팀장', 2),
('position', 'part_leader', '파트장', 3),
('position', 'professional', '프로', 4),

-- 팀
('team', 'dev', '개발팀', 1),
('team', 'design', '디자인팀', 2),
('team', 'planning', '기획팀', 3),
('team', 'marketing', '마케팅팀', 4),

-- 부서
('department', 'it', 'IT', 1),
('department', 'planning', '기획', 2),

-- 업무상태
('task_status', 'waiting', '대기', 1),
('task_status', 'in_progress', '진행', 2),
('task_status', 'completed', '완료', 3),
('task_status', 'on_hold', '홀딩', 4);
```

### **Phase 3: 하이브리드 API 설계**
```typescript
// 현재 호환성 유지하면서 확장성 보장
interface TaskCreateRequest {
  workContent: string;
  description?: string;
  taskType: '일반' | 'KPI'; // 현재 그대로
  status: '대기' | '진행' | '완료' | '홀딩'; // 현재 그대로
  assignee: string; // 현재 그대로 (향후 user_id로 확장)
  team: '개발팀' | '디자인팀' | '기획팀' | '마케팅팀'; // 현재 그대로
  department: 'IT' | '기획'; // 현재 그대로
  // ... 기타 필드들
}

// 백엔드 validation
class TaskService {
  async createTask(data: TaskCreateRequest) {
    // 1단계: 고정값 validation
    if (!TEAMS.includes(data.team)) {
      throw new BadRequestException('Invalid team');
    }
    
    // 2단계: 마스터코드 확장 시
    // const teamExists = await this.masterCodeService.exists('team', data.team);
    // if (!teamExists) throw new BadRequestException('Invalid team');
    
    return this.taskRepository.save(data);
  }
}
```

## 🔐 **권한 & 보안 체계**

### 🔥 개선된 권한 체계 (v3.0 치명적 위험 개선)

#### 권한 레벨 정의
```typescript
enum UserRole {
  SYSTEM_ADMIN = 'system_admin',  // 모든 기능 접근
  TEAM_LEADER = 'team_leader',    // 팀 데이터 관리
  PART_LEADER = 'part_leader',    // 파트 데이터 관리  
  MEMBER = 'member'               // 개인 데이터만
}

// 🔥 신규: 권한 위임 테이블 (휴가/출장 대응)
permission_delegations (
  id BIGSERIAL PRIMARY KEY,
  from_user_id BIGINT REFERENCES users(id),
  to_user_id BIGINT REFERENCES users(id),
  delegated_role VARCHAR(20),     -- 위임할 역할
  delegated_teams TEXT[],          -- 위임할 팀 목록 (복수 가능)
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  reason VARCHAR(200),            -- 위임 사유
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  approved_by BIGINT REFERENCES users(id),
  approved_at TIMESTAMP
);

// 🔥 신규: 복수 팀 소속 지원 (협업/겸직)
user_team_mappings (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  team VARCHAR(50) NOT NULL,
  is_primary BOOLEAN DEFAULT false,  -- 주 소속팀
  role_in_team VARCHAR(20),          -- 팀 내 역할
  start_date DATE NOT NULL,
  end_date DATE,                     -- NULL이면 현재 소속
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, team, start_date)
);

// 🔥 개선된 권한 매트릭스
권한별 접근 범위:
- SYSTEM_ADMIN: 모든 데이터 CRUD + 시스템 설정
- TEAM_LEADER: 
  * 소속 팀(복수) 전체 데이터 CRUD
  * 타 팀 데이터 읽기 전용 (협업 지원)
  * 권한 위임 승인/생성 가능
- PART_LEADER:
  * 소속 파트 데이터 CRUD
  * 같은 팀 내 타 파트 읽기 전용
  * 제한적 권한 위임 요청 가능
- MEMBER:
  * 본인 담당 데이터 CRUD
  * 팀 내 공개 데이터 읽기
  * 위임받은 권한 한시적 행사
```

## 🔄 **데이터 처리 정책 (v3.0 치명적 위험 개선)**

### 🔥 팀 변경 시 데이터 처리
```typescript
// 팀 변경 프로세스
interface TeamChangeProcess {
  // 1단계: 변경 요청
  request: {
    user_id: number;
    from_team: string;
    to_team: string;
    change_date: Date;
    reason: string;
  };
  
  // 2단계: 데이터 처리
  dataHandling: {
    ongoing_tasks: 'TRANSFER' | 'REASSIGN' | 'COMPLETE';  // 진행중 업무
    completed_tasks: 'KEEP_ORIGINAL' | 'COPY_TO_NEW';     // 완료 업무
    files: 'MAINTAIN_ACCESS' | 'TRANSFER_OWNERSHIP';      // 파일
    permissions: 'RESET' | 'MERGE';                        // 권한
  };
  
  // 3단계: 인수인계
  handover: {
    tasks_to_handover: number[];     // 인계할 업무 ID
    new_assignee: number;             // 인수자
    handover_note: string;            // 인수인계 노트
    completed_at: Date;
  };
}

// 팀 변경 처리 API
POST /api/users/:id/team-change
{
  "to_team": "개발팀",
  "change_date": "2024-02-01",
  "ongoing_tasks_handling": "REASSIGN",
  "new_assignee_id": 5
}
```

### 🔥 사용자 퇴사 처리
```sql
-- 퇴사 처리 프로세스 테이블
resignation_processes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  resignation_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED
  
  -- 업무 인계
  task_handover_to BIGINT REFERENCES users(id),
  task_handover_completed BOOLEAN DEFAULT false,
  task_handover_note TEXT,
  
  -- 파일 처리
  file_transfer_to BIGINT REFERENCES users(id),
  file_transfer_completed BOOLEAN DEFAULT false,
  
  -- 권한 회수
  permission_revoked BOOLEAN DEFAULT false,
  account_deactivated BOOLEAN DEFAULT false,
  
  processed_by BIGINT REFERENCES users(id),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 퇴사 처리 체크리스트
resignation_checklists (
  id BIGSERIAL PRIMARY KEY,
  process_id BIGINT REFERENCES resignation_processes(id),
  item_type VARCHAR(50), -- TASK, FILE, PERMISSION, ACCOUNT
  item_id BIGINT,
  action VARCHAR(50), -- TRANSFER, ARCHIVE, DELETE
  target_user_id BIGINT REFERENCES users(id),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP
);
```

### 🔥 KPI-업무 연동 데이터 동기화
```typescript
// KPI 삭제 시 연관 업무 처리
interface KpiDeletionPolicy {
  // KPI 상태에 따른 처리
  handleLinkedTasks(kpiId: number): {
    if_kpi_active: 'PREVENT_DELETION';      // 활성 KPI는 삭제 불가
    if_kpi_completed: 'MAINTAIN_REFERENCE'; // 완료 KPI는 참조 유지
    if_kpi_cancelled: 'REMOVE_REFERENCE';   // 취소 KPI는 참조 제거
  };
  
  // 연관 업무 알림
  notifyAffectedUsers: boolean;
  
  // 감사 로그
  auditLog: {
    action: 'KPI_DELETION_ATTEMPTED' | 'KPI_DELETED';
    affected_tasks: number[];
    prevented_reason?: string;
  };
}

// KPI 변경 시 업무 동기화
@Injectable()
export class KpiTaskSyncService {
  async syncKpiChanges(kpiId: number, changes: Partial<KpiEntity>) {
    // 1. 연관된 업무 찾기
    const linkedTasks = await this.taskRepo.find({
      where: { loaded_kpi_id: kpiId }
    });
    
    // 2. 중요 필드 변경 시 업무 업데이트
    if (changes.title || changes.status) {
      for (const task of linkedTasks) {
        task.loaded_kpi_title = changes.title || task.loaded_kpi_title;
        // 상태 동기화 규칙 적용
        if (changes.status === 'CANCELLED') {
          task.taskType = '일반'; // KPI 연결 해제
        }
      }
    }
    
    // 3. 변경 이력 기록
    await this.auditService.log({
      entity: 'KPI_TASK_SYNC',
      action: 'UPDATE',
      details: { kpiId, changes, affectedTasks: linkedTasks.length }
    });
  }
}

### 보안 정책
```typescript
// 비밀번호 정책
- 최소 8자리 + 특수문자 포함
- JWT 토큰 만료: 8시간
- Refresh 토큰: 7일

// 파일 보안 (🔥 검증 결과 강화)
- 업로드 제한: 100MB
- 허용 타입: PDF, Office 문서, 이미지만 (화이트리스트)
- 금지 타입: 실행파일, 스크립트 파일 (블랙리스트)
- 파일명 검증: 경로 조작 방지
- 바이러스 스캔: ZIP/압축파일 필수

// 백업 정책
- DB 백업: 매주 일요일 새벽 2시
- 파일 백업: 매주 일요일 새벽 3시
- 백업 보관: 4주분
```

## 🔄 **자동화 & 알림 시스템**

### Cron Jobs
```typescript
// 라이선스 만료 알림
@Cron('0 9 * * 1') // 매주 월요일 9시
async checkLicenseExpiry() {
  // 30일 이내 만료 라이선스 알림
}

// 업무 마감일 알림  
@Cron('0 9 * * *') // 매일 9시
async taskDeadlineReminder() {
  // 7일전, 3일전, 1일전, 당일 알림
}

// 백업 실행
@Cron('0 2 * * 0') // 매주 일요일 2시
async performBackup() {
  // DB + 파일 백업
}

// 감사로그 아카이빙
@Cron('0 1 1 * *') // 매월 1일 1시
async archiveAuditLogs() {
  // 1년 이상 로그 → archive 테이블
}
```

### 알림 종류
```typescript
enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',           // 업무 할당
  TASK_DEADLINE = 'task_deadline',           // 업무 마감임박
  LICENSE_EXPIRY = 'license_expiry',         // 라이선스 만료
  SECURITY_INCIDENT = 'security_incident',   // 보안사고
  EDUCATION_DUE = 'education_due',           // 교육 이수기한
  INSPECTION_DUE = 'inspection_due'          // 점검 실시기한
}
```

## 🛠️ **API 엔드포인트 설계**

### 인증 API
```typescript
POST /api/auth/login
POST /api/auth/logout  
POST /api/auth/refresh
GET  /api/auth/profile
PUT  /api/auth/change-password
```

### 관리자 메뉴 API
```typescript
// 마스터코드 (SYSTEM_ADMIN만)
GET    /api/admin/master-codes
POST   /api/admin/master-codes
PUT    /api/admin/master-codes/:id
DELETE /api/admin/master-codes/:id

// 시스템 설정
GET    /api/admin/system-settings
PUT    /api/admin/system-settings

// 체크리스트 템플릿
GET    /api/admin/checklist-templates
POST   /api/admin/checklist-templates
PUT    /api/admin/checklist-templates/:id
DELETE /api/admin/checklist-templates/:id

// 사용자 설정
GET    /api/admin/user-settings/:userId
PUT    /api/admin/user-settings/:userId
```

### 메인 메뉴 API (현재 프론트엔드와 완전 일치)
```typescript
// 대시보드
GET  /api/dashboard/widgets          // 사용자별 위젯 설정 조회
POST /api/dashboard/widgets          // 새 위젯 추가
PUT  /api/dashboard/widgets/:id      // 위젯 설정 변경
DELETE /api/dashboard/widgets/:id    // 위젯 삭제
GET  /api/dashboard/stats            // 대시보드 통계 데이터
  // Response: { myTasks: {...}, teamKpi: {...}, costStatus: {...}, todaySchedule: [...], notices: [...] }

// 업무관리 (TaskEditDialog와 완전 일치)
GET    /api/tasks                    // 업무 목록 조회
  // Query: ?team=개발팀&status=진행&assignee=김철수&page=1&limit=20
  // Response: TaskTableData[]
GET    /api/tasks/:id                // 특정 업무 상세 조회
POST   /api/tasks                    // 새 업무 등록
  // Body: { workContent, description, taskType, status, assignee, team, department, progress, registrationDate, startDate, completedDate }
PUT    /api/tasks/:id                // 업무 수정
DELETE /api/tasks/:id                // 업무 삭제 (논리삭제)

// 업무 체크리스트 (계층구조 지원)
GET    /api/tasks/:id/checklists     // 업무의 체크리스트 조회
POST   /api/tasks/:id/checklists     // 새 체크리스트 항목 추가
PUT    /api/tasks/:id/checklists/:itemId  // 체크리스트 항목 수정
DELETE /api/tasks/:id/checklists/:itemId  // 체크리스트 항목 삭제
PUT    /api/tasks/:id/checklists/:itemId/toggle  // 체크박스 토글

// 업무 댓글 (기록탭)
GET    /api/tasks/:id/comments       // 업무 댓글 목록
POST   /api/tasks/:id/comments       // 새 댓글 추가
PUT    /api/tasks/:id/comments/:commentId  // 댓글 수정
DELETE /api/tasks/:id/comments/:commentId  // 댓글 삭제

// 업무 파일 (자료탭)
GET    /api/tasks/:id/files          // 업무 첨부파일 목록
POST   /api/tasks/:id/files          // 파일 업로드
DELETE /api/tasks/:id/files/:fileId  // 파일 삭제
GET    /api/tasks/:id/files/:fileId/download  // 파일 다운로드

// KPI관리 (KpiEditDialog와 완전 일치)
GET    /api/kpis                     // KPI 목록 조회
  // Query: ?team=개발팀&status=진행&assignee=김철수
GET    /api/kpis/:id                 // 특정 KPI 상세 조회
POST   /api/kpis                     // 새 KPI 등록
PUT    /api/kpis/:id                 // KPI 수정 (is_locked 체크)
DELETE /api/kpis/:id                 // KPI 삭제 (논리삭제)

// KPI 체크리스트 (업무와 동일한 구조)
GET    /api/kpis/:id/checklists      // KPI 체크리스트 조회
POST   /api/kpis/:id/checklists      // 새 체크리스트 항목 추가
PUT    /api/kpis/:id/checklists/:itemId     // 체크리스트 항목 수정
DELETE /api/kpis/:id/checklists/:itemId     // 체크리스트 항목 삭제
PUT    /api/kpis/:id/checklists/:itemId/toggle  // 체크박스 토글

// KPI 팀별 조회 (업무관리에서 "KPI 불러오기"용)
GET    /api/kpis/team/:teamName      // 특정 팀의 KPI 목록
  // Response: KPI 목록 + 체크리스트 계층구조

// KPI 댓글 및 파일 (업무와 동일)
GET    /api/kpis/:id/comments        // KPI 댓글 목록
POST   /api/kpis/:id/comments        // 새 댓글 추가
GET    /api/kpis/:id/files           // KPI 첨부파일 목록
POST   /api/kpis/:id/files           // 파일 업로드

// 일정관리
GET    /api/calendar/events          // 일정 목록 조회
  // Query: ?start=2024-01-01&end=2024-01-31&type=meeting
POST   /api/calendar/events          // 새 일정 등록
PUT    /api/calendar/events/:id      // 일정 수정
DELETE /api/calendar/events/:id      // 일정 삭제

// 개인교육관리
GET    /api/personal-educations      // 개인교육 목록 조회
  // Query: ?participant=userId&status=진행중
POST   /api/personal-educations      // 새 교육 등록
PUT    /api/personal-educations/:id  // 교육 정보 수정
DELETE /api/personal-educations/:id  // 교육 삭제
POST   /api/personal-educations/:id/complete  // 교육 완료 처리

// 비용관리
GET    /api/costs                    // 비용 목록 조회
  // Query: ?category=운영비&status=승인&requestedBy=userId
POST   /api/costs                    // 새 비용 신청
PUT    /api/costs/:id                // 비용 정보 수정
DELETE /api/costs/:id                // 비용 삭제
POST   /api/costs/:id/approve        // 비용 승인
POST   /api/costs/:id/reject         // 비용 반려
GET    /api/costs/:id/files          // 비용 첨부파일 목록
POST   /api/costs/:id/files          // 비용 파일 업로드
```

### 기획 메뉴 API
```typescript
// 매출관리
GET  /api/planning/sales
POST /api/planning/sales
GET  /api/planning/sales/analytics

// 투자관리
GET  /api/planning/investments
POST /api/planning/investments
PUT  /api/planning/investments/:id
GET  /api/planning/investments/:id/milestones
```

### IT 메뉴 API
```typescript
// VOC관리
GET  /api/it/vocs
POST /api/it/vocs
PUT  /api/it/vocs/:id
POST /api/it/vocs/:id/response

// 솔루션관리
GET  /api/it/solutions
POST /api/it/solutions
PUT  /api/it/solutions/:id
POST /api/it/solutions/:id/assign

// 하드웨어관리
GET  /api/it/hardware
POST /api/it/hardware
PUT  /api/it/hardware/:id
POST /api/it/hardware/:id/maintenance

// 소프트웨어관리
GET  /api/it/software
POST /api/it/software
PUT  /api/it/software/:id
GET  /api/it/software/:id/license-status
GET  /api/it/licenses/expiring      // 만료 예정 목록

// IT교육관리
GET  /api/it/educations
POST /api/it/educations
PUT  /api/it/educations/:id
POST /api/it/educations/:id/enroll
```

### 보안 메뉴 API
```typescript
// 보안점검관리
GET  /api/security/inspections
POST /api/security/inspections
PUT  /api/security/inspections/:id
POST /api/security/inspections/:id/items

// 보안교육관리
GET  /api/security/educations
POST /api/security/educations
PUT  /api/security/educations/:id
POST /api/security/educations/:id/enroll

// 보안사고관리
GET  /api/security/incidents
POST /api/security/incidents
PUT  /api/security/incidents/:id
POST /api/security/incidents/:id/escalate
POST /api/security/incidents/:id/actions

// 보안규정관리
GET  /api/security/regulations
POST /api/security/regulations
PUT  /api/security/regulations/:id
POST /api/security/regulations/:id/acknowledge
GET  /api/security/regulations/:id/views
```

### AI 대화 API
```typescript
POST /api/ai/chat                    // 메시지 전송
GET  /api/ai/conversations           // 대화 이력
GET  /api/ai/prompts                 // 프롬프트 템플릿
DELETE /api/ai/conversations/:id     // 대화 삭제
```

### 공통 API
```typescript
// 파일 관리
POST   /api/files/upload             // 100MB 제한
GET    /api/files/:id/download
DELETE /api/files/:id

// 감사로그
GET    /api/audit-logs               // 권한별 조회
GET    /api/audit-logs/export        // Excel 다운로드

// 알림
GET    /api/notifications
PUT    /api/notifications/:id/read
POST   /api/notifications/settings
DELETE /api/notifications/:id

// 마스터코드 조회 (모든 사용자)
GET    /api/master-codes/:category
```

## 🚀 **성능 최적화 설계 (🔥 검증 결과 추가)**

### 필수 데이터베이스 인덱스
```sql
-- 🔍 핵심 검색 성능 인덱스
CREATE INDEX idx_tasks_assignee ON tasks(assignee) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_team ON tasks(team) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_status ON tasks(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_department ON tasks(department) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_task_type ON tasks(task_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_registration_date ON tasks(registration_date DESC);

-- KPI 검색 최적화
CREATE INDEX idx_kpis_team ON kpis(team) WHERE deleted_at IS NULL;
CREATE INDEX idx_kpis_assignee ON kpis(assignee) WHERE deleted_at IS NULL;
CREATE INDEX idx_kpis_status ON kpis(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_kpis_is_locked ON kpis(is_locked) WHERE deleted_at IS NULL;

-- 체크리스트 계층구조 최적화
CREATE INDEX idx_task_checklists_task_id ON task_checklists(task_id, parent_id, level);
CREATE INDEX idx_kpi_checklists_kpi_id ON kpi_checklists(kpi_id, parent_id, level);

-- 파일 시스템 최적화
CREATE INDEX idx_task_files_task_id ON task_files(task_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_kpi_files_kpi_id ON kpi_files(kpi_id) WHERE deleted_at IS NULL;

-- 감사로그 성능 (파티셔닝 전 임시)
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_logs_user_date ON audit_logs(user_id, created_at DESC);

-- 논리삭제 최적화 (모든 주요 테이블)
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_costs_deleted_at ON costs(deleted_at);
```

### 캐싱 전략
```typescript
// Redis 캐시 키 설계
const CACHE_KEYS = {
  MASTER_CODES: 'master_codes:',
  TEAM_USERS: 'team_users:',
  USER_PERMISSIONS: 'user_permissions:',
  SYSTEM_SETTINGS: 'system_settings'
};

// 캐시 TTL 설정
- 마스터코드: 1시간 (자주 변경되지 않음)
- 사용자 권한: 30분 (보안 중요)  
- 팀별 사용자: 15분 (조직변경 반영)
- 시스템 설정: 10분 (실시간 반영 필요)
```

### 쿼리 최적화 전략
```sql
-- 계층구조 체크리스트 효율적 조회 (CTE 사용)
WITH RECURSIVE checklist_tree AS (
  SELECT *, 0 as depth FROM task_checklists 
  WHERE task_id = ? AND parent_id IS NULL AND deleted_at IS NULL
  UNION ALL
  SELECT tc.*, ct.depth + 1 FROM task_checklists tc
  JOIN checklist_tree ct ON tc.parent_id = tc.id
  WHERE tc.deleted_at IS NULL
)
SELECT * FROM checklist_tree ORDER BY level, sort_order;

-- 업무 목록 조회 최적화 (필터링 + 페이징)
SELECT t.*, COUNT(*) OVER() as total_count
FROM tasks t
WHERE t.deleted_at IS NULL
  AND (? IS NULL OR t.team = ?)
  AND (? IS NULL OR t.assignee = ?)
  AND (? IS NULL OR t.status = ?)
ORDER BY t.registration_date DESC
LIMIT ? OFFSET ?;
```

## 🔐 **보안 강화 설계 (🔥 검증 결과 추가)**

### 파일 업로드 보안 정책
```typescript
// 파일 업로드 검증 로직
const FILE_SECURITY = {
  // 허용 파일 타입 (화이트리스트)
  ALLOWED_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg', 'image/png', 'image/gif',
    'text/plain', 'text/csv'
  ],
  
  // 금지 확장자 (블랙리스트)
  FORBIDDEN_EXTENSIONS: [
    '.exe', '.bat', '.cmd', '.scr', '.pif', '.com',
    '.js', '.vbs', '.jar', '.php', '.asp', '.jsp'
  ],
  
  // 파일 크기 제한
  MAX_SIZE: 100 * 1024 * 1024, // 100MB
  
  // 파일명 검증 정규식 (경로 조작 방지)
  FILENAME_REGEX: /^[a-zA-Z0-9\-_\.\s\(\)\[\]]+$/,
  
  // 스캔 필수 확장자
  SCAN_REQUIRED: ['.zip', '.rar', '.7z', '.tar', '.gz']
};
```

### API 권한 Guard 구현
```typescript
// 역할 기반 권한 Guard
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      'roles', [context.getHandler(), context.getClass()]
    );
    
    if (!requiredRoles) return true;
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some(role => user.role === role);
  }
}

// 팀/조직 기반 권한 Guard  
@Injectable()
export class TeamAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const { user, params, query, body } = request;
    
    // SYSTEM_ADMIN은 모든 접근 허용
    if (user.role === UserRole.SYSTEM_ADMIN) return true;
    
    // 팀 데이터 접근 권한 검증
    const targetTeam = params.team || query.team || body.team;
    if (targetTeam && user.team !== targetTeam) {
      if (user.role === UserRole.TEAM_LEADER) return false;
    }
    
    return true;
  }
}
```

## 📅 **현실적 구현 일정 (9-10주) (🔥 v3.0 리스크 버퍼 추가)**

### Phase 1: 기반 시스템 + 권한 체계 (1.5주) 🔥
```
Week 1-1.5:
✅ NestJS 프로젝트 셋업 + PostgreSQL Docker
✅ Prisma 스키마 작성 (v3.0 개선사항 포함)
✅ 🔥 권한 위임 시스템 구현
✅ 🔥 복수 팀 소속 지원 구현
✅ JWT 인증 + 자동 갱신 로직
✅ 기본 CRUD 보일러플레이트 생성
✅ 파일 업로드 기본 구조
```

### Phase 2: 업무관리 핵심 구현 (3주) 🔥 버퍼 추가
```
Week 2-3:
✅ 업무관리 기본 CRUD + 체크리스트 기반
  - TaskEditDialog 기본 필드 API 구현
  - 체크리스트 계층구조 데이터베이스 설계  
  - 기본 체크리스트 CRUD (단순 버전)
  - 🔥 팀 변경 처리 로직 구현

Week 4:
✅ 업무관리 고급 기능 + 보안 완성
  - 체크리스트 드래그앤드롭 + 진척율 관리
  - 댓글 시스템 완전 구현
  - 🔥 개선된 권한 Guard 구현 (위임 포함)
  - 파일 보안 정책 적용 (화이트리스트)
  - 성능 인덱스 적용
```

### Phase 3: KPI관리 + 데이터 정책 (2주) 🔥
```
Week 5-6:
✅ KPI관리 완전 구현
  - KpiEditDialog와 100% 일치하는 API  
  - 🔥 KPI-업무 동기화 서비스 구현
  - 🔥 KPI 삭제 정책 적용
  - 체크리스트 CRUD (업무 로직 재사용)
  - is_locked 처리 + 상태 관리
  - 캐싱 전략 적용 (Redis)
✅ 🔥 퇴사 처리 프로세스 구현
```

### Phase 4: 관리자 + 보조 메뉴 (1.5주)
```
Week 7-7.5:
✅ 마스터코드 관리 (하이브리드 방식)
✅ 시스템 설정 관리
✅ 사용자 설정 관리  
✅ 감사로그 시스템 구현
✅ 비용관리 CRUD (기본)
✅ 일정관리 CRUD (기본)
```

### Phase 5: 프론트엔드 연동 + 안정화 (1.5주) 🔥
```
Week 8-8.5:
✅ 프론트엔드 연동 테스트
✅ API 구조 조정 및 버그 수정
✅ 🔥 권한 위임 UI 연동
✅ 🔥 팀 변경/퇴사 프로세스 UI 연동
✅ 실제 데이터 흐름 검증
✅ 성능 최적화 적용
```

### Phase 6: 리스크 버퍼 + 확장 (1.5주) 🔥
```
Week 9-10:
✅ 🔥 예상치 못한 이슈 대응 (필수 버퍼)
✅ 통합 테스트 및 버그 수정
✅ 성능 병목 지점 최적화
✅ 문서화 및 인수인계 준비
✅ (선택) 전문 모듈 구현
✅ (선택) AI 대화 기본 구현
```

### **🎯 우선순위 기반 구현 전략 (검증 결과 반영)**
1. **MVP 우선**: 업무관리 + KPI관리만 완벽 구현
2. **보안 강화**: 파일 업로드 보안을 별도 마일스톤으로 관리
3. **성능 확보**: 인덱스를 초기 단계에 적용
4. **점진적 확장**: 나머지 모듈은 기본 CRUD부터 시작
5. **연동 시간 충분 확보**: 1주일 연동 기간으로 안정성 확보

### **위험 완화 전략**
- 체크리스트 복잡도 단계적 구현 (기본 → 계층구조 → 드래그앤드롭)
- 파일 보안 정책 별도 구현 (기본 업로드 → 보안 강화)
- API 구조 변경 가능성을 고려한 유연한 설계

### **기존 Phase 5: 최종화 + 연동 (0.5주)
```
Week 5.5-6:
✅ AI 대화 기본 구현
✅ 프론트엔드 연동 테스트
✅ 성능 최적화 (인덱스 추가)
✅ API 문서화 (Swagger)
✅ 배포 준비
```

### **단축 가능한 이유**
1. **현재 프론트엔드 기반 설계**: 요구사항이 명확함
2. **하이브리드 접근**: 복잡한 정규화 없이 빠른 구현
3. **핵심 모듈 우선**: 업무/KPI만 완벽하게 구현
4. **단계적 확장**: 나머지 모듈은 기본 CRUD로 시작

## 🗄️ **PostgreSQL 설정 가이드**

### Docker로 PostgreSQL 실행 (추천)
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: mainly-postgres
    environment:
      POSTGRES_DB: mainly_db
      POSTGRES_USER: mainly_user
      POSTGRES_PASSWORD: mainly_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: mainly-redis
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  postgres_data:
```

### NestJS에서 PostgreSQL 연결

#### 필요한 패키지 설치
```bash
npm install @prisma/client prisma
npm install @nestjs/config
npm install bcrypt @types/bcrypt
npm install @nestjs/passport passport passport-jwt passport-local
npm install @nestjs/jwt
npm install @nestjs/schedule
npm install class-validator class-transformer
npm install @nestjs/swagger swagger-ui-express
```

#### Prisma 설정
```bash
# Prisma 초기화
npx prisma init

# 마이그레이션 생성
npx prisma migrate dev --name init

# Prisma Client 생성
npx prisma generate

# Prisma Studio (DB 관리 GUI)
npx prisma studio
```

## 🔧 **개발 환경 설정**

### 환경변수 (.env)
```env
# Database
DATABASE_URL="postgresql://mainly_user:mainly_password@localhost:5432/mainly_db"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key-here"
JWT_EXPIRE="8h"
REFRESH_EXPIRE="7d"

# File Upload
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE=104857600  # 100MB

# AI Integration
AI_API_URL="https://api.openai.com/v1"
AI_API_KEY="your-ai-api-key"

# Email (알림용)
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-password"

# Backup
BACKUP_PATH="./backups"
BACKUP_RETENTION_DAYS=28

# Server
PORT=3100
NODE_ENV=development
```

### 실행 순서
```bash
# 1. PostgreSQL 실행
docker-compose up -d

# 2. 데이터베이스 마이그레이션
npx prisma migrate dev

# 3. 시드 데이터 입력
npx prisma db seed

# 4. NestJS 앱 실행
npm run start:dev
```

## 📝 **추가 구현 사항**

### 시스템 설정 관리 항목
- 비밀번호 정책: 8글자 이상 + 특수문자 포함
- 세션 타임아웃: 8시간
- 파일 업로드 제한: 100MB
- 백업 주기: 매주 일요일

### 대시보드 위젯
- 내 업무 현황 (진행중/완료/지연)
- 팀 KPI 달성률
- 이번달 비용 집행 현황
- 오늘의 일정
- 최근 공지사항
- 사용자별 위젯 커스터마이징 가능

### 특수 요구사항
- 업무관리-KPI 연동: KPI에서 업무로 불러온 경우 KPI 수정 불가
- 논리적 삭제: 모든 데이터는 deleted_at 플래그로 관리
- 변경 이력 추적: 모든 중요 변경사항 audit_logs에 기록
- 라이선스 만료 알림: 30일 전 자동 알림
- AI 대화 이력: 영구 보관
- 팀-파트 계층 구조: 최대 10개 파트

## 🚀 **배포 및 운영**

### Docker 컨테이너화
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3100

CMD ["npm", "run", "start:prod"]
```

### 모니터링 및 로깅
- 애플리케이션 로그: Winston logger
- API 응답 시간 모니터링
- 데이터베이스 쿼리 성능 추적
- 에러 알림 시스템

이 계획서에 따라 구현하면 현재 프론트엔드와 완벽하게 연동되는 풀스택 MAINLY 시스템이 완성됩니다.