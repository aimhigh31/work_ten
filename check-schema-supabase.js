const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

(async () => {
  try {
    console.log('📊 admin_users_userprofiles 테이블 데이터 확인\n');

    // 최근 10명 데이터 확인 (모든 주요 필드 포함)
    const { data, error } = await supabase
      .from('admin_users_userprofiles')
      .select('id, user_code, user_name, email, phone, country, address, department, position, role, user_account_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ 조회 오류:', error);
      return;
    }

    console.log('최근 10명 사용자 데이터:');
    console.log('═'.repeat(100));

    data.forEach((user, idx) => {
      console.log(`\n${idx + 1}. ${user.user_code} - ${user.user_name}`);
      console.log(`   ├─ 이메일: ${user.email || '❌ NULL'}`);
      console.log(`   ├─ 전화번호: ${user.phone || '❌ NULL'}`);
      console.log(`   ├─ 국가: ${user.country || '❌ NULL'}`);
      console.log(`   ├─ 주소: ${user.address || '❌ NULL'}`);
      console.log(`   ├─ 부서: ${user.department || '❌ NULL'}`);
      console.log(`   ├─ 직급: ${user.position || '❌ NULL'}`);
      console.log(`   ├─ 직책: ${user.role || '❌ NULL'}`);
      console.log(`   ├─ 사용자계정ID: ${user.user_account_id || '❌ NULL'}`);
      console.log(`   └─ 생성일: ${user.created_at}`);
    });

    console.log('\n═'.repeat(100));

    // NULL 통계
    const nullStats = {
      phone: data.filter(u => !u.phone).length,
      country: data.filter(u => !u.country).length,
      address: data.filter(u => !u.address).length,
      email: data.filter(u => !u.email).length,
      user_account_id: data.filter(u => !u.user_account_id).length
    };

    console.log('\n📊 NULL 통계 (최근 10명 중):');
    console.log(`   전화번호 NULL: ${nullStats.phone}개`);
    console.log(`   국가 NULL: ${nullStats.country}개`);
    console.log(`   주소 NULL: ${nullStats.address}개`);
    console.log(`   이메일 NULL: ${nullStats.email}개`);
    console.log(`   사용자계정ID NULL: ${nullStats.user_account_id}개`);

  } catch (err) {
    console.error('❌ 오류:', err);
  }
})();
