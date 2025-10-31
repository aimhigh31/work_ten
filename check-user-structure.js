require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkUserStructure() {
  try {
    const { data: users } = await supabase
      .from('admin_users_userprofiles')
      .select('id, user_code, user_name, email, role_id')
      .order('id');

    console.log('현재 사용자 구조:\n');
    console.table(users.map(u => ({
      ID: u.id,
      '사용자코드': u.user_code,
      '이름': u.user_name,
      '이메일': u.email ? '***@***' : null,  // 마스킹
      'role_id': u.role_id
    })));

    console.log('\n권장 식별 방식:');
    console.log('1. id (primary key): 절대 변하지 않음');
    console.log('2. user_code: 사용자 식별용 코드');
    console.log('3. 이메일: 로그인용으로만 사용, 식별자로 사용 X');
  } catch (error) {
    console.error('오류:', error);
  }
}

checkUserStructure();
