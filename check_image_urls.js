const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;
console.log('🔗 데이터베이스 연결 중...');

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkImageUrls() {
  try {
    // image_1_url 또는 image_2_url이 있는 데이터 조회
    const result = await pool.query(`
      SELECT
        id,
        code,
        asset_name,
        image_1_url,
        image_2_url,
        created_at
      FROM it_hardware_data
      WHERE image_1_url IS NOT NULL
         OR image_2_url IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 10;
    `);

    if (result.rows.length > 0) {
      console.log('\n✅ 이미지 URL이 저장된 하드웨어 데이터:');
      console.table(result.rows);
    } else {
      console.log('\n❌ 이미지 URL이 저장된 데이터가 없습니다.');
    }

    // 전체 데이터 수 확인
    const countResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM it_hardware_data;
    `);

    console.log(`\n📊 전체 하드웨어 데이터: ${countResult.rows[0].total}개`);

  } catch (error) {
    console.error('❌ 조회 중 오류:', error);
  } finally {
    pool.end();
  }
}

checkImageUrls();