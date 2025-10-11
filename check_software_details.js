const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSoftwareDetails() {
  console.log('🔍 it_software_data 상세 정보 확인...');

  try {
    const { data, error } = await supabase
      .from('it_software_data')
      .select('id, software_name, status, assignee, code, start_date, created_at')
      .order('id', { ascending: true });

    if (error) {
      console.error('❌ 테이블 조회 실패:', error);
      return;
    }

    console.log('✅ 테이블 조회 성공!');
    console.log(`📊 총 데이터 개수: ${data?.length}개`);

    if (data && data.length > 0) {
      console.log('\n📝 상세 데이터:');
      data.forEach((item) => {
        console.log(`ID: ${item.id} | 소프트웨어명: "${item.software_name}" | 코드: "${item.code}" | 상태: ${item.status}`);
        console.log(`   담당자: ${item.assignee} | 시작일: ${item.start_date} | 생성일: ${item.created_at}`);
        console.log('');
      });
    }

  } catch (err) {
    console.error('❌ 테이블 확인 중 오류:', err);
  }
}

checkSoftwareDetails();