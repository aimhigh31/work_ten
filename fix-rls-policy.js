// RLS 정책 수정 스크립트
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixRLSPolicy() {
  // Supabase PostgreSQL 연결 정보
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL 또는 SUPABASE_DB_URL 환경 변수가 설정되지 않았습니다.');
    console.log('💡 .env.local 파일에 다음 중 하나를 추가하세요:');
    console.log('   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres');
    console.log('   또는');
    console.log('   SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Supabase 데이터베이스에 연결 중...');
    await client.connect();
    console.log('✅ 연결 성공!\n');

    // 1. 기존 정책 삭제
    console.log('🗑️  기존 RLS 정책 삭제 중...');
    await client.query(`
      DROP POLICY IF EXISTS "Anyone can submit evaluations" ON hr_evaluation_submissions;
      DROP POLICY IF EXISTS "Anyone can submit evaluation items" ON hr_evaluation_submission_items;
      DROP POLICY IF EXISTS "Authenticated users can view all submissions" ON hr_evaluation_submissions;
      DROP POLICY IF EXISTS "Authenticated users can view all submission items" ON hr_evaluation_submission_items;
    `);
    console.log('✅ 기존 정책 삭제 완료\n');

    // 2. 새로운 정책 생성
    console.log('📝 새로운 RLS 정책 생성 중...');

    await client.query(`
      CREATE POLICY "Enable insert for anon users"
      ON hr_evaluation_submissions
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
    `);
    console.log('✅ hr_evaluation_submissions INSERT 정책 생성');

    await client.query(`
      CREATE POLICY "Enable insert for anon users on items"
      ON hr_evaluation_submission_items
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
    `);
    console.log('✅ hr_evaluation_submission_items INSERT 정책 생성');

    await client.query(`
      CREATE POLICY "Enable read access for authenticated users"
      ON hr_evaluation_submissions
      FOR SELECT
      TO authenticated
      USING (true);
    `);
    console.log('✅ hr_evaluation_submissions SELECT 정책 생성');

    await client.query(`
      CREATE POLICY "Enable read access for authenticated users on items"
      ON hr_evaluation_submission_items
      FOR SELECT
      TO authenticated
      USING (true);
    `);
    console.log('✅ hr_evaluation_submission_items SELECT 정책 생성\n');

    // 3. 정책 확인
    console.log('🔍 생성된 정책 확인...\n');
    const result = await client.query(`
      SELECT tablename, policyname, cmd, roles
      FROM pg_policies
      WHERE tablename IN ('hr_evaluation_submissions', 'hr_evaluation_submission_items')
      ORDER BY tablename, policyname;
    `);

    console.log('📋 현재 RLS 정책:');
    console.table(result.rows);

    console.log('\n✅ RLS 정책 수정 완료!');
    console.log('💡 이제 평가 제출을 다시 시도해보세요.');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixRLSPolicy();
