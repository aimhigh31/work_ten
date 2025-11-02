const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkUserCodes() {
  console.log('\n=== 사용자 테이블 코드 확인 ===');

  const { data: userData, error: userError } = await supabase
    .from('admin_users_userprofiles')
    .select('id, user_code, user_name, created_at')
    .order('created_at', { ascending: true });

  if (userError) {
    console.error('❌ admin_users_userprofiles 오류:', userError);
  } else {
    console.log('✅ admin_users_userprofiles 데이터:');
    console.log(`총 ${userData?.length || 0}개의 데이터\n`);

    if (userData && userData.length > 0) {
      console.log('코드 형식 예시:');
      userData.forEach(u => console.log(`  ${u.user_code} - ${u.user_name}`));

      // 25년도 코드만 필터링
      const year25Codes = userData.filter(u => u.user_code && u.user_code.startsWith('USER-25-'));
      console.log(`\n25년도 코드: ${year25Codes.length}개`);
      year25Codes.forEach(u => console.log(`  ${u.user_code}`));
    }
  }
}

checkUserCodes();
