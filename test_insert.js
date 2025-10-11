const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// 환경변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔗 Supabase 환경 변수 확인:', {
  url: supabaseUrl ? '✅ 설정됨' : '❌ 없음',
  serviceKey: supabaseServiceKey ? '✅ 설정됨' : '❌ 없음',
  urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'undefined'
});

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInsert() {
  try {
    console.log('🧪 간단한 INSERT 테스트 시작...');

    // 1. 먼저 현재 데이터 조회
    console.log('\n1️⃣ 기존 데이터 조회 테스트');
    const { data: existingData, error: selectError } = await supabase
      .from('it_solution_data')
      .select('*')
      .limit(3);

    if (selectError) {
      console.error('❌ SELECT 오류:', selectError);
      return;
    }

    console.log('✅ SELECT 성공:', existingData?.length || 0, '개');
    if (existingData && existingData.length > 0) {
      console.log('📋 첫 번째 레코드:', JSON.stringify(existingData[0], null, 2));
    }

    // 2. 최대 번호 조회
    console.log('\n2️⃣ 최대 번호 조회 테스트');
    const { data: maxData, error: maxError } = await supabase
      .from('it_solution_data')
      .select('no')
      .eq('is_active', true)
      .order('no', { ascending: false })
      .limit(1);

    if (maxError) {
      console.error('❌ MAX 조회 오류:', maxError);
      return;
    }

    const maxNo = maxData && maxData.length > 0 ? maxData[0].no : 0;
    const nextNo = maxNo + 1;
    console.log('✅ 최대 번호:', maxNo, '→ 다음 번호:', nextNo);

    // 3. 간단한 INSERT 테스트
    console.log('\n3️⃣ INSERT 테스트');
    const testData = {
      no: nextNo,
      registration_date: new Date().toISOString().split('T')[0],
      start_date: new Date().toISOString().split('T')[0],
      code: `TEST-${Date.now()}`,
      solution_type: '웹개발',
      development_type: '신규개발',
      title: '테스트 솔루션',
      detail_content: '테스트용 솔루션입니다',
      team: '개발팀',
      assignee: '테스트담당자',
      status: '대기',
      completed_date: null,
      attachments: [],
      created_by: 'test',
      updated_by: 'test',
      is_active: true
    };

    console.log('📤 INSERT 데이터:', JSON.stringify(testData, null, 2));

    const { data: insertData, error: insertError } = await supabase
      .from('it_solution_data')
      .insert([testData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ INSERT 오류 상세:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
        fullError: insertError
      });
      return;
    }

    console.log('✅ INSERT 성공!');
    console.log('📋 생성된 데이터:', JSON.stringify(insertData, null, 2));

    // 4. 생성된 데이터 삭제 (테스트 정리)
    console.log('\n4️⃣ 테스트 데이터 정리');
    const { error: deleteError } = await supabase
      .from('it_solution_data')
      .update({ is_active: false })
      .eq('id', insertData.id);

    if (deleteError) {
      console.error('❌ 삭제 오류:', deleteError);
    } else {
      console.log('✅ 테스트 데이터 정리 완료');
    }

    console.log('\n🎉 모든 테스트 성공!');

  } catch (error) {
    console.error('❌ 테스트 실패:', {
      error,
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

testInsert();