const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function addUserAccountColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    console.log('🔗 데이터베이스 연결 성공');

    // user_account_id 컬럼 추가
    console.log('\n🔧 user_account_id 컬럼 추가...');
    try {
      await client.query(`
        ALTER TABLE admin_users_userprofiles
        ADD COLUMN user_account_id VARCHAR(50);
      `);
      console.log('✅ user_account_id 컬럼 추가 완료');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  user_account_id 컬럼이 이미 존재합니다');
      } else {
        console.error('❌ user_account_id 컬럼 추가 실패:', error.message);
      }
    }

    // 기존 사용자들에 대해 기본값 설정 (user_code를 기반으로)
    console.log('\n🔧 기존 사용자들의 user_account_id 기본값 설정...');
    const updateQuery = `
      UPDATE admin_users_userprofiles
      SET user_account_id = LOWER(REPLACE(user_code, '-', '_'))
      WHERE user_account_id IS NULL;
    `;

    const result = await client.query(updateQuery);
    console.log(`✅ ${result.rowCount}개 사용자의 user_account_id 설정 완료`);

    // 업데이트된 컬럼 확인
    console.log('\n📊 업데이트된 테이블 구조 확인:');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'admin_users_userprofiles'
      AND column_name IN ('user_account_id', 'email', 'phone')
      ORDER BY column_name;
    `);

    columns.rows.forEach((col, index) => {
      const maxLength = col.character_maximum_length ? ` (max: ${col.character_maximum_length})` : '';
      console.log(`  ${index + 1}. ${col.column_name}: ${col.data_type}${maxLength} (nullable: ${col.is_nullable})`);
    });

    // 사용자 데이터 확인
    console.log('\n📝 사용자 데이터 확인:');
    const userData = await client.query(`
      SELECT id, user_name, user_code, user_account_id, email, phone
      FROM admin_users_userprofiles
      ORDER BY id
      LIMIT 5;
    `);

    userData.rows.forEach((user, index) => {
      console.log(`\n  ${index + 1}. ${user.user_name} (ID: ${user.id})`);
      console.log(`     코드: ${user.user_code}`);
      console.log(`     계정ID: ${user.user_account_id || '❌ NULL'}`);
      console.log(`     이메일: ${user.email}`);
      console.log(`     전화번호: ${user.phone || '❌ NULL'}`);
    });

    console.log('\n🎯 사용자계정(ID) 컬럼 추가 작업이 완료되었습니다!');

  } catch (error) {
    console.error('❌ 데이터베이스 오류:', error.message);
  } finally {
    await client.end();
  }
}

// 스크립트 실행
addUserAccountColumn();