// plan_task_management 테이블명을 main_task_management로 변경
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function renameTable() {
  console.log('\n🔄 테이블명 변경 시작: plan_task_management → main_task_management\n');

  try {
    // PostgreSQL에서 테이블명 변경
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE plan_task_management RENAME TO main_task_management;'
    });

    if (error) {
      console.error('❌ 테이블명 변경 실패:', error);
      console.log('\n대신 직접 SQL로 실행해주세요:');
      console.log('Supabase Dashboard > SQL Editor에서 다음 쿼리 실행:\n');
      console.log('ALTER TABLE plan_task_management RENAME TO main_task_management;\n');
      return;
    }

    console.log('✅ 테이블명 변경 성공!');

    // 변경 확인
    const { data: checkData, error: checkError } = await supabase
      .from('main_task_management')
      .select('count')
      .limit(1);

    if (checkError) {
      console.log('⚠️  변경 확인 실패:', checkError.message);
    } else {
      console.log('✅ 변경 확인 완료: main_task_management 테이블이 정상적으로 동작합니다.');
    }

  } catch (err) {
    console.error('❌ 오류 발생:', err);
    console.log('\n수동으로 실행해주세요:');
    console.log('Supabase Dashboard > SQL Editor에서 다음 쿼리 실행:\n');
    console.log('ALTER TABLE plan_task_management RENAME TO main_task_management;\n');
  }
}

renameTable();
