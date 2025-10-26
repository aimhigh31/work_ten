const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exxumujwufzqnovhzvif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanAndRestoreRoles() {
  console.log('🧹 [역할 관리 정리 및 복구] 시작...\n');

  // 1. 모든 역할 삭제
  console.log('🗑️ 기존 역할 데이터 삭제 중...');
  const { error: deleteError } = await supabase
    .from('admin_users_rules')
    .delete()
    .neq('id', 0); // id != 0 (모든 행 삭제)

  if (deleteError) {
    console.error('❌ 삭제 실패:', deleteError);
    return;
  }
  console.log('✅ 기존 데이터 삭제 완료\n');

  // 2. 기본 역할 데이터
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

  // 3. 기본 역할 삽입
  console.log('📝 기본 역할 생성 중...');
  for (const role of defaultRoles) {
    const { data, error } = await supabase
      .from('admin_users_rules')
      .insert([role])
      .select();

    if (error) {
      console.error('❌ 생성 실패:', role.role_code, error);
    } else {
      console.log('✅ 생성 완료:', role.role_code, '-', role.role_name);
    }
  }

  console.log('\n📊 [역할 관리 복구] 완료!\n');

  // 4. 최종 확인
  const { data: finalRoles } = await supabase
    .from('admin_users_rules')
    .select('*')
    .order('display_order');

  console.log('✅ 최종 역할 목록 (' + finalRoles.length + '개):');
  finalRoles.forEach((role, idx) => {
    console.log('  ' + (idx + 1) + '.', role.role_code, '-', role.role_name, '(활성:', role.is_active + ')');
  });
}

cleanAndRestoreRoles().catch(console.error);
