// main_kpi_data 테이블의 모든 컬럼 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkKpiDataColumns() {
  console.log('\n🔍 main_kpi_data 테이블 컬럼 확인\n');

  // 안재식의 KPI 데이터 조회
  const { data: kpiData, error: kpiError } = await supabase
    .from('main_kpi_data')
    .select('*')
    .eq('assignee', '안재식')
    .limit(5);

  if (kpiError) {
    console.error('❌ KPI 데이터 조회 실패:', kpiError);
    return;
  }

  console.log(`📊 조회된 데이터: ${kpiData?.length || 0}개\n`);

  if (kpiData && kpiData.length > 0) {
    console.log('📋 테이블 컬럼 목록:\n');
    const firstRow = kpiData[0];
    const columns = Object.keys(firstRow);

    columns.forEach((col, idx) => {
      const value = firstRow[col];
      let valuePreview;

      if (value === null) {
        valuePreview = 'null';
      } else if (typeof value === 'string') {
        valuePreview = `"${value.length > 50 ? value.substring(0, 50) + '...' : value}"`;
      } else if (typeof value === 'object') {
        valuePreview = JSON.stringify(value);
      } else {
        valuePreview = String(value);
      }

      console.log(`  ${(idx + 1).toString().padStart(2, ' ')}. ${col.padEnd(25, ' ')} : ${valuePreview}`);
    });

    console.log('\n\n📊 전체 데이터 샘플:\n');
    kpiData.forEach((item, idx) => {
      console.log(`\n=== 데이터 ${idx + 1} ===`);
      console.log(`ID: ${item.id}`);
      console.log(`work_content: "${item.work_content || 'N/A'}"`);
      console.log(`assignee: "${item.assignee || 'N/A'}"`);
      console.log(`team: "${item.team || 'N/A'}"`);
      console.log(`impact: "${item.impact || 'N/A'}"`);

      // 모든 필드 출력
      console.log('\n모든 필드:');
      Object.keys(item).forEach(key => {
        if (!['id', 'work_content', 'assignee', 'team', 'impact'].includes(key)) {
          const value = item[key];
          const preview = value === null ? 'null' :
            typeof value === 'string' ? (value.length > 30 ? `"${value.substring(0, 30)}..."` : `"${value}"`) :
              JSON.stringify(value);
          console.log(`  ${key}: ${preview}`);
        }
      });
    });
  }

  console.log('\n✅ 확인 완료\n');
}

checkKpiDataColumns().catch(error => {
  console.error('❌ 스크립트 실행 오류:', error);
  process.exit(1);
});
