require('dotenv').config({ path: '.env.local' });

async function testChecklistCreation() {
  const baseURL = 'http://localhost:3200';

  console.log('🧪 체크리스트 생성 테스트 시작...');

  try {
    const fetch = (await import('node-fetch')).default;

    // 새 체크리스트 생성 테스트
    console.log('\n➕ 새 체크리스트 생성 테스트...');

    const newChecklistData = {
      no: 0, // 서버에서 자동 증가
      registration_date: new Date().toISOString().split('T')[0],
      code: `CHK-${Date.now().toString().slice(-6)}`,
      department: 'IT001',
      work_content: 'API 테스트 체크리스트',
      description: 'integer 범위 초과 오류 수정 후 테스트',
      status: '대기',
      team: '개발팀',
      assignee: 'USR001',
      progress: 0,
      attachments: []
    };

    console.log('📋 생성할 데이터:', JSON.stringify(newChecklistData, null, 2));

    const createResponse = await fetch(`${baseURL}/api/checklists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newChecklistData)
    });

    console.log('📡 응답 상태:', createResponse.status, createResponse.statusText);

    const createResult = await createResponse.json();
    console.log('📄 응답 데이터:', JSON.stringify(createResult, null, 2));

    if (createResult.success) {
      console.log('✅ 체크리스트 생성 성공!');
      console.log(`📊 생성된 ID: ${createResult.data.id}, NO: ${createResult.data.no}`);

      // 생성된 체크리스트 조회 테스트
      console.log('\n🔍 생성된 체크리스트 조회 테스트...');

      const getResponse = await fetch(`${baseURL}/api/checklists`);
      const getResult = await getResponse.json();

      if (getResult.success) {
        const createdItem = getResult.data.find(item => item.id === createResult.data.id);
        if (createdItem) {
          console.log('✅ 생성된 체크리스트 조회 성공:');
          console.log(`  ID: ${createdItem.id}, NO: ${createdItem.no}`);
          console.log(`  제목: ${createdItem.work_content}`);
          console.log(`  상태: ${createdItem.status}`);
          console.log(`  팀: ${createdItem.team}`);
        } else {
          console.log('❌ 생성된 체크리스트를 찾을 수 없습니다.');
        }
      } else {
        console.log('❌ 체크리스트 목록 조회 실패:', getResult.error);
      }

    } else {
      console.log('❌ 체크리스트 생성 실패:', createResult.error);
    }

    // 큰 숫자 테스트 (실패해야 함)
    console.log('\n⚠️ 큰 숫자 테스트 (실패 예상)...');

    const bigNumberData = {
      ...newChecklistData,
      no: 1758237999267, // PostgreSQL integer 범위 초과
      code: `CHK-BIG-${Date.now().toString().slice(-6)}`
    };

    const bigNumberResponse = await fetch(`${baseURL}/api/checklists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bigNumberData)
    });

    const bigNumberResult = await bigNumberResponse.json();

    if (bigNumberResult.success) {
      console.log('⚠️ 예상과 달리 큰 숫자가 성공했습니다:', bigNumberResult.data);
    } else {
      console.log('✅ 예상대로 큰 숫자 테스트 실패:', bigNumberResult.error);
    }

  } catch (error) {
    console.error('💥 체크리스트 생성 테스트 중 오류:', error.message);
  }
}

testChecklistCreation();