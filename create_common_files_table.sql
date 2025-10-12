-- common_files_data 테이블 생성
CREATE TABLE IF NOT EXISTS common_files_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL,
  record_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  user_id UUID,
  user_name TEXT,
  team TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_files_page ON common_files_data(page);
CREATE INDEX IF NOT EXISTS idx_files_record_id ON common_files_data(record_id);
CREATE INDEX IF NOT EXISTS idx_files_page_record ON common_files_data(page, record_id);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON common_files_data(created_at DESC);

-- RLS 활성화
ALTER TABLE common_files_data ENABLE ROW LEVEL SECURITY;

-- 정책 생성 (개발 환경: 모든 권한 허용)
DROP POLICY IF EXISTS "Allow read access to all users" ON common_files_data;
CREATE POLICY "Allow read access to all users"
  ON common_files_data FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow insert access to all users" ON common_files_data;
CREATE POLICY "Allow insert access to all users"
  ON common_files_data FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access to all users" ON common_files_data;
CREATE POLICY "Allow update access to all users"
  ON common_files_data FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow delete access to all users" ON common_files_data;
CREATE POLICY "Allow delete access to all users"
  ON common_files_data FOR DELETE
  USING (true);
