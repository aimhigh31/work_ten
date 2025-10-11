const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Supabase URL:', supabaseUrl);
console.log('🔧 Service Key 설정됨:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY 필요');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
  try {
    console.log('📦 profile-images 버킷 생성 중...');

    // 버킷 생성 시도
    const { data, error } = await supabase.storage.createBucket('profile-images', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ profile-images 버킷이 이미 존재합니다.');
      } else {
        throw error;
      }
    } else {
      console.log('✅ profile-images 버킷이 생성되었습니다:', data);
    }

    // 버킷 목록 확인
    console.log('\n📋 현재 버킷 목록:');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ 버킷 목록 조회 실패:', listError);
    } else {
      buckets.forEach(bucket => {
        console.log(`  - ${bucket.name} (public: ${bucket.public})`);
      });
    }

    console.log('\n🎯 Storage 설정이 완료되었습니다!');
    console.log('이제 프로필 사진 업로드를 테스트해보세요.');

  } catch (error) {
    console.error('❌ 버킷 생성 실패:', error);
    console.error('상세 오류:', error.message);

    // 수동 생성 안내
    console.log('\n📋 수동 생성 방법:');
    console.log('1. Supabase Dashboard → Storage → Create Bucket');
    console.log('2. Bucket ID: profile-images');
    console.log('3. Public bucket: 체크');
    console.log('4. Create bucket 클릭');
  }
}

// 스크립트 실행
createBucket();