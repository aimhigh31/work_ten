const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCodes() {
  const { data, error } = await supabase
    .from('main_task_management')
    .select('task_id')
    .like('task_id', 'MAIN-TASK-25-%')
    .order('task_id', { ascending: true });

  if (error) {
    console.error('오류:', error);
  } else {
    console.log('현재 업무관리 코드 목록:');
    const uniqueCodes = [...new Set(data.map(item => item.task_id))];
    uniqueCodes.forEach(code => console.log(code));
    console.log(`\n총 ${uniqueCodes.length}개의 고유 코드`);
  }
}

checkCodes();
