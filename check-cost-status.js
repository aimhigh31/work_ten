const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCostStatus() {
  try {
    console.log('🔍 비용관리 데이터 상태 확인 중...\n');

    const { data, error } = await supabase
      .from('main_cost_data')
      .select('id, assignee, status, amount')
      .order('id', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ 에러:', error);
      return;
    }

    console.log('📊 비용관리 데이터 샘플 (최근 10개):');
    console.log('─'.repeat(80));

    const statusCount = {};
    data.forEach((cost, index) => {
      console.log(`\n${index + 1}. ID: ${cost.id}`);
      console.log(`   담당자: ${cost.assignee}`);
      console.log(`   상태: ${cost.status}`);
      console.log(`   금액: ₩${parseFloat(cost.amount || 0).toLocaleString()}`);

      statusCount[cost.status] = (statusCount[cost.status] || 0) + 1;
    });

    console.log('\n' + '─'.repeat(80));
    console.log('\n📈 상태별 통계:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}건`);
    });

  } catch (err) {
    console.error('❌ 예외 발생:', err);
  }
}

checkCostStatus();
