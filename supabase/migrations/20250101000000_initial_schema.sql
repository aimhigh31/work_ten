-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================
-- 1. USER PROFILES (사용자 프로필)
-- =====================================
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  department TEXT,
  position TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 정책 설정
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
-- 3. COST MANAGEMENT (비용관리)
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
  
  -- 자동 계산 검증
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

-- 첨부파일 테이블
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
  
  -- 파일 검증
  CONSTRAINT check_file_size CHECK (file_size > 0 AND file_size <= 52428800),
  CONSTRAINT check_file_type CHECK (file_type IN (
    'application/pdf', 
    'image/jpeg', 
    'image/png', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ))
);

-- =====================================
-- 4. TASK MANAGEMENT (업무관리)
-- =====================================

-- 업무 기록 테이블
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
-- 5. EDUCATION MANAGEMENT (교육관리)
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
-- 6. INDEXES (인덱스)
-- =====================================

-- Cost Records 인덱스
CREATE INDEX idx_cost_records_assignee ON cost_records(assignee_id);
CREATE INDEX idx_cost_records_status ON cost_records(status);
CREATE INDEX idx_cost_records_team ON cost_records(team);
CREATE INDEX idx_cost_records_date ON cost_records(registration_date);
CREATE INDEX idx_cost_records_created_at ON cost_records(created_at DESC);

-- Task Records 인덱스
CREATE INDEX idx_task_records_assignee ON task_records(assignee_id);
CREATE INDEX idx_task_records_status ON task_records(status);
CREATE INDEX idx_task_records_team ON task_records(team);
CREATE INDEX idx_task_records_created_at ON task_records(created_at DESC);

-- Education Records 인덱스
CREATE INDEX idx_education_records_assignee ON education_records(assignee_id);
CREATE INDEX idx_education_records_status ON education_records(status);
CREATE INDEX idx_education_records_date ON education_records(start_date);
CREATE INDEX idx_education_participants_education ON education_participants(education_record_id);
CREATE INDEX idx_education_participants_participant ON education_participants(participant_id);

-- =====================================
-- 7. RLS POLICIES (Row Level Security)
-- =====================================

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

-- =====================================
-- 8. FUNCTIONS (코드 생성 함수)
-- =====================================

-- 다음 시퀀스 번호 가져오기
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
$$ LANGUAGE plpgsql;

-- 비용 코드 생성
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
$$ LANGUAGE plpgsql;

-- 업무 코드 생성
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
$$ LANGUAGE plpgsql;

-- 교육 코드 생성
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
$$ LANGUAGE plpgsql;

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
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cost_records_updated_at BEFORE UPDATE ON cost_records 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_records_updated_at BEFORE UPDATE ON task_records 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_education_records_updated_at BEFORE UPDATE ON education_records 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();