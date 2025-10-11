require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTeamColumn() {
  try {
    console.log('🔍 security_education_data 테이블 구조 확인 중...\n');

    // 테이블에서 한 행만 가져와서 컬럼 확인
    const { data, error } = await supabase
      .from('security_education_data')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ 테이블 조회 에러:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ 테이블 컬럼 목록:');
      const columns = Object.keys(data[0]);
      columns.forEach((col, index) => {
        const hasTeam = col === 'team' ? ' 👈 팀 필드 발견!' : '';
        console.log(`  ${index + 1}. ${col}${hasTeam}`);
      });

      if (columns.includes('team')) {
        console.log('\n✅ team 컬럼이 존재합니다.');
      } else {
        console.log('\n❌ team 컬럼이 없습니다. 컬럼을 추가해야 합니다.');
      }
    } else {
      console.log('⚠️  테이블에 데이터가 없습니다. 빈 테이블입니다.');
    }
  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkTeamColumn();
