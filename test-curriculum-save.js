const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exxumujwufzqnovhzvif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NTYwMDksImV4cCI6MjA3MzIzMjAwOX0.zTU0q24c72ewx8DKHqD5lUB1VuuuwBY0jLzWel9DIME';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSave() {
  try {
    // 테스트용 education_id (실제로 존재하는 ID 사용)
    const testEducationId = 100001; // 6자리 임시 ID

    const testData = {
      education_id: testEducationId,
      session_order: 1,
      session_title: '테스트 제목',
      session_description: '테스트 설명',
      duration_minutes: 60,
      instructor: '테스트 강사',
      session_type: '강의',
      materials: '테스트 자료',
      objectives: '테스트 목표',
      is_active: true,
      created_by: 'user',
      updated_by: 'user'
    };

    console.log('저장할 데이터:', JSON.stringify(testData, null, 2));

    const { data, error } = await supabase
      .from('security_education_curriculum')
      .insert(testData)
      .select();

    if (error) {
      console.error('❌ 저장 실패:');
      console.error('에러 메시지:', error.message);
      console.error('에러 세부사항:', error.details);
      console.error('에러 힌트:', error.hint);
      console.error('에러 코드:', error.code);
      console.error('전체 에러:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ 저장 성공:', data);

      // 저장된 데이터 삭제 (테스트용)
      if (data && data[0]) {
        const { error: deleteError } = await supabase
          .from('security_education_curriculum')
          .delete()
          .eq('id', data[0].id);

        if (!deleteError) {
          console.log('✅ 테스트 데이터 삭제 완료');
        }
      }
    }

  } catch (error) {
    console.error('예외 발생:', error);
  }
}

testSave();