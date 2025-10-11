// 잘못된 참석자 ID 데이터 정리 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupInvalidAttendeeIds() {
  try {
    console.log('🔍 잘못된 참석자 ID 조회 시작...');

    // PostgreSQL integer 범위: -2,147,483,648 ~ 2,147,483,647
    // Date.now()로 생성된 큰 ID들을 찾아 삭제
    const maxValidId = 2147483647;

    // 큰 ID 데이터 조회
    const { data: invalidData, error: fetchError } = await supabase
      .from('security_education_attendee')
      .select('id, user_name, education_id')
      .gt('id', maxValidId);

    if (fetchError) {
      console.error('❌ 데이터 조회 실패:', fetchError);
      return;
    }

    if (!invalidData || invalidData.length === 0) {
      console.log('✅ 정리할 잘못된 ID가 없습니다.');
      return;
    }

    console.log(`🔍 발견된 잘못된 ID: ${invalidData.length}개`);
    invalidData.forEach(item => {
      console.log(`  - ID: ${item.id}, 이름: ${item.user_name}, 교육ID: ${item.education_id}`);
    });

    // 사용자 확인
    console.log('\n⚠️  위 데이터들을 삭제하시겠습니까? (y/N)');

    // Node.js 환경에서 사용자 입력 받기
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('삭제하려면 "y"를 입력하세요: ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        // 큰 ID들 삭제
        const { error: deleteError } = await supabase
          .from('security_education_attendee')
          .delete()
          .gt('id', maxValidId);

        if (deleteError) {
          console.error('❌ 삭제 실패:', deleteError);
        } else {
          console.log('✅ 잘못된 ID 데이터 삭제 완료!');
        }
      } else {
        console.log('❌ 삭제 취소됨');
      }

      rl.close();
    });

  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류:', error);
  }
}

// 스크립트 실행
cleanupInvalidAttendeeIds();