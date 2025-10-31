require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTasks() {
  console.log('=== main_task_data 샘플 데이터 확인 (전체 컬럼) ===');
  const { data: tasks, error: taskError } = await supabase
    .from('main_task_data')
    .select('*')
    .limit(3);

  if (taskError) {
    console.error('업무관리 조회 에러:', taskError);
  } else {
    console.log('업무관리 샘플 데이터:');
    tasks.forEach((item, index) => {
      console.log(`\n--- 레코드 ${index + 1} ---`);
      Object.keys(item).forEach(key => {
        console.log(`  ${key}: ${item[key]}`);
      });
    });
  }
}

checkTasks().then(() => process.exit(0));
