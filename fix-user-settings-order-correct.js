// 사용자설정 메뉴 순서 수정 스크립트 (올바른 컬럼명 사용)
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function fixUserSettingsOrder() {
  console.log('🔄 사용자설정 메뉴 순서 수정 시작...');
  
  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 1단계: 현재 관리자메뉴 그룹의 메뉴 순서 확인
    console.log('\n1️⃣ 현재 관리자메뉴 그룹 메뉴 순서 확인...');
    const currentMenus = await client.query(`
      SELECT id, menu_category, menu_page, display_order, menu_level
      FROM admin_systemsetting_menu 
      WHERE menu_category = '관리자메뉴'
      ORDER BY display_order, id
    `);
    
    console.log('현재 관리자메뉴 구조:');
    currentMenus.rows.forEach(menu => {
      console.log(`   ID: ${menu.id}, Order: ${menu.display_order}, Level: ${menu.menu_level}, Page: ${menu.menu_page}`);
    });

    // 2단계: 메뉴들을 올바른 순서로 재정렬
    console.log('\n2️⃣ 관리자메뉴 순서 재정렬...');
    
    // 원하는 순서: 관리자메뉴(0) > 시스템설정(1) > 체크리스트관리(2) > 마스터코드관리(3) > 사용자설정(4)
    const menuOrder = [
      { page: '관리자메뉴', newOrder: 1 },
      { page: '시스템설정', newOrder: 2 },
      { page: '체크리스트관리', newOrder: 3 },
      { page: '마스터코드관리', newOrder: 4 },
      { page: '사용자설정', newOrder: 5 }
    ];

    for (const item of menuOrder) {
      const updateResult = await client.query(`
        UPDATE admin_systemsetting_menu 
        SET display_order = $1, updated_at = NOW() 
        WHERE menu_category = '관리자메뉴' AND menu_page = $2
        RETURNING id, menu_page, display_order
      `, [item.newOrder, item.page]);
      
      if (updateResult.rows.length > 0) {
        console.log(`✅ ${item.page}: display_order → ${item.newOrder}`);
      } else {
        console.log(`⚠️ ${item.page} 메뉴를 찾을 수 없습니다.`);
      }
    }

    // 3단계: 다른 메뉴들(메인메뉴 등)의 순서 조정
    console.log('\n3️⃣ 다른 메뉴 그룹들 순서 조정...');
    
    // 메인메뉴를 10번대로 이동
    const mainMenuUpdate = await client.query(`
      UPDATE admin_systemsetting_menu 
      SET display_order = display_order + 10, updated_at = NOW() 
      WHERE menu_category = '메인메뉴'
      RETURNING id, menu_page, display_order
    `);
    
    console.log(`✅ 메인메뉴 그룹 ${mainMenuUpdate.rows.length}개 항목을 10번대로 이동:`);
    mainMenuUpdate.rows.forEach(menu => {
      console.log(`   ${menu.menu_page}: display_order ${menu.display_order}`);
    });

    // 4단계: 최종 결과 확인
    console.log('\n4️⃣ 최종 메뉴 구조 확인...');
    const finalMenus = await client.query(`
      SELECT id, menu_category, menu_page, display_order, menu_level, is_enabled
      FROM admin_systemsetting_menu 
      ORDER BY display_order, id
    `);
    
    console.log('수정된 전체 메뉴 구조:');
    finalMenus.rows.forEach(menu => {
      const status = menu.is_enabled ? '✅' : '❌';
      console.log(`   ${status} Order: ${menu.display_order}, Level: ${menu.menu_level}, Category: ${menu.menu_category}, Page: ${menu.menu_page}`);
    });

    return true;
  } catch (error) {
    console.error('❌ 사용자설정 순서 수정 오류:', error);
    return false;
  } finally {
    await client.end();
    console.log('\n🔌 PostgreSQL 연결 종료');
  }
}

fixUserSettingsOrder().then((success) => {
  if (success) {
    console.log('\n🎉 사용자설정 메뉴 순서 수정 완료!');
    console.log('✅ 관리자메뉴 구조가 다음과 같이 정렬되었습니다:');
    console.log('   1. 관리자메뉴 (그룹)');
    console.log('   2. ├─ 시스템설정');  
    console.log('   3. ├─ 체크리스트관리');
    console.log('   4. ├─ 마스터코드관리');
    console.log('   5. └─ 사용자설정');
    console.log('🔄 브라우저를 새로고침하여 변경사항을 확인하세요.');
  } else {
    console.log('\n❌ 사용자설정 순서 수정 실패');
  }
  process.exit(success ? 0 : 1);
});