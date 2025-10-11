const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Supabase URL:', supabaseUrl);
console.log('🔧 Service Key 설정됨:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateBucketLimits() {
  try {
    console.log('📊 현재 버킷 설정 확인 중...');

    // 현재 버킷 정보 조회
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ 버킷 조회 실패:', listError);
      return;
    }

    console.log('\n📋 현재 버킷 목록:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name}`);
      console.log(`    Public: ${bucket.public}`);
      console.log(`    File Size Limit: ${bucket.file_size_limit || '제한 없음'}`);
      console.log(`    Allowed MIME Types: ${bucket.allowed_mime_types || '제한 없음'}`);
    });

    // profile-images 버킷 업데이트 (용량 제한 설정)
    console.log('\n🔧 profile-images 버킷 제한 설정 중...');

    const { data: updateResult, error: updateError } = await supabase.storage.updateBucket('profile-images', {
      public: true,
      file_size_limit: 5242880, // 5MB
      allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    });

    if (updateError) {
      console.error('❌ 버킷 업데이트 실패:', updateError);

      // SQL로 직접 업데이트 시도
      console.log('\n🔄 SQL로 직접 업데이트 시도...');
      const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `
          UPDATE storage.buckets
          SET
            file_size_limit = 5242880,
            allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']::text[]
          WHERE id = 'profile-images';
        `
      });

      if (sqlError) {
        console.error('❌ SQL 업데이트 실패:', sqlError);
      } else {
        console.log('✅ SQL로 버킷 제한 설정 완료');
      }
    } else {
      console.log('✅ 버킷 제한 설정 완료:', updateResult);
    }

    // 업데이트된 버킷 정보 확인
    console.log('\n📊 업데이트된 버킷 설정:');
    const { data: updatedBuckets } = await supabase.storage.listBuckets();

    const profileBucket = updatedBuckets?.find(b => b.name === 'profile-images');
    if (profileBucket) {
      console.log(`  - File Size Limit: ${profileBucket.file_size_limit ? `${(profileBucket.file_size_limit / 1024 / 1024).toFixed(1)}MB` : '제한 없음'}`);
      console.log(`  - Allowed MIME Types: ${profileBucket.allowed_mime_types || '제한 없음'}`);
    }

    console.log('\n🎯 Storage 용량 제한 설정이 완료되었습니다!');

  } catch (error) {
    console.error('❌ 버킷 제한 설정 실패:', error);

    // 수동 설정 안내
    console.log('\n📋 수동 설정 방법:');
    console.log('1. Supabase Dashboard → Storage → profile-images 버킷 클릭');
    console.log('2. Settings 탭 클릭');
    console.log('3. File size limit: 5MB 설정');
    console.log('4. Allowed MIME types: image/jpeg, image/png, image/gif, image/webp 설정');

    console.log('\n또는 SQL Editor에서:');
    console.log(`
UPDATE storage.buckets
SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']::text[]
WHERE id = 'profile-images';
    `);
  }
}

// 스크립트 실행
updateBucketLimits();