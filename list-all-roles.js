/**
 * 모든 역할 목록 조회
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  try {
    const { data: roles, error } = await supabase
      .from('admin_users_rules')
      .select('id, role_code, role_name, role_description, is_active')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('❌ 역할 조회 실패:', error);
      return;
    }

    console.log('📋 활성 역할 목록 (' + roles.length + '개):\n');
    roles.forEach((role, index) => {
      console.log(`${index + 1}. [ID: ${role.id}] ${role.role_name} (${role.role_code})`);
      if (role.role_description) {
        console.log(`   설명: ${role.role_description}`);
      }
    });
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
})();
