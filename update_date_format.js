const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateDateFormats() {
  console.log('📅 날짜 형식 업데이트 시작...');

  try {
    // 기존 데이터 조회
    const { data: currentData, error: fetchError } = await supabase
      .from('it_software_data')
      .select('id, start_date, completed_date, created_at')
      .order('id', { ascending: true });

    if (fetchError) {
      console.error('❌ 데이터 조회 실패:', fetchError);
      return;
    }

    console.log(`📊 업데이트할 데이터: ${currentData?.length}개`);

    // 각 데이터 업데이트
    for (const item of currentData || []) {
      const updates = {};

      // start_date 업데이트 (YYYY-MM-DD 형식으로)
      if (item.start_date && item.start_date.includes('T')) {
        updates.start_date = item.start_date.split('T')[0];
      }

      // completed_date 업데이트 (있는 경우)
      if (item.completed_date && item.completed_date.includes('T')) {
        updates.completed_date = item.completed_date.split('T')[0];
      }

      // 업데이트할 내용이 있는 경우에만 실행
      if (Object.keys(updates).length > 0) {
        console.log(`🔄 ID ${item.id} 업데이트:`, updates);

        const { error: updateError } = await supabase
          .from('it_software_data')
          .update(updates)
          .eq('id', item.id);

        if (updateError) {
          console.error(`❌ ID ${item.id} 업데이트 실패:`, updateError);
        } else {
          console.log(`✅ ID ${item.id} 업데이트 성공`);
        }
      }
    }

    console.log('✅ 날짜 형식 업데이트 완료');

    // 업데이트 후 확인
    const { data: updatedData, error: checkError } = await supabase
      .from('it_software_data')
      .select('id, software_name, start_date, completed_date')
      .order('id', { ascending: true });

    if (checkError) {
      console.error('❌ 업데이트 확인 실패:', checkError);
      return;
    }

    console.log('\n📝 업데이트된 데이터:');
    updatedData?.forEach(item => {
      console.log(`ID: ${item.id} | ${item.software_name} | 시작일: ${item.start_date} | 완료일: ${item.completed_date || 'N/A'}`);
    });

  } catch (err) {
    console.error('❌ 업데이트 중 오류:', err);
  }
}

updateDateFormats();