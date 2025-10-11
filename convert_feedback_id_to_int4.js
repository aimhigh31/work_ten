// common_feedback_data 테이블의 id를 uuid에서 int4로 변경
const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function convertIdToInt4() {
  console.log('🔌 PostgreSQL 직접 연결 중...');

  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 현재 테이블 구조 확인
    console.log('\n📋 변경 전 테이블 구조:');
    const beforeResult = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'common_feedback_data'
      ORDER BY ordinal_position;
    `);
    beforeResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // 데이터 개수 확인
    const countResult = await client.query('SELECT COUNT(*) as count FROM common_feedback_data');
    console.log(`\n📊 현재 데이터 개수: ${countResult.rows[0].count}개`);

    if (countResult.rows[0].count > 0) {
      console.log('⚠️  경고: 테이블에 데이터가 있습니다!');
      console.log('⚠️  이 작업은 기존 데이터를 유지하지만, id 값이 재할당됩니다.');
    }

    // SQL 파일 읽기
    console.log('\n📖 SQL 파일 읽는 중...');
    const sql = fs.readFileSync('convert_feedback_id_to_int4.sql', 'utf8');

    // SQL 실행
    console.log('⚡ ID 타입 변경 중...');
    await client.query(sql);
    console.log('✅ ID 타입 변경 완료');

    // 변경 후 테이블 구조 확인
    console.log('\n📋 변경 후 테이블 구조:');
    const afterResult = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'common_feedback_data'
      ORDER BY ordinal_position;
    `);
    afterResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.column_default ? `(${row.column_default})` : ''}`);
    });

    // ID 컬럼 특별 확인
    const idColumn = afterResult.rows.find(row => row.column_name === 'id');
    if (idColumn && idColumn.data_type === 'integer') {
      console.log('\n✅ ID 컬럼이 성공적으로 int4(integer)로 변경되었습니다!');
    }

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error('상세:', error);
  } finally {
    await client.end();
    console.log('\n🔌 PostgreSQL 연결 종료');
  }
}

convertIdToInt4().then(() => {
  console.log('\n🎉 변환 작업 완료');
  process.exit(0);
}).catch(error => {
  console.error('💥 작업 실패:', error);
  process.exit(1);
});
