// 샘플 데이터 삽입
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function insertSampleData() {
  console.log('📝 샘플 데이터 삽입 시작...');
  
  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 기존 데이터 확인
    const countCheck = await client.query('SELECT COUNT(*) as count FROM "Admin_Systemsetting_Menu"');
    console.log(`현재 데이터 개수: ${countCheck.rows[0].count}개`);

    // 데이터 삽입
    const insertSQL = `
      INSERT INTO "Admin_Systemsetting_Menu" (
        menu_level, menu_category, menu_icon, menu_page, 
        menu_description, menu_url, is_enabled, display_order,
        created_by, updated_by
      ) VALUES 
      (0, '관리자메뉴', 'Setting2', '관리자메뉴', '시스템 관리 메뉴', '/', true, 1, 'system', 'system'),
      (1, '관리자메뉴', 'Setting2', '시스템설정', '시스템 기본 설정 관리', '/admin-panel/system-settings', true, 2, 'system', 'system'),
      (1, '관리자메뉴', 'Profile', '사용자관리', '사용자 계정 관리', '/admin-panel/user-settings', true, 3, 'system', 'system'),
      (0, '메인메뉴', 'Home3', '메인메뉴', '메인 대시보드', '/', true, 4, 'system', 'system'),
      (1, '메인메뉴', 'Chart', '대시보드', '현황 대시보드', '/dashboard/default', true, 5, 'system', 'system'),
      (1, '메인메뉴', 'TaskSquare', '업무관리', '업무 프로세스 관리', '/apps/task-management', true, 6, 'system', 'system'),
      (0, '기획메뉴', 'Category2', '기획메뉴', '기획 업무 관리', '/', true, 7, 'system', 'system'),
      (1, '기획메뉴', 'Money', '비용관리', '프로젝트 비용 관리', '/apps/cost-management', true, 8, 'system', 'system'),
      (1, '기획메뉴', 'Book1', '교육관리', '교육 과정 관리', '/apps/education-management', true, 9, 'system', 'system');
    `;
    
    const insertResult = await client.query(insertSQL);
    console.log(`✅ ${insertResult.rowCount}개 데이터 삽입 완료`);

    // 최종 확인
    const finalCount = await client.query('SELECT COUNT(*) as count FROM "Admin_Systemsetting_Menu"');
    console.log(`📊 총 데이터 개수: ${finalCount.rows[0].count}개`);

    const sampleResult = await client.query(`
      SELECT id, menu_level, menu_category, menu_page, menu_description, is_enabled, display_order
      FROM "Admin_Systemsetting_Menu" 
      ORDER BY display_order 
      LIMIT 10
    `);
    
    console.log('\n📋 전체 데이터:');
    sampleResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. [${row.id}] ${row.menu_page} (${row.menu_category}) - 레벨:${row.menu_level} 순서:${row.display_order}`);
      console.log(`      설명: ${row.menu_description}`);
      console.log(`      활성화: ${row.is_enabled}`);
      console.log('');
    });

    return true;
  } catch (error) {
    console.error('❌ 데이터 삽입 오류:', error);
    return false;
  } finally {
    await client.end();
    console.log('🔌 PostgreSQL 연결 종료');
  }
}

insertSampleData().then((success) => {
  if (success) {
    console.log('🎉 샘플 데이터 삽입 완료!');
    console.log('✅ 이제 프론트엔드에서 Admin_Systemsetting_Menu 테이블을 사용할 수 있습니다.');
  } else {
    console.log('❌ 샘플 데이터 삽입 실패');
  }
  process.exit(success ? 0 : 1);
});