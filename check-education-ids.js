const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEducationIds() {
  try {
    // security_education_data 테이블의 기존 교육 데이터 조회
    const { data, error } = await supabase
      .from('security_education_data')
      .select('id, education_name')
      .order('id', { ascending: true });

    if (error) {
      console.error('교육 데이터 조회 실패:', error);
      return;
    }

    console.log('📊 기존 교육 데이터:');
    if (data && data.length > 0) {
      data.forEach((item, index) => {
        console.log(`${index + 1}. ID: ${item.id}, 교육명: ${item.education_name}`);
      });
    } else {
      console.log('등록된 교육 데이터가 없습니다.');
    }

    return data;

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

checkEducationIds();