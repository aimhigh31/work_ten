require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAllStatus() {
  console.log('=== 업무관리 (main_task_data) 모든 상태값 확인 ===');
  const { data: tasks, error: taskError } = await supabase
    .from('main_task_data')
    .select('status');

  if (taskError) {
    console.error('업무관리 조회 에러:', taskError);
  } else {
    const uniqueStatuses = [...new Set(tasks.map(t => t.status))];
    console.log('고유 상태값:', uniqueStatuses);
    console.log('각 상태별 개수:');
    uniqueStatuses.forEach(status => {
      const count = tasks.filter(t => t.status === status).length;
      console.log(`  ${status}: ${count}건`);
    });
  }

  // 보안규정관리 - 테이블명을 찾아보자
  console.log('\n=== 보안 관련 테이블 확인 ===');

  // security_regulation_data 시도
  const { data: secReg1, error: secRegError1 } = await supabase
    .from('security_regulation_data')
    .select('status')
    .limit(1);

  if (!secRegError1) {
    console.log('✓ security_regulation_data 테이블 발견!');
    const { data: allSecReg } = await supabase
      .from('security_regulation_data')
      .select('status');
    const uniqueSecStatuses = [...new Set(allSecReg.map(t => t.status))];
    console.log('고유 상태값:', uniqueSecStatuses);
  } else {
    console.log('✗ security_regulation_data 없음:', secRegError1.message);
  }

  // main_security_regulation_data 시도
  const { data: secReg2, error: secRegError2 } = await supabase
    .from('main_security_regulation_data')
    .select('status')
    .limit(1);

  if (!secRegError2) {
    console.log('✓ main_security_regulation_data 테이블 발견!');
    const { data: allSecReg } = await supabase
      .from('main_security_regulation_data')
      .select('status');
    const uniqueSecStatuses = [...new Set(allSecReg.map(t => t.status))];
    console.log('고유 상태값:', uniqueSecStatuses);
  } else {
    console.log('✗ main_security_regulation_data 없음:', secRegError2.message);
  }

  // security_document_data 시도
  const { data: secDoc, error: secDocError } = await supabase
    .from('security_document_data')
    .select('status')
    .limit(1);

  if (!secDocError) {
    console.log('✓ security_document_data 테이블 발견!');
    const { data: allSecDoc } = await supabase
      .from('security_document_data')
      .select('status');
    const uniqueSecDocStatuses = [...new Set(allSecDoc.map(t => t.status))];
    console.log('고유 상태값:', uniqueSecDocStatuses);
  } else {
    console.log('✗ security_document_data 없음:', secDocError.message);
  }
}

checkAllStatus().then(() => process.exit(0));
