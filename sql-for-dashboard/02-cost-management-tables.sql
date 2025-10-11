-- =================================================
-- Nexwork Frontend - 2단계: 비용관리 모듈 테이블들
-- Supabase Dashboard > SQL Editor에서 실행 (1단계 완료 후)
-- =================================================

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

-- 8. Cost Amount Details 정책 (부모 레코드와 동일)
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

-- 9. Cost Comments 정책
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