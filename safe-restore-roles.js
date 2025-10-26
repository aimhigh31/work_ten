const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exxumujwufzqnovhzvif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function safeRestoreRoles() {
  console.log('🔄 [역할 관리 안전 복구] 시작...\n');

  // 1. 현재 역할 상태 확인
  const { data: existingRoles, error: checkError } = await supabase
    .from('admin_users_rules')
    .select('*')
    .order('id');

  if (checkError) {
    console.error('❌ 역할 조회 실패:', checkError);
    return;
  }

  console.log('📊 현재 역할 데이터:', existingRoles.length, '개');
  existingRoles.forEach((role) => {
    console.log('  -', role.id, ':', role.role_code, '-', role.role_name, '(활성:', role.is_active + ')');
  });
  console.log('\n');

  // 2. 사용 중인 역할 확인
  const { data: usedRoles, error: usedError } = await supabase
    .from('admin_users_userprofiles')
    .select('role_id')
    .not('role_id', 'is', null);

  if (usedError) {
    console.error('❌ 사용 중인 역할 조회 실패:', usedError);
    return;
  }

  const usedRoleIds = [...new Set(usedRoles.map((r) => r.role_id))];
  console.log('🔗 사용자에게 할당된 역할 ID:', usedRoleIds);
  console.log('\n');

  // 3. 기본 역할 정의
  const defaultRoles = [
    {
      role_code: 'ROLE-00-SYSTEM',
      role_name: '슈퍼관리자',
      role_description: '시스템 전체 관리 권한 (모든 메뉴 Full 권한)',
      display_order: 1,
      is_active: true,
      is_system: true
    },
    {
      role_code: 'ROLE-25-001',
      role_name: '시스템 관리자',
      role_description: '시스템 설정 및 관리 권한',
      display_order: 2,
      is_active: true,
      is_system: true
    },
    {
      role_code: 'ROLE-25-002',
      role_name: '일반 관리자',
      role_description: '일반 관리 업무 권한',
      display_order: 3,
      is_active: true,
      is_system: false
    },
    {
      role_code: 'ROLE-25-003',
      role_name: '일반 사용자',
      role_description: '기본 읽기 및 쓰기 권한',
      display_order: 4,
      is_active: true,
      is_system: false
    },
    {
      role_code: 'ROLE-25-004',
      role_name: '조회 전용',
      role_description: '읽기 전용 권한',
      display_order: 5,
      is_active: true,
      is_system: false
    }
  ];

  // 4. 기존 역할 업데이트 또는 신규 생성
  console.log('🔄 역할 데이터 동기화 중...\n');

  for (const defaultRole of defaultRoles) {
    const existingRole = existingRoles.find((r) => r.role_code === defaultRole.role_code);

    if (existingRole) {
      // 기존 역할 업데이트
      console.log('✏️ 업데이트:', defaultRole.role_code, '-', defaultRole.role_name);

      const { error: updateError } = await supabase
        .from('admin_users_rules')
        .update({
          role_name: defaultRole.role_name,
          role_description: defaultRole.role_description,
          display_order: defaultRole.display_order,
          is_active: defaultRole.is_active,
          is_system: defaultRole.is_system
        })
        .eq('id', existingRole.id);

      if (updateError) {
        console.error('  ❌ 업데이트 실패:', updateError);
      } else {
        console.log('  ✅ 업데이트 완료');
      }
    } else {
      // 신규 역할 생성
      console.log('➕ 생성:', defaultRole.role_code, '-', defaultRole.role_name);

      const { error: insertError } = await supabase.from('admin_users_rules').insert([defaultRole]);

      if (insertError) {
        console.error('  ❌ 생성 실패:', insertError);
      } else {
        console.log('  ✅ 생성 완료');
      }
    }
  }

  console.log('\n');

  // 5. 사용되지 않는 역할 비활성화
  console.log('🗑️ 불필요한 역할 비활성화 중...\n');

  const defaultRoleCodes = defaultRoles.map((r) => r.role_code);

  for (const role of existingRoles) {
    // 기본 역할이 아니고, 사용 중이지 않은 역할
    if (!defaultRoleCodes.includes(role.role_code)) {
      const isUsed = usedRoleIds.includes(role.id);

      if (!isUsed && role.is_active) {
        console.log('🔒 비활성화:', role.role_code, '-', role.role_name);

        const { error: deactivateError } = await supabase
          .from('admin_users_rules')
          .update({ is_active: false })
          .eq('id', role.id);

        if (deactivateError) {
          console.error('  ❌ 비활성화 실패:', deactivateError);
        } else {
          console.log('  ✅ 비활성화 완료');
        }
      } else if (isUsed) {
        console.log('⚠️ 사용 중이므로 유지:', role.role_code, '-', role.role_name);
      }
    }
  }

  console.log('\n✅ [역할 관리 복구] 완료!\n');

  // 6. 최종 상태 확인
  const { data: finalRoles } = await supabase
    .from('admin_users_rules')
    .select('*')
    .order('display_order', { ascending: true })
    .order('id', { ascending: true });

  console.log('📊 최종 역할 목록 (' + finalRoles.length + '개):');
  finalRoles.forEach((role, idx) => {
    const usedMark = usedRoleIds.includes(role.id) ? ' [사용중]' : '';
    console.log('  ' + (idx + 1) + '.', role.role_code, '-', role.role_name, '(활성:', role.is_active + ')' + usedMark);
  });
}

safeRestoreRoles().catch(console.error);
