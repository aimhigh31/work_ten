const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupFilesStorage() {
  try {
    console.log('🔨 common_files_data 테이블 및 Storage 버킷 생성 중...');

    // PostgreSQL 직접 연결 방식
    const { Client } = require('pg');
    const connectionString = process.env.DATABASE_URL;

    const client = new Client({ connectionString });

    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');
    console.log('');

    // =====================================
    // Step 1: common_files_data 테이블 생성
    // =====================================
    console.log('📄 Step 1: common_files_data 테이블 생성 중...');

    const createTableSQL = `
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
    `;

    await client.query(createTableSQL);
    console.log('✅ 테이블 생성 완료');

    // 인덱스 생성
    console.log('📑 인덱스 생성 중...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_files_page ON common_files_data(page);',
      'CREATE INDEX IF NOT EXISTS idx_files_record_id ON common_files_data(record_id);',
      'CREATE INDEX IF NOT EXISTS idx_files_page_record ON common_files_data(page, record_id);',
      'CREATE INDEX IF NOT EXISTS idx_files_created_at ON common_files_data(created_at DESC);'
    ];

    for (const indexSQL of indexes) {
      try {
        await client.query(indexSQL);
        const indexName = indexSQL.match(/INDEX (?:IF NOT EXISTS )?(\w+)/)[1];
        console.log('  ✅ 인덱스 생성:', indexName);
      } catch (err) {
        if (err.message.includes('already exists')) {
          const indexName = indexSQL.match(/INDEX (?:IF NOT EXISTS )?(\w+)/)[1];
          console.log('  ⚠️ 인덱스 이미 존재:', indexName);
        } else {
          throw err;
        }
      }
    }

    // RLS 활성화
    console.log('🔒 RLS 정책 설정 중...');
    await client.query('ALTER TABLE common_files_data ENABLE ROW LEVEL SECURITY;');
    console.log('✅ RLS 활성화 완료');

    // RLS 정책 생성 (개발 환경: 모든 권한 허용)
    const policies = [
      `DROP POLICY IF EXISTS "Allow read access to all users" ON common_files_data;`,
      `CREATE POLICY "Allow read access to all users" ON common_files_data FOR SELECT USING (true);`,
      `DROP POLICY IF EXISTS "Allow insert access to all users" ON common_files_data;`,
      `CREATE POLICY "Allow insert access to all users" ON common_files_data FOR INSERT WITH CHECK (true);`,
      `DROP POLICY IF EXISTS "Allow update access to all users" ON common_files_data;`,
      `CREATE POLICY "Allow update access to all users" ON common_files_data FOR UPDATE USING (true);`,
      `DROP POLICY IF EXISTS "Allow delete access to all users" ON common_files_data;`,
      `CREATE POLICY "Allow delete access to all users" ON common_files_data FOR DELETE USING (true);`
    ];

    for (const policySQL of policies) {
      try {
        await client.query(policySQL);
      } catch (err) {
        // 정책 관련 오류는 무시 (이미 존재할 수 있음)
        if (!err.message.includes('does not exist')) {
          console.log('  ℹ️ 정책 설정:', err.message);
        }
      }
    }
    console.log('✅ RLS 정책 생성 완료 (모든 사용자에게 전체 권한 허용)');
    console.log('');

    // =====================================
    // Step 2: Storage 버킷 생성
    // =====================================
    console.log('📦 Step 2: common-files Storage 버킷 생성 중...');

    // Storage 버킷 생성
    const createBucketSQL = `
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('common-files', 'common-files', true)
      ON CONFLICT (id) DO NOTHING;
    `;

    await client.query(createBucketSQL);
    console.log('✅ Storage 버킷 생성 완료');

    // Storage RLS 정책 생성
    console.log('🔒 Storage RLS 정책 설정 중...');
    const storagePolicies = [
      `DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;`,
      `CREATE POLICY "Allow public read access" ON storage.objects FOR SELECT USING (bucket_id = 'common-files');`,
      `DROP POLICY IF EXISTS "Allow all users to upload" ON storage.objects;`,
      `CREATE POLICY "Allow all users to upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'common-files');`,
      `DROP POLICY IF EXISTS "Allow all users to update" ON storage.objects;`,
      `CREATE POLICY "Allow all users to update" ON storage.objects FOR UPDATE USING (bucket_id = 'common-files');`,
      `DROP POLICY IF EXISTS "Allow all users to delete" ON storage.objects;`,
      `CREATE POLICY "Allow all users to delete" ON storage.objects FOR DELETE USING (bucket_id = 'common-files');`
    ];

    for (const policySQL of storagePolicies) {
      try {
        await client.query(policySQL);
      } catch (err) {
        if (!err.message.includes('does not exist')) {
          console.log('  ℹ️ Storage 정책:', err.message.substring(0, 50) + '...');
        }
      }
    }
    console.log('✅ Storage RLS 정책 생성 완료');
    console.log('');

    await client.end();
    console.log('✅ 데이터베이스 연결 종료');
    console.log('');

    // =====================================
    // 테이블 및 버킷 확인
    // =====================================
    console.log('🔍 생성 확인 중...');

    // 테이블 확인
    const { data: tableData, error: tableError } = await supabase
      .from('common_files_data')
      .select('*')
      .limit(1);

    if (!tableError) {
      console.log('✅ common_files_data 테이블 접근 확인');
    } else {
      console.log('⚠️ 테이블 접근 실패:', tableError.message);
    }

    // Storage 버킷 확인
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();

    if (!bucketError && buckets) {
      const commonFilesBucket = buckets.find(b => b.id === 'common-files');
      if (commonFilesBucket) {
        console.log('✅ common-files Storage 버킷 확인');
        console.log('   - Bucket ID:', commonFilesBucket.id);
        console.log('   - Public:', commonFilesBucket.public);
      } else {
        console.log('⚠️ common-files 버킷을 찾을 수 없습니다.');
      }
    } else {
      console.log('⚠️ Storage 버킷 목록 조회 실패:', bucketError?.message);
    }

    console.log('');
    console.log('='.repeat(70));
    console.log('🎉 자료탭 DB 설정이 완료되었습니다!');
    console.log('='.repeat(70));
    console.log('');
    console.log('✓ common_files_data 테이블 생성됨');
    console.log('✓ 인덱스 4개 생성됨 (page, record_id, page+record_id, created_at)');
    console.log('✓ RLS 정책 적용됨 (개발 환경: 모든 권한 허용)');
    console.log('✓ common-files Storage 버킷 생성됨 (Public)');
    console.log('✓ Storage RLS 정책 적용됨 (모든 사용자 접근 가능)');
    console.log('');
    console.log('이제 보안교육관리 페이지에서 자료탭 파일 업로드를 테스트할 수 있습니다!');
    console.log('');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    console.error('상세:', error.message);
    process.exit(1);
  }
}

// 실행
setupFilesStorage();
