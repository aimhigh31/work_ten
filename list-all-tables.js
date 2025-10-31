require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTables() {
  // regulation 관련 테이블 찾기
  console.log('=== Regulation 관련 테이블 찾기 ===');
  const { data: regTables, error: regError } = await supabase
    .rpc('exec_sql', {
      sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%regulation%' OR table_name LIKE '%security%'"
    });

  if (!regError && regTables) {
    console.log('Regulation/Security 테이블:', regTables);
  }

  // task 관련 테이블 찾기
  console.log('\n=== Task 관련 테이블 찾기 ===');
  const { data: taskTables, error: taskError } = await supabase
    .rpc('exec_sql', {
      sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%task%'"
    });

  if (!taskError && taskTables) {
    console.log('Task 테이블:', taskTables);
  }

  // main_task_data 컬럼 확인
  console.log('\n=== main_task_data 컬럼 확인 ===');
  const { data: taskColumns, error: taskColError } = await supabase
    .rpc('exec_sql', {
      sql: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'main_task_data' ORDER BY ordinal_position"
    });

  if (!taskColError && taskColumns) {
    console.log('main_task_data 컬럼:', taskColumns);
  } else {
    console.log('에러:', taskColError);
  }
}

listTables().then(() => process.exit(0));
