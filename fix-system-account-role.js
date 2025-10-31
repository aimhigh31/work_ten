/**
 * system 계정의 역할을 올바른 시스템 관리자 역할로 변경
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

async function fixSystemAccountRole() {
  try {
    console.log('✅ Supabase 연결 성공\n');

    // 1. 현재 상태 확인
    console.log('📊 1. 현재 system 계정 상태...\n');
    const { data: beforeUser } = await supabase
      .from('admin_users_userprofiles')
      .select(`
        id,
        email,
        user_name,
        role_id,
        admin_users_rules (
          id,
          role_code,
          role_name
        )
      `)
      .eq('email', 'system@nexplus.co.kr')
      .single();

    if (beforeUser) {
      console.log('=== 변경 전 ===');
      console.log('이메일:', beforeUser.email);
      console.log('role_id:', beforeUser.role_id);
      console.log('역할 정보:', beforeUser.admin_users_rules);
      console.log();
    }

    // 2. ROLE-25-ADMIN 역할 확인
    console.log('📋 2. ROLE-25-ADMIN 역할 확인...\n');
    const { data: adminRole } = await supabase
      .from('admin_users_rules')
      .select('*')
      .eq('role_code', 'ROLE-25-ADMIN')
      .single();

    if (!adminRole) {
      console.error('❌ ROLE-25-ADMIN 역할을 찾을 수 없습니다!');
      return;
    }

    console.log('=== ROLE-25-ADMIN 역할 ===');
    console.log('id:', adminRole.id);
    console.log('role_code:', adminRole.role_code);
    console.log('role_name:', adminRole.role_name);
    console.log('role_description:', adminRole.role_description);
    console.log('is_active:', adminRole.is_active);
    console.log();

    if (!adminRole.is_active) {
      console.log('⚠️  ROLE-25-ADMIN이 비활성화 상태입니다. 활성화합니다...');
      await supabase
        .from('admin_users_rules')
        .update({ is_active: true })
        .eq('id', adminRole.id);
      console.log('✅ 역할 활성화 완료\n');
    }

    // 3. system 계정의 role_id 변경
    console.log(`📝 3. system 계정의 role_id를 ${beforeUser.role_id} → ${adminRole.id}로 변경...\n`);
    const { data: updatedUser, error: updateError } = await supabase
      .from('admin_users_userprofiles')
      .update({
        role_id: adminRole.id,
        updated_by: 'system',
        updated_at: new Date().toISOString()
      })
      .eq('email', 'system@nexplus.co.kr')
      .select(`
        id,
        email,
        user_name,
        role_id,
        admin_users_rules (
          id,
          role_code,
          role_name
        )
      `)
      .single();

    if (updateError) {
      console.error('❌ role_id 변경 실패:', updateError);
      return;
    }

    console.log('=== 변경 후 ===');
    console.log('이메일:', updatedUser.email);
    console.log('role_id:', updatedUser.role_id);
    console.log('역할 정보:', updatedUser.admin_users_rules);
    console.log();

    console.log('✅ system 계정의 역할이 성공적으로 변경되었습니다!');
    console.log();
    console.log('다음 단계:');
    console.log('  1. 브라우저 완전 로그아웃');
    console.log('  2. 캐시 삭제 (Ctrl + Shift + Delete)');
    console.log('  3. 브라우저 재시작');
    console.log('  4. system@nexplus.co.kr로 다시 로그인');
    console.log('  5. 사용자설정 페이지에서 추가/삭제 버튼 활성화 확인');

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

fixSystemAccountRole();
