/**
 * 현재 사용자의 role_id 확인 및 할당 스크립트
 *
 * 사용법:
 * node check-user-role.js ossam@company.com
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkAndAssignRole(email) {
  try {
    console.log('\n=== 사용자 role_id 확인 ===\n');

    // 1. 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from('admin_users_userprofiles')
      .select('email, user_name, role_id, admin_users_rules(id, role_name)')
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.error('❌ 사용자를 찾을 수 없습니다:', userError?.message);
      return;
    }

    console.log('📋 사용자 정보:');
    console.log('  이메일:', user.email);
    console.log('  이름:', user.user_name);
    console.log('  현재 role_id:', user.role_id);
    console.log('  현재 역할명:', user.admin_users_rules?.role_name || '없음');

    // 2. role_id가 null이면 사용 가능한 역할 목록 표시
    if (!user.role_id) {
      console.log('\n⚠️ role_id가 설정되지 않았습니다!\n');

      // 사용 가능한 역할 조회
      const { data: roles, error: rolesError } = await supabase
        .from('admin_users_rules')
        .select('id, role_name')
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (rolesError || !roles || roles.length === 0) {
        console.error('❌ 역할 목록을 조회할 수 없습니다:', rolesError?.message);
        return;
      }

      console.log('📋 사용 가능한 역할 목록:');
      roles.forEach(role => {
        console.log(`  ${role.id}. ${role.role_name}`);
      });

      console.log('\n💡 역할을 할당하려면 다음 명령어를 실행하세요:');
      console.log(`   node assign-user-role.js ${email} [role_id]`);
      console.log('\n예시:');
      console.log(`   node assign-user-role.js ${email} 1  # 시스템관리자 할당`);
    } else {
      console.log('\n✅ role_id가 정상적으로 설정되어 있습니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

// 실행
const email = process.argv[2];
if (!email) {
  console.error('❌ 사용법: node check-user-role.js <email>');
  console.error('예시: node check-user-role.js ossam@company.com');
  process.exit(1);
}

checkAndAssignRole(email);
