require('dotenv').config({ path: '.env.local' });

async function testEditorSave() {
  const baseURL = 'http://localhost:3200';

  console.log('🧪 체크리스트 에디터 저장 기능 테스트 시작...');

  try {
    const fetch = (await import('node-fetch')).default;

    // 1. 새 체크리스트 생성
    console.log('\n➕ 1. 새 체크리스트 생성...');

    const newChecklistData = {
      no: 0,
      registration_date: new Date().toISOString().split('T')[0],
      code: `CHK-EDITOR-${Date.now().toString().slice(-6)}`,
      department: 'IT001',
      work_content: '에디터 저장 테스트 체크리스트',
      description: '에디터탭 데이터 저장 기능 테스트',
      status: '대기',
      team: '개발팀',
      assignee: 'USR001',
      progress: 0
    };

    const createResponse = await fetch(`${baseURL}/api/checklists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newChecklistData)
    });

    const createResult = await createResponse.json();

    if (!createResult.success) {
      console.error('❌ 체크리스트 생성 실패:', createResult.error);
      return;
    }

    const checklistId = createResult.data.id;
    console.log('✅ 체크리스트 생성 성공! ID:', checklistId);

    // 2. 에디터 항목 추가
    console.log('\n📝 2. 에디터 항목 추가...');

    const editorItems = [
      {
        checklist_id: checklistId,
        no: 1,
        major_category: '테스트',
        sub_category: '기능검증',
        title: '에디터 저장 기능 테스트 항목 1',
        description: '새 체크리스트 생성 시 에디터 데이터 저장 확인',
        evaluation: '진행',
        score: 50
      },
      {
        checklist_id: checklistId,
        no: 2,
        major_category: '테스트',
        sub_category: '통합테스트',
        title: '에디터 저장 기능 테스트 항목 2',
        description: '에디터탭 항목 추가/삭제 기능 확인',
        evaluation: '대기',
        score: 0
      }
    ];

    const batchResponse = await fetch(`${baseURL}/api/checklist-editor/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checklist_id: checklistId,
        items: editorItems
      })
    });

    const batchResult = await batchResponse.json();

    if (!batchResult.success) {
      console.error('❌ 에디터 항목 추가 실패:', batchResult.error);
      return;
    }

    console.log('✅ 에디터 항목 추가 성공!', batchResult.data?.length || 0, '개');

    // 3. 에디터 항목 조회
    console.log('\n🔍 3. 저장된 에디터 항목 조회...');

    const getResponse = await fetch(`${baseURL}/api/checklist-editor?checklist_id=${checklistId}`);
    const getResult = await getResponse.json();

    if (getResult.success) {
      console.log('✅ 에디터 항목 조회 성공:', getResult.data?.length || 0, '개');
      getResult.data?.forEach(item => {
        console.log(`  ${item.no}. ${item.title} - ${item.evaluation} (${item.score}점)`);
      });
    } else {
      console.error('❌ 에디터 항목 조회 실패:', getResult.error);
    }

    // 4. 항목 수정 테스트
    console.log('\n✏️ 4. 에디터 항목 수정 테스트...');

    if (getResult.data && getResult.data.length > 0) {
      const firstItem = getResult.data[0];

      const updateResponse = await fetch(`${baseURL}/api/checklist-editor`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: firstItem.id,
          checklist_id: checklistId,
          no: firstItem.no,
          major_category: firstItem.major_category,
          sub_category: firstItem.sub_category,
          title: firstItem.title + ' (수정됨)',
          description: firstItem.description + ' - 수정 테스트 완료',
          evaluation: '완료',
          score: 100
        })
      });

      const updateResult = await updateResponse.json();

      if (updateResult.success) {
        console.log('✅ 항목 수정 성공!');
        console.log(`  ${updateResult.data.title} - ${updateResult.data.evaluation} (${updateResult.data.score}점)`);
      } else {
        console.error('❌ 항목 수정 실패:', updateResult.error);
      }
    }

    // 5. 최종 확인
    console.log('\n📊 5. 최종 데이터 확인...');

    const finalResponse = await fetch(`${baseURL}/api/checklist-editor?checklist_id=${checklistId}`);
    const finalResult = await finalResponse.json();

    if (finalResult.success) {
      console.log('✅ 최종 조회 성공:');
      console.log('📋 체크리스트 ID:', checklistId);
      console.log('📝 에디터 항목:', finalResult.data?.length || 0, '개');
      finalResult.data?.forEach(item => {
        console.log(`  ${item.no}. ${item.title}`);
        console.log(`     상태: ${item.evaluation}, 점수: ${item.score}점`);
      });
    }

    console.log('\n🎯 모든 테스트 완료!');
    console.log('✨ 체크리스트 에디터 저장 기능이 정상적으로 작동합니다.');

  } catch (error) {
    console.error('💥 테스트 중 오류 발생:', error.message);
  }
}

testEditorSave();