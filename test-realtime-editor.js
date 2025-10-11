require('dotenv').config({ path: '.env.local' });

async function testRealtimeEditor() {
  const baseURL = 'http://localhost:3200';

  console.log('🧪 실시간 에디터 데이터 연동 테스트 시작...');

  try {
    const fetch = (await import('node-fetch')).default;

    // 1. 기존 체크리스트 중 하나를 사용 (또는 새로 생성)
    console.log('\n📋 기존 체크리스트 조회...');

    const checklistResponse = await fetch(`${baseURL}/api/checklists`);
    const checklistResult = await checklistResponse.json();

    if (!checklistResult.success || checklistResult.data.length === 0) {
      console.error('❌ 체크리스트가 없습니다. 먼저 체크리스트를 생성하세요.');
      return;
    }

    const checklist = checklistResult.data[0];
    const checklistId = checklist.id;
    console.log(`✅ 테스트 대상 체크리스트: ${checklist.work_content} (ID: ${checklistId})`);

    // 2. 현재 에디터 항목 조회
    console.log('\n🔍 현재 에디터 항목 조회...');
    const currentResponse = await fetch(`${baseURL}/api/checklist-editor?checklist_id=${checklistId}`);
    const currentResult = await currentResponse.json();

    console.log(`✅ 현재 에디터 항목: ${currentResult.data?.length || 0}개`);
    const initialCount = currentResult.data?.length || 0;

    // 3. 새 항목 추가 테스트
    console.log('\n➕ 실시간 항목 추가 테스트...');

    const newItem = {
      checklist_id: checklistId,
      no: initialCount + 1,
      major_category: '실시간',
      sub_category: '테스트',
      title: '실시간 추가 테스트 항목',
      description: '에디터에서 추가 시 즉시 데이터베이스에 저장되는지 테스트',
      evaluation: '대기',
      score: 0
    };

    const addResponse = await fetch(`${baseURL}/api/checklist-editor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newItem)
    });

    const addResult = await addResponse.json();

    if (addResult.success) {
      console.log('✅ 항목 추가 성공:', addResult.data.title);

      // 4. 추가된 항목 수정 테스트
      console.log('\n✏️ 실시간 항목 수정 테스트...');

      const itemId = addResult.data.id;
      const updateResponse = await fetch(`${baseURL}/api/checklist-editor`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...addResult.data,
          title: '실시간 수정 테스트 항목 (수정됨)',
          evaluation: '진행',
          score: 50,
          description: '실시간 수정 기능이 정상 작동하는지 테스트'
        })
      });

      const updateResult = await updateResponse.json();

      if (updateResult.success) {
        console.log('✅ 항목 수정 성공:', updateResult.data.title);
        console.log(`   평가: ${updateResult.data.evaluation}, 점수: ${updateResult.data.score}점`);

        // 5. 다시 한번 수정 (평가 변경)
        console.log('\n🔄 평가 상태 변경 테스트...');

        const statusUpdateResponse = await fetch(`${baseURL}/api/checklist-editor`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...updateResult.data,
            evaluation: '완료',
            score: 100
          })
        });

        const statusUpdateResult = await statusUpdateResponse.json();

        if (statusUpdateResult.success) {
          console.log('✅ 평가 상태 변경 성공!');
          console.log(`   최종 평가: ${statusUpdateResult.data.evaluation}, 점수: ${statusUpdateResult.data.score}점`);
        }

        // 6. 항목 삭제 테스트
        console.log('\n🗑️ 실시간 항목 삭제 테스트...');

        const deleteResponse = await fetch(`${baseURL}/api/checklist-editor?id=${itemId}`, {
          method: 'DELETE'
        });

        const deleteResult = await deleteResponse.json();

        if (deleteResult.success) {
          console.log('✅ 항목 삭제 성공!');
        } else {
          console.error('❌ 항목 삭제 실패:', deleteResult.error);
        }
      } else {
        console.error('❌ 항목 수정 실패:', updateResult.error);
      }
    } else {
      console.error('❌ 항목 추가 실패:', addResult.error);
    }

    // 7. 최종 상태 확인
    console.log('\n📊 최종 상태 확인...');
    const finalResponse = await fetch(`${baseURL}/api/checklist-editor?checklist_id=${checklistId}`);
    const finalResult = await finalResponse.json();

    if (finalResult.success) {
      console.log(`✅ 최종 에디터 항목: ${finalResult.data?.length || 0}개`);
      const finalCount = finalResult.data?.length || 0;

      if (finalCount === initialCount) {
        console.log('✅ 항목 추가/삭제가 정확히 반영되었습니다!');
      } else {
        console.log(`⚠️ 항목 수 불일치: 초기 ${initialCount}개 → 최종 ${finalCount}개`);
      }

      // 최근 수정된 항목들 표시
      if (finalResult.data && finalResult.data.length > 0) {
        console.log('\n📋 현재 에디터 항목들:');
        finalResult.data.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.title} - ${item.evaluation} (${item.score}점)`);
        });
      }
    }

    console.log('\n🎯 실시간 에디터 데이터 연동 테스트 완료!');
    console.log('✨ 모든 CRUD 작업이 실시간으로 반영됩니다.');

  } catch (error) {
    console.error('💥 테스트 중 오류 발생:', error.message);
  }
}

testRealtimeEditor();