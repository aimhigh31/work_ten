require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔍 전체 역할 확인\n');

  const { data: roles, error } = await supabase
    .from('admin_user_role')
    .select('*')
    .order('id');

  if (roles) {
    console.log(`총 ${roles.length}개의 역할 발견:\n`);
    roles.forEach(role => {
      console.log(`ID: ${role.id}, 역할명: "${role.role_name}", 설명: ${role.description || '-'}`);
    });
  } else {
    console.log('역할을 찾을 수 없습니다.');
    console.error(error);
  }

  // /hr/evaluation 메뉴 상세 확인
  console.log('\n\n🔍 /hr/evaluation 메뉴 상세 확인\n');
  const { data: menu, error: menuError } = await supabase
    .from('admin_systemsetting_menu')
    .select('*')
    .eq('menu_url', '/hr/evaluation')
    .single();

  if (menu) {
    console.log('메뉴 정보:', JSON.stringify(menu, null, 2));
  } else {
    console.log('메뉴를 찾을 수 없습니다.');
    console.error(menuError);
  }
})();
