// IT메뉴와 보안메뉴 추가
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function addITAndSecurityMenus() {
  console.log('🔄 IT메뉴와 보안메뉴 추가 시작...');
  
  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 1단계: 현재 최대 display_order 확인
    console.log('\n1️⃣ 현재 최대 순서 확인...');
    const maxOrderResult = await client.query('SELECT MAX(display_order) as max_order FROM admin_systemsetting_menu');
    const currentMaxOrder = maxOrderResult.rows[0].max_order || 0;
    console.log(`현재 최대 순서: ${currentMaxOrder}`);

    // 2단계: IT메뉴와 보안메뉴 데이터 추가
    console.log('\n2️⃣ IT메뉴와 보안메뉴 데이터 추가...');
    
    const newMenusData = `
      INSERT INTO admin_systemsetting_menu (
        menu_level, menu_category, menu_icon, menu_page, 
        menu_description, menu_url, is_enabled, display_order,
        created_by, updated_by
      ) VALUES 
      -- IT메뉴 그룹 (레벨 0)
      (0, 'IT메뉴', 'Monitor', 'IT메뉴', 'IT 시스템 관리', '/', true, ${currentMaxOrder + 1}, 'system', 'system'),
      
      -- IT메뉴 하위 항목들 (레벨 1)
      (1, 'IT메뉴', 'MessageQuestion', 'VOC관리', '고객 VOC 관리', '/apps/voc-management', true, ${currentMaxOrder + 2}, 'system', 'system'),
      (1, 'IT메뉴', 'Setting3', '솔루션관리', 'IT 솔루션 관리', '/apps/solution-management', true, ${currentMaxOrder + 3}, 'system', 'system'),
      (1, 'IT메뉴', 'CPU', '하드웨어관리', '하드웨어 자산 관리', '/apps/hardware-management', true, ${currentMaxOrder + 4}, 'system', 'system'),
      (1, 'IT메뉴', 'ProgrammingArrows', '소프트웨어관리', '소프트웨어 자산 관리', '/apps/software-management', true, ${currentMaxOrder + 5}, 'system', 'system'),
      (1, 'IT메뉴', 'Teacher', 'IT교육관리', 'IT 교육 과정 관리', '/apps/it-education-management', true, ${currentMaxOrder + 6}, 'system', 'system'),
      
      -- 보안메뉴 그룹 (레벨 0)
      (0, '보안메뉴', 'SecuritySafe', '보안메뉴', '보안 관리 시스템', '/', true, ${currentMaxOrder + 7}, 'system', 'system'),
      
      -- 보안메뉴 하위 항목들 (레벨 1)
      (1, '보안메뉴', 'ScanBarcode', '보안점검관리', '보안 점검 및 감사', '/apps/security-inspection-management', true, ${currentMaxOrder + 8}, 'system', 'system'),
      (1, '보안메뉴', 'SecurityUser', '보안교육관리', '보안 교육 프로그램 관리', '/apps/security-education-management', true, ${currentMaxOrder + 9}, 'system', 'system'),
      (1, '보안메뉴', 'Warning2', '보안사고관리', '보안 사고 대응 관리', '/apps/security-incident-management', true, ${currentMaxOrder + 10}, 'system', 'system'),
      (1, '보안메뉴', 'DocumentText', '보안규정관리', '보안 정책 및 규정 관리', '/apps/security-policy-management', true, ${currentMaxOrder + 11}, 'system', 'system');
    `;
    
    const insertResult = await client.query(newMenusData);
    console.log(`✅ ${insertResult.rowCount}개 새 메뉴 데이터 추가 완료`);

    // 3단계: 전체 메뉴 구조 확인
    console.log('\n3️⃣ 전체 메뉴 구조 확인...');
    const allMenusResult = await client.query(`
      SELECT id, menu_level, menu_category, menu_icon, menu_page, menu_description, is_enabled, display_order
      FROM admin_systemsetting_menu 
      ORDER BY display_order
    `);
    
    console.log(`📊 총 메뉴 개수: ${allMenusResult.rows.length}개`);
    console.log('\n📋 전체 메뉴 구조:');
    
    let currentCategory = '';
    allMenusResult.rows.forEach((row, index) => {
      if (row.menu_level === 0) {
        if (currentCategory !== row.menu_category) {
          currentCategory = row.menu_category;
          console.log(`\n🏷️  ${row.menu_category} 그룹:`);
        }
      }
      
      const indent = row.menu_level === 0 ? '  ' : '    ';
      const levelIcon = row.menu_level === 0 ? '📁' : '📄';
      
      console.log(`${indent}${levelIcon} [${row.display_order}] ${row.menu_page} (${row.menu_icon})`);
      console.log(`${indent}   📝 ${row.menu_description}`);
    });

    // 4단계: 그룹별 통계
    console.log('\n4️⃣ 그룹별 메뉴 통계:');
    const statsResult = await client.query(`
      SELECT 
        menu_category,
        COUNT(*) as total_count,
        SUM(CASE WHEN menu_level = 0 THEN 1 ELSE 0 END) as group_count,
        SUM(CASE WHEN menu_level = 1 THEN 1 ELSE 0 END) as item_count
      FROM admin_systemsetting_menu 
      GROUP BY menu_category
      ORDER BY MIN(display_order)
    `);
    
    statsResult.rows.forEach(row => {
      console.log(`📊 ${row.menu_category}: 총 ${row.total_count}개 (그룹 ${row.group_count}개, 항목 ${row.item_count}개)`);
    });

    return true;
  } catch (error) {
    console.error('❌ IT메뉴/보안메뉴 추가 오류:', error);
    return false;
  } finally {
    await client.end();
    console.log('\n🔌 PostgreSQL 연결 종료');
  }
}

addITAndSecurityMenus().then((success) => {
  if (success) {
    console.log('\n🎉 IT메뉴와 보안메뉴 추가 완료!');
    console.log('✅ 새로운 메뉴 그룹들이 추가되었습니다.');
    console.log('📝 추가된 내용:');
    console.log('   • IT메뉴: VOC관리, 솔루션관리, 하드웨어관리, 소프트웨어관리, IT교육관리');
    console.log('   • 보안메뉴: 보안점검관리, 보안교육관리, 보안사고관리, 보안규정관리');
  } else {
    console.log('\n❌ IT메뉴와 보안메뉴 추가 실패');
  }
  process.exit(success ? 0 : 1);
});