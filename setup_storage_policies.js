const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function setupStoragePolicies() {
  console.log('🔐 Storage RLS 정책 설정 중...\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공\n');

    // 기존 정책 삭제 (있을 경우)
    console.log('🗑️ 기존 정책 삭제 중...');
    await client.query(`
      DROP POLICY IF EXISTS "Anyone can upload OPL images" ON storage.objects;
      DROP POLICY IF EXISTS "Anyone can view OPL images" ON storage.objects;
      DROP POLICY IF EXISTS "Anyone can update OPL images" ON storage.objects;
      DROP POLICY IF EXISTS "Anyone can delete OPL images" ON storage.objects;
    `);
    console.log('✅ 기존 정책 삭제 완료\n');

    // 새 정책 생성
    console.log('➕ 새 RLS 정책 생성 중...');

    // INSERT 정책
    await client.query(`
      CREATE POLICY "Anyone can upload OPL images"
      ON storage.objects
      FOR INSERT
      TO public
      WITH CHECK (bucket_id = 'opl-images');
    `);
    console.log('  ✅ INSERT 정책 생성 완료');

    // SELECT 정책
    await client.query(`
      CREATE POLICY "Anyone can view OPL images"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'opl-images');
    `);
    console.log('  ✅ SELECT 정책 생성 완료');

    // UPDATE 정책
    await client.query(`
      CREATE POLICY "Anyone can update OPL images"
      ON storage.objects
      FOR UPDATE
      TO public
      USING (bucket_id = 'opl-images');
    `);
    console.log('  ✅ UPDATE 정책 생성 완료');

    // DELETE 정책
    await client.query(`
      CREATE POLICY "Anyone can delete OPL images"
      ON storage.objects
      FOR DELETE
      TO public
      USING (bucket_id = 'opl-images');
    `);
    console.log('  ✅ DELETE 정책 생성 완료');

    console.log('\n✅ 모든 Storage RLS 정책 설정 완료!');
    console.log('\n📋 설정된 정책:');
    console.log('  - 모든 사용자가 opl-images 버킷에 파일 업로드 가능');
    console.log('  - 모든 사용자가 opl-images 버킷의 파일 조회 가능');
    console.log('  - 모든 사용자가 opl-images 버킷의 파일 수정 가능');
    console.log('  - 모든 사용자가 opl-images 버킷의 파일 삭제 가능');
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세:', error);
  } finally {
    await client.end();
  }
}

setupStoragePolicies();
