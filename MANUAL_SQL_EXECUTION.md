# 🛠️ 수동 SQL 실행 가이드

## 현재 상황
- API 키 인증 문제로 자동화된 스키마 생성 실패
- CLI 접근 제한으로 인한 로그인 불가
- **해결책**: Supabase Dashboard에서 수동 SQL 실행 필요

## 📋 단계별 실행 가이드

### 1️⃣ Supabase Dashboard 접속
**URL**: https://supabase.com/dashboard/project/exxumujwufzqnovhzvif

### 2️⃣ SQL Editor로 이동
- 좌측 메뉴에서 "SQL Editor" 클릭
- 새 쿼리 생성

### 3️⃣ 1단계 SQL 실행
**파일**: `sql-for-dashboard/01-extensions-and-basic-tables.sql`

```sql
-- 1. 필수 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- 2. 사용자 프로필 테이블 (auth.users 확장)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  department TEXT,
  position TEXT,
  -- Next-Auth 마이그레이션 필드
  nextauth_migrated BOOLEAN DEFAULT FALSE,
  nextauth_original_id TEXT,
  migration_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 마이그레이션 로그 테이블
CREATE TABLE migration_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  migration_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  migrated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 코드 시퀀스 관리 테이블
CREATE TABLE code_sequences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  module_type TEXT NOT NULL, -- 'COST', 'TASK', 'EDUCATION'
  year INTEGER NOT NULL,
  current_sequence INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(module_type, year)
);

-- 5. RLS 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_log ENABLE ROW LEVEL SECURITY;

-- 6. 기본 정책 설정
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 관리자만 마이그레이션 로그 조회 가능
CREATE POLICY "Admins can view migration logs" ON migration_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 4️⃣ 2단계 SQL 실행
**파일**: `sql-for-dashboard/02-cost-management-tables.sql`

```sql
-- 1. 비용 기록 메인 테이블
CREATE TABLE cost_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  registration_date DATE NOT NULL,
  start_date DATE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  team TEXT NOT NULL,
  assignee_id UUID REFERENCES user_profiles(id),
  cost_type TEXT NOT NULL CHECK (cost_type IN ('솔루션', '하드웨어', '출장경비', '행사경비', '사무경비')),
  content TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status TEXT DEFAULT '대기' CHECK (status IN ('대기', '진행', '완료', '취소')),
  completion_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  
  -- 자동 계산 검증 제약조건
  CONSTRAINT check_amount_calculation CHECK (amount = quantity * unit_price)
);

