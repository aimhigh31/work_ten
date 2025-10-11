const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearCurriculumData() {
  try {
    console.log('모든 커리큘럼 데이터를 삭제합니다...');

    // 모든 커리큘럼 데이터 삭제
    const { error } = await supabase
      .from('security_education_curriculum')
      .delete()
      .gte('id', 0); // 모든 데이터 삭제

    if (error) {
      console.error('삭제 실패:', error);
      return;
    }

    console.log('✅ 모든 커리큘럼 데이터가 삭제되었습니다.');

    // 삭제 후 확인
    const { data: remaining, error: checkError } = await supabase
      .from('security_education_curriculum')
      .select('*');

    if (checkError) {
      console.error('확인 실패:', checkError);
      return;
    }

    console.log(`현재 남은 데이터: ${remaining ? remaining.length : 0}개`);

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

clearCurriculumData();