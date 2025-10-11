const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTables() {
  try {
    console.log('🔍 현재 테이블 상태 확인...\n');

    // admin_mastercode_data 확인
    const { data: flatData, error: flatError } = await supabase
      .from('admin_mastercode_data')
      .select('*')
      .limit(1);

    if (flatError) {
      console.log('❌ admin_mastercode_data 테이블 없음:', flatError.message);
    } else {
      const { count } = await supabase
        .from('admin_mastercode_data')
        .select('*', { count: 'exact', head: true });
      console.log(`✅ admin_mastercode_data 테이블 존재 (${count}개 레코드)`);
    }

    // admin_mastercode 확인
    const { data: masterData, error: masterError } = await supabase
      .from('admin_mastercode')
      .select('*')
      .limit(1);

    if (masterError) {
      console.log('❌ admin_mastercode 테이블 없음:', masterError.message);
    } else {
      const { count } = await supabase
        .from('admin_mastercode')
        .select('*', { count: 'exact', head: true });
      console.log(`✅ admin_mastercode 테이블 존재 (${count}개 레코드)`);
    }

    // admin_subcode 확인
    const { data: subData, error: subError } = await supabase
      .from('admin_subcode')
      .select('*')
      .limit(1);

    if (subError) {
      console.log('❌ admin_subcode 테이블 없음:', subError.message);
    } else {
      const { count } = await supabase
        .from('admin_subcode')
        .select('*', { count: 'exact', head: true });
      console.log(`✅ admin_subcode 테이블 존재 (${count}개 레코드)`);
    }

    console.log('\n📌 계층 구조 테이블(admin_mastercode, admin_subcode)이 없다면');
    console.log('   Supabase 대시보드에서 create-hierarchical-tables.sql을 실행하세요.');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkTables();