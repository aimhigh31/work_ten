const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkImageUrls() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    console.log('🔗 데이터베이스 연결 성공');

    // 모든 사용자의 이미지 URL 확인 (최신순)
    const result = await client.query(`
      SELECT id, user_code, user_name, profile_image_url, avatar_url, updated_at
      FROM admin_users_userprofiles
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 10;
    `);

    console.log('\n📸 사용자별 이미지 URL 상태:');
    console.log('============================================');

    if (result.rows.length === 0) {
      console.log('  데이터가 없습니다.');
    } else {
      result.rows.forEach(row => {
        console.log(`🔹 ID: ${row.id}, Code: ${row.user_code}`);
        console.log(`   이름: ${row.user_name}`);
        console.log(`   Profile Image URL: ${row.profile_image_url || '❌ NULL'}`);
        console.log(`   Avatar URL: ${row.avatar_url || '❌ NULL'}`);
        console.log(`   업데이트: ${row.updated_at ? new Date(row.updated_at).toLocaleString('ko-KR') : 'N/A'}`);
        console.log('   ----------------------------------------');
      });
    }

    // 이미지 URL이 있는 사용자 수 확인
    const imageCount = await client.query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(profile_image_url) as users_with_profile_image,
        COUNT(avatar_url) as users_with_avatar
      FROM admin_users_userprofiles;
    `);

    console.log('\n📊 이미지 통계:');
    const stats = imageCount.rows[0];
    console.log(`   전체 사용자: ${stats.total_users}명`);
    console.log(`   프로필 이미지 있음: ${stats.users_with_profile_image}명`);
    console.log(`   아바타 이미지 있음: ${stats.users_with_avatar}명`);

    if (stats.users_with_profile_image === '0' && stats.users_with_avatar === '0') {
      console.log('\n⚠️  모든 사용자의 이미지 URL이 NULL입니다.');
      console.log('   이미지 업로드 후 DB 저장이 제대로 되지 않고 있을 수 있습니다.');
    }

  } catch (error) {
    console.error('❌ 데이터베이스 오류:', error.message);
  } finally {
    await client.end();
  }
}

// 스크립트 실행
checkImageUrls();