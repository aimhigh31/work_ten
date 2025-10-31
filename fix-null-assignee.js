const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixNullAssignee() {
  console.log('🔍 담당자가 null인 데이터 확인 중...\n');

  // 1. null인 데이터 조회
  const { data: nullData, error: selectError } = await supabase
    .from('main_cost_data')
    .select('id, code, team, assignee, created_by')
    .is('assignee', null)
    .eq('is_active', true);

  if (selectError) {
    console.error('❌ 조회 오류:', selectError);
    return;
  }

  console.log(`찾은 null 데이터: ${nullData.length}개\n`);

  if (nullData.length === 0) {
    console.log('✅ null 데이터가 없습니다.');
    return;
  }

  nullData.forEach(item => {
    console.log(`- ID: ${item.id}, 코드: ${item.code}, 팀: ${item.team}, 작성자: ${item.created_by}`);
  });

  console.log('\n📝 담당자를 "미지정"으로 업데이트합니다...\n');

  // 2. 각 데이터를 "미지정"으로 업데이트
  for (const item of nullData) {
    const { error: updateError } = await supabase
      .from('main_cost_data')
      .update({
        assignee: '미지정',
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id);

    if (updateError) {
      console.error(`❌ ID ${item.id} 업데이트 실패:`, updateError);
    } else {
      console.log(`✅ ID ${item.id} (${item.code}) 업데이트 완료`);
    }
  }

  console.log('\n🎉 모든 null 담당자 데이터가 수정되었습니다!');
}

fixNullAssignee();
