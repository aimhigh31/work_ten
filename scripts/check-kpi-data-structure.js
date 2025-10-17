// main_kpi_data 테이블 구조 및 레벨별 데이터 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkKpiDataStructure() {
  console.log('\n🔍 main_kpi_data 테이블 구조 확인\n');

  // 1. 안재식의 KPI 데이터 조회 (레벨별)
  const { data: kpiData, error: kpiError } = await supabase
    .from('main_kpi_data')
    .select('*')
    .eq('assignee', '안재식')
    .order('level', { ascending: true })
    .order('id', { ascending: true });

  if (kpiError) {
    console.error('❌ KPI 데이터 조회 실패:', kpiError);
    return;
  }

  console.log(`📊 안재식의 KPI 데이터: ${kpiData?.length || 0}개\n`);

  // 레벨별로 그룹화
  const byLevel = {};
  kpiData?.forEach(item => {
    const level = item.level || 0;
    if (!byLevel[level]) byLevel[level] = [];
    byLevel[level].push(item);
  });

  console.log('📁 레벨별 데이터 분포:');
  Object.keys(byLevel).sort().forEach(level => {
    console.log(`  레벨 ${level}: ${byLevel[level].length}개`);
  });

  console.log('\n📋 상세 데이터:\n');

  // 레벨별로 출력
  Object.keys(byLevel).sort().forEach(level => {
    console.log(`\n=== 레벨 ${level} ===`);
    byLevel[level].forEach((item, idx) => {
      console.log(`${idx + 1}. ID: ${item.id}`);
      console.log(`   work_content: "${item.work_content || 'N/A'}"`);
      console.log(`   parent_id: ${item.parent_id || 'null'}`);
      console.log(`   level: ${item.level}`);
      console.log(`   expanded: ${item.expanded}`);
      console.log(`   주요과제 필드들:`);

      // 모든 필드 출력
      const fields = Object.keys(item);
      const keyFields = fields.filter(f =>
        f.includes('key') ||
        f.includes('task') ||
        f.includes('major') ||
        f.includes('과제') ||
        f === 'overview' ||
        f === 'summary' ||
        f === 'description'
      );

      if (keyFields.length > 0) {
        keyFields.forEach(field => {
          console.log(`   ${field}: "${item[field] || 'N/A'}"`);
        });
      } else {
        console.log('   (주요과제 관련 필드를 찾을 수 없음)');
      }
      console.log('');
    });
  });

  // 2. main_kpi_task와의 관계 확인
  console.log('\n🔗 main_kpi_task와의 관계:\n');

  const { data: taskData, error: taskError } = await supabase
    .from('main_kpi_task')
    .select(`
      id,
      kpi_id,
      text,
      assignee,
      main_kpi_data!main_kpi_task_kpi_id_fkey (
        id,
        level,
        work_content,
        parent_id
      )
    `)
    .eq('assignee', '안재식')
    .limit(5);

  if (taskError) {
    console.error('❌ Task 조회 실패:', taskError);
  } else {
    console.log(`✅ Task 데이터: ${taskData?.length || 0}개\n`);
    taskData?.forEach((task, idx) => {
      console.log(`${idx + 1}. Task ID: ${task.id}`);
      console.log(`   KPI ID: ${task.kpi_id}`);
      console.log(`   Task text: "${task.text}"`);
      console.log(`   연결된 KPI level: ${task.main_kpi_data?.level}`);
      console.log(`   연결된 KPI work_content: "${task.main_kpi_data?.work_content || 'N/A'}"`);
      console.log(`   연결된 KPI parent_id: ${task.main_kpi_data?.parent_id || 'null'}`);
      console.log('');
    });
  }

  // 3. 테이블 컬럼 목록 확인
  console.log('\n📊 main_kpi_data 테이블 컬럼 목록:\n');

  if (kpiData && kpiData.length > 0) {
    const columns = Object.keys(kpiData[0]);
    console.log('컬럼명 목록:');
    columns.forEach((col, idx) => {
      const sampleValue = kpiData[0][col];
      const valuePreview = typeof sampleValue === 'string' ?
        `"${sampleValue.substring(0, 30)}..."` :
        JSON.stringify(sampleValue);
      console.log(`  ${idx + 1}. ${col}: ${valuePreview}`);
    });
  }

  console.log('\n✅ 확인 완료\n');
}

checkKpiDataStructure().catch(error => {
  console.error('❌ 스크립트 실행 오류:', error);
  process.exit(1);
});
