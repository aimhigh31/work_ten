// 현재 메뉴 데이터 상세 확인
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkCurrentMenuData() {
  console.log('📋 현재 메뉴 데이터 상세 확인...');
  
  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 현재 데이터 전체 조회
    const currentData = await client.query(`
      SELECT id, menu_level, menu_category, menu_icon, menu_page, menu_description, menu_url, is_enabled, display_order
      FROM admin_systemsetting_menu 
      ORDER BY display_order
    `);
    
    console.log(`\n📊 현재 데이터 개수: ${currentData.rows.length}개`);
    console.log('\n📋 현재 메뉴 구조:');
    
    currentData.rows.forEach((row, index) => {
      const indent = '  '.repeat(row.menu_level);
      console.log(`${index + 1}. ${indent}[${row.menu_level}] ${row.menu_page} (${row.menu_category})`);
      console.log(`${indent}   📁 ${row.menu_description}`);
      console.log(`${indent}   🔗 ${row.menu_url}`);
      console.log(`${indent}   ⭐ ${row.is_enabled ? '활성' : '비활성'} | 순서: ${row.display_order}`);
      console.log('');
    });

    return currentData.rows;
  } catch (error) {
    console.error('❌ 데이터 확인 오류:', error);
    return [];
  } finally {
    await client.end();
    console.log('🔌 PostgreSQL 연결 종료');
  }
}

checkCurrentMenuData().then((data) => {
  console.log('🎯 현재 메뉴 데이터 확인 완료');
  process.exit(0);
});