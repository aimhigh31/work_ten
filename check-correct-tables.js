require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔍 정확한 권한 테이블 확인\n');

  // 1. admin_users_rules 테이블 확인
  const { data: rules, error: rulesError } = await supabase
    .from('admin_users_rules')
    .select('*')
    .limit(5);

  console.log('📋 admin_users_rules 테이블 구조:');
  if (rules && rules.length > 0) {
    console.log(JSON.stringify(rules[0], null, 2));
  } else {
    console.log('데이터 없음 또는 에러:', rulesError);
  }

  // 2. system 사용자의 권한 확인
  const { data: systemRules, error: systemError } = await supabase
    .from('admin_users_rules')
    .select('*')
    .eq('user_id', 'system');

  console.log('\n👑 system 사용자의 권한:');
  if (systemRules && systemRules.length > 0) {
    console.log(`총 ${systemRules.length}개의 권한 발견`);

    // /hr/evaluation 관련 권한 찾기
    const evalRule = systemRules.find(r => r.menu_url === '/hr/evaluation');
    if (evalRule) {
      console.log('\n✅ /hr/evaluation 권한 발견:');
      console.log(JSON.stringify(evalRule, null, 2));
    } else {
      console.log('\n❌ /hr/evaluation 권한이 없습니다.');
      console.log('💡 권한을 추가해야 합니다.');
    }
  } else {
    console.log('system 사용자의 권한이 없습니다.');
    console.error(systemError);
  }

  // 3. 권한 API가 사용하는 실제 테이블 확인
  console.log('\n\n🔍 권한 관련 모든 테이블 확인:');

  const tables = ['admin_users_rules', 'admin_role_permission', 'admin_user_roles'];
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    console.log(`\n${table}:`);
    if (data && data.length > 0) {
      console.log('  ✅ 존재함, 샘플:', Object.keys(data[0]).join(', '));
    } else if (error) {
      console.log('  ❌ 없거나 에러:', error.message);
    }
  }
})();
