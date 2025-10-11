const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkUserData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    console.log('🔗 데이터베이스 연결 성공');

    // 사용자 테이블의 모든 컬럼 확인
    console.log('\n📊 사용자 테이블 컬럼 목록:');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'admin_users_userprofiles'
      ORDER BY ordinal_position;
    `);

    columns.rows.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 최신 사용자 데이터 상세 확인 (모든 필드)
    console.log('\n📝 최신 사용자 데이터 (상세):');
    console.log('============================================');

    const userData = await client.query(`
      SELECT
        id, user_code, user_name, email, phone,
        department, position, role, status,
        profile_image_url, avatar_url,
        created_at, updated_at
      FROM admin_users_userprofiles
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 5;
    `);

    if (userData.rows.length === 0) {
      console.log('❌ 사용자 데이터가 없습니다.');
    } else {
      userData.rows.forEach((user, index) => {
        console.log(`\n🔹 사용자 ${index + 1}:`);
        console.log(`   ID: ${user.id}`);
        console.log(`   코드: ${user.user_code}`);
        console.log(`   이름: ${user.user_name}`);
        console.log(`   이메일: ${user.email || '❌ NULL'}`);
        console.log(`   전화번호: ${user.phone || '❌ NULL'}`);
        console.log(`   부서: ${user.department || '❌ NULL'}`);
        console.log(`   직급: ${user.position || '❌ NULL'}`);
        console.log(`   역할: ${user.role || '❌ NULL'}`);
        console.log(`   상태: ${user.status || '❌ NULL'}`);
        console.log(`   프로필 이미지: ${user.profile_image_url || '❌ NULL'}`);
        console.log(`   아바타: ${user.avatar_url || '❌ NULL'}`);
        console.log(`   생성일: ${user.created_at ? new Date(user.created_at).toLocaleString('ko-KR') : 'N/A'}`);
        console.log(`   수정일: ${user.updated_at ? new Date(user.updated_at).toLocaleString('ko-KR') : 'N/A'}`);
        console.log('   ----------------------------------------');
      });
    }

    // 테이블에 있는지 없는 필드 확인
    console.log('\n🔍 확인해야 할 필드들:');
    const fieldCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'admin_users_userprofiles'
      AND column_name IN ('email', 'phone', 'country', 'address');
    `);

    const existingFields = fieldCheck.rows.map(row => row.column_name);
    const requiredFields = ['email', 'phone', 'country', 'address'];

    requiredFields.forEach(field => {
      if (existingFields.includes(field)) {
        console.log(`   ✅ ${field}: 컬럼 존재`);
      } else {
        console.log(`   ❌ ${field}: 컬럼 없음 - 추가 필요`);
      }
    });

  } catch (error) {
    console.error('❌ 데이터베이스 오류:', error.message);
  } finally {
    await client.end();
  }
}

// 스크립트 실행
checkUserData();