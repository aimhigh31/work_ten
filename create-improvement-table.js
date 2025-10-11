require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function createImprovementTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('PostgreSQL 연결 성공');

    // security_accident_improvement 테이블 생성 SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS security_accident_improvement (
        id SERIAL PRIMARY KEY,
        accident_id INTEGER NOT NULL,
        plan TEXT NOT NULL,
        status VARCHAR(20) DEFAULT '미완료',
        completion_date DATE,
        assignee VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by VARCHAR(100) DEFAULT 'system',
        updated_by VARCHAR(100) DEFAULT 'system',
        is_active BOOLEAN DEFAULT true,

        -- 외래키 제약조건
        CONSTRAINT fk_accident_id
          FOREIGN KEY (accident_id)
          REFERENCES security_accident_data(id)
          ON DELETE CASCADE
      );
    `;

    console.log('테이블 생성 SQL 실행 중...');
    await client.query(createTableSQL);
    console.log('✅ security_accident_improvement 테이블 생성 완료');

    // 인덱스 생성
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_improvement_accident_id
      ON security_accident_improvement(accident_id);
    `;

    await client.query(createIndexSQL);
    console.log('✅ 인덱스 생성 완료');

    // 먼저 security_accident_data에 실제 데이터가 있는지 확인
    const checkAccidentDataSQL = `
      SELECT id, code, main_content
      FROM security_accident_data
      ORDER BY id
      LIMIT 5;
    `;

    const accidentDataResult = await client.query(checkAccidentDataSQL);
    console.log('\n📊 security_accident_data 테이블 데이터:');
    console.table(accidentDataResult.rows);

    // 실제 데이터가 있는 경우에만 샘플 데이터 삽입
    if (accidentDataResult.rows.length > 0) {
      const firstAccidentId = accidentDataResult.rows[0].id;
      const insertSampleSQL = `
        INSERT INTO security_accident_improvement
        (accident_id, plan, status, assignee)
        VALUES
        ($1, '방화벽 규칙 강화', '진행중', '김보안'),
        ($1, '직원 보안 교육 실시', '완료', '이교육'),
        ($1, '패스워드 정책 강화', '미완료', '박보안')
        ON CONFLICT DO NOTHING;
      `;

      await client.query(insertSampleSQL, [firstAccidentId]);
      console.log('✅ 샘플 데이터 삽입 완료');
    } else {
      console.log('⚠️ security_accident_data 테이블에 데이터가 없어 샘플 데이터를 삽입하지 않습니다.');
    }

    // 테이블 구조 확인
    const describeTableSQL = `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'security_accident_improvement'
      ORDER BY ordinal_position;
    `;

    const result = await client.query(describeTableSQL);
    console.log('\n📋 테이블 구조:');
    console.table(result.rows);

    // 외래키 제약조건 확인
    const constraintSQL = `
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
        AND tc.table_name = 'security_accident_improvement';
    `;

    const constraintResult = await client.query(constraintSQL);
    console.log('\n🔗 외래키 제약조건:');
    console.table(constraintResult.rows);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await client.end();
    console.log('PostgreSQL 연결 종료');
  }
}

createImprovementTable();