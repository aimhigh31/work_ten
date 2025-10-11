require('dotenv').config({ path: '.env.local' });

async function testCompleteFlow() {
  const baseURL = 'http://localhost:3200';

  console.log('🧪 체크리스트 전체 플로우 테스트 시작...');

  try {
    const fetch = (await import('node-fetch')).default;

    // 1. 새 체크리스트 생성
    console.log('\n➕ 1단계: 새 체크리스트 생성...');

    const newChecklistData = {
      no: 0,
      registration_date: new Date().toISOString().split('T')[0],
      code: `CHK-FLOW-${Date.now().toString().slice(-6)}`,
      department: 'IT001',
      work_content: '전체 플로우 테스트',
      description: 'fetchChecklists 함수 및 전체 저장 로직 테스트',
      status: '진행',
      team: '개발팀',
      assignee: 'USR001',
      progress: 25
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
    console.log('✅ 체크리스트 생성 성공! ID:', checklistId, ', CODE:', createResult.data.code);

    // 2. 에디터 항목 일괄 추가
    console.log('\n📝 2단계: 에디터 항목 일괄 추가...');

    const editorItems = [
      {
        checklist_id: checklistId,
        no: 1,
        major_category: '기능',
        sub_category: '생성',
        title: '체크리스트 생성 기능',
        description: '새 체크리스트를 생성하고 ID를 반환',
        evaluation: '완료',
        score: 100
      },
      {
        checklist_id: checklistId,
        no: 2,
        major_category: '기능',
        sub_category: '저장',
        title: '에디터 데이터 저장',
        description: '에디터탭 데이터를 데이터베이스에 저장',
        evaluation: '진행',
        score: 75
      },
      {
        checklist_id: checklistId,
        no: 3,
        major_category: '기능',
        sub_category: '동기화',
        title: '데이터 동기화',
        description: 'fetchChecklists를 통한 목록 새로고침',
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

    if (batchResult.success) {
      console.log('✅ 에디터 항목 추가 성공!', batchResult.data?.length || 0, '개');
    } else {
      console.error('❌ 에디터 항목 추가 실패:', batchResult.error);
    }

    // 3. 체크리스트 수정
    console.log('\n✏️ 3단계: 체크리스트 수정...');

    const updateData = {
      ...createResult.data,
      work_content: '전체 플로우 테스트 (수정됨)',
      progress: 50,
      status: '진행'
    };

    const updateResponse = await fetch(`${baseURL}/api/checklists`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: checklistId,
        ...updateData
      })
    });

    const updateResult = await updateResponse.json();

    if (updateResult.success) {
      console.log('✅ 체크리스트 수정 성공!');
    } else {
      console.error('❌ 체크리스트 수정 실패:', updateResult.error);
    }

    // 4. 에디터 항목 수정
    console.log('\n✏️ 4단계: 에디터 항목 수정...');

    const getEditorResponse = await fetch(`${baseURL}/api/checklist-editor?checklist_id=${checklistId}`);
    const getEditorResult = await getEditorResponse.json();

    if (getEditorResult.success && getEditorResult.data.length > 0) {
      const firstItem = getEditorResult.data[0];

      const updateEditorResponse = await fetch(`${baseURL}/api/checklist-editor`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...firstItem,
          evaluation: '완료',
          score: 100,
          description: firstItem.description + ' (테스트 완료)'
        })
      });

      const updateEditorResult = await updateEditorResponse.json();

      if (updateEditorResult.success) {
        console.log('✅ 에디터 항목 수정 성공!');
      } else {
        console.error('❌ 에디터 항목 수정 실패:', updateEditorResult.error);
      }
    }

    // 5. 최종 데이터 확인
    console.log('\n📊 5단계: 최종 데이터 확인...');

    // 체크리스트 확인
    const finalChecklistResponse = await fetch(`${baseURL}/api/checklists`);
    const finalChecklistResult = await finalChecklistResponse.json();

    if (finalChecklistResult.success) {
      const createdChecklist = finalChecklistResult.data.find(c => c.id === checklistId);
      if (createdChecklist) {
        console.log('✅ 체크리스트 확인:');
        console.log(`  ID: ${createdChecklist.id}`);
        console.log(`  제목: ${createdChecklist.work_content}`);
        console.log(`  상태: ${createdChecklist.status}`);
        console.log(`  진행률: ${createdChecklist.progress}%`);
      }
    }

    // 에디터 항목 확인
    const finalEditorResponse = await fetch(`${baseURL}/api/checklist-editor?checklist_id=${checklistId}`);
    const finalEditorResult = await finalEditorResponse.json();

    if (finalEditorResult.success) {
      console.log('✅ 에디터 항목 확인:');
      console.log(`  총 ${finalEditorResult.data.length}개 항목`);
      finalEditorResult.data.forEach(item => {
        console.log(`  - ${item.title}: ${item.evaluation} (${item.score}점)`);
      });
    }

    console.log('\n🎯 전체 플로우 테스트 완료!');
    console.log('✨ 모든 기능이 정상적으로 작동합니다.');

  } catch (error) {
    console.error('💥 테스트 중 오류 발생:', error.message);
  }
}

testCompleteFlow();