const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

async function fixStoragePolicies() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 PostgreSQL 연결 중...');
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 기존 정책 삭제
    console.log('🗑️ 기존 정책 삭제 중...');

    const dropPolicies = [
      `DROP POLICY IF EXISTS "Public Access" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Allow public uploads to hardware-images" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Allow public access to hardware-images" ON storage.objects;`
    ];

    for (const sql of dropPolicies) {
      try {
        await client.query(sql);
      } catch (err) {
        // 정책이 없으면 에러 무시
      }
    }

    console.log('📝 새로운 Storage 정책 생성 중...');

    // 공개 읽기 정책 (모든 사용자)
    await client.query(`
      CREATE POLICY "Allow public access to hardware-images"
      ON storage.objects FOR SELECT
      USING ( bucket_id = 'hardware-images' );
    `);
    console.log('✅ 공개 읽기 정책 생성 완료');

    // 공개 업로드 정책 (anon 포함)
    await client.query(`
      CREATE POLICY "Allow public uploads to hardware-images"
      ON storage.objects FOR INSERT
      WITH CHECK ( bucket_id = 'hardware-images' );
    `);
    console.log('✅ 공개 업로드 정책 생성 완료');

    // 공개 업데이트 정책
    await client.query(`
      CREATE POLICY "Allow public updates to hardware-images"
      ON storage.objects FOR UPDATE
      USING ( bucket_id = 'hardware-images' )
      WITH CHECK ( bucket_id = 'hardware-images' );
    `);
    console.log('✅ 공개 업데이트 정책 생성 완료');

    // 공개 삭제 정책
    await client.query(`
      CREATE POLICY "Allow public deletes to hardware-images"
      ON storage.objects FOR DELETE
      USING ( bucket_id = 'hardware-images' );
    `);
    console.log('✅ 공개 삭제 정책 생성 완료');

    // 생성된 정책 확인
    console.log('\n📋 생성된 Storage 정책 확인:');
    const result = await client.query(`
      SELECT policyname, cmd, roles
      FROM pg_policies
      WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname LIKE '%hardware-images%';
    `);

    if (result.rows.length > 0) {
      result.rows.forEach(row => {
        console.log(`   ✓ ${row.policyname} (${row.cmd}) - roles: ${row.roles}`);
      });
    }

    console.log('\n✅ Storage 정책 수정 완료!');
    console.log('💡 이제 anon 사용자도 이미지를 업로드할 수 있습니다.');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 PostgreSQL 연결 종료');
  }
}

fixStoragePolicies();
