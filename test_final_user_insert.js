const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinalInsert() {
  try {
    console.log('🔍 최종 사용자이력 삽입 테스트...\n');

    // 1. 유효한 software_id 가져오기
    const { data: validSoftware } = await supabase
      .from('it_software_data')
      .select('id, software_name')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!validSoftware) {
      console.log('❌ 활성 소프트웨어가 없습니다.');
      return;
    }

    console.log(`✅ 테스트할 소프트웨어: ${validSoftware.software_name} (ID: ${validSoftware.id})\n`);

    // 2. 앱에서 실제로 보내는 것과 동일한 형식의 데이터
    const testUsers = [
      {
        software_id: validSoftware.id,
        user_name: '테스트사용자1',
        department: '개발팀',
        exclusive_id: 'TEST-001',
        reason: '개발 업무용',
        usage_status: '사용중',
        start_date: '2024-09-01',
        end_date: null,
        registration_date: '2024-09-01',
        created_by: 'user',
        updated_by: 'user',
        is_active: true
      },
      {
        software_id: validSoftware.id,
        user_name: '테스트사용자2',
        department: 'QA팀',
        exclusive_id: 'TEST-002',
        reason: '테스트용',
        usage_status: '사용중',
        start_date: '2024-09-15',
        end_date: null,
        registration_date: '2024-09-15',
        created_by: 'user',
        updated_by: 'user',
        is_active: true
      }
    ];

    console.log('📝 삽입할 데이터:');
    console.log(JSON.stringify(testUsers, null, 2));

    // 3. 데이터 삽입
    console.log('\n💾 데이터 삽입 중...');
    const { data: insertedData, error: insertError } = await supabase
      .from('it_software_user')
      .insert(testUsers)
      .select('id, user_name');

    if (insertError) {
      console.error('❌ 삽입 실패!');
      console.error('에러 메시지:', insertError.message);
      console.error('에러 코드:', insertError.code);
      console.error('에러 상세:', insertError.details);
      console.error('에러 힌트:', insertError.hint);
      return;
    }

    console.log('✅ 삽입 성공!');
    console.log('삽입된 데이터:', insertedData);

    // 4. 삽입된 데이터 확인
    console.log('\n📊 삽입된 데이터 확인:');
    const { data: checkData } = await supabase
      .from('it_software_user')
      .select('*')
      .eq('software_id', validSoftware.id)
      .in('id', insertedData.map(d => d.id));

    checkData.forEach(user => {
      console.log(`  - ${user.user_name} (${user.department}): ${user.usage_status}`);
    });

    // 5. 테스트 데이터 정리
    console.log('\n🧹 테스트 데이터 정리 중...');
    const { error: deleteError } = await supabase
      .from('it_software_user')
      .delete()
      .in('id', insertedData.map(d => d.id));

    if (deleteError) {
      console.error('⚠️ 정리 실패:', deleteError.message);
    } else {
      console.log('✅ 정리 완료');
    }

    console.log('\n🎉 모든 테스트 성공! 이제 앱에서도 정상 작동할 것입니다.');

  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error);
  }
}

testFinalInsert();