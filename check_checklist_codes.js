const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkChecklistCodes() {
  console.log('\n=== 체크리스트 테이블 코드 확인 ===');

  const { data, error } = await supabase
    .from('admin_checklist_data')
    .select('code, work_content, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ admin_checklist_data 오류:', error);
  } else {
    console.log('✅ admin_checklist_data 데이터:');
    console.log(`총 ${data?.length || 0}개의 데이터\n`);

    if (data && data.length > 0) {
      console.log('코드 형식 예시:');
      data.forEach(c => console.log(`  ${c.code} - ${c.work_content}`));

      // 25년도 코드만 필터링
      const year25Codes = data.filter(c => c.code && c.code.startsWith('ADMIN-CHECK-25-'));
      console.log(`\n25년도 코드: ${year25Codes.length}개`);
      year25Codes.forEach(c => console.log(`  ${c.code}`));
    }
  }
}

checkChecklistCodes();
