const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Supabase DATABASE_URL에서 연결 정보 파싱
const dbUrl = process.env.DATABASE_URL;
console.log('🔗 DATABASE_URL:', dbUrl ? '설정됨' : '없음');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function addTitleColumn() {
  const client = await pool.connect();

  try {
    console.log('🚀 it_solution_data 테이블에 title 컬럼 추가 시작...');

    // 1. title 컬럼 추가
    await client.query(`
      ALTER TABLE it_solution_data
      ADD COLUMN IF NOT EXISTS title VARCHAR(200) NOT NULL DEFAULT '';
    `);
    console.log('✅ title 컬럼 추가 완료');

    // 2. 기존 데이터의 title을 detail_content 앞부분으로 설정
    await client.query(`
      UPDATE it_solution_data
      SET title = CASE
        WHEN LENGTH(detail_content) > 50
        THEN SUBSTRING(detail_content FROM 1 FOR 50) || '...'
        ELSE detail_content
      END
      WHERE title = '' OR title IS NULL;
    `);
    console.log('✅ 기존 데이터 title 설정 완료');

    // 3. 결과 확인
    const result = await client.query('SELECT id, title, detail_content FROM it_solution_data LIMIT 5');
    console.log('\n📋 수정된 데이터 샘플:');
    result.rows.forEach(row => {
      console.log(`  ID ${row.id}: "${row.title}" - ${row.detail_content.substring(0, 30)}...`);
    });

    console.log('\n🎉 title 컬럼 추가 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await addTitleColumn();
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