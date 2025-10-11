const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function updateIdColumnToInt4() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔌 PostgreSQL 연결 중...');
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공\n');

    // 1. 현재 id 컬럼 타입 확인
    console.log('📋 현재 id 컬럼 타입 확인 중...');
    const checkType = await client.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'main_education_data'
        AND column_name = 'id';
    `);

    if (checkType.rows.length > 0) {
      console.log('현재 id 컬럼 정보:');
      console.table(checkType.rows);
    } else {
      console.log('⚠️ id 컬럼을 찾을 수 없습니다.');
      return;
    }

    // 2. id 컬럼을 int4(integer)로 변경
    console.log('\n🔧 id 컬럼을 int4(integer) 타입으로 변경 중...');

    // USING 절을 사용하여 기존 데이터를 정수로 변환
    await client.query(`
      ALTER TABLE main_education_data
      ALTER COLUMN id TYPE INTEGER USING id::INTEGER;
    `);

    console.log('✅ id 컬럼 타입 변경 완료');

    // 3. 변경 후 확인
    console.log('\n📋 변경 후 id 컬럼 타입 확인 중...');
    const afterCheck = await client.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'main_education_data'
        AND column_name = 'id';
    `);

    console.log('변경 후 id 컬럼 정보:');
    console.table(afterCheck.rows);

    // 4. 시퀀스 확인 및 설정
    console.log('\n🔧 시퀀스 확인 중...');
    const sequenceCheck = await client.query(`
      SELECT pg_get_serial_sequence('main_education_data', 'id') AS sequence_name;
    `);

    if (sequenceCheck.rows[0].sequence_name) {
      console.log('✅ 시퀀스 존재:', sequenceCheck.rows[0].sequence_name);
    } else {
      console.log('⚠️ 시퀀스가 없습니다. 자동 증가를 위해 시퀀스 생성 중...');

      // 현재 최대값 확인
      const maxId = await client.query(`
        SELECT COALESCE(MAX(id), 0) AS max_id FROM main_education_data;
      `);
      const currentMax = maxId.rows[0].max_id;
      console.log('현재 최대 id:', currentMax);

      // 시퀀스 생성
      await client.query(`
        CREATE SEQUENCE IF NOT EXISTS main_education_data_id_seq
        START WITH ${currentMax + 1};
      `);

      // 시퀀스를 id 컬럼의 기본값으로 설정
      await client.query(`
        ALTER TABLE main_education_data
        ALTER COLUMN id SET DEFAULT nextval('main_education_data_id_seq');
      `);

      // 시퀀스 소유권 설정
      await client.query(`
        ALTER SEQUENCE main_education_data_id_seq
        OWNED BY main_education_data.id;
      `);

      console.log('✅ 시퀀스 생성 및 설정 완료');
    }

    console.log('\n✅ 모든 작업 완료!');
    console.log('\n📝 요약:');
    console.log('- id 컬럼이 int4(integer) 타입으로 변경되었습니다.');
    console.log('- 자동 증가 시퀀스가 설정되었습니다.');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세:', error);
  } finally {
    await client.end();
    console.log('\n🔌 PostgreSQL 연결 종료');
  }
}

updateIdColumnToInt4();
