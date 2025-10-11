const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTableAndConstraints() {
  try {
    console.log('🔍 테이블 및 제약 조건 확인 중...\n');

    // 1. 테이블 존재 확인
    console.log('1️⃣ it_software_user 테이블 확인:');
    const { data: tableCheck, error: tableError } = await supabase
      .from('it_software_user')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ 테이블 접근 실패:', tableError);
      return;
    }
    console.log('✅ 테이블 접근 가능');

    // 2. it_software_data 테이블의 실제 데이터 확인
    console.log('\n2️⃣ it_software_data 테이블 데이터 확인:');
    const { data: softwareData, error: softwareError } = await supabase
      .from('it_software_data')
      .select('id, software_name, is_active')
      .eq('is_active', true)
      .order('id', { ascending: true });

    if (softwareError) {
      console.error('❌ 소프트웨어 데이터 조회 실패:', softwareError);
    } else {
      console.log(`✅ 활성 소프트웨어 ${softwareData.length}개 발견:`);
      softwareData.forEach(sw => {
        console.log(`   ID: ${sw.id} - ${sw.software_name}`);
      });
    }

    // 3. 현재 사용자이력 데이터 확인
    console.log('\n3️⃣ 현재 사용자이력 데이터 확인:');
    const { data: userData, count } = await supabase
      .from('it_software_user')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .limit(5);

    console.log(`✅ 활성 사용자이력: ${count || 0}개`);
    if (userData && userData.length > 0) {
      console.log('샘플 데이터:');
      userData.forEach(user => {
        console.log(`   Software ID: ${user.software_id}, User: ${user.user_name}, Dept: ${user.department}`);
      });
    }

    // 4. 외래 키 테스트 - 존재하는 software_id로 삽입 시도
    console.log('\n4️⃣ 외래 키 제약 테스트:');
    if (softwareData && softwareData.length > 0) {
      const testSoftwareId = softwareData[0].id;
      console.log(`   테스트할 Software ID: ${testSoftwareId}`);

      const testUser = {
        software_id: testSoftwareId,
        user_name: '테스트_' + new Date().getTime(),
        department: '테스트부서',
        usage_status: '사용중',
        registration_date: new Date().toISOString().split('T')[0],
        is_active: true
      };

      console.log('   삽입 테스트 데이터:', testUser);

      const { data: insertData, error: insertError } = await supabase
        .from('it_software_user')
        .insert([testUser])
        .select();

      if (insertError) {
        console.error('❌ 삽입 실패:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details
        });
      } else {
        console.log('✅ 삽입 성공! ID:', insertData[0].id);

        // 테스트 데이터 삭제
        const { error: deleteError } = await supabase
          .from('it_software_user')
          .delete()
          .eq('id', insertData[0].id);

        if (!deleteError) {
          console.log('   테스트 데이터 정리 완료');
        }
      }
    }

    // 5. 필수 필드 테스트
    console.log('\n5️⃣ 필수 필드 테스트:');
    const invalidUser = {
      software_id: 1,
      // user_name 누락 (필수 필드)
      department: '테스트부서',
      is_active: true
    };

    const { error: requiredError } = await supabase
      .from('it_software_user')
      .insert([invalidUser]);

    if (requiredError) {
      console.log('✅ 예상된 에러 - 필수 필드 누락:', requiredError.message);
    } else {
      console.log('⚠️ 필수 필드 검증 실패 - user_name 없이도 삽입됨');
    }

    // 6. notes 필드 확인 (빈 문자열 vs null)
    console.log('\n6️⃣ notes 필드 처리 테스트:');
    if (softwareData && softwareData.length > 0) {
      const testData = {
        software_id: softwareData[0].id,
        user_name: 'Notes테스트',
        department: '테스트',
        notes: '',  // 빈 문자열
        usage_status: '사용중',
        registration_date: new Date().toISOString().split('T')[0],
        is_active: true
      };

      const { data: notesTest, error: notesError } = await supabase
        .from('it_software_user')
        .insert([testData])
        .select();

      if (notesError) {
        console.error('❌ notes 필드 테스트 실패:', notesError.message);
      } else {
        console.log('✅ notes 빈 문자열 허용됨');
        // 정리
        await supabase.from('it_software_user').delete().eq('id', notesTest[0].id);
      }
    }

    console.log('\n✅ 모든 검증 완료!');

  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error);
  }
}

verifyTableAndConstraints();