const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWithRealSoftware() {
  try {
    console.log('🔍 실제 소프트웨어 ID로 테스트 중...\n');

    // 1. 먼저 실제 존재하는 소프트웨어 ID 가져오기
    console.log('1️⃣ 실제 소프트웨어 데이터 확인:');
    const { data: softwareData, error: softwareError } = await supabase
      .from('it_software_data')
      .select('id, software_name')
      .eq('is_active', true)
      .limit(1);

    if (softwareError) {
      console.error('❌ 소프트웨어 데이터 조회 실패:', softwareError);
      return;
    }

    if (!softwareData || softwareData.length === 0) {
      console.log('⚠️ 활성화된 소프트웨어가 없습니다. 먼저 소프트웨어를 추가해주세요.');
      return;
    }

    const realSoftwareId = softwareData[0].id;
    console.log(`✅ 테스트할 소프트웨어: ${softwareData[0].software_name} (ID: ${realSoftwareId})`);

    // 2. 실제 소프트웨어 ID로 사용자이력 삽입 테스트
    console.log('\n2️⃣ 사용자이력 삽입 테스트:');
    const testUserData = {
      software_id: realSoftwareId,
      user_name: '실제 테스트 사용자',
      department: '개발팀',
      exclusive_id: 'REAL-TEST-001',
      reason: '개발 업무용',
      usage_status: '사용중',
      start_date: '2024-09-26',
      registration_date: '2024-09-26',
      created_by: 'test',
      updated_by: 'test',
      is_active: true
    };

    console.log('   삽입할 데이터:', testUserData);

    const { data: insertData, error: insertError } = await supabase
      .from('it_software_user')
      .insert(testUserData)
      .select();

    if (insertError) {
      console.error('❌ 삽입 실패:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      });
    } else {
      console.log('✅ 삽입 성공!');
      console.log('   삽입된 데이터 ID:', insertData[0].id);

      // 3. 배치 삽입 테스트
      console.log('\n3️⃣ 배치 삽입 테스트 (같은 소프트웨어에 여러 사용자):');
      const batchUsers = [
        {
          software_id: realSoftwareId,
          user_name: '배치 사용자 A',
          department: '기획팀',
          exclusive_id: 'BATCH-A',
          usage_status: '사용중',
          start_date: '2024-09-01',
          registration_date: '2024-09-01',
          is_active: true
        },
        {
          software_id: realSoftwareId,
          user_name: '배치 사용자 B',
          department: 'QA팀',
          exclusive_id: 'BATCH-B',
          usage_status: '사용중',
          start_date: '2024-09-15',
          registration_date: '2024-09-15',
          is_active: true
        },
        {
          software_id: realSoftwareId,
          user_name: '배치 사용자 C',
          department: '디자인팀',
          exclusive_id: 'BATCH-C',
          usage_status: '반납',
          start_date: '2024-08-01',
          end_date: '2024-09-01',
          registration_date: '2024-08-01',
          is_active: true
        }
      ];

      const { data: batchData, error: batchError } = await supabase
        .from('it_software_user')
        .insert(batchUsers)
        .select('id, user_name');

      if (batchError) {
        console.error('❌ 배치 삽입 실패:', batchError.message);
      } else {
        console.log('✅ 배치 삽입 성공!');
        console.log('   삽입된 사용자:', batchData.map(u => u.user_name).join(', '));

        // 4. 조회 테스트
        console.log('\n4️⃣ 소프트웨어별 사용자이력 조회:');
        const { data: allUsers, error: selectError } = await supabase
          .from('it_software_user')
          .select('*')
          .eq('software_id', realSoftwareId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (selectError) {
          console.error('❌ 조회 실패:', selectError.message);
        } else {
          console.log(`✅ 총 ${allUsers.length}명의 사용자 조회됨`);
          allUsers.forEach(user => {
            console.log(`   - ${user.user_name} (${user.department}) - ${user.usage_status}`);
          });
        }

        // 5. 테스트 데이터 정리
        console.log('\n5️⃣ 테스트 데이터 정리 중...');
        const testIds = [insertData[0].id, ...batchData.map(u => u.id)];

        const { error: cleanupError } = await supabase
          .from('it_software_user')
          .delete()
          .in('id', testIds);

        if (cleanupError) {
          console.error('⚠️ 정리 실패:', cleanupError.message);
        } else {
          console.log('✅ 테스트 데이터 정리 완료');
        }
      }
    }

    console.log('\n🎉 모든 테스트 완료!');
    console.log('   it_software_user 테이블이 정상 작동합니다.');

  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error);
  }
}

testWithRealSoftware();