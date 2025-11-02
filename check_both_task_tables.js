const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkBothTables() {
  console.log('\n=== 1. main_task_data 테이블 조회 ===');
  const { data: taskData, error: taskError } = await supabase
    .from('main_task_data')
    .select('id, code, registration_date')
    .order('id', { ascending: true })
    .limit(10);

  if (taskError) {
    console.error('❌ main_task_data 오류:', taskError);
  } else {
    console.log('✅ main_task_data 데이터:');
    console.log(taskData);
    console.log(`총 ${taskData?.length || 0}개의 데이터`);
  }

  console.log('\n=== 2. main_task_management 테이블 조회 ===');
  const { data: mgmtData, error: mgmtError } = await supabase
    .from('main_task_management')
    .select('id, task_id, registration_date')
    .order('id', { ascending: true })
    .limit(10);

  if (mgmtError) {
    console.error('❌ main_task_management 오류:', mgmtError);
  } else {
    console.log('✅ main_task_management 데이터:');
    console.log(mgmtData);
    console.log(`총 ${mgmtData?.length || 0}개의 데이터`);
  }
}

checkBothTables();
