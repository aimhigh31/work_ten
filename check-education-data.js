const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://exxumujwufzqnovhzvif.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NTYwMDksImV4cCI6MjA3MzIzMjAwOX0.zTU0q24c72ewx8DKHqD5lUB1VuuuwBY0jLzWel9DIME'
);

(async () => {
  console.log('🔍 security_education_data 테이블 확인...\n');

  const { data, error } = await supabase
    .from('security_education_data')
    .select('id, no, code, education_name, education_type, status')
    .order('no', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ 에러:', error);
    return;
  }

  console.log('✅ 최근 5건 데이터:\n');
  data.forEach(row => {
    console.log(`ID: ${row.id}, NO: ${row.no}, Code: ${row.code}`);
    console.log(`  교육명: ${row.education_name}`);
    console.log(`  교육유형: "${row.education_type}" (길이: ${row.education_type?.length})`);
    console.log(`  상태: "${row.status}" (길이: ${row.status?.length})`);
    console.log('');
  });
})();
