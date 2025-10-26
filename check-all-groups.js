const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkAllGroups() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('========================================');
  console.log('모든 마스터 코드 그룹 조회');
  console.log('========================================\n');

  const { data: allGroups, error } = await supabase
    .from('admin_mastercode_data')
    .select('*')
    .eq('codetype', 'group')
    .order('group_code_order', { ascending: true });

  if (error) {
    console.error('❌ 조회 오류:', error);
    return;
  }

  console.log(`총 ${allGroups.length}개 그룹 발견:\n`);

  for (const group of allGroups) {
    console.log(`\n📁 ${group.group_code} - ${group.group_code_name}`);
    console.log(`   설명: ${group.group_code_description || '없음'}`);

    // 해당 그룹의 서브코드 조회
    const { data: subcodes } = await supabase
      .from('admin_mastercode_data')
      .select('subcode_name, subcode_description, is_active')
      .eq('codetype', 'subcode')
      .eq('group_code', group.group_code)
      .order('subcode_order', { ascending: true });

    if (subcodes && subcodes.length > 0) {
      console.log(`   서브코드 (${subcodes.length}개):`);
      subcodes.forEach(sub => {
        const status = sub.is_active ? '✅' : '❌';
        console.log(`      ${status} ${sub.subcode_name} - ${sub.subcode_description || ''}`);
      });
    } else {
      console.log(`   서브코드: 없음`);
    }
  }

  console.log('\n========================================');
}

checkAllGroups();
