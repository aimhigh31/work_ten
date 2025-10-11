require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkImprovementData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('PostgreSQL 연결 성공');

    // security_accident_improvement 테이블 데이터 확인
    const improvementSQL = `
      SELECT
        id,
        accident_id,
        plan,
        status,
        completion_date,
        assignee,
        created_at,
        updated_at,
        is_active
      FROM security_accident_improvement
      ORDER BY id DESC;
    `;

    const improvementResult = await client.query(improvementSQL);
    console.log('\n📋 security_accident_improvement 테이블 데이터:');
    console.table(improvementResult.rows);

    // security_accident_data 테이블 데이터도 확인
    const accidentSQL = `
      SELECT
        id,
        code,
        main_content,
        created_at
      FROM security_accident_data
      ORDER BY id DESC
      LIMIT 5;
    `;

    const accidentResult = await client.query(accidentSQL);
    console.log('\n📋 security_accident_data 테이블 데이터 (최근 5개):');
    console.table(accidentResult.rows);

    // 관계 확인
    const relationSQL = `
      SELECT
        sa.id as accident_id,
        sa.code,
        sa.main_content,
        COUNT(sai.id) as improvement_count
      FROM security_accident_data sa
      LEFT JOIN security_accident_improvement sai ON sa.id = sai.accident_id AND sai.is_active = true
      GROUP BY sa.id, sa.code, sa.main_content
      ORDER BY sa.id DESC;
    `;

    const relationResult = await client.query(relationSQL);
    console.log('\n🔗 사고별 개선사항 개수:');
    console.table(relationResult.rows);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await client.end();
    console.log('PostgreSQL 연결 종료');
  }
}

checkImprovementData();