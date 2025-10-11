const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function addInspectionReportColumns() {
  console.log('🔄 security_inspection_data 테이블에 점검성과보고 컬럼 추가 중...\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 점검성과보고 관련 컬럼 추가
    const alterTableQuery = `
      ALTER TABLE security_inspection_data
      ADD COLUMN IF NOT EXISTS details TEXT,
      ADD COLUMN IF NOT EXISTS performance TEXT,
      ADD COLUMN IF NOT EXISTS improvements TEXT,
      ADD COLUMN IF NOT EXISTS thoughts TEXT,
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    `;

    await client.query(alterTableQuery);
    console.log('✅ 컬럼 추가 성공');

    // 테이블 구조 확인
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'security_inspection_data'
      ORDER BY ordinal_position;
    `;

    const columnsResult = await client.query(columnsQuery);
    console.log('\n📋 업데이트된 테이블 구조:');
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세 오류:', error);
  } finally {
    await client.end();
  }
}

addInspectionReportColumns();
