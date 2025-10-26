const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exxumujwufzqnovhzvif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMasterCodeStructure() {
  console.log('📊 마스터코드 테이블 구조 및 데이터 확인\n');

  // 1. 모든 마스터코드 그룹 확인
  const { data: allGroups, error: groupError } = await supabase
    .from('admin_mastercode3_subcodes')
    .select('group_code')
    .order('group_code');

  if (groupError) {
    console.error('❌ 그룹 조회 실패:', groupError);
  } else {
    const uniqueGroups = [...new Set(allGroups?.map(g => g.group_code) || [])];
    console.log('📋 존재하는 그룹 코드:', uniqueGroups);
    console.log('');
  }

  // 2. 전체 데이터 샘플 확인
  const { data: allData, error: allError } = await supabase
    .from('admin_mastercode3_subcodes')
    .select('*')
    .limit(20);

  if (allError) {
    console.error('❌ 전체 데이터 조회 실패:', allError);
  } else {
    console.log('📄 전체 데이터 샘플 (최대 20개):');
    allData?.forEach((item, idx) => {
      console.log(`  ${idx + 1}. group: ${item.group_code} | subcode: ${item.subcode} | name: ${item.subcode_name} | value: ${item.code_value}`);
    });
    console.log('');
  }

  // 3. 현재 사용자 프로필에 저장된 position, role 값 확인
  const { data: userData, error: userError } = await supabase
    .from('admin_users_userprofiles')
    .select('position, role')
    .limit(10);

  if (userError) {
    console.error('❌ 사용자 데이터 조회 실패:', userError);
  } else {
    console.log('👤 현재 사용자 프로필에 저장된 값:');
    const positions = new Set();
    const roles = new Set();
    userData?.forEach(user => {
      if (user.position) positions.add(user.position);
      if (user.role) roles.add(user.role);
    });
    console.log('  Position 값:', Array.from(positions));
    console.log('  Role 값:', Array.from(roles));
  }
}

checkMasterCodeStructure().catch(console.error);
