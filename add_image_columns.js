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

async function addImageColumns() {
  try {
    console.log('🔧 it_hardware_data 테이블에 이미지 URL 컬럼 추가 중...');

    // image_1_url, image_2_url 컬럼 추가
    const addColumnsQuery = `
      ALTER TABLE it_hardware_data
      ADD COLUMN IF NOT EXISTS image_1_url TEXT,
      ADD COLUMN IF NOT EXISTS image_2_url TEXT;
    `;

    await pool.query(addColumnsQuery);
    console.log('✅ image_1_url, image_2_url 컬럼 추가 완료');

    // 추가된 컬럼 확인
    const checkResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'it_hardware_data'
      AND column_name IN ('image_1_url', 'image_2_url')
      ORDER BY column_name;
    `);

    console.log('\n📋 추가된 이미지 URL 컬럼들:');
    console.table(checkResult.rows);

    // 기존 images 배열 데이터를 개별 URL로 마이그레이션 (선택사항)
    console.log('\n🔄 기존 images 배열 데이터 확인 중...');
    const existingDataResult = await pool.query(`
      SELECT id, images
      FROM it_hardware_data
      WHERE images IS NOT NULL
      AND array_length(images, 1) > 0
      LIMIT 5;
    `);

    if (existingDataResult.rows.length > 0) {
      console.log('📦 기존 images 배열 데이터 발견:');
      console.table(existingDataResult.rows);

      console.log('\n💡 기존 배열 데이터를 개별 URL로 마이그레이션하려면 별도 스크립트를 실행하세요.');
    } else {
      console.log('📭 기존 images 배열 데이터가 없습니다.');
    }

  } catch (error) {
    console.error('❌ 컬럼 추가 중 오류:', error);
  } finally {
    pool.end();
  }
}

addImageColumns();