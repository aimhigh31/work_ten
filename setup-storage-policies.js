const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Service Role Key가 필요합니다 (RLS 정책 설정용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Supabase URL:', supabaseUrl);
console.log('🔧 Service Key 설정됨:', !!supabaseServiceKey);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY가 필요합니다.');
  console.error('Supabase Dashboard → Settings → API → service_role key를 복사하여');
  console.error('.env.local 파일에 SUPABASE_SERVICE_ROLE_KEY=your_service_key 추가하세요.');

  // 일반 키로 시도
  console.log('\n⚠️  일반 anon key로 시도합니다...');
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY도 없습니다.');
    process.exit(1);
  }
}

const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function setupStoragePolicies() {
  try {
    console.log('📋 Storage RLS 정책 설정 중...');

    // SQL로 정책 생성
    const policies = [
      // 모든 사용자가 업로드 가능 (임시로 느슨한 정책)
      {
        name: 'Allow all uploads to profile-images',
        sql: `
          CREATE POLICY "Allow all uploads to profile-images"
          ON storage.objects
          FOR INSERT
          WITH CHECK (bucket_id = 'profile-images');
        `
      },
      // 모든 사용자가 읽기 가능
      {
        name: 'Allow public access to profile-images',
        sql: `
          CREATE POLICY "Allow public access to profile-images"
          ON storage.objects
          FOR SELECT
          USING (bucket_id = 'profile-images');
        `
      },
      // 모든 사용자가 업데이트 가능 (임시)
      {
        name: 'Allow all updates to profile-images',
        sql: `
          CREATE POLICY "Allow all updates to profile-images"
          ON storage.objects
          FOR UPDATE
          WITH CHECK (bucket_id = 'profile-images');
        `
      },
      // 모든 사용자가 삭제 가능 (임시)
      {
        name: 'Allow all deletes to profile-images',
        sql: `
          CREATE POLICY "Allow all deletes to profile-images"
          ON storage.objects
          FOR DELETE
          USING (bucket_id = 'profile-images');
        `
      }
    ];

    for (const policy of policies) {
      console.log(`\n🔐 정책 생성 중: ${policy.name}`);

      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: policy.sql
        });

        if (error) {
          if (error.message.includes('already exists')) {
            console.log(`✅ 정책이 이미 존재합니다: ${policy.name}`);
          } else {
            console.error(`❌ 정책 생성 실패: ${policy.name}`, error.message);
          }
        } else {
          console.log(`✅ 정책 생성 완료: ${policy.name}`);
        }
      } catch (err) {
        console.error(`❌ 정책 생성 오류: ${policy.name}`, err.message);
      }
    }

    console.log('\n🎯 Storage RLS 정책 설정이 완료되었습니다!');
    console.log('이제 프로필 사진 업로드를 다시 테스트해보세요.');

  } catch (error) {
    console.error('❌ Storage 정책 설정 실패:', error);

    // 수동 설정 안내
    console.log('\n📋 수동 설정 방법 (Supabase Dashboard → SQL Editor):');
    console.log(`
-- 모든 사용자 업로드 허용 (임시)
CREATE POLICY "Allow all uploads to profile-images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'profile-images');

-- 공개 읽기 허용
CREATE POLICY "Allow public access to profile-images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-images');

-- 모든 사용자 업데이트/삭제 허용 (임시)
CREATE POLICY "Allow all updates to profile-images"
ON storage.objects
FOR UPDATE
WITH CHECK (bucket_id = 'profile-images');

CREATE POLICY "Allow all deletes to profile-images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'profile-images');
    `);
  }
}

// 스크립트 실행
setupStoragePolicies();