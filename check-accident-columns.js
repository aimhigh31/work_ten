const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://exxumujwufzqnovhzvif.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NTYwMDksImV4cCI6MjA3MzIzMjAwOX0.zTU0q24c72ewx8DKHqD5lUB1VuuuwBY0jLzWel9DIME'
);

(async () => {
  console.log('🔍 security_accident_data 테이블 컬럼 확인...\n');

  const { data, error } = await supabase
    .from('security_accident_data')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ 에러:', error);
    return;
  }

  if (data && data[0]) {
    const columns = Object.keys(data[0]).sort();
    console.log('✅ 총', columns.length, '개 컬럼:\n');
    columns.forEach((col, index) => {
      console.log(`${(index + 1).toString().padStart(2, ' ')}. ${col}`);
    });
  } else {
    console.log('⚠️ 데이터가 없습니다.');
  }
})();
