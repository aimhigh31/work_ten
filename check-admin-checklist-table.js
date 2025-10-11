// PostgreSQL 직접 연결로 admin_checklist_data 테이블 상태 확인
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkChecklistTable() {
  try {
    console.log('🔗 PostgreSQL 연결 중...');
    await client.connect();

    // 1. 테이블 존재 확인
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'admin_checklist_data'
      );
    `);
    console.log('📊 테이블 존재 여부:', tableExists.rows[0].exists);

    // 2. 테이블 구조 확인
    console.log('\n📋 테이블 구조:');
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'admin_checklist_data'
      ORDER BY ordinal_position;
    `);

    structure.rows.forEach(col => {
      const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      console.log(`  - ${col.column_name}: ${col.data_type}${maxLength} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

    // 3. 인덱스 확인
    console.log('\n🔍 인덱스 목록:');
    const indexes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'admin_checklist_data'
      ORDER BY indexname;
    `);

    indexes.rows.forEach(idx => {
      console.log(`  - ${idx.indexname}`);
      console.log(`    ${idx.indexdef}`);
    });

    // 4. 제약조건 확인
    console.log('\n🛡️ 제약조건:');
    const constraints = await client.query(`
      SELECT conname, contype,
             CASE contype
               WHEN 'c' THEN 'CHECK'
               WHEN 'f' THEN 'FOREIGN KEY'
               WHEN 'p' THEN 'PRIMARY KEY'
               WHEN 'u' THEN 'UNIQUE'
               ELSE contype::text
             END as constraint_type,
             pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'admin_checklist_data'::regclass
      ORDER BY contype, conname;
    `);

    constraints.rows.forEach(con => {
      console.log(`  - ${con.conname} (${con.constraint_type})`);
      console.log(`    ${con.definition}`);
    });

    // 5. 데이터 개수 확인
    const countResult = await client.query('SELECT COUNT(*) as total FROM admin_checklist_data;');
    console.log(`\n📊 총 데이터 개수: ${countResult.rows[0].total}개`);

    // 6. 상태별 통계
    const statusStats = await client.query(`
      SELECT status, COUNT(*) as count
      FROM admin_checklist_data
      GROUP BY status
      ORDER BY status;
    `);

    console.log('\n📈 상태별 통계:');
    statusStats.rows.forEach(stat => {
      console.log(`  - ${stat.status}: ${stat.count}개`);
    });

    // 7. 팀별 통계
    const teamStats = await client.query(`
      SELECT team, COUNT(*) as count
      FROM admin_checklist_data
      GROUP BY team
      ORDER BY team;
    `);

    console.log('\n👥 팀별 통계:');
    teamStats.rows.forEach(stat => {
      console.log(`  - ${stat.team}: ${stat.count}개`);
    });

    // 8. 진행률 통계
    const progressStats = await client.query(`
      SELECT
        AVG(progress) as avg_progress,
        MIN(progress) as min_progress,
        MAX(progress) as max_progress
      FROM admin_checklist_data;
    `);

    console.log('\n📊 진행률 통계:');
    const stats = progressStats.rows[0];
    console.log(`  - 평균 진행률: ${Math.round(stats.avg_progress)}%`);
    console.log(`  - 최소 진행률: ${stats.min_progress}%`);
    console.log(`  - 최대 진행률: ${stats.max_progress}%`);

    // 9. RLS 정책 확인
    console.log('\n🔒 RLS 정책:');
    const policies = await client.query(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
      FROM pg_policies
      WHERE tablename = 'admin_checklist_data'
      ORDER BY policyname;
    `);

    if (policies.rows.length > 0) {
      policies.rows.forEach(policy => {
        console.log(`  - ${policy.policyname}`);
        console.log(`    Command: ${policy.cmd}`);
        console.log(`    Roles: ${policy.roles}`);
        console.log(`    Expression: ${policy.qual || 'true'}`);
      });
    } else {
      console.log('  정책이 설정되지 않았습니다.');
    }

    console.log('\n✅ admin_checklist_data 테이블 상태 확인 완료');

  } catch (error) {
    console.error('❌ 테이블 상태 확인 중 오류:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// 스크립트 실행
checkChecklistTable();