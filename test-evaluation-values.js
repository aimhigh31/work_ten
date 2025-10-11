require('dotenv').config({ path: '.env.local' });

async function testEvaluationValues() {
  const baseURL = 'http://localhost:3200';

  console.log('🧪 Evaluation 필드 값 테스트 시작...');

  try {
    const fetch = (await import('node-fetch')).default;

    // 모든 허용된 evaluation 값 테스트
    const evaluationValues = ['대기', '진행', '완료', '보류', '취소'];

    for (let i = 0; i < evaluationValues.length; i++) {
      const evaluation = evaluationValues[i];

      console.log(`\n📝 테스트 ${i + 1}: evaluation = '${evaluation}'`);

      const testData = {
        checklist_id: 1,
        no: 1000 + i,
        major_category: '테스트',
        sub_category: '검증',
        title: `${evaluation} 상태 테스트`,
        description: `evaluation 값 '${evaluation}' 테스트`,
        evaluation: evaluation,
        score: i * 20
      };

      const response = await fetch(`${baseURL}/api/checklist-editor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ '${evaluation}' 값 삽입 성공`);
      } else {
        console.log(`❌ '${evaluation}' 값 삽입 실패:`, result.error);
      }
    }

    // 삽입된 데이터 조회
    console.log('\n🔍 삽입된 데이터 확인...');
    const getResponse = await fetch(`${baseURL}/api/checklist-editor?checklist_id=1`);
    const getData = await getResponse.json();

    if (getData.success) {
      const testItems = getData.data.filter(item => item.no >= 1000 && item.no < 1005);
      console.log(`✅ 테스트 데이터 ${testItems.length}개 확인`);
      testItems.forEach(item => {
        console.log(`  NO.${item.no}: ${item.evaluation} - ${item.title}`);
      });
    }

    // 테스트 데이터 정리
    console.log('\n🗑️ 테스트 데이터 정리...');
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error: deleteError } = await supabase
      .from('admin_checklist_editor')
      .delete()
      .gte('no', 1000)
      .lte('no', 1004);

    if (!deleteError) {
      console.log('✅ 테스트 데이터 정리 완료');
    } else {
      console.log('❌ 테스트 데이터 정리 실패:', deleteError.message);
    }

    console.log('\n🎯 모든 evaluation 값 테스트 완료!');

  } catch (error) {
    console.error('💥 테스트 중 오류 발생:', error.message);
  }
}

testEvaluationValues();