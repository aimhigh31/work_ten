const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

async function removeConstraints() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log("🔧 CHECK 제약 조건 제거 시작...");

    // investment_type 제약 조건 제거
    await client.query(`
      ALTER TABLE plan_investment_data 
      DROP CONSTRAINT IF EXISTS plan_investment_data_investment_type_check;
    `);
    console.log("✅ investment_type 제약 조건 제거 완료");

    // team 제약 조건 제거
    await client.query(`
      ALTER TABLE plan_investment_data 
      DROP CONSTRAINT IF EXISTS plan_investment_data_team_check;
    `);
    console.log("✅ team 제약 조건 제거 완료");

    // status 제약 조건 제거 (선택사항)
    await client.query(`
      ALTER TABLE plan_investment_data 
      DROP CONSTRAINT IF EXISTS plan_investment_data_status_check;
    `);
    console.log("✅ status 제약 조건 제거 완료");

    console.log("\n🎉 모든 제약 조건이 성공적으로 제거되었습니다!");
    console.log("이제 마스터코드와 부서관리의 동적 값을 저장할 수 있습니다.");

  } catch (err) {
    console.error("❌ 오류:", err.message);
  } finally {
    await client.end();
  }
}

removeConstraints();
