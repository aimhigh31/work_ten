const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testUserDataSave() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    console.log('🔗 데이터베이스 연결 성공');

    // 테스트용 사용자 데이터로 업데이트
    const testUserId = 1; // USER-25-001 (김개발자)

    console.log('\n🧪 테스트: phone, country, address 직접 업데이트...');

    const updateQuery = `
      UPDATE admin_users_userprofiles
      SET
        phone = $1,
        country = $2,
        address = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING id, user_name, phone, country, address, updated_at;
    `;

    const testData = [
      '010-1234-5678',           // phone
      '대한민국',                 // country
      '서울시 강남구 테헤란로 123', // address
      testUserId                 // id
    ];

    const result = await client.query(updateQuery, testData);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ 업데이트 성공!');
      console.log(`   사용자: ${user.user_name}`);
      console.log(`   전화번호: ${user.phone}`);
      console.log(`   국가: ${user.country}`);
      console.log(`   주소: ${user.address}`);
      console.log(`   업데이트 시간: ${new Date(user.updated_at).toLocaleString('ko-KR')}`);
    } else {
      console.log('❌ 업데이트 실패: 해당 사용자를 찾을 수 없습니다.');
    }

    // 다른 사용자들도 확인
    console.log('\n📊 모든 사용자의 phone, country, address 상태:');
    const allUsersQuery = `
      SELECT id, user_name, phone, country, address
      FROM admin_users_userprofiles
      ORDER BY id;
    `;

    const allUsers = await client.query(allUsersQuery);

    allUsers.rows.forEach((user, index) => {
      console.log(`\n  ${index + 1}. ${user.user_name} (ID: ${user.id})`);
      console.log(`     전화번호: ${user.phone || '❌ NULL'}`);
      console.log(`     국가: ${user.country || '❌ NULL'}`);
      console.log(`     주소: ${user.address || '❌ NULL'}`);
    });

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  } finally {
    await client.end();
  }
}

// 스크립트 실행
testUserDataSave();