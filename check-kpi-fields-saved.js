require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkKpiFieldsSaved() {
  try {
    console.log('🔍 main_task_data 테이블에서 KPI 필드 확인 중...\n');

    // 모든 업무 데이터 조회 (KPI 필드 포함)
    const { data, error } = await supabase
      .from('main_task_data')
      .select('id, code, work_content, task_type, kpi_id, kpi_work_content, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 조회 실패:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  데이터가 없습니다.');
      return;
    }

    console.log('='.repeat(120));
    console.log('업무 데이터 KPI 필드 확인 결과:');
    console.log('='.repeat(120));

    let kpiCount = 0;
    let generalCount = 0;

    data.forEach((task, index) => {
      const isKpi = task.task_type === 'KPI';
      if (isKpi) kpiCount++;
      else generalCount++;

      const statusIcon = isKpi ? '✅ KPI' : '📋 일반';

      console.log(`\n${index + 1}. ${statusIcon} | ${task.code} | ${task.work_content || '(제목없음)'}`);
      console.log(`   ├─ 업무유형: ${task.task_type || '(NULL)'}`);
      console.log(`   ├─ KPI ID: ${task.kpi_id || '(NULL)'}`);
      console.log(`   └─ KPI 제목: ${task.kpi_work_content || '(NULL)'}`);
    });

    console.log('\n' + '='.repeat(120));
    console.log(`📊 총 ${data.length}개 업무 | KPI 업무: ${kpiCount}개 | 일반 업무: ${generalCount}개`);
    console.log('='.repeat(120));

    // KPI 필드가 실제로 저장된 업무 찾기
    const savedKpiTasks = data.filter(t => t.task_type === 'KPI' && t.kpi_id && t.kpi_work_content);

    if (savedKpiTasks.length > 0) {
      console.log('\n✅ KPI 필드가 제대로 저장된 업무:');
      savedKpiTasks.forEach(task => {
        console.log(`   - ${task.code}: "${task.kpi_work_content}" (KPI ID: ${task.kpi_id})`);
      });
    } else {
      console.log('\n⚠️  아직 KPI 필드가 완전히 저장된 업무가 없습니다.');
      console.log('   → 업무유형을 "KPI"로 설정하고 KPI를 선택한 후 저장해보세요.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkKpiFieldsSaved();
