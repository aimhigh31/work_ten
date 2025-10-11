const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addAssignedRolesColumn() {
  try {
    console.log("assigned_roles 컬럼 추가 중...");

    const query = `
      ALTER TABLE admin_users_userprofiles 
      ADD COLUMN IF NOT EXISTS assigned_roles JSONB DEFAULT '[]'::jsonb;
    `;

    await pool.query(query);
    console.log("✅ assigned_roles 컬럼 추가 성공");

    // 기존 role 데이터를 assigned_roles로 마이그레이션
    const migrateQuery = `
      UPDATE admin_users_userprofiles 
      SET assigned_roles = CASE 
        WHEN role IS NOT NULL AND role != '' 
        THEN json_build_array(role)::jsonb
        ELSE '[]'::jsonb
      END
      WHERE assigned_roles = '[]'::jsonb;
    `;

    const result = await pool.query(migrateQuery);
    console.log(`✅ 기존 역할 데이터 마이그레이션 완료: ${result.rowCount}개 행 업데이트`);

  } catch (err) {
    console.error("오류:", err);
  } finally {
    await pool.end();
  }
}

addAssignedRolesColumn();
