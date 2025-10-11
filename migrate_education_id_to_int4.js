const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migrateIdToInt4() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔌 PostgreSQL 연결 중...');
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공\n');

    // 1. 현재 데이터 확인
    console.log('📋 현재 데이터 확인 중...');
    const dataCount = await client.query(`
      SELECT COUNT(*) as count FROM main_education_data;
    `);
    console.log(`현재 데이터 개수: ${dataCount.rows[0].count}개\n`);

    // 2. 트랜잭션 시작
    console.log('🔄 트랜잭션 시작...\n');
    await client.query('BEGIN');

    // 3. 임시 integer id 컬럼 추가
    console.log('🔧 임시 id_new 컬럼 추가 중...');
    await client.query(`
      ALTER TABLE main_education_data
      ADD COLUMN id_new SERIAL;
    `);
    console.log('✅ id_new 컬럼 추가 완료\n');

    // 4. 외래키 제약조건 확인 및 삭제
    console.log('🔍 외래키 제약조건 확인 중...');
    const foreignKeys = await client.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'main_education_data'
        AND ccu.column_name = 'id';
    `);

    if (foreignKeys.rows.length > 0) {
      console.log('발견된 외래키 제약조건:');
      console.table(foreignKeys.rows);

      // 외래키 제약조건 임시 삭제
      for (const fk of foreignKeys.rows) {
        console.log(`🔧 외래키 제약조건 삭제: ${fk.constraint_name}`);
        await client.query(`
          ALTER TABLE ${fk.table_name}
          DROP CONSTRAINT ${fk.constraint_name};
        `);
      }
      console.log('✅ 외래키 제약조건 삭제 완료\n');
    } else {
      console.log('외래키 제약조건 없음\n');
    }

    // 5. 기존 id 컬럼 삭제 및 id_new를 id로 변경
    console.log('🔧 기존 id 컬럼 삭제 중...');
    await client.query(`
      ALTER TABLE main_education_data
      DROP COLUMN id;
    `);
    console.log('✅ 기존 id 컬럼 삭제 완료\n');

    console.log('🔧 id_new를 id로 이름 변경 중...');
    await client.query(`
      ALTER TABLE main_education_data
      RENAME COLUMN id_new TO id;
    `);
    console.log('✅ 컬럼 이름 변경 완료\n');

    // 6. id를 PRIMARY KEY로 설정
    console.log('🔧 id를 PRIMARY KEY로 설정 중...');
    await client.query(`
      ALTER TABLE main_education_data
      ADD PRIMARY KEY (id);
    `);
    console.log('✅ PRIMARY KEY 설정 완료\n');

    // 7. 외래키 제약조건 복원 (필요한 경우)
    if (foreignKeys.rows.length > 0) {
      console.log('🔧 외래키 제약조건 복원 중...');
      for (const fk of foreignKeys.rows) {
        // 참조 테이블의 컬럼도 integer로 변경해야 할 수 있음
        console.log(`⚠️ 수동 복원 필요: ${fk.table_name}.${fk.column_name} → main_education_data.id`);
      }
    }

    // 8. 트랜잭션 커밋
    await client.query('COMMIT');
    console.log('✅ 트랜잭션 커밋 완료\n');

    // 9. 변경 후 확인
    console.log('📋 변경 후 테이블 구조 확인:');
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
    console.table(afterCheck.rows);

    // 10. 데이터 확인
    console.log('\n📋 변경 후 데이터 확인:');
    const afterData = await client.query(`
      SELECT id, code, title, created_at
      FROM main_education_data
      ORDER BY id
      LIMIT 5;
    `);
    console.table(afterData.rows);

    console.log('\n✅ 모든 작업 완료!');
    console.log('\n📝 요약:');
    console.log('- id 컬럼이 UUID에서 INTEGER(int4)로 변경되었습니다.');
    console.log('- 자동 증가 시퀀스(SERIAL)가 설정되었습니다.');
    console.log('- 새로운 데이터는 1, 2, 3... 순서로 자동 할당됩니다.');

  } catch (error) {
    // 오류 발생 시 롤백
    try {
      await client.query('ROLLBACK');
      console.error('❌ 오류 발생으로 롤백 완료');
    } catch (rollbackError) {
      console.error('❌ 롤백 실패:', rollbackError.message);
    }

    console.error('❌ 오류 발생:', error.message);
    console.error('상세:', error);
  } finally {
    await client.end();
    console.log('\n🔌 PostgreSQL 연결 종료');
  }
}

migrateIdToInt4();
