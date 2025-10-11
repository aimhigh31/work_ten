const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL 또는 SUPABASE_DB_URL 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTable() {
  try {
    console.log('🔌 데이터베이스 연결 중...');
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공!');

    console.log('\n🔧 main_cost_finance 테이블 생성 중...');

    // 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS main_cost_finance (
        id SERIAL PRIMARY KEY,
        cost_id INTEGER NOT NULL,
        item_order INTEGER NOT NULL,
        code VARCHAR(50),
        cost_type VARCHAR(50),
        content TEXT,
        quantity INTEGER DEFAULT 1,
        unit_price BIGINT DEFAULT 0,
        amount BIGINT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by VARCHAR(100) DEFAULT 'user',
        updated_by VARCHAR(100) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,

        -- 외래키 제약 조건
        CONSTRAINT main_cost_finance_cost_id_fkey
          FOREIGN KEY (cost_id) REFERENCES main_cost_data(id)
          ON DELETE CASCADE
      );
    `);
    console.log('✅ 테이블 생성 완료');

    // 인덱스 생성
    console.log('🔧 인덱스 생성 중...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_main_cost_finance_cost_id ON main_cost_finance(cost_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_main_cost_finance_is_active ON main_cost_finance(is_active);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_main_cost_finance_item_order ON main_cost_finance(item_order);');
    console.log('✅ 인덱스 생성 완료');

    // 트리거 생성 (updated_at 자동 업데이트)
    console.log('🔧 트리거 생성 중...');
    await client.query(`
      DROP TRIGGER IF EXISTS update_main_cost_finance_updated_at ON main_cost_finance;
      CREATE TRIGGER update_main_cost_finance_updated_at
        BEFORE UPDATE ON main_cost_finance
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ 트리거 생성 완료');

    // RLS 비활성화
    console.log('🔧 RLS 비활성화 중...');
    await client.query('ALTER TABLE main_cost_finance DISABLE ROW LEVEL SECURITY;');
    console.log('✅ RLS 비활성화 완료');

    // 코멘트 추가
    console.log('🔧 테이블 설명 추가 중...');
    await client.query("COMMENT ON TABLE main_cost_finance IS '비용관리 금액 상세 데이터';");
    await client.query("COMMENT ON COLUMN main_cost_finance.id IS '고유 ID';");
    await client.query("COMMENT ON COLUMN main_cost_finance.cost_id IS '비용 ID (외래키: main_cost_data.id)';");
    await client.query("COMMENT ON COLUMN main_cost_finance.item_order IS '항목 순서';");
    await client.query("COMMENT ON COLUMN main_cost_finance.code IS '항목 코드';");
    await client.query("COMMENT ON COLUMN main_cost_finance.cost_type IS '비용유형';");
    await client.query("COMMENT ON COLUMN main_cost_finance.content IS '내용';");
    await client.query("COMMENT ON COLUMN main_cost_finance.quantity IS '수량';");
    await client.query("COMMENT ON COLUMN main_cost_finance.unit_price IS '단가';");
    await client.query("COMMENT ON COLUMN main_cost_finance.amount IS '금액';");
    await client.query("COMMENT ON COLUMN main_cost_finance.is_active IS '활성화 상태';");
    console.log('✅ 테이블 설명 추가 완료');

    // 샘플 데이터 삽입
    console.log('\n📊 샘플 데이터 삽입 중...');

    // COST-25-001의 금액 상세
    await client.query(`
      INSERT INTO main_cost_finance (cost_id, item_order, code, cost_type, content, quantity, unit_price, amount, is_active)
      SELECT
        id as cost_id,
        1 as item_order,
        'COST-25-001-01' as code,
        '솔루션' as cost_type,
        'SAP ERP 기본 라이선스' as content,
        1 as quantity,
        100000000 as unit_price,
        100000000 as amount,
        true as is_active
      FROM main_cost_data
      WHERE code = 'COST-25-001'
      ON CONFLICT DO NOTHING;

      INSERT INTO main_cost_finance (cost_id, item_order, code, cost_type, content, quantity, unit_price, amount, is_active)
      SELECT
        id as cost_id,
        2 as item_order,
        'COST-25-001-02' as code,
        '솔루션' as cost_type,
        '유지보수 연간 계약' as content,
        1 as quantity,
        50000000 as unit_price,
        50000000 as amount,
        true as is_active
      FROM main_cost_data
      WHERE code = 'COST-25-001'
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ 샘플 데이터 삽입 완료');

    // 데이터 확인
    const result = await client.query(`
      SELECT cf.*, cd.code as cost_code, cd.title as cost_title
      FROM main_cost_finance cf
      JOIN main_cost_data cd ON cf.cost_id = cd.id
      WHERE cf.is_active = true
      ORDER BY cf.cost_id, cf.item_order;
    `);

    console.log(`\n✅ 테이블 생성 및 데이터 삽입 완료! (${result.rows.length}개 레코드)`);
    console.log('\n📋 샘플 데이터:');
    result.rows.forEach(row => {
      console.log(`  - ${row.cost_code}: ${row.content} - ${row.amount.toLocaleString()}원 (${row.quantity}개 x ${row.unit_price.toLocaleString()}원)`);
    });

    console.log('\n🎉 모든 작업이 완료되었습니다!');

  } catch (err) {
    console.error('\n❌ 오류 발생:', err.message);
    console.error('\n상세 오류:', err);
  } finally {
    await client.end();
    console.log('\n🔌 데이터베이스 연결 종료');
  }
}

createTable();
