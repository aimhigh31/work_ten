const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCostAssignee() {
  console.log('🔍 비용관리 데이터의 assignee 확인 중...\n');

  const { data, error } = await supabase
    .from('main_cost_data')
    .select('id, no, code, team, assignee, created_by')
    .eq('is_active', true)
    .order('no', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ 오류:', error);
    return;
  }

  console.log('✅ 조회 결과:\n');
  data.forEach(item => {
    console.log(`ID: ${item.id}, NO: ${item.no}`);
    console.log(`  코드: ${item.code}`);
    console.log(`  팀: ${item.team || '(없음)'}`);
    console.log(`  담당자(assignee): "${item.assignee}" (타입: ${typeof item.assignee})`);
    console.log(`  작성자(created_by): ${item.created_by}`);
    console.log('  ---');
  });

  console.log(`\n총 ${data.length}개 데이터 조회됨`);
}

checkCostAssignee();
