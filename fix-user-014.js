const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

(async () => {
  console.log('🔧 USER-25-014 사용자 데이터 업데이트 시작...\n');

  // 업데이트할 데이터
  const updateData = {
    user_account_id: 'asd_account',  // 원하는 사용자계정ID를 입력하세요
    phone: '010-1234-1234',
    country: '대한민국',
    address: 'asd'
  };

  console.log('📝 업데이트할 데이터:');
  console.log(`   사용자계정ID: ${updateData.user_account_id}`);
  console.log(`   전화번호: ${updateData.phone}`);
  console.log(`   국가: ${updateData.country}`);
  console.log(`   주소: ${updateData.address}`);
  console.log('');

  const { data, error } = await supabase
    .from('admin_users_userprofiles')
    .update(updateData)
    .eq('user_code', 'USER-25-014')
    .select();

  if (error) {
    console.error('❌ 업데이트 실패:', error);
    return;
  }

  console.log('✅ 업데이트 성공!');
  console.log('📊 업데이트된 데이터:', data);
})();
