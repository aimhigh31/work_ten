const { createClient } = require("@supabase/supabase-js");
const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

async function checkConstraints() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log("🔍 테이블 제약 조건 확인...");

    // CHECK 제약 조건 조회
    const result = await client.query(`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(c.oid) as constraint_definition
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE conrelid = 'plan_investment_data'::regclass
        AND contype = 'c'
      ORDER BY conname;
    `);

    console.log("\n📋 CHECK 제약 조건 목록:");
    result.rows.forEach(row => {
      console.log(`\n제약 조건명: ${row.constraint_name}`);
      console.log(`정의: ${row.constraint_definition}`);
    });

  } catch (err) {
    console.error("❌ 오류:", err.message);
  } finally {
    await client.end();
  }
}

checkConstraints();
