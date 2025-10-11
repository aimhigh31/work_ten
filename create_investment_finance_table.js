const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

async function createInvestmentFinanceTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log("🔧 plan_investment_finance 테이블 생성 시작...");

    // 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS plan_investment_finance (
        id SERIAL PRIMARY KEY,
        investment_id INTEGER NOT NULL,
        item_order INTEGER NOT NULL,
        investment_category VARCHAR NOT NULL,
        item_name VARCHAR NOT NULL,
        budget_amount NUMERIC DEFAULT 0,
        execution_amount NUMERIC DEFAULT 0,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by VARCHAR DEFAULT 'user',
        updated_by VARCHAR DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        
        CONSTRAINT plan_investment_finance_investment_id_fkey
          FOREIGN KEY (investment_id) REFERENCES plan_investment_data(id)
      );
    `);
    
    console.log("✅ plan_investment_finance 테이블 생성 완료");

    // 테이블 구조 확인
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'plan_investment_finance'
      ORDER BY ordinal_position;
    `);

    console.log("\n📋 테이블 컬럼 구조:");
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default || ''}`);
    });

  } catch (err) {
    console.error("❌ 오류:", err.message);
  } finally {
    await client.end();
  }
}

createInvestmentFinanceTable();
