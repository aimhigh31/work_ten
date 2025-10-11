require('dotenv').config({ path: '.env.local' });

async function checkDatabaseSchema() {
  const { Client } = require('pg');

  const client = new Client({
    host: 'aws-0-ap-northeast-2.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.ckgmqjxqoqortyfsqgqo',
    password: process.env.SUPABASE_DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('🔄 데이터베이스 스키마 확인 중...');

    // 1. 테이블 제약 조건 확인
    const constraintsQuery = `
      SELECT
        conname AS constraint_name,
        contype AS constraint_type,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'admin_checklist_editor'::regclass
      ORDER BY conname;
    `;

    const constraintsResult = await client.query(constraintsQuery);
    console.log('\n📋 테이블 제약 조건:');
    constraintsResult.rows.forEach(row => {
      console.log(`  ${row.constraint_name} (${row.constraint_type}): ${row.constraint_definition}`);
    });

    // 2. 현재 데이터 확인
    const dataQuery = `
      SELECT checklist_id, no, COUNT(*) as count
      FROM admin_checklist_editor
      GROUP BY checklist_id, no
      HAVING COUNT(*) > 1
      ORDER BY checklist_id, no;
    `;

    const dataResult = await client.query(dataQuery);
    console.log('\n🔍 중복 데이터 확인:');
    if (dataResult.rows.length === 0) {
      console.log('  중복 데이터 없음');
    } else {
      console.log('  ❌ 중복 데이터 발견:');
      dataResult.rows.forEach(row => {
        console.log(`    checklist_id: ${row.checklist_id}, no: ${row.no}, count: ${row.count}`);
      });
    }

  } catch (error) {
    console.error('💥 오류 발생:', error.message);
  } finally {
    await client.end();
  }
}

checkDatabaseSchema();
