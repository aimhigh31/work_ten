const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exxumujwufzqnovhzvif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NTYwMDksImV4cCI6MjA3MzIzMjAwOX0.zTU0q24c72ewx8DKHqD5lUB1VuuuwBY0jLzWel9DIME';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateEducation() {
  try {
    // 테스트용 교육 데이터
    const educationData = {
      id: Math.floor(Math.random() * 1000000) + 100000, // 6자리 임시 ID
      education_name: '테스트 보안교육',
      description: '테스트 설명',
      education_type: '정기교육',
      status: '계획됨',
      code: 'TEST-001',
      assignee: '테스터',
      execution_date: new Date().toISOString().split('T')[0],
      location: '테스트 장소'
    };

    console.log('생성할 교육 데이터:', JSON.stringify(educationData, null, 2));

    const { data, error } = await supabase
      .from('security_education_data')
      .insert(educationData)
      .select()
      .single();

    if (error) {
      console.error('❌ 교육 생성 실패:');
      console.error('에러 메시지:', error.message);
      console.error('에러 세부사항:', error.details);
      console.error('에러 코드:', error.code);
    } else {
      console.log('✅ 교육 생성 성공!');
      console.log('생성된 데이터:', JSON.stringify(data, null, 2));
      console.log('생성된 ID:', data.id);

      // 테스트용 커리큘럼 데이터 추가
      const curriculumData = {
        education_id: data.id,
        session_order: 1,
        session_title: '테스트 세션',
        session_description: '테스트 설명',
        duration_minutes: 60,
        instructor: '테스트 강사'
      };

      console.log('\n커리큘럼 추가 테스트...');
      const { data: currData, error: currError } = await supabase
        .from('security_education_curriculum')
        .insert(curriculumData)
        .select();

      if (currError) {
        console.error('❌ 커리큘럼 추가 실패:', currError.message);
      } else {
        console.log('✅ 커리큘럼 추가 성공:', currData);
      }

      // 테스트 데이터 삭제
      console.log('\n테스트 데이터 정리...');

      // 먼저 커리큘럼 삭제
      if (currData && currData[0]) {
        await supabase
          .from('security_education_curriculum')
          .delete()
          .eq('id', currData[0].id);
        console.log('✅ 커리큘럼 삭제 완료');
      }

      // 그 다음 교육 삭제
      await supabase
        .from('security_education_data')
        .delete()
        .eq('id', data.id);
      console.log('✅ 교육 데이터 삭제 완료');
    }

  } catch (error) {
    console.error('예외 발생:', error);
  }
}

testCreateEducation();