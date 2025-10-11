const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Supabase DATABASE_URL 파싱
const databaseUrl = process.env.DATABASE_URL;
console.log('🔗 데이터베이스 URL:', databaseUrl);

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkHardwareTableStructure() {
  try {
    console.log('🔍 하드웨어 테이블 구조 확인 중...');

    // 먼저 모든 테이블 목록 확인
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%hardware%'
      ORDER BY table_name;
    `);

    console.log('\n📋 하드웨어 관련 테이블 목록:');
    console.table(tablesResult.rows);

    if (tablesResult.rows.length === 0) {
      console.log('❌ 하드웨어 관련 테이블이 없습니다.');
      return;
    }

    // 첫 번째 하드웨어 테이블의 컬럼 정보 조회
    const tableName = tablesResult.rows[0].table_name;
    console.log(`\n🔍 ${tableName} 테이블 구조 확인 중...`);

    const result = await pool.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `, [tableName]);

    console.log(`\n📋 ${tableName} 테이블 구조:`);
    console.table(result.rows);

    // image_1_url, image_2_url 컬럼 존재 확인
    const imageColumns = result.rows.filter(row =>
      row.column_name === 'image_1_url' || row.column_name === 'image_2_url'
    );

    if (imageColumns.length === 0) {
      console.log('\n❌ 이미지 URL 컬럼이 존재하지 않습니다.');
      console.log('💡 image_1_url, image_2_url 컬럼을 추가해야 합니다.');
    } else {
      console.log('\n✅ 이미지 URL 컬럼이 존재합니다:');
      console.table(imageColumns);
    }

  } catch (error) {
    console.error('❌ 테이블 구조 확인 중 오류:', error);
  } finally {
    pool.end();
  }
}

checkHardwareTableStructure();