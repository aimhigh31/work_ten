const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
const client = new Client({ connectionString });

async function removeConstraints() {
  try {
    await client.connect();
    console.log("✅ PostgreSQL 연결 성공");

    // 모든 CHECK 제약조건 제거
    const constraints = [
      "it_solution_data_team_check",
      "it_solution_data_development_type_check",
      "it_solution_data_solution_type_check",
      "it_solution_data_status_check"
    ];

    for (const constraint of constraints) {
      try {
        await client.query(`ALTER TABLE it_solution_data DROP CONSTRAINT ${constraint}`);
        console.log(`✅ ${constraint} 제거 완료`);
      } catch (err) {
        console.log(`⚠️ ${constraint} 제거 실패:`, err.message);
      }
    }

    console.log("\n🎉 모든 CHECK 제약조건 제거 완료!");

  } catch (error) {
    console.error("❌ 오류:", error.message);
  } finally {
    await client.end();
  }
}

removeConstraints();
