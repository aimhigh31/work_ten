const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 새로운 deleteItEducation 함수 테스트
async function deleteItEducation(id) {
  console.log(`🗑️ 삭제 시작 - ID: ${id}`);

  try {
    // 1. 먼저 데이터가 존재하는지 확인
    const { data: existingData, error: checkError } = await supabase
      .from('it_education_data')
      .select('id, education_name, is_active')
      .eq('id', id)
      .single();

    if (checkError) {
      console.error('❌ 데이터 존재 확인 실패:', checkError);
      return false;
    }

    console.log(`📊 삭제 대상 확인 - ID: ${existingData.id}, 이름: ${existingData.education_name}, 활성: ${existingData.is_active}`);

    // 2. is_active를 false로 업데이트
    const { data: updateResult, error: updateError } = await supabase
      .from('it_education_data')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError);
      return false;
    }

    console.log('✅ 삭제 성공:', updateResult);
    return true;

  } catch (err) {
    console.error('❌ 삭제 중 예외 발생:', {
      id,
      error: err,
      message: err instanceof Error ? err.message : '알 수 없는 오류',
      type: typeof err
    });

    return false;
  } finally {
    console.log(`🏁 삭제 작업 완료 - ID: ${id}`);
  }
}

async function testNewDeleteFunction() {
  console.log('🔄 새로운 삭제 함수 테스트 시작...');

  try {
    // 활성 데이터 조회
    const { data: activeData, error: findError } = await supabase
      .from('it_education_data')
      .select('id, education_name, is_active')
      .eq('is_active', true);

    if (findError) {
      console.error('❌ 활성 데이터 조회 실패:', findError);
      return;
    }

    console.log('\n📊 현재 활성 데이터:');
    activeData.forEach(item => {
      console.log(`  ID: ${item.id}, 이름: ${item.education_name}, 활성: ${item.is_active}`);
    });

    if (activeData.length > 0) {
      const testId = activeData[0].id;
      const testName = activeData[0].education_name;

      console.log(`\n🎯 테스트 대상: ID ${testId} "${testName}"`);

      // 삭제 실행
      const result = await deleteItEducation(testId);

      if (result) {
        console.log('\n✅ 테스트 성공! 삭제 후 상태 확인...');

        // 삭제 후 상태 확인
        const { data: afterData, error: afterError } = await supabase
          .from('it_education_data')
          .select('id, education_name, is_active')
          .eq('id', testId)
          .single();

        if (afterError) {
          console.error('❌ 삭제 후 상태 확인 실패:', afterError);
        } else {
          console.log(`📊 삭제 후 상태: ID ${afterData.id}, 이름: ${afterData.education_name}, 활성: ${afterData.is_active}`);
        }

        // 활성 데이터 개수 재확인
        const { data: finalActiveData } = await supabase
          .from('it_education_data')
          .select('id')
          .eq('is_active', true);

        console.log(`🎉 최종 활성 데이터 개수: ${finalActiveData?.length || 0}개`);

      } else {
        console.error('❌ 테스트 실패');
      }

    } else {
      console.log('❌ 테스트할 활성 데이터가 없습니다.');
    }

  } catch (err) {
    console.error('❌ 테스트 중 오류:', err);
  }
}

testNewDeleteFunction();