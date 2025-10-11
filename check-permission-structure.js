const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
});

async function checkPermissionStructure() {
  try {
    console.log('🔍 권한 시스템 구조 분석...\n');

    // admin_users_rules의 권한 구조 확인
    console.log('📋 admin_users_rules 권한 구조:');
    console.log('========================================');

    const rulesQuery = `
      SELECT role_code, role_name, permissions
      FROM admin_users_rules
      WHERE is_active = true
      ORDER BY display_order;
    `;

    const rulesResult = await pool.query(rulesQuery);

    rulesResult.rows.forEach(row => {
      console.log(`\n✅ ${row.role_code}: ${row.role_name}`);
      console.log('  권한 설정:');

      if (row.permissions) {
        Object.entries(row.permissions).forEach(([menu, permission]) => {
          console.log(`    - ${menu}: ${permission}`);
        });
      }
    });

    // 메뉴 테이블 확인
    console.log('\n\n📋 admin_systemsetting_menu 메뉴 목록:');
    console.log('========================================');

    const menuQuery = `
      SELECT menu_category, menu_page, menu_description, is_enabled
      FROM admin_systemsetting_menu
      WHERE is_enabled = true
      ORDER BY display_order;
    `;

    const menuResult = await pool.query(menuQuery);

    menuResult.rows.forEach(row => {
      console.log(`  - [${row.menu_category}] ${row.menu_page}: ${row.menu_description}`);
    });

    // 사용자와 역할 연결 확인
    console.log('\n\n📋 사용자별 할당된 역할:');
    console.log('========================================');

    const userRolesQuery = `
      SELECT user_name, rule, assigned_roles
      FROM admin_users_userprofiles
      WHERE assigned_roles IS NOT NULL
      LIMIT 10;
    `;

    const userRolesResult = await pool.query(userRolesQuery);

    userRolesResult.rows.forEach(row => {
      console.log(`  - ${row.user_name}:`);
      console.log(`    주 역할: ${row.rule}`);
      console.log(`    할당된 역할들: ${row.assigned_roles}`);
    });

    // 모든 admin_ 테이블 목록
    console.log('\n\n📂 사용 가능한 테이블:');
    console.log('========================================');
    const allTablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'admin_%'
      ORDER BY table_name;
    `;

    const allTablesResult = await pool.query(allTablesQuery);
    allTablesResult.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

  } catch (error) {
    console.error('❌ 구조 확인 실패:', error.message);
  } finally {
    await pool.end();
  }
}

checkPermissionStructure();