const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function updateRegulationStatus() {
  console.log('🔧 security_regulation_data 테이블의 상태 업데이트 중...\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공\n');

    // '작성중' 상태를 '대기'로 변경
    console.log('🔄 "작성중" 상태를 "대기"로 변경 중...');
    const result = await client.query(`
      UPDATE security_regulation_data
      SET status = '대기'
      WHERE status = '작성중';
    `);

    console.log(`✅ ${result.rowCount}개 레코드 업데이트 완료\n`);

    // 현재 상태 확인
    const { rows } = await client.query(`
      SELECT status, COUNT(*) as count
      FROM security_regulation_data
      WHERE is_active = true
      GROUP BY status
      ORDER BY status;
    `);

    console.log('📊 현재 상태별 통계:');
    rows.forEach(row => {
      console.log(`  - ${row.status}: ${row.count}개`);
    });

    console.log('\n✅ 작업 완료!');
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세:', error);
  } finally {
    await client.end();
  }
}

updateRegulationStatus();
