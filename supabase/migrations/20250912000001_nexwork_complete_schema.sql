-- Nexwork Frontend 완전한 스키마 생성 (완벽버전 계획서 기반)
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================
-- 1. USER PROFILES (사용자 프로필 확장)
-- =====================================
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  department TEXT,
  position TEXT,
  -- Next-Auth 마이그레이션 관련 필드
  nextauth_migrated BOOLEAN DEFAULT FALSE,
  nextauth_original_id TEXT,
  migration_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 마이그레이션 로그 테이블
CREATE TABLE migration_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  migration_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  migrated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- 2. CODE SEQUENCES (코드 시퀀스 관리)
-- =====================================
CREATE TABLE code_sequences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  module_type TEXT NOT NULL, -- 'COST', 'TASK', 'EDUCATION'
  year INTEGER NOT NULL,
  current_sequence INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(module_type, year)
);

-- =====================================
-- 3. COST MANAGEMENT (비용관리 모듈)
-- =====================================

-- 비용 기록 메인 테이블
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

-- 금액 상세 테이블
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

-- 비용 코멘트 테이블
CREATE TABLE cost_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cost_record_id UUID REFERENCES cost_records(id) ON DELETE CASCADE,
  author_id UUID REFERENCES user_profiles(id),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 첨부파일 테이블 (완전 스토리지 통합)
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

-- =====================================
-- 4. TASK MANAGEMENT (업무관리 모듈)
-- =====================================

-- 업무 테이블
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

-- 업무 첨부파일 테이블
CREATE TABLE task_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_record_id UUID REFERENCES task_records(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'task-attachments',
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES user_profiles(id)
);

-- =====================================
-- 5. EDUCATION MANAGEMENT (교육관리 모듈)
-- =====================================

-- 교육 기록 테이블
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

-- 커리큘럼 테이블
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

-- 참석자 테이블
CREATE TABLE education_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  education_record_id UUID REFERENCES education_records(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES user_profiles(id),
  department TEXT NOT NULL,
  attendance_status TEXT DEFAULT '예정' CHECK (attendance_status IN ('예정', '참석', '불참', '지각')),
  completion_status TEXT DEFAULT '미완료' CHECK (completion_status IN ('미완료', '완료', '부분완료')),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- 6. PERFORMANCE OPTIMIZED INDEXES
-- =====================================

-- Cost Records 인덱스
CREATE INDEX idx_cost_records_assignee ON cost_records(assignee_id);
CREATE INDEX idx_cost_records_status ON cost_records(status);
CREATE INDEX idx_cost_records_team ON cost_records(team);
CREATE INDEX idx_cost_records_date ON cost_records(registration_date);
CREATE INDEX idx_cost_records_created_at ON cost_records(created_at DESC);
CREATE INDEX idx_cost_records_amount ON cost_records(amount DESC);

-- Task Records 인덱스
CREATE INDEX idx_task_records_assignee ON task_records(assignee_id);
CREATE INDEX idx_task_records_status ON task_records(status);
CREATE INDEX idx_task_records_team ON task_records(team);
CREATE INDEX idx_task_records_created_at ON task_records(created_at DESC);
CREATE INDEX idx_task_records_department ON task_records(department);

-- Education Records 인덱스
CREATE INDEX idx_education_records_assignee ON education_records(assignee_id);
CREATE INDEX idx_education_records_status ON education_records(status);
CREATE INDEX idx_education_records_date ON education_records(start_date);
CREATE INDEX idx_education_participants_education ON education_participants(education_record_id);
CREATE INDEX idx_education_participants_participant ON education_participants(participant_id);

-- 복합 인덱스 (자주 함께 사용되는 컬럼들)
CREATE INDEX idx_cost_records_team_status ON cost_records(team, status);
CREATE INDEX idx_cost_records_assignee_status ON cost_records(assignee_id, status);
CREATE INDEX idx_task_records_team_status ON task_records(team, status);

-- =====================================
-- 7. ROW LEVEL SECURITY (RLS) 정책
-- =====================================

-- User Profiles RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_log ENABLE ROW LEVEL SECURITY;

-- User Profiles 정책
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

-- Migration Log (관리자만 접근)
CREATE POLICY "Admins can view migration logs" ON migration_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Cost Records RLS
ALTER TABLE cost_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_amount_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_attachments ENABLE ROW LEVEL SECURITY;

-- 비용 기록 정책
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

-- Cost Amount Details 정책 (부모 레코드와 동일)
CREATE POLICY "Users can view cost amount details" ON cost_amount_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cost_records cr
      WHERE cr.id = cost_record_id AND (
        cr.assignee_id = auth.uid() OR 
        cr.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
      )
    )
  );

-- Cost Comments 정책
CREATE POLICY "Users can view cost comments" ON cost_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cost_records cr
      WHERE cr.id = cost_record_id AND (
        cr.assignee_id = auth.uid() OR 
        cr.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
      )
    )
  );

CREATE POLICY "Users can insert cost comments" ON cost_comments
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own cost comments" ON cost_comments
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can delete own cost comments" ON cost_comments
  FOR DELETE USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Task Records RLS
