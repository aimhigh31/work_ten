require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function addEvaluationCriteriaColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, 'add_evaluation_criteria_columns.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // SQL 실행
    console.log('📝 평가기준표 컬럼 추가 중...');
    await client.query(sql);
    console.log('✅ 평가기준표 컬럼 추가 완료');

    // 결과 확인
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'main_kpi_data'
        AND column_name IN (
          'selection_background',
          'impact',
          'evaluation_criteria_s',
          'evaluation_criteria_a',
          'evaluation_criteria_b',
          'evaluation_criteria_c',
          'evaluation_criteria_d'
        )
      ORDER BY column_name;
    `);

    console.log('\n📋 추가된 컬럼 목록:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    await client.end();
    console.log('✅ PostgreSQL 연결 종료');
  }
}

addEvaluationCriteriaColumns();
