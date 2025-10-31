const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkKpiData() {
  try {
    console.log('🔍 KPI 데이터 확인 중...\n');

    const { data, error } = await supabase
      .from('main_kpi_data')
      .select('id, code, management_category, department, status')
      .limit(5);

    if (error) {
      console.error('❌ 에러:', error);
      return;
    }

    console.log('📊 KPI 데이터 샘플 (최근 5개):');
    console.log('─'.repeat(80));

    data.forEach((kpi, index) => {
      console.log(`\n${index + 1}. KPI ID: ${kpi.id}`);
      console.log(`   코드: ${kpi.code}`);
      console.log(`   관리분류: ${kpi.management_category}`);
      console.log(`   업무분류 (department): ${kpi.department}`);
      console.log(`   상태: ${kpi.status}`);
    });

    console.log('\n' + '─'.repeat(80));

  } catch (err) {
    console.error('❌ 예외 발생:', err);
  }
}

checkKpiData();
