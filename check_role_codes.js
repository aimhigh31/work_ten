const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRoleCodes() {
  console.log('\n=== 역할 테이블 코드 확인 ===');

  const { data, error } = await supabase
    .from('admin_users_rules')
    .select('id, role_code, role_name, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ admin_users_rules 오류:', error);
  } else {
    console.log('✅ admin_users_rules 데이터:');
    console.log(`총 ${data?.length || 0}개의 데이터\n`);

    if (data && data.length > 0) {
      console.log('코드 형식 예시:');
      data.forEach(r => console.log(`  ${r.role_code} - ${r.role_name}`));

      // 25년도 코드만 필터링
      const year25Codes = data.filter(r => r.role_code && r.role_code.startsWith('ROLE-25-'));
      console.log(`\n25년도 코드: ${year25Codes.length}개`);
      year25Codes.forEach(r => console.log(`  ${r.role_code}`));
    }
  }
}

checkRoleCodes();
