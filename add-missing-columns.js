const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function addMissingColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    console.log('🔗 데이터베이스 연결 성공');

    // 1. country 컬럼 추가
    console.log('\n🔧 country 컬럼 추가...');
    try {
      await client.query(`
        ALTER TABLE admin_users_userprofiles
        ADD COLUMN country VARCHAR(100);
      `);
      console.log('✅ country 컬럼 추가 완료');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  country 컬럼이 이미 존재합니다');
      } else {
        console.error('❌ country 컬럼 추가 실패:', error.message);
      }
    }

    // 2. address 컬럼 추가
    console.log('\n🔧 address 컬럼 추가...');
    try {
      await client.query(`
        ALTER TABLE admin_users_userprofiles
        ADD COLUMN address TEXT;
      `);
      console.log('✅ address 컬럼 추가 완료');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  address 컬럼이 이미 존재합니다');
      } else {
        console.error('❌ address 컬럼 추가 실패:', error.message);
      }
    }

    // 3. 추가된 컬럼 확인
    console.log('\n📊 업데이트된 테이블 구조 확인:');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'admin_users_userprofiles'
      AND column_name IN ('country', 'address', 'phone', 'email')
      ORDER BY column_name;
    `);

    columns.rows.forEach((col, index) => {
      const maxLength = col.character_maximum_length ? ` (max: ${col.character_maximum_length})` : '';
      console.log(`  ${index + 1}. ${col.column_name}: ${col.data_type}${maxLength} (nullable: ${col.is_nullable})`);
    });

    console.log('\n🎯 누락된 컬럼 추가 작업이 완료되었습니다!');
    console.log('이제 country와 address 필드에 데이터를 저장할 수 있습니다.');

  } catch (error) {
    console.error('❌ 데이터베이스 오류:', error.message);
  } finally {
    await client.end();
  }
}

// 스크립트 실행
addMissingColumns();