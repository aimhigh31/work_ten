// main_kpi_task 테이블 데이터 확인 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  console.log('SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.log('SUPABASE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkKpiTaskData() {
  console.log('\n🔍 main_kpi_task 테이블 데이터 확인\n');

  // 1. 전체 데이터 개수
  const { count: totalCount, error: countError } = await supabase
    .from('main_kpi_task')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ 전체 개수 조회 실패:', countError);
  } else {
    console.log(`📊 전체 데이터 개수: ${totalCount}개`);
  }

  // 2. assignee 필드가 있는 데이터
  const { data: assigneeData, error: assigneeError } = await supabase
    .from('main_kpi_task')
    .select('id, assignee, text, team, start_date, due_date')
    .not('assignee', 'is', null)
    .limit(10);

  if (assigneeError) {
    console.error('❌ assignee 데이터 조회 실패:', assigneeError);
  } else {
    console.log(`\n📋 assignee가 있는 데이터 (최대 10개):`);
    if (assigneeData && assigneeData.length > 0) {
      assigneeData.forEach((item, idx) => {
        console.log(`  ${idx + 1}. id=${item.id}, assignee="${item.assignee}", text="${item.text?.substring(0, 30)}..."`);
      });
    } else {
      console.log('  (데이터 없음)');
    }
  }

  // 3. "안재식" 담당자 데이터
  const { data: userSpecificData, error: userError } = await supabase
    .from('main_kpi_task')
    .select('*')
    .eq('assignee', '안재식');

  if (userError) {
    console.error('❌ 안재식 데이터 조회 실패:', userError);
  } else {
    console.log(`\n👤 "안재식" 담당자 데이터: ${userSpecificData?.length || 0}개`);
    if (userSpecificData && userSpecificData.length > 0) {
      userSpecificData.forEach((item, idx) => {
        console.log(`  ${idx + 1}. id=${item.id}, text="${item.text}", kpi_id=${item.kpi_id}`);
      });
    }
  }

  // 4. JOIN 쿼리 테스트
  console.log('\n🔗 main_kpi_data와 JOIN 테스트:');
  const { data: joinData, error: joinError } = await supabase
    .from('main_kpi_task')
    .select(`
      id,
      text,
      assignee,
      main_kpi_data!main_kpi_task_kpi_id_fkey (
        impact,
        work_content
      )
    `)
    .eq('assignee', '안재식')
    .limit(5);

  if (joinError) {
    console.error('❌ JOIN 쿼리 실패:', joinError);
    console.error('   상세:', JSON.stringify(joinError, null, 2));
  } else {
    console.log(`✅ JOIN 쿼리 성공: ${joinData?.length || 0}개`);
    if (joinData && joinData.length > 0) {
      joinData.forEach((item, idx) => {
        console.log(`  ${idx + 1}. id=${item.id}, text="${item.text}"`);
        console.log(`     impact: ${item.main_kpi_data?.impact || 'null'}`);
        console.log(`     work_content: ${item.main_kpi_data?.work_content || 'null'}`);
      });
    }
  }

  // 5. 고유한 assignee 값들 확인
  const { data: uniqueAssignees, error: uniqueError } = await supabase
    .from('main_kpi_task')
    .select('assignee')
    .not('assignee', 'is', null);

  if (uniqueError) {
    console.error('❌ assignee 목록 조회 실패:', uniqueError);
  } else {
    const uniqueSet = new Set(uniqueAssignees?.map(item => item.assignee));
    console.log(`\n👥 고유한 assignee 값들 (총 ${uniqueSet.size}명):`);
    uniqueSet.forEach(name => {
      console.log(`  - "${name}"`);
    });
  }

  console.log('\n✅ 데이터 확인 완료\n');
}

checkKpiTaskData().catch(error => {
  console.error('❌ 스크립트 실행 오류:', error);
  process.exit(1);
});
