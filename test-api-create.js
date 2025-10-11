require('dotenv').config({ path: '.env.local' });

async function testAPICreate() {
  try {
    console.log('🧪 API 생성 테스트 시작...\n');

    const checklistId = 24;

    // API 호출 (no 값 없이)
    const requestData = {
      checklist_id: checklistId,
      major_category: 'API테스트',
      sub_category: '자동번호',
      title: 'API 자동 번호 테스트',
      description: 'no 값을 API가 자동 계산',
      evaluation: '대기',
      score: 0
    };

    console.log('📡 API 요청 데이터 (no 필드 없음):');
    console.log(JSON.stringify(requestData, null, 2));

    const response = await fetch('http://localhost:3000/api/checklist-editor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    const result = await response.json();

    if (result.success) {
      console.log('\n✅ API 생성 성공!');
      console.log(`   생성된 ID: ${result.data.id}`);
      console.log(`   자동 할당된 No: ${result.data.no}`);
      console.log(`   제목: ${result.data.title}`);

      // 생성된 항목 삭제
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      await supabase
        .from('admin_checklist_editor')
        .delete()
        .eq('id', result.data.id);

      console.log('\n🗑️ 테스트 항목 삭제 완료');
    } else {
      console.error('\n❌ API 생성 실패:', result.error);
    }

  } catch (error) {
    console.error('💥 오류:', error.message);
  }
}

testAPICreate();