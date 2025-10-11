const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Supabase URL에서 데이터베이스 연결 정보 추출
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

// Supabase URL을 PostgreSQL 연결 문자열로 변환
// 예: https://xxx.supabase.co -> postgres://postgres:[password]@db.xxx.supabase.co:5432/postgres
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Supabase URL 형식이 올바르지 않습니다:', supabaseUrl);
  process.exit(1);
}

console.log('📡 Supabase 프로젝트:', projectRef);
console.log('⚠️  데이터베이스 비밀번호를 입력해야 합니다.');
console.log('   Supabase Dashboard → Settings → Database → Connection string에서 확인하세요.');
console.log('');

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('PostgreSQL 비밀번호를 입력하세요: ', async (password) => {
  readline.close();

  const connectionString = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;

  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('\n🔌 데이터베이스 연결 중...');
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공!');

    console.log('\n🔧 main_cost_data 테이블 생성 중...');

    // 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS main_cost_data (
        id SERIAL PRIMARY KEY,
        no INTEGER,
        registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
        code VARCHAR(50) UNIQUE NOT NULL,
        cost_type VARCHAR(50) NOT NULL,
        title VARCHAR(255),
        content TEXT,
        amount BIGINT DEFAULT 0,
        team VARCHAR(100),
        assignee VARCHAR(100),
        status VARCHAR(50) DEFAULT '대기',
        start_date DATE,
        completion_date DATE,
        attachments JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by VARCHAR(100) DEFAULT 'system',
        updated_by VARCHAR(100) DEFAULT 'system',
        is_active BOOLEAN DEFAULT true
      );
    `);
    console.log('✅ 테이블 생성 완료');

    // 인덱스 생성
    console.log('🔧 인덱스 생성 중...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_main_cost_data_code ON main_cost_data(code);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_main_cost_data_registration_date ON main_cost_data(registration_date);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_main_cost_data_status ON main_cost_data(status);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_main_cost_data_team ON main_cost_data(team);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_main_cost_data_is_active ON main_cost_data(is_active);');
    console.log('✅ 인덱스 생성 완료');

    // 트리거 함수 생성
    console.log('🔧 트리거 생성 중...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await client.query('DROP TRIGGER IF EXISTS update_main_cost_data_updated_at ON main_cost_data;');
    await client.query(`
      CREATE TRIGGER update_main_cost_data_updated_at
        BEFORE UPDATE ON main_cost_data
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ 트리거 생성 완료');

    // RLS 비활성화
    console.log('🔧 RLS 비활성화 중...');
    await client.query('ALTER TABLE main_cost_data DISABLE ROW LEVEL SECURITY;');
    console.log('✅ RLS 비활성화 완료');

    // 코멘트 추가
    console.log('🔧 테이블 설명 추가 중...');
    await client.query("COMMENT ON TABLE main_cost_data IS '비용관리 메인 데이터';");
    await client.query("COMMENT ON COLUMN main_cost_data.id IS '고유 ID';");
    await client.query("COMMENT ON COLUMN main_cost_data.no IS '순번';");
    await client.query("COMMENT ON COLUMN main_cost_data.registration_date IS '등록일';");
    await client.query("COMMENT ON COLUMN main_cost_data.code IS '비용 코드';");
    await client.query("COMMENT ON COLUMN main_cost_data.cost_type IS '비용유형';");
    await client.query("COMMENT ON COLUMN main_cost_data.title IS '제목';");
    await client.query("COMMENT ON COLUMN main_cost_data.content IS '세부내용';");
    await client.query("COMMENT ON COLUMN main_cost_data.amount IS '합계금액';");
    await client.query("COMMENT ON COLUMN main_cost_data.team IS '팀';");
    await client.query("COMMENT ON COLUMN main_cost_data.assignee IS '담당자';");
    await client.query("COMMENT ON COLUMN main_cost_data.status IS '상태';");
    await client.query("COMMENT ON COLUMN main_cost_data.start_date IS '시작일';");
    await client.query("COMMENT ON COLUMN main_cost_data.completion_date IS '완료일';");
    await client.query("COMMENT ON COLUMN main_cost_data.attachments IS '첨부파일 정보 (JSON)';");
    await client.query("COMMENT ON COLUMN main_cost_data.is_active IS '활성화 상태';");
    console.log('✅ 테이블 설명 추가 완료');

    // 샘플 데이터 삽입
    console.log('\n📊 샘플 데이터 삽입 중...');
    await client.query(`
      INSERT INTO main_cost_data (no, registration_date, code, cost_type, title, content, amount, team, assignee, status, start_date, completion_date, attachments, is_active)
      VALUES
        (1, '2025-09-28', 'COST-25-001', '솔루션', 'ERP 시스템 라이선스', 'SAP ERP 시스템 연간 라이선스 구매', 150000000, 'IT팀', '김철수', '완료', '2025-09-01', '2025-09-28', '[]'::jsonb, true),
        (2, '2025-09-25', 'COST-25-002', '하드웨어', '서버 구매', 'Dell PowerEdge R740 서버 3대', 84000000, 'IT팀', '이민수', '진행', '2025-09-20', NULL, '[]'::jsonb, true),
        (3, '2025-09-20', 'COST-25-003', '출장경비', '해외 컨퍼런스 참가', 'AWS re:Invent 2025 참가 경비', 8500000, 'IT팀', '송민호', '대기', '2025-12-01', NULL, '[]'::jsonb, true)
      ON CONFLICT (code) DO NOTHING;
    `);
    console.log('✅ 샘플 데이터 삽입 완료');

    // 데이터 확인
    const result = await client.query('SELECT * FROM main_cost_data WHERE is_active = true ORDER BY registration_date DESC;');
    console.log(`\n✅ 테이블 생성 및 데이터 삽입 완료! (${result.rows.length}개 레코드)`);
    console.log('\n📋 샘플 데이터:');
    result.rows.forEach(row => {
      console.log(`  - ${row.code}: ${row.title} (${row.cost_type}) - ${row.amount.toLocaleString()}원`);
    });

  } catch (err) {
    console.error('\n❌ 오류 발생:', err.message);
    console.error('상세:', err);
  } finally {
    await client.end();
    console.log('\n🔌 데이터베이스 연결 종료');
  }
});
