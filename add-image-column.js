const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function addProfileImageColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    console.log('🔗 데이터베이스 연결 성공');

    // 컬럼이 존재하는지 확인
    const checkColumn = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'admin_users_userprofiles'
      AND column_name = 'profile_image_url';
    `;

    const checkResult = await client.query(checkColumn);

    if (checkResult.rows.length > 0) {
      console.log('✅ profile_image_url 컬럼이 이미 존재합니다.');
    } else {
      console.log('🔧 profile_image_url 컬럼 추가 중...');

      // 컬럼 추가
      const addColumn = `
        ALTER TABLE admin_users_userprofiles
        ADD COLUMN profile_image_url TEXT;
      `;

      await client.query(addColumn);
      console.log('✅ profile_image_url 컬럼이 추가되었습니다.');
    }

    // 테이블 구조 확인
    console.log('\n📋 현재 테이블 구조:');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'admin_users_userprofiles'
      ORDER BY ordinal_position;
    `);

    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    console.log('\n🎯 데이터베이스 업데이트 완료!');

  } catch (error) {
    console.error('❌ 데이터베이스 오류:', error.message);

    // 상세 오류 정보 출력
    if (error.code) {
      console.error('오류 코드:', error.code);
    }
    if (error.detail) {
      console.error('상세 정보:', error.detail);
    }
  } finally {
    await client.end();
  }
}

// 스크립트 실행
addProfileImageColumn();