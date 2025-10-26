const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function assignMultipleRoles() {
  console.log('\n🔧 System 사용자에게 3개 역할 할당 시작...\n');

  try {
    const rolesToAssign = ['ROLE-25-001', 'ROLE-00-SYSTEM', 'ROLE-25-ADMIN'];

    // System 사용자 업데이트
    const { data, error } = await supabase
      .from('admin_users_userprofiles')
      .update({
        assigned_roles: rolesToAssign
      })
      .eq('user_code', 'USER-25-013')
      .select()
      .single();

    if (error) {
      console.error('❌ 업데이트 실패:', error);
      return;
    }

    console.log('✅ 역할 할당 성공!');
    console.log('📋 업데이트된 사용자:', {
      user_code: data.user_code,
      user_name: data.user_name,
      assigned_roles: data.assigned_roles
    });

    // 검증
    const { data: verified } = await supabase
      .from('admin_users_userprofiles')
      .select('user_code, user_name, assigned_roles')
      .eq('user_code', 'USER-25-013')
      .single();

    console.log('\n🔍 검증 결과:');
    console.log('  assigned_roles:', verified.assigned_roles);
    console.log('  타입:', typeof verified.assigned_roles);
    console.log('  배열 여부:', Array.isArray(verified.assigned_roles));
    console.log('  개수:', Array.isArray(verified.assigned_roles) ? verified.assigned_roles.length : 'N/A');

    console.log('\n✅ 완료! 이제 페이지를 새로고침하세요.\n');
  } catch (err) {
    console.error('❌ 오류 발생:', err);
  }
}

assignMultipleRoles();
