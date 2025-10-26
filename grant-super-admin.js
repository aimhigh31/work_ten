const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exxumujwufzqnovhzvif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function grantSuperAdmin() {
  console.log('🔐 [슈퍼관리자 권한 부여] 시작...\n');

  // 1. 슈퍼관리자 역할 ID 찾기
  const { data: superAdminRole, error: roleError } = await supabase
    .from('admin_users_rules')
    .select('id, role_code, role_name')
    .eq('role_code', 'ROLE-00-SYSTEM')
    .single();

  if (roleError || !superAdminRole) {
    console.error('❌ 슈퍼관리자 역할을 찾을 수 없습니다:', roleError);
    return;
  }

  console.log('✅ 슈퍼관리자 역할 확인:', superAdminRole.id, '-', superAdminRole.role_name);
  console.log('\n');

  // 2. system 계정 찾기
  const { data: systemUser, error: userError } = await supabase
    .from('admin_users_userprofiles')
    .select('id, user_id, user_name, role_id')
    .eq('user_id', 'system')
    .single();

  if (userError || !systemUser) {
    console.error('❌ system 계정을 찾을 수 없습니다:', userError);
    console.log('\n📋 모든 사용자 목록 조회 중...\n');

    // 모든 사용자 출력
    const { data: allUsers } = await supabase
      .from('admin_users_userprofiles')
      .select('id, user_id, user_name, role_id')
      .order('id');

    if (allUsers && allUsers.length > 0) {
      console.log('현재 등록된 사용자:');
      allUsers.forEach((u) => {
        console.log('  -', u.id, ':', u.user_id, '/', u.user_name, '(역할 ID:', u.role_id + ')');
      });
    }
    return;
  }

  console.log('✅ system 계정 확인:', systemUser.user_id, '/', systemUser.user_name);
  console.log('   현재 역할 ID:', systemUser.role_id);
  console.log('\n');

  // 3. 슈퍼관리자 역할 부여
  if (systemUser.role_id === superAdminRole.id) {
    console.log('ℹ️ 이미 슈퍼관리자 역할이 부여되어 있습니다.');
  } else {
    console.log('🔄 슈퍼관리자 역할 부여 중...');

    const { error: updateError } = await supabase
      .from('admin_users_userprofiles')
      .update({ role_id: superAdminRole.id })
      .eq('id', systemUser.id);

    if (updateError) {
      console.error('❌ 역할 부여 실패:', updateError);
      return;
    }

    console.log('✅ 슈퍼관리자 역할 부여 완료!');
  }

  console.log('\n');

  // 4. 최종 확인
  const { data: updatedUser } = await supabase
    .from('admin_users_userprofiles')
    .select('id, user_id, user_name, role_id')
    .eq('id', systemUser.id)
    .single();

  if (updatedUser) {
    console.log('📊 최종 상태:');
    console.log('   사용자:', updatedUser.user_id, '/', updatedUser.user_name);
    console.log('   역할 ID:', updatedUser.role_id, '(' + superAdminRole.role_name + ')');
  }

  console.log('\n✅ [슈퍼관리자 권한 부여] 완료!');
}

grantSuperAdmin().catch(console.error);
