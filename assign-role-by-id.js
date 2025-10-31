require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// 사용법: node assign-role-by-id.js <user_id> <role_id>
// 예시: node assign-role-by-id.js 17 11

async function assignRole() {
  try {
    const userId = process.argv[2];
    const roleId = process.argv[3];

    if (!userId || !roleId) {
      console.log('사용법: node assign-role-by-id.js <user_id> <role_id>');
      console.log('예시: node assign-role-by-id.js 17 11');
      return;
    }

    // ID로 역할 부여 (이메일 사용 안 함)
    const { data, error } = await supabase
      .from('admin_users_userprofiles')
      .update({ role_id: parseInt(roleId) })
      .eq('id', parseInt(userId))
      .select('id, user_code, user_name, role_id');

    if (error) {
      console.error('실패:', error);
      return;
    }

    console.log('✅ 역할 부여 완료!');
    console.log('사용자 ID:', data[0].id);
    console.log('사용자 코드:', data[0].user_code);
    console.log('이름:', data[0].user_name);
    console.log('부여된 role_id:', data[0].role_id);
  } catch (error) {
    console.error('오류:', error);
  }
}

assignRole();
