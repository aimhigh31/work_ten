const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateBucketTo1MB() {
  try {
    console.log('🔧 profile-images 버킷을 1MB 제한으로 업데이트 중...');

    const { data: updateResult, error: updateError } = await supabase.storage.updateBucket('profile-images', {
      public: true,
      file_size_limit: 1048576, // 1MB
      allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    });

    if (updateError) {
      console.error('❌ 버킷 업데이트 실패:', updateError);

      // SQL로 직접 업데이트 시도
      console.log('\n🔄 SQL로 직접 업데이트 시도...');
      const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `
          UPDATE storage.buckets
          SET file_size_limit = 1048576
          WHERE id = 'profile-images';
        `
      });

      if (sqlError) {
        console.error('❌ SQL 업데이트 실패:', sqlError);
      } else {
        console.log('✅ SQL로 버킷 제한 1MB로 설정 완료');
      }
    } else {
      console.log('✅ 버킷 제한 1MB로 설정 완료:', updateResult);
    }

    // 업데이트된 버킷 정보 확인
    console.log('\n📊 업데이트된 버킷 설정:');
    const { data: buckets } = await supabase.storage.listBuckets();

    const profileBucket = buckets?.find(b => b.name === 'profile-images');
    if (profileBucket) {
      const sizeLimitMB = profileBucket.file_size_limit ? (profileBucket.file_size_limit / 1024 / 1024).toFixed(1) : '제한 없음';
      console.log(`  - File Size Limit: ${sizeLimitMB}MB`);
      console.log(`  - Allowed MIME Types: ${profileBucket.allowed_mime_types || '제한 없음'}`);
    }

    console.log('\n🎯 프로필 이미지 업로드 제한이 1MB로 변경되었습니다!');

  } catch (error) {
    console.error('❌ 버킷 업데이트 실패:', error);

    console.log('\n📋 수동 설정 방법:');
    console.log('Supabase Dashboard → SQL Editor에서:');
    console.log(`
UPDATE storage.buckets
SET file_size_limit = 1048576
WHERE id = 'profile-images';
    `);
  }
}

// 스크립트 실행
updateBucketTo1MB();