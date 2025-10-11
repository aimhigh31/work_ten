require('dotenv').config({ path: '.env.local' });

async function testBatchAPI() {
  const baseURL = 'http://localhost:3200';

  console.log('🧪 Batch API 전용 테스트 시작...');

  try {
    const fetch = (await import('node-fetch')).default;

    // 먼저 기존 데이터 조회
    console.log('\n📖 기존 데이터 조회...');
    const getResponse = await fetch(`${baseURL}/api/checklist-editor?checklist_id=1`);
    const getData = await getResponse.json();

    if (!getData.success) {
      console.error('❌ 기존 데이터 조회 실패:', getData.error);
      return;
    }

    console.log(`✅ 기존 데이터 ${getData.data?.length || 0}개 조회 성공`);

    // 첫 번째와 두 번째 항목을 수정하는 batch 요청
    const firstItem = getData.data?.[0];
    const secondItem = getData.data?.[1];

    if (!firstItem || !secondItem) {
      console.error('❌ 테스트할 데이터가 부족합니다.');
      return;
    }

    console.log('\n📦 Batch 요청 데이터:');
    const batchPayload = {
      checklist_id: 1,
      items: [
        {
          id: firstItem.id,
          checklist_id: 1,
          no: firstItem.no,
          major_category: firstItem.major_category,
          sub_category: firstItem.sub_category,
          title: firstItem.title + ' (Batch 수정 1)',
          description: firstItem.description + ' (Batch 테스트)',
          evaluation: '진행',
          score: 85
        },
        {
          id: secondItem.id,
          checklist_id: 1,
          no: secondItem.no,
          major_category: secondItem.major_category,
          sub_category: secondItem.sub_category,
          title: secondItem.title + ' (Batch 수정 2)',
          description: secondItem.description + ' (Batch 테스트)',
          evaluation: '완료',
          score: 95
        }
      ]
    };

    console.log('📋 Batch 요청 페이로드:', JSON.stringify(batchPayload, null, 2));

    console.log('\n📦 POST /api/checklist-editor/batch 요청...');

    const batchResponse = await fetch(`${baseURL}/api/checklist-editor/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchPayload)
    });

    console.log('📡 응답 상태:', batchResponse.status, batchResponse.statusText);

    const batchData = await batchResponse.json();
    console.log('📄 응답 데이터:', JSON.stringify(batchData, null, 2));

    if (batchData.success) {
      console.log('✅ BATCH 요청 성공!');
      console.log(`📊 처리된 항목: ${batchData.data?.length || 0}개`);

      if (batchData.data && batchData.data.length > 0) {
        batchData.data.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.title} - ${item.evaluation} (${item.score}점)`);
        });
      }
    } else {
      console.log('❌ BATCH 요청 실패:', batchData.error);
      if (batchData.partialResults) {
        console.log('⚠️ 부분 성공 결과:', batchData.partialResults.length, '개');
      }
    }

    // 결과 확인
    console.log('\n🔍 수정 결과 확인...');
    const finalResponse = await fetch(`${baseURL}/api/checklist-editor?checklist_id=1`);
    const finalData = await finalResponse.json();

    if (finalData.success) {
      const updatedFirst = finalData.data?.find(item => item.id === firstItem.id);
      const updatedSecond = finalData.data?.find(item => item.id === secondItem.id);

      console.log('📋 첫 번째 항목 변경사항:');
      console.log(`  이전: ${firstItem.title} - ${firstItem.evaluation} (${firstItem.score}점)`);
      console.log(`  이후: ${updatedFirst?.title} - ${updatedFirst?.evaluation} (${updatedFirst?.score}점)`);

      console.log('📋 두 번째 항목 변경사항:');
      console.log(`  이전: ${secondItem.title} - ${secondItem.evaluation} (${secondItem.score}점)`);
      console.log(`  이후: ${updatedSecond?.title} - ${updatedSecond?.evaluation} (${updatedSecond?.score}점)`);
    }

  } catch (error) {
    console.error('💥 Batch API 테스트 중 오류:', error.message);
  }
}

testBatchAPI();