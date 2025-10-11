-- =================================================
-- Nexwork Frontend - 3단계: 업무관리 및 교육관리 테이블들
-- Supabase Dashboard > SQL Editor에서 실행 (2단계 완료 후)
-- =================================================

-- =====================================
-- 업무관리 모듈 테이블들
-- =====================================

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

-- 업무관리 인덱스
CREATE INDEX idx_task_records_assignee ON task_records(assignee_id);
CREATE INDEX idx_task_records_status ON task_records(status);
CREATE INDEX idx_task_records_team ON task_records(team);
CREATE INDEX idx_task_records_created_at ON task_records(created_at DESC);
CREATE INDEX idx_task_records_department ON task_records(department);
CREATE INDEX idx_task_records_team_status ON task_records(team, status);

-- =====================================
-- 교육관리 모듈 테이블들
-- =====================================

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

-- 교육관리 인덱스
CREATE INDEX idx_education_records_assignee ON education_records(assignee_id);
CREATE INDEX idx_education_records_status ON education_records(status);
CREATE INDEX idx_education_records_date ON education_records(start_date);
CREATE INDEX idx_education_participants_education ON education_participants(education_record_id);
CREATE INDEX idx_education_participants_participant ON education_participants(participant_id);

-- =====================================
-- RLS 정책 설정
-- =====================================

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

-- 테이블 코멘트 추가
COMMENT ON TABLE cost_records IS 'Nexwork 비용관리 메인 테이블 - 완벽버전 스키마';
COMMENT ON TABLE task_records IS 'Nexwork 업무관리 메인 테이블';  
COMMENT ON TABLE education_records IS 'Nexwork 교육관리 메인 테이블';