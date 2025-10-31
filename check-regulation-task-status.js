require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStatus() {
  console.log('=== 보안규정관리 테이블 상태 확인 ===');
  const { data: regulations, error: regError } = await supabase
    .from('main_regulation_data')
    .select('id, title, status')
    .limit(10);

  if (regError) {
    console.error('보안규정관리 조회 에러:', regError);
  } else {
    console.log('보안규정관리 데이터:');
    regulations.forEach(item => {
      console.log(`  ID: ${item.id}, 제목: ${item.title}, 상태: ${item.status}`);
    });
  }

  console.log('\n=== 업무관리 테이블 상태 확인 ===');
  const { data: tasks, error: taskError } = await supabase
    .from('main_task_data')
    .select('id, title, status')
    .limit(10);

  if (taskError) {
    console.error('업무관리 조회 에러:', taskError);
  } else {
    console.log('업무관리 데이터:');
    tasks.forEach(item => {
      console.log(`  ID: ${item.id}, 제목: ${item.title}, 상태: ${item.status}`);
    });
  }

  console.log('\n=== 마스터코드 확인 (GROUP003) ===');
  const { data: masterCodes, error: mcError } = await supabase
    .from('admin_mastercode_data')
    .select('*')
    .eq('codetype', 'subcode')
    .like('subcode', 'GROUP003-%');

  if (mcError) {
    console.error('마스터코드 조회 에러:', mcError);
  } else {
    console.log('GROUP003 마스터코드:');
    masterCodes.forEach(code => {
      console.log(`  ${code.subcode}: ${code.subcode_name}`);
    });
  }
}

checkStatus().then(() => process.exit(0));
