require('dotenv').config({ path: '.env.local' });

async function testAPIEndpoints() {
  const baseURL = 'http://localhost:3200';

  console.log('🧪 API 엔드포인트 테스트 시작...');

  try {
    // Node.js 환경에서 fetch 사용 (Node 18+)
    const fetch = (await import('node-fetch')).default;

    // 1. GET 테스트 - 체크리스트 에디터 데이터 조회
    console.log('\n📖 1. GET /api/checklist-editor?checklist_id=1');

    const getResponse = await fetch(`${baseURL}/api/checklist-editor?checklist_id=1`);
    const getData = await getResponse.json();

    if (getData.success) {
      console.log('✅ GET 요청 성공:', getData.data?.length || 0, '개 항목 조회');
      console.log('📄 조회된 첫 번째 항목:', getData.data?.[0]);
    } else {
      console.log('❌ GET 요청 실패:', getData.error);
    }

    // 2. PUT 테스트 - 데이터 수정
    console.log('\n📝 2. PUT /api/checklist-editor');

    const putPayload = {
      id: getData.data?.[0]?.id,
      checklist_id: 1,
      no: 1,
      major_category: '보안',
      sub_category: '접근통제',
      title: '시스템 권한 점검 (수정됨)',
      description: '시스템 사용자 권한이 적절히 설정되어 있는지 확인 (API 테스트)',
      evaluation: '진행',
      score: 75
    };

    const putResponse = await fetch(`${baseURL}/api/checklist-editor`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(putPayload)
    });

    const putData = await putResponse.json();

    if (putData.success) {
      console.log('✅ PUT 요청 성공:', putData.data);
    } else {
      console.log('❌ PUT 요청 실패:', putData.error);
    }

    // 3. POST 테스트 - 새 데이터 추가
    console.log('\n➕ 3. POST /api/checklist-editor');

    const postPayload = {
      checklist_id: 1,
      no: 10,
      major_category: 'API테스트',
      sub_category: '기능검증',
      title: 'API 연동 테스트',
      description: 'REST API가 정상적으로 작동하는지 확인',
      evaluation: '대기',
      score: 0
    };

    const postResponse = await fetch(`${baseURL}/api/checklist-editor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postPayload)
    });

    const postData = await postResponse.json();

    if (postData.success) {
      console.log('✅ POST 요청 성공:', postData.data);
    } else {
      console.log('❌ POST 요청 실패:', postData.error);
    }

    // 4. Batch 테스트 - 일괄 처리
    console.log('\n📦 4. POST /api/checklist-editor/batch');

    const batchPayload = {
      checklist_id: 1,
      items: [
        {
          id: getData.data?.[1]?.id,
          no: 2,
          major_category: '보안',
          sub_category: '패스워드',
          title: '패스워드 정책 점검 (일괄수정)',
          description: '패스워드 복잡성 및 변경 주기 확인 (배치 테스트)',
          evaluation: '완료',
          score: 90
        }
      ]
    };

    const batchResponse = await fetch(`${baseURL}/api/checklist-editor/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchPayload)
    });

    const batchData = await batchResponse.json();

    if (batchData.success) {
      console.log('✅ BATCH 요청 성공:', batchData.results?.length || 0, '개 항목 처리');
    } else {
      console.log('❌ BATCH 요청 실패:', batchData.error);
    }

    // 5. 최종 확인 - 수정된 데이터 조회
    console.log('\n🔍 5. 최종 데이터 확인');

    const finalResponse = await fetch(`${baseURL}/api/checklist-editor?checklist_id=1`);
    const finalData = await finalResponse.json();

    if (finalData.success) {
      console.log('✅ 최종 조회 성공:', finalData.data?.length || 0, '개 항목');
      console.log('\n📋 현재 모든 데이터:');
      finalData.data?.forEach(item => {
        console.log(`  ${item.no}. ${item.title} - ${item.evaluation} (${item.score}점)`);
      });
    } else {
      console.log('❌ 최종 조회 실패:', finalData.error);
    }

    console.log('\n🎯 모든 API 엔드포인트 테스트 완료!');

  } catch (error) {
    console.error('💥 API 테스트 중 오류:', error.message);
  }
}

testAPIEndpoints();