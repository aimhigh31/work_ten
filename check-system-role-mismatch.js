/**
 * system 계정의 역할 불일치 확인
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkRoleMismatch() {
  try {
    console.log('✅ Supabase 연결 성공\n');

    // 1. system 계정의 현재 상태
    console.log('📊 1. system 계정의 현재 역할...\n');
    const { data: user } = await supabase
      .from('admin_users_userprofiles')
      .select(`
        id,
        email,
        user_name,
        role_id,
        admin_users_rules (
          id,
          role_code,
          role_name,
          is_active
        )
      `)
      .eq('email', 'system@nexplus.co.kr')
      .single();

    if (user) {
      console.log('=== system 계정 현재 상태 ===');
      console.log('이메일:', user.email);
      console.log('사용자명:', user.user_name);
      console.log('role_id:', user.role_id);
      console.log('역할 정보:', user.admin_users_rules);
      console.log();
    }

    // 2. ROLE-23_ADMIN 역할 찾기
    console.log('📋 2. ROLE-23_ADMIN 역할 검색...\n');
    const { data: adminRole } = await supabase
      .from('admin_users_rules')
      .select('*')
      .ilike('role_code', '%ROLE-23%ADMIN%');

    if (adminRole && adminRole.length > 0) {
      console.log('=== ROLE-23_ADMIN 역할 정보 ===');
      console.table(adminRole);
    } else {
      console.log('❌ ROLE-23_ADMIN 역할을 찾을 수 없습니다.\n');

      // ROLE-23으로 시작하는 역할 찾기
      const { data: role23 } = await supabase
        .from('admin_users_rules')
        .select('*')
        .ilike('role_code', 'ROLE-23%');

      if (role23 && role23.length > 0) {
        console.log('ROLE-23으로 시작하는 역할들:');
        console.table(role23);
      }
    }

    // 3. 모든 역할 목록
    console.log('\n📋 3. 전체 역할 목록...\n');
    const { data: allRoles } = await supabase
      .from('admin_users_rules')
      .select('id, role_code, role_name, is_active')
      .order('id');

    if (allRoles) {
      console.log('=== 전체 역할 목록 ===');
      console.table(allRoles);
    }

    // 4. "시스템 관리자" 이름의 역할 찾기
    console.log('\n📋 4. "시스템 관리자" 또는 "admin" 이름의 역할...\n');
    const { data: sysAdminRoles } = await supabase
      .from('admin_users_rules')
      .select('*')
      .or('role_name.ilike.%시스템%,role_name.ilike.%관리자%,role_name.ilike.%admin%');

    if (sysAdminRoles && sysAdminRoles.length > 0) {
      console.log('=== 관리자 관련 역할들 ===');
      console.table(sysAdminRoles);
    }

    // 5. 진단
    console.log('\n=== 💡 진단 ===');
    if (user && user.role_id === 11) {
      console.log('❌ system 계정이 role_id 11 (ROLE-25-001, "일반 조회")로 설정되어 있습니다.');
      console.log('⚠️  이것은 시스템 관리자가 아닌 일반 사용자 역할입니다!');
      console.log();
      console.log('해결 방법:');
      console.log('1. system 계정의 role_id를 올바른 관리자 역할 ID로 변경');
      console.log('2. 또는 ROLE-23_ADMIN 역할이 어떤 ID인지 확인 후 할당');
    }

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

checkRoleMismatch();
