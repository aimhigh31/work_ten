/**
 * 모든 사용자 계정 목록 조회
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function listAllUsers() {
  try {
    console.log('✅ Supabase 연결 성공\n');

    // 모든 사용자 조회
    console.log('📊 전체 사용자 목록 조회...\n');
    const { data: users, error } = await supabase
      .from('admin_users_userprofiles')
      .select(`
        id,
        email,
        role_id,
        admin_users_rules (
          role_code,
          role_name
        )
      `)
      .order('id');

    if (error) {
      console.error('❌ 조회 실패:', error);
      return;
    }

    console.log(`전체 사용자: ${users?.length || 0}명\n`);

    if (users && users.length > 0) {
      console.table(users.map(u => ({
        ID: u.id,
        이메일: u.email,
        역할ID: u.role_id,
        역할명: u.admin_users_rules?.role_name || '미지정'
      })));

      // jsan 관련 계정 찾기
      const jsanUsers = users.filter(u =>
        u.email && u.email.toLowerCase().includes('jsan')
      );

      if (jsanUsers.length > 0) {
        console.log('\n\n📌 jsan 관련 계정:');
        console.table(jsanUsers.map(u => ({
          이메일: u.email,
          역할ID: u.role_id,
          역할명: u.admin_users_rules?.role_name
        })));
      } else {
        console.log('\n⚠️  "jsan"이 포함된 계정을 찾을 수 없습니다.');
      }
    }

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

listAllUsers();
