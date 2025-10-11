const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
});

async function checkPermissionTables() {
  try {
    console.log('🔍 권한 관련 테이블 구조 확인...\n');

    // admin_users_rules 테이블 확인
    const rulesTableQuery = `
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'admin_users_rules'
      ORDER BY ordinal_position;
    `;

    const rulesResult = await pool.query(rulesTableQuery);

    if (rulesResult.rows.length > 0) {
      console.log('📋 admin_users_rules 테이블 구조:');
      rulesResult.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
      });

      // 데이터 샘플 확인
      const sampleQuery = `SELECT * FROM admin_users_rules LIMIT 5;`;
      const sampleResult = await pool.query(sampleQuery);
      console.log(`\n📊 admin_users_rules 샘플 데이터 (${sampleResult.rows.length}개):`);
      sampleResult.rows.forEach(row => {
        console.log(`  - ID: ${row.id}, 내용: ${JSON.stringify(row)}`);
      });
    } else {
      console.log('❌ admin_users_rules 테이블이 없습니다.');
    }

    // admin_usersettings_role 테이블 확인 (역할 관리)
    console.log('\n\n📋 admin_usersettings_role 테이블 구조:');
    const roleTableQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'admin_usersettings_role'
      ORDER BY ordinal_position;
    `;

    const roleResult = await pool.query(roleTableQuery);
    if (roleResult.rows.length > 0) {
      roleResult.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });

      // 역할 데이터 확인
      const roleDataQuery = `SELECT * FROM admin_usersettings_role LIMIT 5;`;
      const roleDataResult = await pool.query(roleDataQuery);
      console.log(`\n📊 역할 데이터 샘플 (${roleDataResult.rows.length}개):`);
      roleDataResult.rows.forEach(row => {
        console.log(`  - ${row.role_code}: ${row.role_name} (권한: ${row.permissions || '없음'})`);
      });
    }

    // admin_systemsetting_menu 테이블 확인 (메뉴 목록)
    console.log('\n\n📋 admin_systemsetting_menu 테이블 구조:');
    const menuTableQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'admin_systemsetting_menu'
      ORDER BY ordinal_position;
    `;

    const menuResult = await pool.query(menuTableQuery);
    if (menuResult.rows.length > 0) {
      menuResult.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });

      // 메뉴 데이터 확인
      const menuDataQuery = `SELECT id, menu_id, menu_name, description FROM admin_systemsetting_menu ORDER BY menu_id LIMIT 10;`;
      const menuDataResult = await pool.query(menuDataQuery);
      console.log(`\n📊 메뉴 데이터 샘플 (${menuDataResult.rows.length}개):`);
      menuDataResult.rows.forEach(row => {
        console.log(`  - ${row.menu_id}: ${row.menu_name}`);
      });
    }

    // 모든 admin_ 테이블 목록
    console.log('\n\n📂 모든 admin_ 테이블 목록:');
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
    console.error('❌ 테이블 확인 실패:', error);
  } finally {
    await pool.end();
  }
}

checkPermissionTables();