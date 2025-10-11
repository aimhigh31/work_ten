const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function updateBucketSize() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    console.log('🔗 데이터베이스 연결 성공');

    // 현재 버킷 설정 확인
    const currentSettings = await client.query(`
      SELECT id, name, file_size_limit, allowed_mime_types
      FROM storage.buckets
      WHERE id = 'profile-images';
    `);

    console.log('📊 현재 버킷 설정:');
    if (currentSettings.rows.length > 0) {
      const bucket = currentSettings.rows[0];
      console.log(`  - ID: ${bucket.id}`);
      console.log(`  - 현재 크기 제한: ${bucket.file_size_limit ? `${(bucket.file_size_limit / 1024 / 1024).toFixed(1)}MB` : '제한 없음'}`);
    }

    // 1MB로 업데이트
    console.log('\n🔧 버킷 크기 제한을 1MB로 업데이트...');

    const updateResult = await client.query(`
      UPDATE storage.buckets
      SET file_size_limit = 1048576
      WHERE id = 'profile-images';
    `);

    console.log(`✅ ${updateResult.rowCount}개 레코드가 업데이트되었습니다.`);

    // 업데이트 후 설정 확인
    const updatedSettings = await client.query(`
      SELECT id, name, file_size_limit, allowed_mime_types
      FROM storage.buckets
      WHERE id = 'profile-images';
    `);

    console.log('\n📊 업데이트된 버킷 설정:');
    if (updatedSettings.rows.length > 0) {
      const bucket = updatedSettings.rows[0];
      console.log(`  - ID: ${bucket.id}`);
      console.log(`  - 새로운 크기 제한: ${bucket.file_size_limit ? `${(bucket.file_size_limit / 1024 / 1024).toFixed(1)}MB` : '제한 없음'}`);
      console.log(`  - MIME 타입: ${bucket.allowed_mime_types ? bucket.allowed_mime_types.join(', ') : '제한 없음'}`);
    }

    console.log('\n🎯 프로필 이미지 업로드 제한이 1MB로 성공적으로 변경되었습니다!');

  } catch (error) {
    console.error('❌ 데이터베이스 오류:', error.message);
  } finally {
    await client.end();
  }
}

// 스크립트 실행
updateBucketSize();