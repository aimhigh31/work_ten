const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testUserSearch() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('🔍 user_account_id = "kim" 또는 user_code = "kim"으로 검색...\n');

  // 테스트 1: 원본 쿼리 (실패 예상)
  console.log('테스트 1: .or("user_code.eq.kim,user_account_id.eq.kim")');
  let result1 = await supabase
    .from('admin_users_userprofiles')
    .select('email, user_name, user_code, user_account_id')
    .or('user_code.eq.kim,user_account_id.eq.kim')
    .limit(1);
  console.log('  결과:', result1.data?.length || 0, '명\n');

  // 테스트 2: eq 대신 individual filters
  console.log('테스트 2: .or("user_code.eq.\\"kim\\",user_account_id.eq.\\"kim\\"")');
  let result2 = await supabase
    .from('admin_users_userprofiles')
    .select('email, user_name, user_code, user_account_id')
    .or('user_code.eq."kim",user_account_id.eq."kim"')
    .limit(1);
  console.log('  결과:', result2.data?.length || 0, '명\n');

  // 테스트 3: 직접 eq 사용
  console.log('테스트 3: .eq("user_account_id", "kim")');
  let result3 = await supabase
    .from('admin_users_userprofiles')
    .select('email, user_name, user_code, user_account_id')
    .eq('user_account_id', 'kim')
    .limit(1);
  console.log('  결과:', result3.data?.length || 0, '명\n');

  if (result3.data && result3.data.length > 0) {
    console.log('✅ user_account_id로 검색 성공!');
    console.log('  User Account ID:', result3.data[0].user_account_id);
    console.log('  User Code:', result3.data[0].user_code);
  }

  // 올바른 쿼리로 최종 테스트 (LEFT JOIN 사용)
  console.log('\n🔍 최종 테스트: LEFT JOIN 사용');
  const { data: users, error } = await supabase
    .from('admin_users_userprofiles')
    .select(`
      email, user_name, status, is_active, auth_user_id,
      position, department, avatar_url, profile_image_url,
      role_id,
      admin_users_rules(id, role_name)
    `)
    .or('user_code.eq.kim,user_account_id.eq.kim')
    .limit(1);

  if (error) {
    console.error('❌ 검색 오류:', error.message);
    console.error('   상세:', error);
    return;
  }

  if (!users || users.length === 0) {
    console.error('❌ 사용자를 찾을 수 없습니다.');
    return;
  }

  const user = users[0];
  console.log('✅ 사용자 발견:');
  console.log('   이름:', user.user_name);
  console.log('   이메일:', user.email);
  console.log('   상태:', user.status, '/ is_active:', user.is_active);
  console.log('   Auth User ID:', user.auth_user_id);
  console.log('   Role:', user.admin_users_rules?.role_name || '역할 없음');

  console.log('\n🔐 이메일로 Supabase Auth 로그인 테스트...');

  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
    email: user.email,
    password: '123456'
  });

  if (authError) {
    console.error('❌ Auth 로그인 실패:', authError.message);
  } else {
    console.log('✅ Auth 로그인 성공!');
    console.log('   User ID:', authData.user.id);
  }
}

testUserSearch();
