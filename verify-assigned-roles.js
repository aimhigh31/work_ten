const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyAssignedRoles() {
  console.log('\n🔍 assigned_roles 필드 검증 시작...\n');

  try {
    // 1. 모든 사용자의 assigned_roles 확인
    const { data: allUsers, error: allError } = await supabase
      .from('admin_users_userprofiles')
      .select('id, user_code, user_name, assigned_roles, rule, role_id')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ 전체 사용자 조회 실패:', allError);
      return;
    }

    console.log('\n📊 전체 사용자 assigned_roles 상태:');
    allUsers.forEach((u) => {
      const rolesStatus = Array.isArray(u.assigned_roles)
        ? `✅ ${u.assigned_roles.length}개 역할`
        : `⚠️  비정상 (${typeof u.assigned_roles})`;
      console.log(`\n  ${u.user_code} (${u.user_name}):`);
      console.log(`    assigned_roles: ${rolesStatus}`);
      if (Array.isArray(u.assigned_roles) && u.assigned_roles.length > 0) {
        console.log(`      → ${u.assigned_roles.join(', ')}`);
      }
      console.log(`    rule: ${u.rule || 'NULL'}`, u.rule ? '⚠️  (제거 필요)' : '✅');
      console.log(`    role_id: ${u.role_id || 'NULL'}`, u.role_id ? '⚠️  (제거 필요)' : '✅');
    });

    console.log('\n✅ 검증 완료\n');
  } catch (err) {
    console.error('❌ 오류 발생:', err);
  }
}

verifyAssignedRoles();
