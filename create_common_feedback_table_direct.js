const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Supabase URL에서 프로젝트 ID 추출
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectId = supabaseUrl ? supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] : null;

if (!projectId) {
  console.error('❌ Supabase URL에서 프로젝트 ID를 추출할 수 없습니다.');
  process.exit(1);
}

const client = new Client({
  host: `aws-0-ap-northeast-2.pooler.supabase.com`,
  port: 6543,
  database: 'postgres',
  user: `postgres.${projectId}`,
  password: process.env.SUPABASE_DB_PASSWORD || 'ghkdwls12#$',
  ssl: { rejectUnauthorized: false }
});

async function createFeedbackTable() {
  try {
    console.log('🔌 Supabase에 연결 중...');
    await client.connect();
    console.log('✅ 연결 성공!');

    console.log('📝 common_feedback_data 테이블 생성 시작...');

    // 테이블 생성
    await client.query(`
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
    `);

    console.log('✅ common_feedback_data 테이블 생성 완료!');

    // 인덱스 생성
    console.log('📝 인덱스 생성 중...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_feedback_page ON common_feedback_data(page);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_feedback_record_id ON common_feedback_data(record_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_feedback_page_record ON common_feedback_data(page, record_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON common_feedback_data(created_at DESC);
    `);

    console.log('✅ 인덱스 생성 완료!');

    // RLS 활성화
    console.log('📝 RLS 설정 중...');
    await client.query(`
      ALTER TABLE common_feedback_data ENABLE ROW LEVEL SECURITY;
    `);

    // 정책 생성
    await client.query(`
      DROP POLICY IF EXISTS "Allow read access to all users" ON common_feedback_data;
    `);
    await client.query(`
      CREATE POLICY "Allow read access to all users"
        ON common_feedback_data FOR SELECT
        USING (true);
    `);

    await client.query(`
      DROP POLICY IF EXISTS "Allow insert access to all users" ON common_feedback_data;
    `);
    await client.query(`
      CREATE POLICY "Allow insert access to all users"
        ON common_feedback_data FOR INSERT
        WITH CHECK (true);
    `);

    await client.query(`
      DROP POLICY IF EXISTS "Allow update access to all users" ON common_feedback_data;
    `);
    await client.query(`
      CREATE POLICY "Allow update access to all users"
        ON common_feedback_data FOR UPDATE
        USING (true);
    `);

    await client.query(`
      DROP POLICY IF EXISTS "Allow delete access to all users" ON common_feedback_data;
    `);
    await client.query(`
      CREATE POLICY "Allow delete access to all users"
        ON common_feedback_data FOR DELETE
        USING (true);
    `);

    console.log('✅ RLS 설정 완료!');

    console.log('\n🎉 모든 작업이 완료되었습니다!');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await client.end();
  }
}

createFeedbackTable();
