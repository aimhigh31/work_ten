// API 응답 시뮬레이션 테스트
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exxumujwufzqnovhzvif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAPIResponse() {
  console.log('🧪 API 응답 시뮬레이션 테스트\n');

  // GET /api/users와 동일한 쿼리
  const { data: rows, error } = await supabase
    .from('admin_users_userprofiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ 조회 실패:', error);
    return;
  }

  console.log(`✅ 총 ${rows?.length}명 조회\n`);

  // API route.ts의 processedData 로직 시뮬레이션
  const processedData = rows.map((row) => {
    const assignedRole = row.assigned_roles;

    return {
      ...row,
      assignedRole: Array.isArray(assignedRole) ? assignedRole : [],
      rule: row.rule || 'ROLE-25-003',
      role_id: row.role_id || null
    };
  });

  // System 계정 찾기
  const systemUser = processedData.find(u => u.user_account_id === 'system');

  if (systemUser) {
    console.log('🔍 System 계정 - DB 원본:');
    console.log('  assigned_roles:', rows.find(r => r.user_account_id === 'system').assigned_roles);
    console.log('  rule:', rows.find(r => r.user_account_id === 'system').rule);
    console.log('  role_id:', rows.find(r => r.user_account_id === 'system').role_id);
    console.log('');

    console.log('🔍 System 계정 - API 처리 후:');
    console.log('  assignedRole:', systemUser.assignedRole);
    console.log('  assignedRole 타입:', typeof systemUser.assignedRole);
    console.log('  assignedRole 배열여부:', Array.isArray(systemUser.assignedRole));
    console.log('  assignedRole 길이:', systemUser.assignedRole?.length);
    console.log('  rule:', systemUser.rule);
    console.log('  role_id:', systemUser.role_id);
    console.log('');

    console.log('✅ API 응답 시뮬레이션 성공!');
    console.log('프론트엔드로 전달될 데이터:', {
      user_account_id: systemUser.user_account_id,
      user_name: systemUser.user_name,
      assignedRole: systemUser.assignedRole,
      rule: systemUser.rule,
      role_id: systemUser.role_id
    });
  }
}

testAPIResponse().catch(console.error);
