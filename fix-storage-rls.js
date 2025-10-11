const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixStorageRLS() {
  try {
    console.log('🔧 Storage RLS 정책 직접 수정 중...');

    // 모든 작업을 허용하는 간단한 정책
    const { data, error } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'objects');

    console.log('현재 정책:', data);

    // 기존 정책 확인
    const { data: policies } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname LIKE '%profile-images%';
      `
    });

    console.log('현재 profile-images 정책:', policies);

    // 가장 간단한 정책 생성 (모든 권한 허용)
    const createPolicy = `
      DO $$
      BEGIN
        -- 기존 정책 삭제
        DROP POLICY IF EXISTS "Allow all for profile-images" ON storage.objects;

        -- 새 정책 생성 (모든 작업 허용)
        CREATE POLICY "Allow all for profile-images"
        ON storage.objects
        FOR ALL
        TO public
        USING (bucket_id = 'profile-images')
        WITH CHECK (bucket_id = 'profile-images');

        RAISE NOTICE '✅ Storage 정책이 설정되었습니다.';
      END $$;
    `;

    console.log('\n📋 실행할 SQL:');
    console.log(createPolicy);

    const { data: result, error: sqlError } = await supabase.rpc('exec_sql', {
      sql: createPolicy
    });

    if (sqlError) {
      console.error('❌ SQL 실행 실패:', sqlError);

      // PostgreSQL 직접 연결로 시도
      console.log('\n🔄 PostgreSQL 직접 연결로 재시도...');
      await executeDirectSQL();
    } else {
      console.log('✅ RLS 정책 설정 완료:', result);
    }

  } catch (error) {
    console.error('❌ RLS 정책 설정 실패:', error);

    // 수동 설정 안내
    console.log('\n📋 수동 설정이 필요합니다:');
    console.log('Supabase Dashboard → SQL Editor에서 다음 SQL 실행:');
    console.log(`
CREATE POLICY "Allow all for profile-images"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'profile-images')
WITH CHECK (bucket_id = 'profile-images');
    `);
  }
}

async function executeDirectSQL() {
  const { Client } = require('pg');

  const client = new Client({
    connectionString: process.env.DATABASE_URL || `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${process.env.NEXT_PUBLIC_SUPABASE_URL.split('//')[1].split('.')[0]}.supabase.co:5432/postgres`
  });

  try {
    await client.connect();

    const sql = `
      DROP POLICY IF EXISTS "Allow all for profile-images" ON storage.objects;

      CREATE POLICY "Allow all for profile-images"
      ON storage.objects
      FOR ALL
      TO public
      USING (bucket_id = 'profile-images')
      WITH CHECK (bucket_id = 'profile-images');
    `;

    await client.query(sql);
    console.log('✅ 직접 SQL로 정책 설정 완료');

  } catch (error) {
    console.error('❌ 직접 SQL 실행 실패:', error);
  } finally {
    await client.end();
  }
}

// 스크립트 실행
fixStorageRLS();