-- 2. 금액 상세 테이블
CREATE TABLE cost_amount_details (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cost_record_id UUID REFERENCES cost_records(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  cost_type TEXT NOT NULL,
  content TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  
  CONSTRAINT check_detail_amount_calculation CHECK (amount = quantity * unit_price)
);

-- 3. 비용 코멘트 테이블
CREATE TABLE cost_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cost_record_id UUID REFERENCES cost_records(id) ON DELETE CASCADE,
  author_id UUID REFERENCES user_profiles(id),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 첨부파일 테이블 (완전 스토리지 통합)
CREATE TABLE cost_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cost_record_id UUID REFERENCES cost_records(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'cost-attachments',
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES user_profiles(id),
  
  -- 파일 검증 제약조건
  CONSTRAINT check_file_size CHECK (file_size > 0 AND file_size <= 52428800), -- 50MB 제한
  CONSTRAINT check_file_type CHECK (file_type IN (
    'application/pdf', 
    'image/jpeg', 
    'image/png', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ))
);

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX idx_cost_records_assignee ON cost_records(assignee_id);
CREATE INDEX idx_cost_records_status ON cost_records(status);
CREATE INDEX idx_cost_records_team ON cost_records(team);
CREATE INDEX idx_cost_records_date ON cost_records(registration_date);
CREATE INDEX idx_cost_records_created_at ON cost_records(created_at DESC);
CREATE INDEX idx_cost_records_amount ON cost_records(amount DESC);

-- 복합 인덱스 (자주 함께 사용되는 컬럼들)
CREATE INDEX idx_cost_records_team_status ON cost_records(team, status);
CREATE INDEX idx_cost_records_assignee_status ON cost_records(assignee_id, status);

-- 6. RLS 활성화
ALTER TABLE cost_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_amount_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_attachments ENABLE ROW LEVEL SECURITY;

-- 7. 비용 기록 정책
CREATE POLICY "Users can view cost records" ON cost_records
  FOR SELECT USING (
    assignee_id = auth.uid() OR 
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert cost records" ON cost_records
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update cost records" ON cost_records
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can delete own cost records" ON cost_records
  FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 5️⃣ 3단계 SQL 실행
**파일**: `sql-for-dashboard/03-task-education-tables.sql`

```sql
-- 1. 업무 기록 테이블
CREATE TABLE task_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  no SERIAL,
  registration_date DATE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  team TEXT NOT NULL CHECK (team IN ('개발팀', '디자인팀', '기획팀', '마케팅팀')),
  department TEXT NOT NULL CHECK (department IN ('IT', '기획')),
  work_content TEXT NOT NULL,
  status TEXT DEFAULT '대기' CHECK (status IN ('대기', '진행', '완료', '홀딩')),
  assignee_id UUID REFERENCES user_profiles(id),
  start_date DATE,
  completed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- 2. 업무 첨부파일 테이블
CREATE TABLE task_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_record_id UUID REFERENCES task_records(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'task-attachments',
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES user_profiles(id)
);

-- 3. 교육 기록 테이블
CREATE TABLE education_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  registration_date DATE NOT NULL,
  start_date DATE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  education_type TEXT NOT NULL CHECK (education_type IN ('신입교육', '담당자교육', '관리자교육', '수시교육')),
  content TEXT NOT NULL,
  participants INTEGER DEFAULT 0,
  location TEXT NOT NULL,
  status TEXT DEFAULT '예정' CHECK (status IN ('예정', '진행', '완료', '취소')),
  completion_date DATE,
  assignee_id UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- 4. 커리큘럼 테이블
CREATE TABLE education_curriculum (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  education_record_id UUID REFERENCES education_records(id) ON DELETE CASCADE,
  time_slot TEXT NOT NULL,
  subject TEXT NOT NULL,
  instructor TEXT NOT NULL,
  content TEXT NOT NULL,
  attachment_path TEXT,
  sort_order INTEGER DEFAULT 0
);

-- 5. 참석자 테이블
CREATE TABLE education_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  education_record_id UUID REFERENCES education_records(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES user_profiles(id),
  department TEXT NOT NULL,
  attendance_status TEXT DEFAULT '예정' CHECK (attendance_status IN ('예정', '참석', '불참', '지각')),
  completion_status TEXT DEFAULT '미완료' CHECK (completion_status IN ('미완료', '완료', '부분완료')),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_task_records_assignee ON task_records(assignee_id);
CREATE INDEX idx_task_records_status ON task_records(status);
CREATE INDEX idx_task_records_team ON task_records(team);
CREATE INDEX idx_task_records_created_at ON task_records(created_at DESC);
CREATE INDEX idx_task_records_department ON task_records(department);
CREATE INDEX idx_task_records_team_status ON task_records(team, status);

CREATE INDEX idx_education_records_assignee ON education_records(assignee_id);
CREATE INDEX idx_education_records_status ON education_records(status);
CREATE INDEX idx_education_records_date ON education_records(start_date);
CREATE INDEX idx_education_participants_education ON education_participants(education_record_id);
CREATE INDEX idx_education_participants_participant ON education_participants(participant_id);

-- RLS 활성화
ALTER TABLE task_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_curriculum ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_participants ENABLE ROW LEVEL SECURITY;

-- Task Records RLS
CREATE POLICY "Users can view task records" ON task_records
  FOR SELECT USING (
    assignee_id = auth.uid() OR 
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert task records" ON task_records
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update task records" ON task_records
  FOR UPDATE USING (
    created_by = auth.uid() OR
    assignee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Education Records RLS
CREATE POLICY "Users can view education records" ON education_records FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage education records" ON education_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can view education curriculum" ON education_curriculum FOR SELECT USING (TRUE);
CREATE POLICY "Users can view education participants" ON education_participants FOR SELECT USING (TRUE);

-- 테이블 코멘트 추가
COMMENT ON TABLE cost_records IS 'Nexwork 비용관리 메인 테이블 - 완벽버전 스키마';
COMMENT ON TABLE task_records IS 'Nexwork 업무관리 메인 테이블';  
COMMENT ON TABLE education_records IS 'Nexwork 교육관리 메인 테이블';
```

## ✅ 완료 확인

모든 SQL 실행 후 다음 명령어로 확인:
```bash
npm run supabase:migrate-data
npm run supabase:verify
```

## 🚨 중요 사항
1. **순서대로 실행**: 1단계 → 2단계 → 3단계
2. **에러 확인**: 각 단계에서 에러가 없는지 확인
3. **권한 확인**: Service Role로 로그인되어 있는지 확인