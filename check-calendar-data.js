const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkCalendarData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('🔍 main_calendar_data 테이블 조회...\n');

  // 전체 데이터 조회
  const { data: allData, error: allError } = await supabase
    .from('main_calendar_data')
    .select('*')
    .order('start_date', { ascending: true });

  if (allError) {
    console.error('❌ 전체 조회 오류:', allError);
    return;
  }

  console.log(`📊 전체 데이터: ${allData?.length || 0}개\n`);

  if (allData && allData.length > 0) {
    console.log('📝 샘플 데이터 (최신 5개):');
    allData.slice(0, 5).forEach((item, index) => {
      console.log(`\n[${index + 1}]`);
      console.log(`  ID: ${item.id}`);
      console.log(`  Event ID: ${item.event_id}`);
      console.log(`  제목: ${item.title}`);
      console.log(`  시작일: ${item.start_date}`);
      console.log(`  종료일: ${item.end_date}`);
      console.log(`  팀: ${item.team || '없음'}`);
      console.log(`  담당자: ${item.assignee || '없음'}`);
      console.log(`  종일: ${item.all_day ? '예' : '아니오'}`);
    });
  } else {
    console.log('⚠️ 일정 데이터가 없습니다.');
  }
}

checkCalendarData();
