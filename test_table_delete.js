const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// deleteItEducation 함수 테스트
async function deleteItEducation(id) {
  try {
    const { error } = await supabase
      .from('it_education_data')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('IT교육 데이터 삭제 실패:', error);
      throw error;
    }

    return true;
  } catch (err) {
    console.error('IT교육 데이터 삭제 오류:', err);
    return false;
  }
}

async function testTableDelete() {
  console.log('🔄 테이블 삭제 기능 테스트 시작...');

  try {
    // 1. 현재 활성 데이터 확인
    console.log('\n📊 삭제 전 상태 확인...');
    const { data: beforeData, error: beforeError } = await supabase
      .from('it_education_data')
      .select('id, code, education_name, is_active');

    if (beforeError) {
      console.error('❌ 데이터 조회 실패:', beforeError);
      return;
    }

    console.log('전체 데이터:');
    beforeData.forEach(item => {
      console.log(`  ID: ${item.id}, 코드: ${item.code}, 이름: ${item.education_name}, 활성: ${item.is_active}`);
    });

    const activeData = beforeData.filter(item => item.is_active);
    const inactiveData = beforeData.filter(item => !item.is_active);

    console.log(`활성 데이터: ${activeData.length}개, 비활성 데이터: ${inactiveData.length}개`);

    // 2. 테스트용으로 활성 데이터 하나를 삭제
    if (activeData.length > 0) {
      const targetId = activeData[0].id;
      const targetName = activeData[0].education_name;

      console.log(`\n🗑️  테이블 삭제 기능 시뮬레이션 - ID ${targetId} "${targetName}" 삭제...`);

      const deleteResult = await deleteItEducation(targetId);

      if (deleteResult) {
        console.log('✅ 삭제 요청 성공');

        // 3. 삭제 후 상태 확인
        console.log('\n📊 삭제 후 상태 확인...');
        const { data: afterData, error: afterError } = await supabase
          .from('it_education_data')
          .select('id, code, education_name, is_active');

        if (afterError) {
          console.error('❌ 삭제 후 데이터 조회 실패:', afterError);
          return;
        }

        console.log('전체 데이터:');
        afterData.forEach(item => {
          console.log(`  ID: ${item.id}, 코드: ${item.code}, 이름: ${item.education_name}, 활성: ${item.is_active}`);
        });

        const activeAfter = afterData.filter(item => item.is_active);
        const inactiveAfter = afterData.filter(item => !item.is_active);

        console.log(`활성 데이터: ${activeAfter.length}개, 비활성 데이터: ${inactiveAfter.length}개`);

        // 4. UI에서 보이는 데이터 (활성 데이터만)
        console.log('\n🖥️  UI에 표시될 데이터 (활성 데이터만):');
        activeAfter.forEach(item => {
          console.log(`  ID: ${item.id}, 코드: ${item.code}, 이름: ${item.education_name}`);
        });

        console.log(`\n✅ 테이블 삭제 테스트 성공!`);
        console.log(`- 삭제 전 활성: ${activeData.length}개 → 삭제 후 활성: ${activeAfter.length}개`);
        console.log(`- 삭제 전 비활성: ${inactiveData.length}개 → 삭제 후 비활성: ${inactiveAfter.length}개`);

      } else {
        console.error('❌ 삭제 실패');
      }

    } else {
      console.log('❌ 삭제할 활성 데이터가 없습니다.');
    }

  } catch (err) {
    console.error('❌ 테스트 실패:', err);
  }
}

testTableDelete();