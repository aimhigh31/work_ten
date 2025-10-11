// 사용자설정 메뉴 순서 수정 스크립트
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
      SELECT id, menu_id, category, page, display_order, level
      FROM admin_systemsetting_menu 
      WHERE category LIKE '%관리자메뉴%' OR menu_id LIKE '%admin-panel%'
      ORDER BY display_order, id
    `);
    
    console.log('현재 관리자메뉴 구조:');
    currentMenus.rows.forEach(menu => {
      console.log(`   ID: ${menu.id}, Order: ${menu.display_order}, Level: ${menu.level}, Category: ${menu.category}, Page: ${menu.page}`);
    });

    // 2단계: 사용자설정 메뉴 찾기
    console.log('\n2️⃣ 사용자설정 메뉴 찾기...');
    const userSettingsMenu = await client.query(`
      SELECT id, menu_id, category, page, display_order, level
      FROM admin_systemsetting_menu 
      WHERE page = '사용자설정' OR menu_id LIKE '%user-settings%'
    `);
    
    if (userSettingsMenu.rows.length === 0) {
      console.log('⚠️ 사용자설정 메뉴를 찾을 수 없습니다.');
      return false;
    }
    
    console.log('찾은 사용자설정 메뉴:', userSettingsMenu.rows[0]);

    // 3단계: 마스터코드관리 메뉴 찾기
    console.log('\n3️⃣ 마스터코드관리 메뉴 찾기...');
    const masterCodeMenu = await client.query(`
      SELECT id, menu_id, category, page, display_order, level
      FROM admin_systemsetting_menu 
      WHERE page = '마스터코드관리' OR menu_id LIKE '%master-code%'
    `);
    
    if (masterCodeMenu.rows.length === 0) {
      console.log('⚠️ 마스터코드관리 메뉴를 찾을 수 없습니다.');
      return false;
    }
    
    console.log('찾은 마스터코드관리 메뉴:', masterCodeMenu.rows[0]);

    // 4단계: 사용자설정을 마스터코드관리 다음 순서로 이동
    console.log('\n4️⃣ 사용자설정 순서 수정...');
    
    const newDisplayOrder = masterCodeMenu.rows[0].display_order + 1;
    
    console.log(`사용자설정을 display_order ${newDisplayOrder}로 변경...`);
    
    const updateResult = await client.query(`
      UPDATE admin_systemsetting_menu 
      SET display_order = $1, updated_at = NOW() 
      WHERE id = $2
      RETURNING id, menu_id, category, page, display_order, level
    `, [newDisplayOrder, userSettingsMenu.rows[0].id]);
    
    console.log('✅ 사용자설정 순서 수정 완료:', updateResult.rows[0]);

    // 5단계: 다른 메뉴들의 순서 조정 (필요시)
    console.log('\n5️⃣ 다른 메뉴들 순서 조정...');
    
    // 새로운 순서보다 크거나 같은 다른 메뉴들을 한 칸씩 뒤로 밀기
    const adjustResult = await client.query(`
      UPDATE admin_systemsetting_menu 
      SET display_order = display_order + 1, updated_at = NOW() 
      WHERE display_order >= $1 
      AND id != $2
      AND (category LIKE '%관리자메뉴%' OR menu_id LIKE '%admin-panel%')
      RETURNING id, menu_id, category, page, display_order, level
    `, [newDisplayOrder, userSettingsMenu.rows[0].id]);
    
    if (adjustResult.rows.length > 0) {
      console.log(`✅ ${adjustResult.rows.length}개 메뉴의 순서를 조정했습니다.`);
      adjustResult.rows.forEach(menu => {
        console.log(`   ${menu.page}: ${menu.display_order - 1} → ${menu.display_order}`);
      });
    }

    // 6단계: 최종 결과 확인
    console.log('\n6️⃣ 최종 관리자메뉴 구조 확인...');
    const finalMenus = await client.query(`
      SELECT id, menu_id, category, page, display_order, level
      FROM admin_systemsetting_menu 
      WHERE category LIKE '%관리자메뉴%' OR menu_id LIKE '%admin-panel%'
      ORDER BY display_order, id
    `);
    
    console.log('수정된 관리자메뉴 구조:');
    finalMenus.rows.forEach(menu => {
      console.log(`   Order: ${menu.display_order}, Level: ${menu.level}, Page: ${menu.page}`);
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
    console.log('✅ 사용자설정이 마스터코드관리 다음에 위치하도록 수정되었습니다.');
    console.log('🔄 브라우저를 새로고침하여 변경사항을 확인하세요.');
  } else {
    console.log('\n❌ 사용자설정 순서 수정 실패');
  }
  process.exit(success ? 0 : 1);
});