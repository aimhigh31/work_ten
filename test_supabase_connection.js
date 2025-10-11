const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// 환경변수 확인
console.log('🔗 환경변수 상태:');
console.log('  SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 설정됨' : '❌ 없음');
console.log('  ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 없음');
console.log('  SERVICE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? '✅ 설정됨' : '❌ 없음');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 필수 환경변수가 누락되었습니다!');
  process.exit(1);
}

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  console.log('\n🚀 Supabase 연결 테스트 시작...');

  try {
    // 1. 기본 연결 테스트 - 간단한 쿼리
    console.log('\n1️⃣ 기본 연결 테스트...');
    const { data: testData, error: testError } = await supabase
      .from('it_solution_data')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ 기본 연결 실패:', testError);
    } else {
      console.log('✅ 기본 연결 성공! 데이터:', testData?.length || 0, '개');
    }

    // 1-2. 다양한 COUNT 쿼리 패턴 테스트
    console.log('\n1️⃣-2 다양한 COUNT 패턴 테스트...');

    // 패턴 1: count 옵션 없이
    const { count: count1, error: countError1 } = await supabase
      .from('it_solution_data')
      .select('*', { count: 'exact', head: true });

    if (countError1) {
      console.error('❌ COUNT 패턴 1 실패:', countError1);
    } else {
      console.log('✅ COUNT 패턴 1 성공! 총 개수:', count1);
    }

    // 패턴 2: 단순 select count
    const { data: count2Data, error: countError2 } = await supabase
      .from('it_solution_data')
      .select('id', { count: 'exact', head: true });

    if (countError2) {
      console.error('❌ COUNT 패턴 2 실패:', countError2);
    } else {
      console.log('✅ COUNT 패턴 2 성공!');
    }

    // 패턴 3: 직접적인 count 쿼리
    const { count: count3, error: countError3 } = await supabase
      .from('it_solution_data')
      .select('*', { count: 'exact' })
      .limit(0);

    if (countError3) {
      console.error('❌ COUNT 패턴 3 실패:', countError3);
      console.error('  - 상세 오류:', JSON.stringify(countError3, null, 2));
    } else {
      console.log('✅ COUNT 패턴 3 성공! 총 개수:', count3);
    }

    // 2. 테이블 존재 확인
    console.log('\n2️⃣ 테이블 구조 확인...');
    const { data: tableData, error: tableError } = await supabase
      .from('it_solution_data')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ 테이블 조회 실패:', tableError);
    } else {
      console.log('✅ 테이블 조회 성공!');
      console.log('  - 조회된 행 수:', tableData?.length || 0);
      if (tableData && tableData.length > 0) {
        console.log('  - 컬럼들:', Object.keys(tableData[0]));
      }
    }

    // 3. 간단한 INSERT 테스트
    console.log('\n3️⃣ INSERT 테스트...');
    const testInsertData = {
      no: 999,
      registration_date: new Date().toISOString().split('T')[0],
      code: 'TEST-CONNECTION-001',
      solution_type: '웹개발',
      development_type: '신규개발',
      title: '연결 테스트',
      detail_content: 'Supabase 연결 테스트용 데이터',
      team: '개발팀',
      assignee: '테스트',
      status: '대기',
      created_by: 'test',
      updated_by: 'test',
      is_active: true
    };

    const { data: insertData, error: insertError } = await supabase
      .from('it_solution_data')
      .insert([testInsertData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ INSERT 테스트 실패:', insertError);
      console.error('  - 오류 상세:', JSON.stringify(insertError, null, 2));
    } else {
      console.log('✅ INSERT 테스트 성공!');
      console.log('  - 생성된 데이터 ID:', insertData?.id);

      // 4. 생성된 테스트 데이터 삭제
      console.log('\n4️⃣ 테스트 데이터 정리...');
      const { error: deleteError } = await supabase
        .from('it_solution_data')
        .delete()
        .eq('id', insertData.id);

      if (deleteError) {
        console.error('❌ 테스트 데이터 삭제 실패:', deleteError);
      } else {
        console.log('✅ 테스트 데이터 정리 완료!');
      }
    }

  } catch (error) {
    console.error('❌ 연결 테스트 중 예외 발생:', error);
  }
}

// 테스트 실행
testConnection().then(() => {
  console.log('\n🎉 Supabase 연결 테스트 완료!');
}).catch((error) => {
  console.error('\n💥 테스트 실행 실패:', error);
});