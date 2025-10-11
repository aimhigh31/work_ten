const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkKpiCodes() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    const result = await client.query(`
      SELECT id, code, work_content, management_category, target_kpi, current_kpi, created_at
      FROM main_kpi_data
      ORDER BY id DESC
      LIMIT 10;
    `);

    console.log('\n📊 최근 KPI 코드 목록:');
    console.table(result.rows);

    const countResult = await client.query('SELECT COUNT(*) FROM main_kpi_data;');
    console.log(`\n총 ${countResult.rows[0].count}개의 KPI가 있습니다.`);

  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await client.end();
  }
}

checkKpiCodes();
