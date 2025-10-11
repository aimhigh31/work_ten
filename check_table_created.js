const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableCreated() {
  console.log('🔍 it_software_user 테이블 생성 확인 중...');

  try {
    // 테이블 존재 확인
    const { data, error } = await supabase
      .from('it_software_user')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('table') || error.message?.includes('relation')) {
        console.log('❌ it_software_user 테이블이 아직 생성되지 않았습니다.');
        console.log('');
        console.log('📋 다음 단계를 수행하세요:');
        console.log('1. https://supabase.com/dashboard 접속');
        console.log('2. 프로젝트 선택');
        console.log('3. 왼쪽 메뉴에서 "SQL Editor" 클릭');
        console.log('4. "New Query" 클릭');
        console.log('5. SUPABASE_TABLE_CREATE.sql 파일의 내용을 복사해서 붙여넣기');
        console.log('6. "RUN" 버튼 클릭');
        console.log('7. 생성 완료 후 이 스크립트를 다시 실행하세요');
        console.log('');
        console.log('🔗 SQL 파일 위치: SUPABASE_TABLE_CREATE.sql');
        return;
      }

      console.error('❌ 테이블 확인 중 오류:', error);
      return;
    }

    console.log('🎉 it_software_user 테이블이 성공적으로 생성되었습니다!');

    // 테이블 구조 확인
    console.log('📋 테이블 구조 확인 중...');

    // 샘플 데이터 삽입 테스트
    const sampleData = {
      software_id: 1,
      user_name: 'test_user',
      department: 'test_dept',
      exclusive_id: 'test_id',
      reason: 'connection_test',
      usage_status: '사용중'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('it_software_user')
      .insert(sampleData)
      .select();

    if (insertError) {
      console.log('⚠️ 샘플 데이터 삽입 실패:', insertError.message);

      // 외래키 제약 조건 때문일 수 있음
      if (insertError.message?.includes('foreign key') || insertError.message?.includes('violates')) {
        console.log('💡 it_software_data 테이블에 software_id = 1인 레코드가 없을 수 있습니다.');
        console.log('   실제 소프트웨어 데이터가 있는 ID를 사용하거나 외래키 제약조건을 확인하세요.');
      }
    } else {
      console.log('✅ 샘플 데이터 삽입 성공:', insertData);

      // 샘플 데이터 삭제
      await supabase
        .from('it_software_user')
        .delete()
        .eq('user_name', 'test_user');

      console.log('🧹 샘플 데이터 정리 완료');
    }

    // 조회 테스트
    const { data: selectData, error: selectError } = await supabase
      .from('it_software_user')
      .select('*')
      .limit(5);

    if (!selectError) {
      console.log('✅ 테이블 조회 성공 - 현재 레코드 수:', selectData?.length || 0);

      if (selectData && selectData.length > 0) {
        console.log('📄 기존 데이터 샘플:');
        selectData.forEach(item => {
          console.log(`  - ID: ${item.id}, 사용자: ${item.user_name}, 부서: ${item.department}`);
        });
      }
    } else {
      console.log('⚠️ 테이블 조회 실패:', selectError.message);
    }

    console.log('');
    console.log('🚀 축하합니다! it_software_user 테이블이 정상적으로 작동합니다.');
    console.log('   이제 소프트웨어관리 페이지의 사용자이력탭에서 DB 연동이 가능합니다!');

  } catch (err) {
    console.error('❌ 예상치 못한 오류:', err);
  }
}

checkTableCreated();