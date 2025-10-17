// parent_id=26인 태스크 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkParentTask() {
  console.log('\n🔍 parent task 확인\n');

  // 1. ID=26 태스크 조회
  const { data: parentTask, error: parentError } = await supabase
    .from('main_kpi_task')
    .select('*')
    .eq('id', 26)
    .single();

  if (parentError) {
    console.error('❌ Parent task 조회 실패:', parentError);
  } else {
    console.log('📋 Parent Task (ID=26):');
    console.log(`  text: "${parentTask.text}"`);
    console.log(`  level: ${parentTask.level}`);
    console.log(`  assignee: ${parentTask.assignee || 'null'}`);
    console.log(`  kpi_id: ${parentTask.kpi_id}`);
    console.log(`  parent_id: ${parentTask.parent_id || 'null'}`);
  }

  // 2. 안재식의 모든 태스크 조회 (level 포함)
  console.log('\n📊 안재식의 모든 태스크:\n');
  const { data: allTasks, error: allError } = await supabase
    .from('main_kpi_task')
    .select('*')
    .eq('assignee', '안재식')
    .order('kpi_id', { ascending: true })
    .order('level', { ascending: true });

  if (allError) {
    console.error('❌ 태스크 조회 실패:', allError);
  } else {
    allTasks.forEach((task, idx) => {
      console.log(`${idx + 1}. ID=${task.id}, level=${task.level}, parent_id=${task.parent_id || 'null'}`);
      console.log(`   text: "${task.text}"`);
      console.log(`   kpi_id: ${task.kpi_id}`);
      console.log('');
    });
  }

  console.log('✅ 확인 완료\n');
}

checkParentTask().catch(error => {
  console.error('❌ 스크립트 실행 오류:', error);
  process.exit(1);
});
