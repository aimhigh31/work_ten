const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔗 Supabase 연결 정보:');
console.log('URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ 없음');
console.log('Service Key:', supabaseServiceKey ? '✅ 설정됨' : '❌ 없음');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkSolutionTableViaSupabase() {
  try {
    console.log('\n🔍 it_solution_data 테이블 현재 상태 확인 중...\n');

    // 1. 전체 데이터 수 확인
    console.log('1. 전체 데이터 수 확인:');
    const { data: allData, error: allError } = await supabase
      .from('it_solution_data')
      .select('*', { count: 'exact' })
      .limit(0);

    if (allError) {
      console.error('❌ 전체 데이터 조회 오류:', allError);
      return;
    }

    console.log(`전체 레코드 수: ${allData?.length || 0}개`);

    // 2. 활성 데이터 수 확인
    console.log('\n2. 활성 데이터 수 확인:');
    const { data: activeData, error: activeError, count: activeCount } = await supabase
      .from('it_solution_data')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .limit(0);

    if (activeError) {
      console.error('❌ 활성 데이터 조회 오류:', activeError);
      return;
    }

    console.log(`활성 레코드 수: ${activeCount || 0}개`);

    // 3. 최근 5개 데이터 확인
    console.log('\n3. 최근 생성된 활성 데이터 (최대 5개):');
    const { data: recentData, error: recentError } = await supabase
      .from('it_solution_data')
      .select('no, title, code, solution_type, development_type, assignee, status, created_at, updated_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('❌ 최근 데이터 조회 오류:', recentError);
      return;
    }

    if (recentData && recentData.length > 0) {
      console.table(recentData);
    } else {
      console.log('⚠️ 활성 상태의 데이터가 없습니다.');
    }

    // 4. 최대 no 값 확인
    console.log('\n4. 최대 no 값 확인:');
    const { data: maxNoData, error: maxNoError } = await supabase
      .from('it_solution_data')
      .select('no')
      .eq('is_active', true)
      .order('no', { ascending: false })
      .limit(1);

    if (maxNoError) {
      console.error('❌ 최대 no 조회 오류:', maxNoError);
      return;
    }

    const maxNo = maxNoData && maxNoData.length > 0 ? maxNoData[0].no : 0;
    console.log(`현재 최대 no 값: ${maxNo}, 다음 생성될 no: ${maxNo + 1}`);

    // 5. 오늘 생성된 데이터 확인
    console.log('\n5. 오늘 생성된 데이터 확인:');
    const today = new Date().toISOString().split('T')[0];
    const { data: todayData, error: todayError, count: todayCount } = await supabase
      .from('it_solution_data')
      .select('*', { count: 'exact' })
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)
      .limit(0);

    if (todayError) {
      console.error('❌ 오늘 데이터 조회 오류:', todayError);
      return;
    }

    console.log(`오늘 생성된 레코드 수: ${todayCount || 0}개`);

    // 6. 테이블 존재 여부 확인을 위한 샘플 데이터 조회
    console.log('\n6. 테이블 샘플 데이터 확인:');
    const { data: sampleData, error: sampleError } = await supabase
      .from('it_solution_data')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ 샘플 데이터 조회 오류 - 테이블이 존재하지 않을 수 있습니다:', sampleError);
      return;
    }

    if (sampleData && sampleData.length > 0) {
      console.log('✅ 테이블이 존재하고 데이터 구조가 정상입니다.');
      console.log('샘플 데이터 구조:', Object.keys(sampleData[0]));
    } else {
      console.log('⚠️ 테이블은 존재하지만 데이터가 없습니다.');
    }

    console.log('\n✅ it_solution_data 테이블 상태 확인 완료!');

  } catch (error) {
    console.error('❌ 테이블 상태 확인 중 오류 발생:', error);
  }
}

checkSolutionTableViaSupabase();