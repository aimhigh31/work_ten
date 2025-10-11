const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
});

async function addNoColumn() {
  try {
    await client.connect();

    // 1. no 컬럼 추가
    console.log('1. no 컬럼 추가 중...');
    await client.query(`
      ALTER TABLE security_education_data
      ADD COLUMN IF NOT EXISTS no SERIAL
    `);
    console.log('✅ no 컬럼 추가 완료');

    // 2. 기존 데이터에 순번 부여
    console.log('2. 기존 데이터에 순번 부여 중...');
    const result = await client.query(`
      WITH numbered AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) as rn
        FROM security_education_data
      )
      UPDATE security_education_data
      SET no = numbered.rn
      FROM numbered
      WHERE security_education_data.id = numbered.id
      RETURNING *
    `);
    console.log(`✅ ${result.rowCount}개 행 업데이트 완료`);

    // 3. 현재 최대 no 값으로 시퀀스 재설정
    const maxResult = await client.query('SELECT MAX(no) as max_no FROM security_education_data');
    const maxNo = maxResult.rows[0].max_no || 0;

    // 시퀀스 이름 찾기
    const seqResult = await client.query(`
      SELECT pg_get_serial_sequence('security_education_data', 'no') as seq_name
    `);

    if (seqResult.rows[0].seq_name) {
      await client.query(`
        ALTER SEQUENCE ${seqResult.rows[0].seq_name} RESTART WITH ${maxNo + 1}
      `);
      console.log(`✅ 시퀀스를 ${maxNo + 1}부터 시작하도록 설정`);
    }

    // 4. 결과 확인
    const checkResult = await client.query(`
      SELECT id, no, education_name, created_at
      FROM security_education_data
      ORDER BY no
      LIMIT 10
    `);

    console.log('\n📋 변경된 데이터 확인:');
    console.table(checkResult.rows);

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await client.end();
  }
}

addNoColumn();