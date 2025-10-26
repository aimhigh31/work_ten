const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exxumujwufzqnovhzvif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRoleAssignment() {
  console.log('🧪 역할 할당 테스트 시작\n');

  // 1. System 계정 현재 상태 확인
  const { data: before, error: beforeError } = await supabase
    .from('admin_users_userprofiles')
    .select('id, user_account_id, user_name, assigned_roles, rule, role_id')
    .eq('user_account_id', 'system')
    .single();

  if (beforeError) {
    console.error('❌ 조회 실패:', beforeError);
    return;
  }

  console.log('📋 현재 상태:');
  console.log('  assigned_roles:', before.assigned_roles);
  console.log('  rule:', before.rule);
  console.log('  role_id:', before.role_id);
  console.log('');

  // 2. 시스템관리자 역할 추가 (ROLE-25-ADMIN)
  const newRoles = ['ROLE-00-SYSTEM', 'ROLE-25-ADMIN'];

  console.log('➕ 역할 추가 시도:');
  console.log('  새로운 assigned_roles:', newRoles);
  console.log('  새로운 rule:', newRoles[0]);
  console.log('  새로운 role_id: 18 (ROLE-00-SYSTEM의 ID)');
  console.log('');

  const { data: after, error: updateError } = await supabase
    .from('admin_users_userprofiles')
    .update({
      assigned_roles: newRoles,
      rule: newRoles[0],
      role_id: 18
    })
    .eq('user_account_id', 'system')
    .select()
    .single();

  if (updateError) {
    console.error('❌ 업데이트 실패:', updateError);
    return;
  }

  console.log('✅ 업데이트 성공!');
  console.log('📋 업데이트 후 상태:');
  console.log('  assigned_roles:', after.assigned_roles);
  console.log('  rule:', after.rule);
  console.log('  role_id:', after.role_id);
  console.log('');

  // 3. 다시 조회해서 확인
  const { data: verify } = await supabase
    .from('admin_users_userprofiles')
    .select('id, user_account_id, user_name, assigned_roles, rule, role_id')
    .eq('user_account_id', 'system')
    .single();

  console.log('🔍 재조회 결과:');
  console.log('  assigned_roles:', verify.assigned_roles);
  console.log('  assigned_roles 타입:', typeof verify.assigned_roles);
  console.log('  assigned_roles 길이:', Array.isArray(verify.assigned_roles) ? verify.assigned_roles.length : 'N/A');
  console.log('  rule:', verify.rule);
  console.log('  role_id:', verify.role_id);
}

testRoleAssignment().catch(console.error);
