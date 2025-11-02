const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCodes() {
  const { data, error } = await supabase
    .from('main_task_management')
    .select('id, code, registration_date')
    .order('id', { ascending: true })
    .limit(20);

  if (error) {
    console.error('오류:', error);
  } else {
    console.log('현재 업무관리 데이터 코드 목록:');
    console.log(data);
    console.log(`\n총 ${data.length}개의 데이터`);
  }
}

checkCodes();
