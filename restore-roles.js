const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exxumujwufzqnovhzvif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreRoles() {
  console.log('📊 [역할 관리 복구] 시작...\n');

  // 1. 현재 상태 확인
  const { data: existingRoles, error: checkError } = await supabase
    .from('admin_users_rules')
    .select('*')
    .order('id');

  if (checkError) {
    console.error('❌ 역할 조회 실패:', checkError);
    return;
  }

  console.log('✅ 현재 역할 데이터:', existingRoles.length, '개');
  existingRoles.forEach(role => {
    console.log('  -', role.id, ':', role.role_code, '-', role.role_name);
  });
  console.log('\n');

  // 2. 기본 역할 데이터 (백업)
  const defaultRoles = [
    {
      role_code: 'ROLE-25-001',
      role_name: '시스템 관리자',
      role_description: '시스템 전체 관리 권한',
      display_order: 1,
      is_active: true,
      is_system: true
    },
    {
      role_code: 'ROLE-25-002',
      role_name: '일반 사용자',
      role_description: '기본 읽기 권한',
      display_order: 2,
      is_active: true,
      is_system: true
    },
    {
      role_code: 'ROLE-25-003',
      role_name: '관리자',
      role_description: '관리 메뉴 접근 권한',
      display_order: 3,
      is_active: true,
      is_system: false
    }
  ];

  // 3. 삭제되거나 없는 역할 복구
  for (const defaultRole of defaultRoles) {
    const exists = existingRoles.find(r => r.role_code === defaultRole.role_code);

    if (!exists) {
      console.log('🔄 복구 중:', defaultRole.role_code, '-', defaultRole.role_name);

      const { data, error } = await supabase
        .from('admin_users_rules')
        .insert([defaultRole])
        .select();

      if (error) {
        console.error('❌ 복구 실패:', defaultRole.role_code, error);
      } else {
        console.log('✅ 복구 완료:', defaultRole.role_code);
      }
    } else {
      console.log('✓ 존재함:', defaultRole.role_code, '-', defaultRole.role_name);
    }
  }

  console.log('\n📊 [역할 관리 복구] 완료!');

  // 4. 최종 상태 확인
  const { data: finalRoles } = await supabase
    .from('admin_users_rules')
    .select('*')
    .order('id');

  console.log('\n✅ 최종 역할 데이터:', finalRoles.length, '개');
  finalRoles.forEach(role => {
    console.log('  -', role.id, ':', role.role_code, '-', role.role_name, '(활성:', role.is_active + ')');
  });
}

restoreRoles().catch(console.error);
