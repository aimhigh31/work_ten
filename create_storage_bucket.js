const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createStorageBucket() {
  console.log('🗄️ Supabase Storage 버킷 생성 중...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. 기존 버킷 확인
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ 버킷 목록 조회 실패:', listError);
      return;
    }

    console.log('📋 기존 버킷 목록:', buckets.map((b) => b.name));

    const bucketName = 'opl-images';
    const existingBucket = buckets.find((b) => b.name === bucketName);

    if (existingBucket) {
      console.log(`✅ "${bucketName}" 버킷이 이미 존재합니다.`);
      return;
    }

    // 2. 버킷 생성 (퍼블릭 접근 허용)
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 5242880 // 5MB
    });

    if (error) {
      console.error('❌ 버킷 생성 실패:', error);
      return;
    }

    console.log(`✅ "${bucketName}" 버킷 생성 성공`);

    // 3. 버킷 정책 확인
    console.log('\n📋 생성된 버킷 정보:');
    console.log('  - 이름:', bucketName);
    console.log('  - 퍼블릭 접근: 허용');
    console.log('  - 최대 파일 크기: 5MB');
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

createStorageBucket();
