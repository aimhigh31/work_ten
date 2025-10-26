const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공\n');

    // hr_evaluation_submissions 테이블 스키마 확인
    console.log('=== hr_evaluation_submissions 테이블 스키마 ===');
    const submissionsSchema = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'hr_evaluation_submissions'
      ORDER BY ordinal_position;
    `);

    if (submissionsSchema.rows.length === 0) {
      console.log('❌ hr_evaluation_submissions 테이블이 존재하지 않습니다.\n');
    } else {
      console.log('컬럼 목록:');
      submissionsSchema.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
      console.log();
    }

    // hr_evaluation_submission_items 테이블 스키마 확인
    console.log('=== hr_evaluation_submission_items 테이블 스키마 ===');
    const itemsSchema = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'hr_evaluation_submission_items'
      ORDER BY ordinal_position;
    `);

    if (itemsSchema.rows.length === 0) {
      console.log('❌ hr_evaluation_submission_items 테이블이 존재하지 않습니다.\n');
    } else {
      console.log('컬럼 목록:');
      itemsSchema.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
      console.log();
    }

  } catch (error) {
    console.error('❌ 오류:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    await client.end();
    console.log('✅ 연결 종료');
  }
}

checkSchema();
