const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEducationMenu() {
  try {
    console.log('🔍 개인교육관리 메뉴 정보 조회...\n');

    const { data, error } = await supabase
      .from('admin_systemsetting_menu')
      .select('*')
      .eq('menu_url', '/apps/education');

    if (error) {
      console.error('❌ 조회 실패:', error);
      return;
    }

    console.log('✅ 조회 결과:');
    console.log(JSON.stringify(data, null, 2));

    console.log('\n🔍 현재 menu_category:', data[0]?.menu_category);
    console.log('🔍 원하는 값: 메인메뉴');

    if (data[0]?.menu_category !== '메인메뉴') {
      console.log('\n⚠️  DB에서 menu_category를 메인메뉴로 업데이트해야 합니다!');
    } else {
      console.log('\n✅ DB는 올바릅니다. breadcrumb이 DB를 참조하지 않고 있을 수 있습니다.');
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkEducationMenu();
