-- common_feedback_data 테이블 생성
CREATE TABLE IF NOT EXISTS common_feedback_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  description TEXT,
  user_id UUID,
  user_name TEXT,
  team TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_feedback_page ON common_feedback_data(page);
CREATE INDEX IF NOT EXISTS idx_feedback_record_id ON common_feedback_data(record_id);
CREATE INDEX IF NOT EXISTS idx_feedback_page_record ON common_feedback_data(page, record_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON common_feedback_data(created_at DESC);

-- RLS 활성화
ALTER TABLE common_feedback_data ENABLE ROW LEVEL SECURITY;

-- 정책 생성
DROP POLICY IF EXISTS "Allow read access to all users" ON common_feedback_data;
CREATE POLICY "Allow read access to all users"
  ON common_feedback_data FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow insert access to all users" ON common_feedback_data;
CREATE POLICY "Allow insert access to all users"
  ON common_feedback_data FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access to all users" ON common_feedback_data;
CREATE POLICY "Allow update access to all users"
  ON common_feedback_data FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow delete access to all users" ON common_feedback_data;
CREATE POLICY "Allow delete access to all users"
  ON common_feedback_data FOR DELETE
  USING (true);
