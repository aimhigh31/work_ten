const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// PostgreSQL 연결 정보 (Supabase의 Direct Connection 사용)
const connectionString = process.env.DATABASE_URL ||
  `postgresql://postgres.exxumujwufzqnovhzvif:${process.env.SUPABASE_DB_PASSWORD}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`;

async function applyStoragePolicies() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 PostgreSQL 연결 중...');
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 기존 정책 삭제 (있을 경우)
    console.log('🗑️ 기존 정책 삭제 중...');

    const dropPolicies = [
      `DROP POLICY IF EXISTS "Public Access" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;`
    ];

    for (const sql of dropPolicies) {
      try {
        await client.query(sql);
      } catch (err) {
        // 정책이 없으면 에러 무시
      }
    }

    // 새 정책 생성
    console.log('📝 Storage 정책 생성 중...');

    const policies = [
      {
        name: 'Public Access',
        sql: `
          CREATE POLICY "Public Access"
          ON storage.objects FOR SELECT
          USING ( bucket_id = 'hardware-images' );
        `
      },
      {
        name: 'Authenticated users can upload',
        sql: `
          CREATE POLICY "Authenticated users can upload"
          ON storage.objects FOR INSERT
          TO authenticated
          WITH CHECK ( bucket_id = 'hardware-images' );
        `
      },
      {
        name: 'Authenticated users can delete',
        sql: `
          CREATE POLICY "Authenticated users can delete"
          ON storage.objects FOR DELETE
          TO authenticated
          USING ( bucket_id = 'hardware-images' );
        `
      },
      {
        name: 'Authenticated users can update',
        sql: `
          CREATE POLICY "Authenticated users can update"
          ON storage.objects FOR UPDATE
          TO authenticated
          USING ( bucket_id = 'hardware-images' );
        `
      }
    ];

    for (const policy of policies) {
      try {
        await client.query(policy.sql);
        console.log(`✅ "${policy.name}" 정책 생성 완료`);
      } catch (err) {
        console.error(`❌ "${policy.name}" 정책 생성 실패:`, err.message);
      }
    }

    // 생성된 정책 확인
    console.log('\n📋 생성된 Storage 정책 확인:');
    const result = await client.query(`
      SELECT policyname, cmd, qual
      FROM pg_policies
      WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname LIKE '%hardware-images%' OR policyname IN ('Public Access', 'Authenticated users can upload', 'Authenticated users can delete', 'Authenticated users can update');
    `);

    if (result.rows.length > 0) {
      result.rows.forEach(row => {
        console.log(`   ✓ ${row.policyname} (${row.cmd})`);
      });
    } else {
      console.log('   ⚠️ 정책이 조회되지 않습니다. 수동으로 확인이 필요합니다.');
    }

    console.log('\n✅ Storage 정책 설정 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 PostgreSQL 연결 종료');
  }
}

applyStoragePolicies();
