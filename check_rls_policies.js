const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Supabase DATABASE_URL에서 연결 정보 파싱
const dbUrl = process.env.DATABASE_URL;
console.log('🔗 DATABASE_URL:', dbUrl ? '설정됨' : '없음');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function checkRLSPolicies() {
  const client = await pool.connect();

  try {
    console.log('🔍 it_solution_data 테이블 RLS 정책 확인...');

    // 1. 테이블의 RLS 활성화 상태 확인
    const rlsStatus = await client.query(`
      SELECT relname, relrowsecurity, relforcerowsecurity
      FROM pg_class
      WHERE relname = 'it_solution_data';
    `);

    console.log('\n📋 RLS 상태:');
    if (rlsStatus.rows.length > 0) {
      const row = rlsStatus.rows[0];
      console.log(`  테이블: ${row.relname}`);
      console.log(`  RLS 활성화: ${row.relrowsecurity ? '✅ YES' : '❌ NO'}`);
      console.log(`  RLS 강제: ${row.relforcerowsecurity ? '✅ YES' : '❌ NO'}`);
    } else {
      console.log('  ❌ 테이블을 찾을 수 없습니다.');
      return;
    }

    // 2. 현재 적용된 RLS 정책 확인
    const policies = await client.query(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
      FROM pg_policies
      WHERE tablename = 'it_solution_data';
    `);

    console.log('\n📋 현재 RLS 정책:');
    if (policies.rows.length > 0) {
      policies.rows.forEach((policy, index) => {
        console.log(`  정책 ${index + 1}: ${policy.policyname}`);
        console.log(`    명령: ${policy.cmd}`);
        console.log(`    역할: ${policy.roles}`);
        console.log(`    조건: ${policy.qual || 'None'}`);
        console.log('');
      });
    } else {
      console.log('  📝 정책이 설정되지 않았습니다.');
    }

    // 3. RLS 비활성화 (개발환경에서만)
    console.log('\n🔧 RLS 비활성화 중...');
    await client.query('ALTER TABLE it_solution_data DISABLE ROW LEVEL SECURITY;');
    console.log('✅ RLS 비활성화 완료');

    // 4. 다시 상태 확인
    const updatedStatus = await client.query(`
      SELECT relname, relrowsecurity, relforcerowsecurity
      FROM pg_class
      WHERE relname = 'it_solution_data';
    `);

    console.log('\n📋 업데이트된 RLS 상태:');
    if (updatedStatus.rows.length > 0) {
      const row = updatedStatus.rows[0];
      console.log(`  테이블: ${row.relname}`);
      console.log(`  RLS 활성화: ${row.relrowsecurity ? '✅ YES' : '❌ NO'}`);
      console.log(`  RLS 강제: ${row.relforcerowsecurity ? '✅ YES' : '❌ NO'}`);
    }

    console.log('\n🎉 RLS 정책 확인 및 수정 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await checkRLSPolicies();
  } catch (error) {
    console.error('❌ 실행 실패:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}