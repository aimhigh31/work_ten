require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTaskTable() {
  try {
    console.log('🔍 main_task_data 테이블 구조 확인 중...\n');

    // 1. 테이블에서 샘플 데이터 1개 가져오기 (컬럼 확인용)
    const { data: sampleData, error: sampleError } = await supabase
      .from('main_task_data')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ 샘플 데이터 조회 실패:', sampleError);
      return;
    }

    if (sampleData && sampleData.length > 0) {
      console.log('✅ main_task_data 테이블 컬럼 목록:');
      console.log('='.repeat(80));

      const columns = Object.keys(sampleData[0]);
      columns.forEach((col, index) => {
        const value = sampleData[0][col];
        const type = typeof value;
        const displayValue = value === null ? 'NULL' :
                           type === 'object' ? JSON.stringify(value).substring(0, 50) + '...' :
                           String(value).substring(0, 50);

        console.log(`${index + 1}. ${col.padEnd(30)} | 타입: ${type.padEnd(10)} | 샘플: ${displayValue}`);
      });

      console.log('='.repeat(80));
      console.log(`\n총 ${columns.length}개 컬럼\n`);

      // KPI 관련 컬럼 확인
      console.log('🔍 KPI 관련 컬럼 확인:');
      const kpiColumns = columns.filter(col =>
        col.toLowerCase().includes('kpi') ||
        col.toLowerCase().includes('type') ||
        col.toLowerCase().includes('task_type')
      );

      if (kpiColumns.length > 0) {
        console.log('✅ KPI 관련 컬럼 발견:');
        kpiColumns.forEach(col => {
          console.log(`   - ${col}: ${sampleData[0][col]}`);
        });
      } else {
        console.log('⚠️  KPI 관련 컬럼이 없습니다.');
        console.log('   추가 필요한 컬럼:');
        console.log('   - task_type (업무유형: 일반/KPI)');
        console.log('   - kpi_id (연결된 KPI ID)');
        console.log('   - kpi_work_content (KPI 제목)');
      }

      // 전체 데이터 개수 확인
      const { count, error: countError } = await supabase
        .from('main_task_data')
        .select('*', { count: 'exact', head: true });

      if (!countError) {
        console.log(`\n📊 전체 데이터 개수: ${count}개\n`);
      }

    } else {
      console.log('⚠️  테이블에 데이터가 없습니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkTaskTable();
