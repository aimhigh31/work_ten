// main_kpi_data에서 안재식의 KPI를 찾아서 main_kpi_task 샘플 데이터 생성
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSampleKpiTasks() {
  console.log('\n🔍 안재식의 KPI 데이터 확인\n');

  // 1. main_kpi_data에서 안재식 데이터 찾기
  const { data: kpiData, error: kpiError } = await supabase
    .from('main_kpi_data')
    .select('*')
    .eq('assignee', '안재식')
    .limit(10);

  if (kpiError) {
    console.error('❌ KPI 데이터 조회 실패:', kpiError);
    return;
  }

  console.log(`📊 안재식의 KPI 데이터: ${kpiData?.length || 0}개`);

  if (!kpiData || kpiData.length === 0) {
    console.log('⚠️ 안재식의 KPI 데이터가 없습니다. 샘플 데이터를 생성할 수 없습니다.');
    return;
  }

  // 2. 각 KPI에 대해 샘플 task 생성
  console.log('\n📝 샘플 KPI Task 생성 중...\n');

  const tasksToInsert = [];

  for (const kpi of kpiData.slice(0, 5)) { // 최대 5개 KPI에 대해서만
    console.log(`  - KPI ID ${kpi.id}: ${kpi.work_content?.substring(0, 50) || 'N/A'}...`);

    // 각 KPI당 2-3개의 task 생성
    const taskCount = Math.floor(Math.random() * 2) + 2; // 2 또는 3

    for (let i = 0; i < taskCount; i++) {
      const task = {
        kpi_id: kpi.id,
        text: `${kpi.work_content?.substring(0, 30) || 'Task'} - 세부작업 ${i + 1}`,
        checked: i === 0, // 첫 번째 task만 체크됨
        parent_id: null,
        level: 0,
        expanded: true,
        status: i === 0 ? '완료' : i === 1 ? '진행' : '대기',
        start_date: kpi.registration_date || new Date().toISOString().split('T')[0],
        due_date: kpi.completed_date || null,
        progress_rate: i === 0 ? 100 : i === 1 ? 50 : 0,
        assignee: '안재식',
        team: kpi.team || null,
        priority: '중',
        weight: 1
      };

      tasksToInsert.push(task);
    }
  }

  console.log(`\n📊 생성할 Task 개수: ${tasksToInsert.length}개`);

  // 3. 데이터 삽입
  const { data: insertedData, error: insertError } = await supabase
    .from('main_kpi_task')
    .insert(tasksToInsert)
    .select();

  if (insertError) {
    console.error('❌ Task 삽입 실패:', insertError);
    console.error('   상세:', JSON.stringify(insertError, null, 2));
    return;
  }

  console.log(`✅ ${insertedData?.length || 0}개의 Task가 성공적으로 생성되었습니다.`);

  // 4. 생성된 데이터 확인
  console.log('\n📋 생성된 Task 목록:');
  if (insertedData && insertedData.length > 0) {
    insertedData.forEach((task, idx) => {
      console.log(`  ${idx + 1}. id=${task.id}, status="${task.status}", text="${task.text.substring(0, 40)}..."`);
    });
  }

  // 5. JOIN 쿼리 테스트
  console.log('\n🔗 JOIN 쿼리 테스트:');
  const { data: joinData, error: joinError } = await supabase
    .from('main_kpi_task')
    .select(`
      id,
      text,
      assignee,
      status,
      start_date,
      due_date,
      main_kpi_data!main_kpi_task_kpi_id_fkey (
        impact,
        work_content
      )
    `)
    .eq('assignee', '안재식')
    .limit(5);

  if (joinError) {
    console.error('❌ JOIN 쿼리 실패:', joinError);
  } else {
    console.log(`✅ JOIN 쿼리 성공: ${joinData?.length || 0}개`);
    if (joinData && joinData.length > 0) {
      joinData.forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.text.substring(0, 40)}...`);
        console.log(`     impact: ${item.main_kpi_data?.impact || 'null'}`);
        console.log(`     work_content: ${item.main_kpi_data?.work_content?.substring(0, 40) || 'null'}...`);
      });
    }
  }

  console.log('\n✅ 샘플 데이터 생성 완료\n');
}

createSampleKpiTasks().catch(error => {
  console.error('❌ 스크립트 실행 오류:', error);
  process.exit(1);
});
