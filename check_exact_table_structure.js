const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExactStructure() {
  try {
    console.log('🔍 it_software_user 테이블의 정확한 구조 확인 중...\n');

    // 1. 테이블에서 데이터 하나 가져와서 구조 확인
    const { data: sampleData, error: sampleError } = await supabase
      .from('it_software_user')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ 테이블 조회 실패:', sampleError);
      return;
    }

    if (sampleData && sampleData.length > 0) {
      console.log('📊 실제 테이블 컬럼 (샘플 데이터 기반):');
      console.log('=====================================');
      const columns = Object.keys(sampleData[0]);
      columns.forEach(col => {
        const value = sampleData[0][col];
        const type = value === null ? 'null' : typeof value;
        console.log(`  ${col.padEnd(20)} : ${type.padEnd(10)} (예시: ${JSON.stringify(value)})`);
      });
      console.log('=====================================');
    } else {
      console.log('⚠️ 테이블이 비어있습니다. 빈 select로 스키마 확인...');
    }

    // 2. 필수/선택 필드 테스트를 위한 최소 데이터 삽입 시도
    console.log('\n📝 최소 필수 필드 테스트:');

    // 먼저 유효한 software_id 가져오기
    const { data: validSoftware } = await supabase
      .from('it_software_data')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!validSoftware) {
      console.log('⚠️ 활성 소프트웨어가 없어서 테스트 불가');
      return;
    }

    const minimalData = {
      software_id: validSoftware.id,
      user_name: '최소필드테스트',
      department: '테스트부서',
      usage_status: '사용중',
      is_active: true
    };

    console.log('최소 데이터:', minimalData);

    const { data: minimalInsert, error: minimalError } = await supabase
      .from('it_software_user')
      .insert([minimalData])
      .select();

    if (minimalError) {
      console.error('❌ 최소 데이터 삽입 실패:', minimalError.message);
      console.log('   필요한 추가 필드:', minimalError.details || minimalError.hint || '');
    } else {
      console.log('✅ 최소 데이터 삽입 성공!');
      console.log('   삽입된 데이터 구조:');
      const insertedColumns = Object.keys(minimalInsert[0]);
      insertedColumns.forEach(col => {
        console.log(`     - ${col}: ${JSON.stringify(minimalInsert[0][col])}`);
      });

      // 테스트 데이터 삭제
      await supabase
        .from('it_software_user')
        .delete()
        .eq('id', minimalInsert[0].id);
      console.log('   테스트 데이터 정리 완료');
    }

    // 3. 전체 필드 목록 확인
    console.log('\n📋 지원되는 전체 필드 테스트:');
    const fullData = {
      software_id: validSoftware.id,
      user_name: '전체필드테스트',
      department: '개발팀',
      exclusive_id: 'FULL-TEST',
      reason: '테스트 사유',
      usage_status: '사용중',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      registration_date: '2024-01-01',
      created_by: 'test-script',
      updated_by: 'test-script',
      is_active: true,
      // 아래는 테스트 필드들
      user_id: null,
      user_code: null,
      position: null,
      email: null,
      phone: null,
      notes: null
    };

    const { data: fullInsert, error: fullError } = await supabase
      .from('it_software_user')
      .insert([fullData])
      .select();

    if (fullError) {
      console.log('⚠️ 일부 필드가 존재하지 않을 수 있음:', fullError.message);

      // 에러 메시지에서 존재하지 않는 컬럼 찾기
      if (fullError.message.includes('column')) {
        console.log('   존재하지 않는 컬럼이 있습니다.');
      }
    } else {
      console.log('✅ 전체 필드 삽입 성공!');
      // 정리
      await supabase
        .from('it_software_user')
        .delete()
        .eq('id', fullInsert[0].id);
    }

    console.log('\n✅ 구조 확인 완료!');

  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error);
  }
}

checkExactStructure();