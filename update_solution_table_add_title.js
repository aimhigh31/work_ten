const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Supabase DATABASE_URL에서 연결 정보 파싱
const dbUrl = process.env.DATABASE_URL;
console.log('🔗 DATABASE_URL:', dbUrl ? '설정됨' : '없음');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function updateSolutionTable() {
  const client = await pool.connect();

  try {
    console.log('🚀 it_solution_data 테이블에 title 필드 추가 시작...');

    // 1. title 컬럼 추가
    await client.query(`
      ALTER TABLE it_solution_data
      ADD COLUMN IF NOT EXISTS title VARCHAR(200) NOT NULL DEFAULT '';
    `);
    console.log('✅ title 컬럼 추가 완료');

    // 2. 기존 데이터에 title 값 업데이트 (detail_content의 첫 20자를 title로 사용)
    await client.query(`
      UPDATE it_solution_data
      SET title = LEFT(detail_content, 20)
      WHERE title = '' OR title IS NULL;
    `);
    console.log('✅ 기존 데이터 title 업데이트 완료');

    // 3. 테이블 구조 확인
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'it_solution_data'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 업데이트된 테이블 구조:');
    tableInfo.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    // 4. 샘플 데이터 확인
    const sampleResult = await client.query('SELECT id, no, title, detail_content FROM it_solution_data LIMIT 3');
    console.log('\n📊 샘플 데이터:');
    sampleResult.rows.forEach(row => {
      console.log(`  ID: ${row.id}, No: ${row.no}, Title: "${row.title}"`);
    });

    console.log('\n🎉 it_solution_data 테이블 title 필드 추가 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await updateSolutionTable();
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