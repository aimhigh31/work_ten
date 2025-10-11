const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkGroup016() {
  console.log('🔍 GROUP016 마스터코드 데이터 확인...');

  try {
    // GROUP016 관련 데이터 조회
    const { data, error } = await supabase
      .from('admin_mastercode_data')
      .select('*')
      .eq('group_code', 'GROUP016')
      .eq('is_active', true)
      .order('subcode_order', { ascending: true });

    if (error) {
      console.error('❌ GROUP016 데이터 조회 실패:', error);
      return;
    }

    console.log(`✅ GROUP016 데이터 조회 성공: ${data?.length}개`);

    if (data && data.length > 0) {
      console.log('\n📝 GROUP016 데이터:');
      data.forEach(item => {
        console.log(`  - 코드타입: ${item.codetype}`);
        console.log(`    그룹코드: ${item.group_code} | 그룹명: ${item.group_code_name}`);
        if (item.codetype === 'subcode') {
          console.log(`    서브코드: ${item.subcode} | 서브코드명: ${item.subcode_name}`);
        }
        console.log('');
      });

      // 서브코드만 필터링
      const subcodes = data.filter(item => item.codetype === 'subcode');
      console.log(`📋 GROUP016 서브코드 목록 (${subcodes.length}개):)`);
      subcodes.forEach(sub => {
        console.log(`  • ${sub.subcode_name} (${sub.subcode})`);
      });
    } else {
      console.log('⚠️ GROUP016 데이터가 없습니다. 샘플 데이터를 생성해야 합니다.');
    }

  } catch (err) {
    console.error('❌ 조회 중 오류:', err);
  }
}

checkGroup016();