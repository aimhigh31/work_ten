const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('🧪 개인교육관리 데이터 삽입 테스트\n');

  // 1. 최대 no 값 조회
  console.log('1️⃣ 최대 no 값 조회...');
  const { data: maxNoData, error: maxNoError } = await supabase
    .from('main_education_data')
    .select('no')
    .order('no', { ascending: false })
    .limit(1);

  if (maxNoError) {
    console.log('❌ 최대 no 조회 실패:', maxNoError);
    return;
  }

  const nextNo = maxNoData && maxNoData.length > 0 ? maxNoData[0].no + 1 : 1;
  console.log('✅ 다음 no 값:', nextNo);

  // 2. 테스트 데이터 준비
  const year = new Date().getFullYear().toString().slice(-2);
  const code = `MAIN-EDU-${year}-${String(nextNo).padStart(3, '0')}`;

  const testData = {
    code: code,
    no: nextNo,
    registration_date: '2025-10-14',
    start_date: '2025-10-14',
    education_category: '개발',
    company_name: '테스트회사',
    education_type: '온라인교육',
    channel: '전화',
    title: '테스트 개인교육',
    description: '테스트 설명',
    team: '개발팀',
    assignee_name: '홍길동',
    status: '진행',
    priority: '보통',
    response_content: null,
    completion_date: null,
    satisfaction_score: null,
    attachments: [],
    created_by: 'system',
    updated_by: 'system',
    is_active: true
  };

  console.log('\n2️⃣ 삽입할 데이터:');
  console.log(JSON.stringify(testData, null, 2));

  // 3. 삽입 시도
  console.log('\n3️⃣ 데이터 삽입 시도...');
  const { data, error } = await supabase
    .from('main_education_data')
    .insert([testData])
    .select()
    .single();

  if (error) {
    console.log('\n❌ 삽입 실패!');
    console.log('에러 코드:', error.code);
    console.log('에러 메시지:', error.message);
    console.log('에러 상세:', error.details);
    console.log('에러 힌트:', error.hint);
    console.log('\n전체 에러 객체:');
    console.log(JSON.stringify(error, null, 2));
  } else {
    console.log('\n✅ 삽입 성공!');
    console.log('생성된 데이터:');
    console.log(JSON.stringify(data, null, 2));
  }
}

testInsert();
