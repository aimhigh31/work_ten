const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUserCostData() {
  try {
    console.log('🔍 사용자별 비용관리 데이터 확인 중...\n');

    const { data, error } = await supabase
      .from('main_cost_data')
      .select('id, assignee, status, amount')
      .order('id', { ascending: false });

    if (error) {
      console.error('❌ 에러:', error);
      return;
    }

    console.log(`📊 총 비용관리 데이터: ${data.length}개\n`);

    // 담당자별로 그룹화
    const userStats = {};
    data.forEach((cost) => {
      const user = cost.assignee || '미지정';
      if (!userStats[user]) {
        userStats[user] = {
          total: 0,
          대기: 0,
          진행: 0,
          완료: 0,
          홀딩: 0,
          items: []
        };
      }

      const amount = parseFloat(cost.amount || 0);
      userStats[user].total += amount;
      userStats[user][cost.status] = (userStats[user][cost.status] || 0) + amount;
      userStats[user].items.push(cost);
    });

    console.log('👥 담당자별 통계:');
    console.log('─'.repeat(80));

    Object.entries(userStats).forEach(([user, stats]) => {
      console.log(`\n📌 ${user}:`);
      console.log(`   총합계: ₩${stats.total.toLocaleString()}`);
      console.log(`   대기: ₩${stats.대기.toLocaleString()}`);
      console.log(`   진행: ₩${stats.진행.toLocaleString()}`);
      console.log(`   완료: ₩${stats.완료.toLocaleString()}`);
      console.log(`   홀딩: ₩${stats.홀딩.toLocaleString()}`);
      console.log(`   건수: ${stats.items.length}건`);
    });

  } catch (err) {
    console.error('❌ 예외 발생:', err);
  }
}

checkUserCostData();
