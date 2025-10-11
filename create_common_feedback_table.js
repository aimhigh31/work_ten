const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL 또는 Key가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createFeedbackTable() {
  console.log('📝 common_feedback_data 테이블 생성 시작...');

  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
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

        -- 모든 사용자가 읽을 수 있도록 정책 생성
        DROP POLICY IF EXISTS "Allow read access to all users" ON common_feedback_data;
        CREATE POLICY "Allow read access to all users"
          ON common_feedback_data FOR SELECT
          USING (true);

        -- 모든 사용자가 삽입할 수 있도록 정책 생성
        DROP POLICY IF EXISTS "Allow insert access to all users" ON common_feedback_data;
        CREATE POLICY "Allow insert access to all users"
          ON common_feedback_data FOR INSERT
          WITH CHECK (true);

        -- 모든 사용자가 업데이트할 수 있도록 정책 생성
        DROP POLICY IF EXISTS "Allow update access to all users" ON common_feedback_data;
        CREATE POLICY "Allow update access to all users"
          ON common_feedback_data FOR UPDATE
          USING (true);

        -- 모든 사용자가 삭제할 수 있도록 정책 생성
        DROP POLICY IF EXISTS "Allow delete access to all users" ON common_feedback_data;
        CREATE POLICY "Allow delete access to all users"
          ON common_feedback_data FOR DELETE
          USING (true);
      `
    });

    if (error) {
      // exec_sql이 없는 경우 직접 SQL 실행
      console.log('⚠️ exec_sql 함수가 없습니다. 직접 테이블을 생성해주세요.');
      console.log('\n아래 SQL을 Supabase SQL Editor에서 실행하세요:\n');
      console.log(`
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

-- 모든 사용자가 읽을 수 있도록 정책 생성
DROP POLICY IF EXISTS "Allow read access to all users" ON common_feedback_data;
CREATE POLICY "Allow read access to all users"
  ON common_feedback_data FOR SELECT
  USING (true);

-- 모든 사용자가 삽입할 수 있도록 정책 생성
DROP POLICY IF EXISTS "Allow insert access to all users" ON common_feedback_data;
CREATE POLICY "Allow insert access to all users"
  ON common_feedback_data FOR INSERT
  WITH CHECK (true);

-- 모든 사용자가 업데이트할 수 있도록 정책 생성
DROP POLICY IF EXISTS "Allow update access to all users" ON common_feedback_data;
CREATE POLICY "Allow update access to all users"
  ON common_feedback_data FOR UPDATE
  USING (true);

-- 모든 사용자가 삭제할 수 있도록 정책 생성
DROP POLICY IF EXISTS "Allow delete access to all users" ON common_feedback_data;
CREATE POLICY "Allow delete access to all users"
  ON common_feedback_data FOR DELETE
  USING (true);
      `);
      return;
    }

    console.log('✅ common_feedback_data 테이블 생성 완료!');
  } catch (err) {
    console.error('❌ 테이블 생성 중 오류 발생:', err);
  }
}

createFeedbackTable();
