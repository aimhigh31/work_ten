const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSoftwareTable() {
  console.log('🔍 it_software_data 테이블 상태 확인...');

  try {
    // 테이블 데이터 조회 (Supabase Client 방식)
    const { data, error } = await supabase
      .from('it_software_data')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ 테이블 조회 실패:', error);
      return;
    }

    console.log('✅ 테이블 조회 성공!');
    console.log(`📊 총 데이터 개수: ${data?.length}개`);

    if (data && data.length > 0) {
      console.log('📝 샘플 데이터:');
      data.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.software_name} (${item.status}) - 담당자: ${item.assignee}`);
      });
    } else {
      console.log('⚠️ 테이블은 존재하지만 데이터가 없습니다.');
    }

  } catch (err) {
    console.error('❌ 테이블 확인 중 오류:', err);
  }
}

checkSoftwareTable();