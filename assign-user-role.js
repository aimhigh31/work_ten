/**
 * 사용자에게 role_id 할당 스크립트
 *
 * 사용법:
 * node assign-user-role.js <email> <role_id>
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function assignRole(email, roleId) {
  try {
    console.log('\n=== 사용자 역할 할당 ===\n');

    // 1. 역할 정보 확인
    const { data: role, error: roleError } = await supabase
      .from('admin_users_rules')
      .select('id, role_name')
      .eq('id', roleId)
      .single();

    if (roleError || !role) {
      console.error('❌ 역할을 찾을 수 없습니다. role_id:', roleId);
      return;
    }

    console.log('📋 할당할 역할:');
    console.log('  ID:', role.id);
    console.log('  이름:', role.role_name);

    // 2. 사용자 확인
    const { data: user, error: userError } = await supabase
      .from('admin_users_userprofiles')
      .select('email, user_name, role_id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.error('❌ 사용자를 찾을 수 없습니다:', email);
      return;
    }

    console.log('\n📋 대상 사용자:');
    console.log('  이메일:', user.email);
    console.log('  이름:', user.user_name);
    console.log('  현재 role_id:', user.role_id || 'null');

    // 3. role_id 업데이트
    const { error: updateError } = await supabase
      .from('admin_users_userprofiles')
      .update({ role_id: roleId })
      .eq('email', email);

    if (updateError) {
      console.error('❌ 역할 할당 실패:', updateError.message);
      return;
    }

    console.log('\n✅ 역할 할당 완료!');
    console.log(`   ${user.user_name}(${email})에게 "${role.role_name}" 역할이 할당되었습니다.`);
    console.log('\n💡 다음 단계:');
    console.log('   1. 브라우저에서 로그아웃');
    console.log('   2. 다시 로그인');
    console.log('   3. 새로운 세션에 roleId가 자동으로 포함됩니다.');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

// 실행
const email = process.argv[2];
const roleId = parseInt(process.argv[3], 10);

if (!email || !roleId || isNaN(roleId)) {
  console.error('❌ 사용법: node assign-user-role.js <email> <role_id>');
  console.error('예시: node assign-user-role.js ossam@company.com 1');
  process.exit(1);
}

assignRole(email, roleId);
