const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

(async () => {
  try {
    console.log('📊 admin_users_userprofiles 테이블 스키마 확인\n');

    // 테이블 컬럼 정보 조회
    const schemaQuery = `
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'admin_users_userprofiles'
        AND column_name IN ('phone', 'country', 'address', 'email', 'user_name', 'department', 'position', 'role')
      ORDER BY ordinal_position;
    `;

    const schemaResult = await pool.query(schemaQuery);

    console.log('컬럼 정보:');
    console.log('─'.repeat(80));
    schemaResult.rows.forEach((col) => {
      console.log(`📌 ${col.column_name}`);
      console.log(`   타입: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
      console.log(`   NULL 허용: ${col.is_nullable}`);
      console.log(`   기본값: ${col.column_default || 'None'}`);
      console.log('');
    });

    // 최근 데이터 확인
    console.log('\n📊 최근 3명 데이터 확인');
    console.log('─'.repeat(80));

    const dataQuery = `
      SELECT
        id,
        user_code,
        user_name,
        email,
        phone,
        country,
        address,
        created_at
      FROM admin_users_userprofiles
      ORDER BY created_at DESC
      LIMIT 3;
    `;

    const dataResult = await pool.query(dataQuery);

    dataResult.rows.forEach((row, idx) => {
      console.log(`\n${idx + 1}. ${row.user_code} - ${row.user_name}`);
      console.log(`   이메일: ${row.email || 'NULL'}`);
      console.log(`   전화번호: ${row.phone || 'NULL'}`);
      console.log(`   국가: ${row.country || 'NULL'}`);
      console.log(`   주소: ${row.address || 'NULL'}`);
      console.log(`   생성일: ${row.created_at}`);
    });

    await pool.end();
  } catch (error) {
    console.error('❌ 오류:', error);
    await pool.end();
  }
})();
