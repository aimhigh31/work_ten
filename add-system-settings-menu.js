// 관리자메뉴에 시스템설정 추가
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function addSystemSettingsToAdminMenu() {
  console.log('🔄 관리자메뉴에 시스템설정 추가 시작...');
  
  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 1단계: 현재 관리자메뉴 항목들 확인
    console.log('\n1️⃣ 현재 관리자메뉴 항목 확인...');
    const currentAdminMenus = await client.query(`
      SELECT id, menu_level, menu_page, display_order, menu_description
      FROM admin_systemsetting_menu 
      WHERE menu_category = '관리자메뉴'
      ORDER BY display_order
    `);
    
    console.log('현재 관리자메뉴 항목들:');
    currentAdminMenus.rows.forEach(row => {
      const indent = row.menu_level === 0 ? '' : '  ';
      console.log(`   ${indent}[${row.display_order}] ${row.menu_page} (레벨: ${row.menu_level})`);
    });

    // 2단계: 시스템설정이 이미 있는지 확인
    const systemSettingsExists = currentAdminMenus.rows.find(row => 
      row.menu_page === '시스템설정' && row.menu_level === 1
    );

    if (systemSettingsExists) {
      console.log('\n⚠️ 시스템설정이 이미 존재합니다. ID:', systemSettingsExists.id);
      return true;
    }

    // 3단계: 시스템설정 추가 (관리자메뉴 그룹 다음, 첫 번째 하위 항목으로)
    console.log('\n2️⃣ 시스템설정 메뉴 추가...');
    
    // 관리자메뉴 그룹의 display_order 확인
    const adminGroupOrder = currentAdminMenus.rows.find(row => row.menu_level === 0)?.display_order || 1;
    const newSystemSettingsOrder = adminGroupOrder + 1;

    // 기존 관리자메뉴 하위 항목들의 display_order를 1씩 뒤로 밀기
    await client.query(`
      UPDATE admin_systemsetting_menu 
      SET display_order = display_order + 1 
      WHERE menu_category = '관리자메뉴' 
      AND menu_level = 1 
      AND display_order >= $1
    `, [newSystemSettingsOrder]);

    // 시스템설정 메뉴 추가
    const insertResult = await client.query(`
      INSERT INTO admin_systemsetting_menu (
        menu_level, menu_category, menu_icon, menu_page, 
        menu_description, menu_url, is_enabled, display_order,
        created_by, updated_by
      ) VALUES (
        1, '관리자메뉴', 'Setting2', '시스템설정', 
        '시스템 기본 설정 관리', '/admin-panel/system-settings', 
        true, $1, 'system', 'system'
      ) RETURNING id
    `, [newSystemSettingsOrder]);

    console.log(`✅ 시스템설정 메뉴 추가 완료 (ID: ${insertResult.rows[0].id})`);

    // 4단계: 업데이트된 관리자메뉴 구조 확인
    console.log('\n3️⃣ 업데이트된 관리자메뉴 구조 확인...');
    const updatedAdminMenus = await client.query(`
      SELECT id, menu_level, menu_page, display_order, menu_description, is_enabled
      FROM admin_systemsetting_menu 
      WHERE menu_category = '관리자메뉴'
      ORDER BY display_order
    `);
    
    console.log('📋 업데이트된 관리자메뉴 구조:');
    updatedAdminMenus.rows.forEach(row => {
      const indent = row.menu_level === 0 ? '📁 ' : '  📄 ';
      const status = row.is_enabled ? '✅' : '❌';
      console.log(`   ${indent}[${row.display_order}] ${row.menu_page} ${status}`);
      if (row.menu_level === 1) {
        console.log(`     📝 ${row.menu_description}`);
      }
    });

    // 5단계: 전체 메뉴 개수 확인
    const totalCount = await client.query('SELECT COUNT(*) as count FROM admin_systemsetting_menu');
    console.log(`\n📊 전체 메뉴 개수: ${totalCount.rows[0].count}개`);

    return true;
  } catch (error) {
    console.error('❌ 시스템설정 추가 오류:', error);
    return false;
  } finally {
    await client.end();
    console.log('\n🔌 PostgreSQL 연결 종료');
  }
}

addSystemSettingsToAdminMenu().then((success) => {
  if (success) {
    console.log('\n🎉 관리자메뉴에 시스템설정 추가 완료!');
    console.log('✅ 최종 관리자메뉴 구조:');
    console.log('   📁 관리자메뉴 (그룹)');
    console.log('     📄 시스템설정 ← 새로 추가');
    console.log('     📄 체크리스트관리');
    console.log('     📄 마스터코드관리');
    console.log('     📄 사용자설정');
  } else {
    console.log('\n❌ 시스템설정 추가 실패');
  }
  process.exit(success ? 0 : 1);
});