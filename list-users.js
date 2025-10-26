const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exxumujwufzqnovhzvif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllUsers() {
  console.log('전체 사용자 목록:\n');

  const { data: allUsers, error } = await supabase
    .from('admin_users_userprofiles')
    .select('id, user_code, user_name, email, role_id, created_by, is_system')
    .order('id');

  if (error) {
    console.error('조회 실패:', error);
    return;
  }

  const { data: roles } = await supabase
    .from('admin_users_rules')
    .select('id, role_code, role_name');

  const roleMap = {};
  if (roles) {
    roles.forEach(r => {
      roleMap[r.id] = r.role_name + ' (' + r.role_code + ')';
    });
  }

  allUsers.forEach((u, idx) => {
    const roleInfo = roleMap[u.role_id] || '미지정';
    const num = idx + 1;
    console.log('  ' + num + '. ID: ' + u.id + ' | ' + u.user_code + ' | ' + u.user_name);
    console.log('     이메일: ' + (u.email || '없음') + ' | 역할: ' + roleInfo);
    console.log('     created_by: ' + u.created_by + ' | is_system: ' + u.is_system);
    console.log('');
  });
}

listAllUsers().catch(console.error);
