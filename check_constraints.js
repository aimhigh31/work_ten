const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
const client = new Client({ connectionString });

async function checkConstraints() {
  try {
    await client.connect();
    console.log("✅ PostgreSQL 연결 성공");

    // CHECK 제약조건 확인
    const result = await client.query(`
      SELECT
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM
        pg_constraint
      WHERE
        conrelid = 'it_solution_data'::regclass
        AND contype = 'c'
      ORDER BY
        conname;
    `);

    console.log("\n📋 it_solution_data 테이블의 CHECK 제약조건:");
    result.rows.forEach(row => {
      console.log(`\n제약조건명: ${row.constraint_name}`);
      console.log(`정의: ${row.constraint_definition}`);
    });

    // 모든 제약조건 제거 쿼리 생성
    console.log("\n🔧 제약조건 제거 SQL:");
    result.rows.forEach(row => {
      console.log(`ALTER TABLE it_solution_data DROP CONSTRAINT ${row.constraint_name};`);
    });

  } catch (error) {
    console.error("❌ 오류:", error.message);
  } finally {
    await client.end();
  }
}

checkConstraints();
