const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTable() {
  const { data, error } = await supabase
    .from('main_task_management')
    .select('*')
    .limit(3);

  if (error) {
    console.error('오류:', error);
  } else {
    console.log('업무관리 테이블 샘플 데이터:');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkTable();
