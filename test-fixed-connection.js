// 수정된 연결 테스트
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exxumujwufzqnovhzvif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NTYwMDksImV4cCI6MjA3MzIzMjAwOX0.zTU0q24c72ewx8DKHqD5lUB1VuuuwBY0jLzWel9DIME';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFixedConnection() {
  console.log('🔄 수정된 연결 테스트...');
  
  try {
    // 1단계: 소문자 테이블명으로 테스트
    console.log('1단계: admin_systemsetting_menu 테이블 접근...');
    const { data: tableData, error: tableError } = await supabase
      .from('admin_systemsetting_menu')
      .select('id')
      .limit(1);

    if (tableError) {
      console.log('=== 테이블 오류 상세 분석 ===');
      console.log('오류 객체:', tableError);
      console.log('오류 타입:', typeof tableError);
      console.log('오류 키들:', Object.keys(tableError));
      
      // 모든 속성 출력
      for (const [key, value] of Object.entries(tableError)) {
        console.log(`${key}:`, value);
      }
      
      return false;
    }

    console.log('✅ 테이블 접근 성공:', tableData);

    // 2단계: 전체 데이터 조회
    console.log('\n2단계: 전체 메뉴 데이터 조회...');
    const { data: allData, error: allError } = await supabase
      .from('admin_systemsetting_menu')
      .select('*')
      .order('display_order', { ascending: true });

    if (allError) {
      console.log('전체 데이터 조회 오류:', allError);
      return false;
    }

    console.log(`✅ 전체 데이터 조회 성공: ${allData.length}개`);
    allData.forEach((item, index) => {
      console.log(`   ${index + 1}. [${item.id}] ${item.menu_page} (${item.menu_category})`);
    });

    // 3단계: 필터링 테스트
    console.log('\n3단계: 필터링 테스트...');
    const { data: filteredData, error: filterError } = await supabase
      .from('admin_systemsetting_menu')
      .select('*')
      .eq('is_enabled', true)
      .eq('menu_level', 1);

    if (filterError) {
      console.log('필터링 오류:', filterError);
      return false;
    }

    console.log(`✅ 필터링 성공: ${filteredData.length}개 (활성화된 레벨1 메뉴)`);

    return true;
  } catch (error) {
    console.log('=== 전체 테스트 예외 발생 ===');
    console.log('예외:', error);
    console.log('예외 타입:', typeof error);
    if (error && typeof error === 'object') {
      console.log('예외 속성들:');
      for (const [key, value] of Object.entries(error)) {
        console.log(`  ${key}:`, value);
      }
    }
    return false;
  }
}

testFixedConnection().then((success) => {
  if (success) {
    console.log('\n🎉 수정된 연결 테스트 성공!');
    console.log('✅ 이제 프론트엔드에서 정상적으로 작동할 것입니다.');
  } else {
    console.log('\n❌ 수정된 연결 테스트 실패');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('테스트 실패:', error);
  process.exit(1);
});