ALTER TABLE task_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE education_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_curriculum ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_participants ENABLE ROW LEVEL SECURITY;

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

-- =====================================
-- 8. FUNCTIONS (코드 생성 및 유틸리티)
-- =====================================

-- 다음 시퀀스 번호 가져오기 함수
CREATE OR REPLACE FUNCTION get_next_sequence(module_type TEXT, year INTEGER)
RETURNS INTEGER AS $$
DECLARE
  next_seq INTEGER;
BEGIN
  INSERT INTO code_sequences (module_type, year, current_sequence)
  VALUES (module_type, year, 1)
  ON CONFLICT (module_type, year)
  DO UPDATE SET 
    current_sequence = code_sequences.current_sequence + 1,
    updated_at = NOW();
  
  SELECT current_sequence INTO next_seq
  FROM code_sequences
  WHERE code_sequences.module_type = get_next_sequence.module_type 
    AND code_sequences.year = get_next_sequence.year;
  
  RETURN next_seq;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 비용 코드 자동 생성 함수
CREATE OR REPLACE FUNCTION generate_cost_code()
RETURNS TEXT AS $$
DECLARE
  year_suffix TEXT;
  sequence_num INTEGER;
  new_code TEXT;
BEGIN
  year_suffix := SUBSTR(EXTRACT(year FROM NOW())::TEXT, 3, 2);
  sequence_num := get_next_sequence('COST', EXTRACT(year FROM NOW())::INTEGER);
  new_code := 'COST-' || year_suffix || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 업무 코드 자동 생성 함수
CREATE OR REPLACE FUNCTION generate_task_code()
RETURNS TEXT AS $$
DECLARE
  year_suffix TEXT;
  sequence_num INTEGER;
  new_code TEXT;
BEGIN
  year_suffix := SUBSTR(EXTRACT(year FROM NOW())::TEXT, 3, 2);
  sequence_num := get_next_sequence('TASK', EXTRACT(year FROM NOW())::INTEGER);
  new_code := 'TASK-' || year_suffix || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 교육 코드 자동 생성 함수
CREATE OR REPLACE FUNCTION generate_education_code()
RETURNS TEXT AS $$
DECLARE
  year_suffix TEXT;
  sequence_num INTEGER;
  new_code TEXT;
BEGIN
  year_suffix := SUBSTR(EXTRACT(year FROM NOW())::TEXT, 3, 2);
  sequence_num := get_next_sequence('EDUCATION', EXTRACT(year FROM NOW())::INTEGER);
  new_code := 'EDU-' || year_suffix || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 통계 조회 함수
CREATE OR REPLACE FUNCTION get_cost_statistics(
  team_filter TEXT DEFAULT NULL,
  date_from DATE DEFAULT NULL,
  date_to DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH filtered_costs AS (
    SELECT * FROM cost_records
    WHERE (team_filter IS NULL OR team = team_filter)
      AND (date_from IS NULL OR registration_date >= date_from)
      AND (date_to IS NULL OR registration_date <= date_to)
  )
  SELECT json_build_object(
    'total_amount', COALESCE(SUM(amount), 0),
    'total_count', COUNT(*),
    'status_breakdown', json_object_agg(status, status_count),
    'type_breakdown', json_object_agg(cost_type, type_amount)
  ) INTO result
  FROM (
    SELECT 
      SUM(amount) as amount,
      status,
      cost_type,
      COUNT(*) as status_count,
      SUM(amount) as type_amount
    FROM filtered_costs
    GROUP BY CUBE(status, cost_type)
  ) grouped;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- 9. TRIGGERS (자동 업데이트 트리거)
-- =====================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 트리거 적용
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cost_records_updated_at 
  BEFORE UPDATE ON cost_records 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_records_updated_at 
  BEFORE UPDATE ON task_records 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_education_records_updated_at 
  BEFORE UPDATE ON education_records 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_code_sequences_updated_at 
  BEFORE UPDATE ON code_sequences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- 10. INITIAL DATA SETUP
-- =====================================

-- 기본 관리자 사용자 생성을 위한 함수 (인증 후 호출)
CREATE OR REPLACE FUNCTION create_admin_profile(
  user_id UUID,
  user_email TEXT,
  user_name TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_profiles (id, email, name, role, department, position)
  VALUES (user_id, user_email, user_name, 'admin', 'IT', 'System Administrator')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = 'admin',
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage 버킷 생성을 위한 정책 (Storage 탭에서 수동 생성 필요)
-- cost-attachments, task-attachments, education-materials 버킷 생성

COMMENT ON TABLE cost_records IS 'Nexwork 비용관리 메인 테이블 - 완벽버전 스키마';
COMMENT ON TABLE task_records IS 'Nexwork 업무관리 메인 테이블';  
COMMENT ON TABLE education_records IS 'Nexwork 교육관리 메인 테이블';
COMMENT ON FUNCTION generate_cost_code() IS '비용 코드 자동 생성: COST-YY-NNN 형식';
COMMENT ON FUNCTION get_cost_statistics(TEXT, DATE, DATE) IS '비용 통계 데이터 조회 함수';