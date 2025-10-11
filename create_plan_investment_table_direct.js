const { Pool } = require('pg');
require("dotenv").config({ path: ".env.local" });

// PostgreSQL 직접 연결
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
});

async function createInvestmentTable() {
  const client = await pool.connect();

  try {
    console.log("🚀 plan_investment_data 테이블 생성 시작...");

    // 1. 테이블 생성
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS plan_investment_data (
        id SERIAL PRIMARY KEY,
        no INTEGER UNIQUE NOT NULL,
        registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
        code VARCHAR(50) UNIQUE NOT NULL,
        investment_type VARCHAR(20) NOT NULL CHECK (investment_type IN ('주식', '채권', '펀드', '부동산', '원자재', '기타')),
        investment_name VARCHAR(200) NOT NULL,
        amount BIGINT NOT NULL DEFAULT 0,
        team VARCHAR(50) NOT NULL CHECK (team IN ('투자팀', '분석팀', '자산운용팀', '리스크관리팀')),
        assignee VARCHAR(100),
        status VARCHAR(20) NOT NULL DEFAULT '대기' CHECK (status IN ('대기', '진행', '완료', '홀딩')),
        start_date DATE,
        completed_date DATE,
        expected_return DECIMAL(15,2) DEFAULT 0,
        actual_return DECIMAL(15,2),
        risk_level VARCHAR(20) NOT NULL DEFAULT '보통' CHECK (risk_level IN ('낮음', '보통', '높음', '매우높음')),
        attachments JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'system',
        updated_by VARCHAR(100) DEFAULT 'system',
        is_active BOOLEAN DEFAULT true
      );
    `;

    await client.query(createTableSQL);
    console.log("✅ plan_investment_data 테이블 생성 완료");

    // 2. RLS 비활성화
    const disableRLSSQL = `ALTER TABLE plan_investment_data DISABLE ROW LEVEL SECURITY;`;
    await client.query(disableRLSSQL);
    console.log("✅ RLS 정책 비활성화 완료");

    // 3. 인덱스 생성
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_plan_investment_no ON plan_investment_data(no);`,
      `CREATE INDEX IF NOT EXISTS idx_plan_investment_code ON plan_investment_data(code);`,
      `CREATE INDEX IF NOT EXISTS idx_plan_investment_status ON plan_investment_data(status);`,
      `CREATE INDEX IF NOT EXISTS idx_plan_investment_assignee ON plan_investment_data(assignee);`,
      `CREATE INDEX IF NOT EXISTS idx_plan_investment_type ON plan_investment_data(investment_type);`,
      `CREATE INDEX IF NOT EXISTS idx_plan_investment_date ON plan_investment_data(registration_date);`
    ];

    for (const query of indexQueries) {
      await client.query(query);
    }
    console.log("✅ 인덱스 생성 완료");

    // 4. 업데이트 트리거 생성
    const createTriggerSQL = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_plan_investment_updated_at ON plan_investment_data;
      CREATE TRIGGER update_plan_investment_updated_at
        BEFORE UPDATE ON plan_investment_data
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    await client.query(createTriggerSQL);
    console.log("✅ 업데이트 트리거 생성 완료");

    // 5. 기존 데이터 확인
    const existingDataResult = await client.query('SELECT COUNT(*) as count FROM plan_investment_data');
    const existingCount = parseInt(existingDataResult.rows[0].count);

    if (existingCount === 0) {
      console.log("📝 샘플 투자 데이터 생성 중...");

      // 샘플 데이터 삽입
      const sampleData = [
        {
          no: 1,
          code: 'INV-25-001',
          investment_type: '주식',
          investment_name: '삼성전자 주식 투자',
          amount: 1000000000,
          team: '투자팀',
          assignee: '김투자',
          status: '진행',
          start_date: '2025-01-15',
          expected_return: 8.5,
          risk_level: '보통'
        },
        {
          no: 2,
          code: 'INV-25-002',
          investment_type: '펀드',
          investment_name: '국내 성장형 펀드',
          amount: 500000000,
          team: '분석팀',
          assignee: '이분석',
          status: '대기',
          expected_return: 12.0,
          risk_level: '높음'
        },
        {
          no: 3,
          code: 'INV-25-003',
          investment_type: '부동산',
          investment_name: '강남 오피스텔 투자',
          amount: 2000000000,
          team: '자산운용팀',
          assignee: '박부동산',
          status: '완료',
          start_date: '2024-12-01',
          completed_date: '2025-01-10',
          expected_return: 6.0,
          actual_return: 7.2,
          risk_level: '낮음'
        },
        {
          no: 4,
          code: 'INV-25-004',
          investment_type: '채권',
          investment_name: '국고채 3년물',
          amount: 800000000,
          team: '리스크관리팀',
          assignee: '최채권',
          status: '홀딩',
          start_date: '2024-11-15',
          expected_return: 4.5,
          risk_level: '낮음'
        }
      ];

      const insertSQL = `
        INSERT INTO plan_investment_data (
          no, code, investment_type, investment_name, amount, team, assignee,
          status, start_date, completed_date, expected_return, actual_return, risk_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `;

      for (const investment of sampleData) {
        await client.query(insertSQL, [
          investment.no,
          investment.code,
          investment.investment_type,
          investment.investment_name,
          investment.amount,
          investment.team,
          investment.assignee,
          investment.status,
          investment.start_date,
          investment.completed_date || null,
          investment.expected_return,
          investment.actual_return || null,
          investment.risk_level
        ]);
        console.log(`✅ ${investment.investment_name} 생성 완료`);
      }
    } else {
      console.log(`📊 기존 투자 데이터 ${existingCount}개 발견, 샘플 데이터 삽입 생략`);
    }

    // 6. 최종 확인
    const finalResult = await client.query(`
      SELECT * FROM plan_investment_data
      WHERE is_active = true
      ORDER BY no ASC
    `);

    console.log(`🎉 plan_investment_data 테이블 설정 완료! 총 ${finalResult.rows.length}개 투자 데이터:`);
    finalResult.rows.forEach((investment, index) => {
      console.log(`  ${index + 1}. ${investment.investment_name} (${investment.code}) - ${investment.status}`);
    });

  } catch (err) {
    console.error("❌ 오류 발생:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

createInvestmentTable();