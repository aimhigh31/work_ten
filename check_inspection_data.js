const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkInspectionData() {
  console.log('🔍 점검성과보고 데이터 확인 중...\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공\n');

    // 가장 최근 수정된 데이터 조회
    const query = `
      SELECT
        id,
        code,
        inspection_content,
        details,
        performance,
        improvements,
        thoughts,
        notes,
        updated_at
      FROM security_inspection_data
      WHERE is_active = true
      ORDER BY updated_at DESC
      LIMIT 5;
    `;

    const result = await client.query(query);

    console.log(`📋 최근 수정된 점검 데이터 (${result.rows.length}개):\n`);

    result.rows.forEach((row, index) => {
      console.log(`\n----- 데이터 ${index + 1} -----`);
      console.log(`ID: ${row.id}`);
      console.log(`코드: ${row.code}`);
      console.log(`점검내용: ${row.inspection_content}`);
      console.log(`세부사항(details): ${row.details || '(비어있음)'}`);
      console.log(`성과(performance): ${row.performance || '(비어있음)'}`);
      console.log(`개선사항(improvements): ${row.improvements || '(비어있음)'}`);
      console.log(`점검소감(thoughts): ${row.thoughts || '(비어있음)'}`);
      console.log(`비고(notes): ${row.notes || '(비어있음)'}`);
      console.log(`수정일시: ${row.updated_at}`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await client.end();
  }
}

checkInspectionData();
