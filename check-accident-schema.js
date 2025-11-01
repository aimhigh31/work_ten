const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://exxumujwufzqnovhzvif.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NTYwMDksImV4cCI6MjA3MzIzMjAwOX0.zTU0q24c72ewx8DKHqD5lUB1VuuuwBY0jLzWel9DIME'
);

(async () => {
  console.log('🔍 security_accident_data 테이블 스키마 확인...\n');

  // PostgreSQL information_schema에서 컬럼 타입 확인
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'security_accident_data'
      ORDER BY ordinal_position;
    `
  });

  if (error) {
    console.log('⚠️ RPC 방식 실패, 직접 쿼리 시도...\n');

    // 대안: 단순히 데이터를 가져와서 타입 추정
    const { data: sampleData, error: sampleError } = await supabase
      .from('security_accident_data')
      .select('status, incident_type, severity, response_stage, team, assignee')
      .limit(1);

    if (sampleError) {
      console.error('❌ 에러:', sampleError);
      return;
    }

    console.log('📊 샘플 데이터로 필드 확인:');
    if (sampleData && sampleData[0]) {
      Object.entries(sampleData[0]).forEach(([key, value]) => {
        console.log(`  ${key}: "${value}" (길이: ${String(value).length})`);
      });
    }

    console.log('\n💡 varchar(10) 문제로 추정되는 필드:');
    console.log('  - status, incident_type, severity, response_stage 등');
    console.log('\n🔧 해결방법: ALTER TABLE로 컬럼 타입을 VARCHAR(50)으로 변경');
  } else {
    console.log('✅ 스키마 정보:\n');
    data.forEach(col => {
      const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      console.log(`  ${col.column_name.padEnd(25)} ${col.data_type}${length.padEnd(8)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
  }
})();
