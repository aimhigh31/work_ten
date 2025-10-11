const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createHardwareImageBucket() {
  try {
    console.log('🚀 하드웨어 이미지 버킷 생성 시작...');

    // 1. 버킷 생성
    const bucketName = 'hardware-images';
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket(bucketName, {
      public: true, // 공개 접근 허용
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ 버킷이 이미 존재합니다:', bucketName);
      } else {
        console.error('❌ 버킷 생성 실패:', bucketError);
        throw bucketError;
      }
    } else {
      console.log('✅ 버킷 생성 성공:', bucketName);
    }

    // 2. 버킷 정책 설정 (공개 읽기 허용)
    console.log('🔧 버킷 정책 설정 중...');

    // Storage 정책은 Supabase 대시보드에서 수동으로 설정하거나
    // SQL로 설정해야 합니다.
    console.log('📌 다음 SQL을 Supabase SQL Editor에서 실행하세요:');
    console.log(`
-- Storage 정책: 공개 읽기 허용
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'hardware-images' );

-- Storage 정책: 인증된 사용자 업로드 허용
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'hardware-images' );

-- Storage 정책: 인증된 사용자 삭제 허용
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'hardware-images' );

-- Storage 정책: 인증된 사용자 업데이트 허용
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'hardware-images' );
    `);

    // 3. 버킷 확인
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('❌ 버킷 목록 조회 실패:', listError);
    } else {
      console.log('✅ 현재 Storage 버킷 목록:');
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (공개: ${bucket.public})`);
      });
    }

    console.log('✅ 하드웨어 이미지 버킷 설정 완료!');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

createHardwareImageBucket();
