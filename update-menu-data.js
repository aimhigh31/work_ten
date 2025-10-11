// 새로운 메뉴 구조로 데이터 업데이트
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function updateMenuData() {
  console.log('🔄 메뉴 데이터 업데이트 시작...');
  
  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 1단계: 기존 데이터 전체 삭제
    console.log('\n1️⃣ 기존 데이터 삭제...');
    await client.query('DELETE FROM admin_systemsetting_menu');
    console.log('✅ 기존 데이터 삭제 완료');

    // 2단계: 새로운 메뉴 구조 데이터 삽입
    console.log('\n2️⃣ 새로운 메뉴 데이터 삽입...');
    
    const newMenuData = `
      INSERT INTO admin_systemsetting_menu (
        menu_level, menu_category, menu_icon, menu_page, 
        menu_description, menu_url, is_enabled, display_order,
        created_by, updated_by
      ) VALUES 
      -- 관리자메뉴 그룹 (레벨 0)
      (0, '관리자메뉴', 'Setting2', '관리자메뉴', '시스템 관리 메뉴', '/', true, 1, 'system', 'system'),
      
      -- 관리자메뉴 하위 항목들 (레벨 1)
      (1, '관리자메뉴', 'TaskSquare', '체크리스트관리', '체크리스트 관리', '/admin-panel/checklist-management', true, 2, 'system', 'system'),
      (1, '관리자메뉴', 'Code', '마스터코드관리', '마스터 코드 관리', '/admin-panel/master-code-management', true, 3, 'system', 'system'),
      (1, '관리자메뉴', 'Profile', '사용자설정', '사용자 설정 관리', '/admin-panel/user-settings', true, 4, 'system', 'system'),
      
      -- 메인메뉴 그룹 (레벨 0)
      (0, '메인메뉴', 'Home3', '메인메뉴', '메인 대시보드', '/', true, 5, 'system', 'system'),
      
      -- 메인메뉴 하위 항목들 (레벨 1)
      (1, '메인메뉴', 'Chart', '대시보드', '현황 대시보드', '/dashboard/default', true, 6, 'system', 'system'),
      (1, '메인메뉴', 'TaskSquare', '업무관리', '업무 프로세스 관리', '/apps/task-management', true, 7, 'system', 'system'),
      (1, '메인메뉴', 'TrendUp', 'KPI관리', 'KPI 성과 관리', '/apps/kpi-management', true, 8, 'system', 'system'),
      (1, '메인메뉴', 'Calendar1', '일정관리', '일정 및 스케줄 관리', '/apps/schedule-management', true, 9, 'system', 'system'),
      (1, '메인메뉴', 'Book1', '개인교육관리', '개인 교육 관리', '/apps/personal-education-management', true, 10, 'system', 'system'),
      (1, '메인메뉴', 'Money', '비용관리', '프로젝트 비용 관리', '/apps/cost-management', true, 11, 'system', 'system'),
      
      -- 기획메뉴 그룹 (레벨 0)
      (0, '기획메뉴', 'Category2', '기획메뉴', '기획 업무 관리', '/', true, 12, 'system', 'system'),
      
      -- 기획메뉴 하위 항목들 (레벨 1)
      (1, '기획메뉴', 'MoneyRecive', '매출관리', '매출 현황 관리', '/apps/sales-management', true, 13, 'system', 'system'),
      (1, '기획메뉴', 'Money', '투자관리', '투자 포트폴리오 관리', '/apps/investment-management', true, 14, 'system', 'system');
    `;
    
    const insertResult = await client.query(newMenuData);
    console.log(`✅ ${insertResult.rowCount}개 메뉴 데이터 삽입 완료`);

    // 3단계: 업데이트된 데이터 확인
    console.log('\n3️⃣ 업데이트된 데이터 확인...');
    const updatedData = await client.query(`
      SELECT id, menu_level, menu_category, menu_icon, menu_page, menu_description, is_enabled, display_order
      FROM admin_systemsetting_menu 
      ORDER BY display_order
    `);
    
    console.log(`📊 총 데이터 개수: ${updatedData.rows.length}개`);
    console.log('\n📋 새로운 메뉴 구조:');
    
    let currentCategory = '';
    updatedData.rows.forEach((row, index) => {
      if (row.menu_level === 0) {
        if (currentCategory !== row.menu_category) {
          currentCategory = row.menu_category;
          console.log(`\n🏷️  ${row.menu_category} 그룹:`);
        }
      }
      
      const indent = row.menu_level === 0 ? '  ' : '    ';
      const levelIcon = row.menu_level === 0 ? '📁' : '📄';
      
      console.log(`${indent}${levelIcon} [${row.display_order}] ${row.menu_page}`);
      console.log(`${indent}   📝 ${row.menu_description}`);
      console.log(`${indent}   ⭐ ${row.is_enabled ? '활성' : '비활성'}`);
    });

    return true;
  } catch (error) {
    console.error('❌ 메뉴 데이터 업데이트 오류:', error);
    return false;
  } finally {
    await client.end();
    console.log('\n🔌 PostgreSQL 연결 종료');
  }
}

updateMenuData().then((success) => {
  if (success) {
    console.log('\n🎉 메뉴 데이터 업데이트 완료!');
    console.log('✅ 새로운 메뉴 구조가 적용되었습니다.');
    console.log('📝 변경사항:');
    console.log('   • 관리자메뉴: 체크리스트관리, 마스터코드관리, 사용자설정 추가');
    console.log('   • 메인메뉴: KPI관리, 일정관리, 개인교육관리 추가');
    console.log('   • 기획메뉴: 매출관리, 투자관리 추가 (교육관리 제거)');
  } else {
    console.log('\n❌ 메뉴 데이터 업데이트 실패');
  }
  process.exit(success ? 0 : 1);
});