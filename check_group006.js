const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGroup006() {
  try {
    console.log('🔍 GROUP006 데이터 조회 중...');

    const { data, error } = await supabase
      .from('admin_mastercode_data')
      .select('*')
      .eq('group_code', 'GROUP006')
      .order('codetype', { ascending: false })
      .order('subcode_order', { ascending: true });

    if (error) {
      console.error('❌ 조회 오류:', error);
      return;
    }

    console.log('📋 GROUP006 전체 데이터:');
    console.log('총', data?.length || 0, '개 레코드');

    if (data && data.length > 0) {
      data.forEach((item, index) => {
        console.log(`${index + 1}. [${item.codetype}] ${item.group_code} - ${item.subcode || '(그룹)'} - ${item.subcode_name || item.group_code_name}`);
      });
    } else {
      console.log('⚠️ GROUP006 데이터가 없습니다.');
    }

  } catch (err) {
    console.error('💥 오류:', err);
  }
}

checkGroup006();