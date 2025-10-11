const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRolesTable() {
  try {
    console.log('역할 테이블 확인 중...');

    // 테이블 존재 확인
    const { data, error } = await supabase
      .from('admin_usersettings_role')
      .select('*')
      .limit(1);

    if (error) {
      console.error('테이블 조회 오류:', error);
      return;
    }

    console.log('테이블 확인 성공. 데이터 샘플:', data);

  } catch (err) {
    console.error('전체 오류:', err);
  }
}

checkRolesTable();