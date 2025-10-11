const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.log('DATABASE_URL 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkTableStructure() {
  try {
    // 테이블 컬럼 정보 조회
    const result = await pool.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'security_education_curriculum'
      ORDER BY ordinal_position;
    `);

    if (result.rows.length === 0) {
      console.log('security_education_curriculum 테이블이 존재하지 않습니다.');

      // 테이블 생성
      console.log('테이블을 생성합니다...');
      await pool.query(`
        CREATE TABLE security_education_curriculum (
          id SERIAL PRIMARY KEY,
          curriculum_name VARCHAR(255) NOT NULL,
          description TEXT,
          duration_hours INTEGER DEFAULT 0,
          target_audience VARCHAR(255),
          prerequisites TEXT,
          learning_objectives TEXT,
          content_outline TEXT,
          assessment_method VARCHAR(255),
          certification BOOLEAN DEFAULT false,
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('✅ 테이블이 성공적으로 생성되었습니다.');

      // 생성된 테이블 구조 다시 조회
      const newResult = await pool.query(`
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = 'security_education_curriculum'
        ORDER BY ordinal_position;
      `);

      console.log('\n📋 생성된 테이블 구조:');
      newResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.column_name} (${row.data_type}) - Nullable: ${row.is_nullable}, Default: ${row.column_default || 'None'}`);
      });

    } else {
      console.log('📋 security_education_curriculum 테이블 구조:');
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.column_name} (${row.data_type}) - Nullable: ${row.is_nullable}, Default: ${row.column_default || 'None'}`);
      });
    }

  } catch (error) {
    console.error('오류 발생:', error.message);
  } finally {
    await pool.end();
  }
}

checkTableStructure();