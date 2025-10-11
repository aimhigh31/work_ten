const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTable() {
  try {
    console.log('🔍 it_software_user 테이블 테스트 중...\n');

    // 1. 테이블 조회 테스트
    console.log('1️⃣ 테이블 조회 테스트:');
    const { data: selectData, error: selectError } = await supabase
      .from('it_software_user')
      .select('*')
      .limit(5);

    if (selectError) {
      console.error('❌ 조회 실패:', selectError);
    } else {
      console.log('✅ 조회 성공');
      console.log('   현재 데이터:', selectData?.length || 0, '개');
      if (selectData && selectData.length > 0) {
        console.log('   샘플:', selectData[0]);
      }
    }

    // 2. 데이터 삽입 테스트
    console.log('\n2️⃣ 데이터 삽입 테스트:');
    const testData = {
      software_id: 999,
      user_name: '테스트 사용자',
      department: '테스트 부서',
      exclusive_id: 'TEST999',
      reason: '테스트 목적',
      usage_status: '사용중',
      start_date: '2024-09-26',
      registration_date: '2024-09-26',
      created_by: 'test',
      updated_by: 'test',
      is_active: true
    };

    console.log('   삽입할 데이터:', testData);

    const { data: insertData, error: insertError } = await supabase
      .from('it_software_user')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ 삽입 실패:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      });
    } else {
      console.log('✅ 삽입 성공');
      console.log('   삽입된 데이터:', insertData);

      // 3. 삽입한 데이터 삭제 (정리)
      if (insertData && insertData[0]) {
        console.log('\n3️⃣ 테스트 데이터 정리:');
        const { error: deleteError } = await supabase
          .from('it_software_user')
          .delete()
          .eq('id', insertData[0].id);

        if (deleteError) {
          console.error('❌ 삭제 실패:', deleteError.message);
        } else {
          console.log('✅ 테스트 데이터 삭제 완료');
        }
      }
    }

    // 4. 배치 삽입 테스트
    console.log('\n4️⃣ 배치 삽입 테스트:');
    const batchData = [
      {
        software_id: 1000,
        user_name: '배치 사용자1',
        department: '개발팀',
        exclusive_id: 'BATCH001',
        usage_status: '사용중',
        start_date: '2024-09-26',
        registration_date: '2024-09-26',
        is_active: true
      },
      {
        software_id: 1000,
        user_name: '배치 사용자2',
        department: 'QA팀',
        exclusive_id: 'BATCH002',
        usage_status: '사용중',
        start_date: '2024-09-26',
        registration_date: '2024-09-26',
        is_active: true
      }
    ];

    const { data: batchInsert, error: batchError } = await supabase
      .from('it_software_user')
      .insert(batchData)
      .select('id, user_name');

    if (batchError) {
      console.error('❌ 배치 삽입 실패:', {
        message: batchError.message,
        code: batchError.code,
        details: batchError.details
      });
    } else {
      console.log('✅ 배치 삽입 성공');
      console.log('   삽입된 데이터 수:', batchInsert?.length);

      // 정리
      if (batchInsert && batchInsert.length > 0) {
        const ids = batchInsert.map(item => item.id);
        await supabase
          .from('it_software_user')
          .delete()
          .in('id', ids);
        console.log('   테스트 데이터 정리 완료');
      }
    }

    console.log('\n✅ 모든 테스트 완료!');

  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error);
  }
}

testTable();