const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateSoftwareCodes() {
  console.log('🔄 소프트웨어 코드 형식 업데이트 시작...');

  try {
    // 기존 데이터 조회
    const { data: currentData, error: fetchError } = await supabase
      .from('it_software_data')
      .select('id, software_name, code')
      .order('id', { ascending: true });

    if (fetchError) {
      console.error('❌ 데이터 조회 실패:', fetchError);
      return;
    }

    console.log(`📊 업데이트할 데이터: ${currentData?.length}개`);

    const currentYear = new Date().getFullYear().toString().slice(-2);
    let sequence = 1;

    // 각 데이터를 새 형식으로 업데이트
    for (const item of currentData || []) {
      const newCode = `IT-SW-${currentYear}-${sequence.toString().padStart(3, '0')}`;

      console.log(`🔄 ID ${item.id} 업데이트: "${item.code}" → "${newCode}"`);

      const { error: updateError } = await supabase
        .from('it_software_data')
        .update({ code: newCode })
        .eq('id', item.id);

      if (updateError) {
        console.error(`❌ ID ${item.id} 업데이트 실패:`, updateError);
      } else {
        console.log(`✅ ID ${item.id} 업데이트 성공`);
      }

      sequence++;
    }

    console.log('✅ 소프트웨어 코드 업데이트 완료');

    // 업데이트 후 확인
    const { data: updatedData, error: checkError } = await supabase
      .from('it_software_data')
      .select('id, software_name, code')
      .order('id', { ascending: true });

    if (checkError) {
      console.error('❌ 업데이트 확인 실패:', checkError);
      return;
    }

    console.log('\n📝 업데이트된 데이터:');
    updatedData?.forEach(item => {
      console.log(`ID: ${item.id} | 코드: ${item.code} | 소프트웨어: ${item.software_name}`);
    });

  } catch (err) {
    console.error('❌ 업데이트 중 오류:', err);
  }
}

updateSoftwareCodes();