const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSongsamCosts() {
  try {
    console.log('🔍 송샘 비용관리 데이터 확인 중...\n');

    const { data, error } = await supabase
      .from('main_cost_data')
      .select('*')
      .eq('assignee', '송샘')
      .order('id', { ascending: false });

    if (error) {
      console.error('❌ 에러:', error);
      return;
    }

    console.log(`📊 송샘의 비용관리 데이터: ${data.length}건\n`);
    console.log('─'.repeat(80));

    data.forEach((cost, index) => {
      console.log(`\n${index + 1}. ID: ${cost.id}`);
      console.log(`   담당자: ${cost.assignee}`);
      console.log(`   상태: "${cost.status}"`);
      console.log(`   금액: ${cost.amount}`);
      console.log(`   금액 (숫자): ${parseFloat(cost.amount || 0)}`);
      console.log(`   금액 타입: ${typeof cost.amount}`);
    });

    console.log('\n' + '─'.repeat(80));

    // 상태별 집계
    const stats = {
      대기: 0,
      진행: 0,
      완료: 0,
      홀딩: 0
    };

    data.forEach(cost => {
      const status = cost.status;
      const amount = parseFloat(cost.amount || 0);
      console.log(`\n집계 중: 상태="${status}", 금액=${amount}`);

      if (status === '대기') stats.대기 += amount;
      else if (status === '진행') stats.진행 += amount;
      else if (status === '완료') stats.완료 += amount;
      else if (status === '홀딩') stats.홀딩 += amount;
      else console.log(`⚠️ 알 수 없는 상태: "${status}"`);
    });

    console.log('\n' + '─'.repeat(80));
    console.log('\n📈 최종 집계:');
    console.log(`   대기: ₩${stats.대기.toLocaleString()}`);
    console.log(`   진행: ₩${stats.진행.toLocaleString()}`);
    console.log(`   완료: ₩${stats.완료.toLocaleString()}`);
    console.log(`   홀딩: ₩${stats.홀딩.toLocaleString()}`);

  } catch (err) {
    console.error('❌ 예외 발생:', err);
  }
}

checkSongsamCosts();
