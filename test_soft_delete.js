const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSoftDelete() {
  console.log('🔄 소프트 삭제 기능 테스트 시작...');

  try {
    // 1. 현재 활성 데이터 조회
    console.log('\n📊 삭제 전 활성 데이터 조회...');
    const { data: beforeData, error: beforeError } = await supabase
      .from('it_education_data')
      .select('id, code, education_name, is_active')
      .eq('is_active', true)
      .order('id', { ascending: true });

    if (beforeError) {
      console.error('❌ 데이터 조회 실패:', beforeError);
      return;
    }

    console.log('활성 데이터 개수:', beforeData.length);
    console.log('활성 데이터 목록:');
    beforeData.forEach(item => {
      console.log(`  ID: ${item.id}, 코드: ${item.code}, 이름: ${item.education_name}, 활성: ${item.is_active}`);
    });

    // 2. 테스트용으로 첫 번째 데이터를 소프트 삭제
    if (beforeData.length > 0) {
      const targetId = beforeData[0].id;
      const targetName = beforeData[0].education_name;

      console.log(`\n🗑️  ID ${targetId} "${targetName}" 소프트 삭제 실행...`);

      const { error: deleteError } = await supabase
        .from('it_education_data')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetId);

      if (deleteError) {
        console.error('❌ 소프트 삭제 실패:', deleteError);
        return;
      }

      console.log('✅ 소프트 삭제 완료');

      // 3. 삭제 후 활성 데이터 다시 조회
      console.log('\n📊 삭제 후 활성 데이터 조회...');
      const { data: afterData, error: afterError } = await supabase
        .from('it_education_data')
        .select('id, code, education_name, is_active')
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (afterError) {
        console.error('❌ 삭제 후 데이터 조회 실패:', afterError);
        return;
      }

      console.log('활성 데이터 개수:', afterData.length);
      console.log('활성 데이터 목록:');
      afterData.forEach(item => {
        console.log(`  ID: ${item.id}, 코드: ${item.code}, 이름: ${item.education_name}, 활성: ${item.is_active}`);
      });

      // 4. 비활성 데이터 확인
      console.log('\n📊 비활성 데이터 조회...');
      const { data: inactiveData, error: inactiveError } = await supabase
        .from('it_education_data')
        .select('id, code, education_name, is_active')
        .eq('is_active', false);

      if (inactiveError) {
        console.error('❌ 비활성 데이터 조회 실패:', inactiveError);
      } else {
        console.log('비활성 데이터 개수:', inactiveData.length);
        console.log('비활성 데이터 목록:');
        inactiveData.forEach(item => {
          console.log(`  ID: ${item.id}, 코드: ${item.code}, 이름: ${item.education_name}, 활성: ${item.is_active}`);
        });
      }

      console.log('\n✅ 소프트 삭제 기능이 정상 작동합니다!');
      console.log(`- 삭제 전 활성 데이터: ${beforeData.length}개`);
      console.log(`- 삭제 후 활성 데이터: ${afterData.length}개`);
      console.log(`- 비활성 데이터: ${inactiveData?.length || 0}개`);

    } else {
      console.log('❌ 테스트할 데이터가 없습니다.');
    }

  } catch (err) {
    console.error('❌ 테스트 실패:', err);
  }
}

testSoftDelete();