const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createUserStatusGroup() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('========================================');
  console.log('GROUP042 - 사용자 상태 그룹 생성');
  console.log('========================================\n');

  // 1. 그룹 생성
  const groupData = {
    codetype: 'group',
    group_code: 'GROUP042',
    group_code_name: '사용자 상태',
    group_code_description: '사용자 계정 상태 관리',
    group_code_status: 'active',
    group_code_order: 42,
    subcode: '',
    subcode_name: '',
    subcode_description: '',
    subcode_status: 'active',
    subcode_remark: '',
    subcode_order: 0,
    is_active: true,
    created_by: 'admin',
    updated_by: 'admin'
  };

  const { data: group, error: groupError } = await supabase
    .from('admin_mastercode_data')
    .insert([groupData])
    .select()
    .single();

  if (groupError) {
    console.error('❌ 그룹 생성 오류:', groupError);
    return;
  }

  console.log('✅ 그룹 생성 성공:', group);

  // 2. 서브코드 생성
  const subcodes = [
    {
      codetype: 'subcode',
      group_code: 'GROUP042',
      group_code_name: '사용자 상태',
      group_code_description: '사용자 계정 상태 관리',
      group_code_status: 'active',
      group_code_order: 42,
      subcode: 'GROUP042-SUB001',
      subcode_name: '대기',
      subcode_description: '가입 승인 대기 중',
      subcode_status: 'active',
      subcode_remark: '신규 가입 사용자',
      subcode_order: 1,
      is_active: true,
      created_by: 'admin',
      updated_by: 'admin'
    },
    {
      codetype: 'subcode',
      group_code: 'GROUP042',
      group_code_name: '사용자 상태',
      group_code_description: '사용자 계정 상태 관리',
      group_code_status: 'active',
      group_code_order: 42,
      subcode: 'GROUP042-SUB002',
      subcode_name: '활성',
      subcode_description: '정상 활동 중인 사용자',
      subcode_status: 'active',
      subcode_remark: '활성 계정',
      subcode_order: 2,
      is_active: true,
      created_by: 'admin',
      updated_by: 'admin'
    },
    {
      codetype: 'subcode',
      group_code: 'GROUP042',
      group_code_name: '사용자 상태',
      group_code_description: '사용자 계정 상태 관리',
      group_code_status: 'active',
      group_code_order: 42,
      subcode: 'GROUP042-SUB003',
      subcode_name: '비활성',
      subcode_description: '일시적으로 비활성화된 사용자',
      subcode_status: 'active',
      subcode_remark: '휴면 계정',
      subcode_order: 3,
      is_active: true,
      created_by: 'admin',
      updated_by: 'admin'
    },
    {
      codetype: 'subcode',
      group_code: 'GROUP042',
      group_code_name: '사용자 상태',
      group_code_description: '사용자 계정 상태 관리',
      group_code_status: 'active',
      group_code_order: 42,
      subcode: 'GROUP042-SUB004',
      subcode_name: '취소',
      subcode_description: '계정 삭제 또는 가입 취소',
      subcode_status: 'active',
      subcode_remark: '삭제된 계정',
      subcode_order: 4,
      is_active: true,
      created_by: 'admin',
      updated_by: 'admin'
    }
  ];

  const { data: subcodeData, error: subcodeError } = await supabase
    .from('admin_mastercode_data')
    .insert(subcodes)
    .select();

  if (subcodeError) {
    console.error('❌ 서브코드 생성 오류:', subcodeError);
    return;
  }

  console.log('\n✅ 서브코드 생성 성공:');
  subcodeData.forEach(sub => {
    console.log(`  - ${sub.subcode_name}: ${sub.subcode_description}`);
  });

  console.log('\n========================================');
  console.log('GROUP042 생성 완료!');
  console.log('========================================');
}

createUserStatusGroup();
