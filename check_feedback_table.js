// common_feedback_data 테이블 구조 확인
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkTable() {
  console.log('🔌 PostgreSQL 직접 연결 중...');

  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 테이블 구조 확인
    console.log('🔍 common_feedback_data 테이블 구조 확인 중...');
    const result = await client.query(`
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'common_feedback_data'
      ORDER BY ordinal_position;
    `);

    if (result.rows.length > 0) {
      console.log('✅ 테이블 구조:');
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''} ${row.is_nullable === 'NO' ? 'NOT NULL' : ''} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });

      // 데이터 개수 확인
      const countResult = await client.query('SELECT COUNT(*) as count FROM common_feedback_data');
      console.log(`\n📊 현재 데이터 개수: ${countResult.rows[0].count}개`);

      // id 타입 특별히 확인
      const idColumn = result.rows.find(row => row.column_name === 'id');
      if (idColumn) {
        console.log(`\n🔑 현재 ID 컬럼 타입: ${idColumn.data_type}`);
        if (idColumn.data_type === 'uuid') {
          console.log('⚠️  UUID 타입입니다. int4로 변경이 필요합니다.');
        } else if (idColumn.data_type === 'integer') {
          console.log('✅ 이미 int4(integer) 타입입니다.');
        }
      }
    } else {
      console.log('❌ 테이블을 찾을 수 없습니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await client.end();
    console.log('🔌 PostgreSQL 연결 종료');
  }
}

checkTable().then(() => {
  console.log('\n🎉 확인 작업 완료');
  process.exit(0);
}).catch(error => {
  console.error('💥 작업 실패:', error);
  process.exit(1);
});
