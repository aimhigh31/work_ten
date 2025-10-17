// 테이블 존재 여부 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('\n🔍 테이블 존재 여부 확인\n');

  // 1. plan_task_management 확인
  console.log('1️⃣ plan_task_management 테이블 확인:');
  const { data: planData, error: planError } = await supabase
    .from('plan_task_management')
    .select('count')
    .limit(1);

  if (planError) {
    console.log('   ❌ plan_task_management 테이블 없음 또는 접근 불가');
    console.log('   에러:', planError.message);
  } else {
    console.log('   ✅ plan_task_management 테이블 존재함');
  }

  // 2. main_task_management 확인
  console.log('\n2️⃣ main_task_management 테이블 확인:');
  const { data: mainData, error: mainError } = await supabase
    .from('main_task_management')
    .select('count')
    .limit(1);

  if (mainError) {
    console.log('   ❌ main_task_management 테이블 없음 또는 접근 불가');
    console.log('   에러:', mainError.message);
  } else {
    console.log('   ✅ main_task_management 테이블 존재함');
  }

  // 3. 권장 조치
  console.log('\n📋 권장 조치:\n');
  if (planError && mainError) {
    console.log('⚠️  두 테이블 모두 접근 불가합니다.');
    console.log('   Supabase Dashboard에서 테이블이 존재하는지 확인하세요.');
  } else if (!planError && mainError) {
    console.log('📌 plan_task_management 테이블이 존재합니다.');
    console.log('   Supabase Dashboard > SQL Editor에서 다음을 실행하세요:\n');
    console.log('   ALTER TABLE plan_task_management RENAME TO main_task_management;\n');
  } else if (planError && !mainError) {
    console.log('✅ main_task_management 테이블이 이미 존재합니다.');
    console.log('   테이블명 변경이 완료된 것으로 보입니다.');
  } else {
    console.log('⚠️  두 테이블이 모두 존재합니다.');
    console.log('   중복된 테이블이 있을 수 있습니다.');
  }

  console.log('\n✅ 확인 완료\n');
}

checkTables().catch(error => {
  console.error('❌ 스크립트 실행 오류:', error);
  process.exit(1);
});
