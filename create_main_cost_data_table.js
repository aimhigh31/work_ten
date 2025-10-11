const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createCostDataTable() {
  console.log('🔧 main_cost_data 테이블 생성 시작...');

  const createTableSQL = `
    -- main_cost_data 테이블 생성
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

    -- 인덱스 생성
    CREATE INDEX IF NOT EXISTS idx_main_cost_data_code ON main_cost_data(code);
    CREATE INDEX IF NOT EXISTS idx_main_cost_data_registration_date ON main_cost_data(registration_date);
    CREATE INDEX IF NOT EXISTS idx_main_cost_data_status ON main_cost_data(status);
    CREATE INDEX IF NOT EXISTS idx_main_cost_data_team ON main_cost_data(team);
    CREATE INDEX IF NOT EXISTS idx_main_cost_data_is_active ON main_cost_data(is_active);

    -- updated_at 자동 업데이트 트리거 함수
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- 트리거 생성
    DROP TRIGGER IF EXISTS update_main_cost_data_updated_at ON main_cost_data;
    CREATE TRIGGER update_main_cost_data_updated_at
      BEFORE UPDATE ON main_cost_data
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    -- RLS 비활성화
    ALTER TABLE main_cost_data DISABLE ROW LEVEL SECURITY;

    COMMENT ON TABLE main_cost_data IS '비용관리 메인 데이터';
    COMMENT ON COLUMN main_cost_data.id IS '고유 ID';
    COMMENT ON COLUMN main_cost_data.no IS '순번';
    COMMENT ON COLUMN main_cost_data.registration_date IS '등록일';
    COMMENT ON COLUMN main_cost_data.code IS '비용 코드';
    COMMENT ON COLUMN main_cost_data.cost_type IS '비용유형';
    COMMENT ON COLUMN main_cost_data.title IS '제목';
    COMMENT ON COLUMN main_cost_data.content IS '세부내용';
    COMMENT ON COLUMN main_cost_data.amount IS '합계금액';
    COMMENT ON COLUMN main_cost_data.team IS '팀';
    COMMENT ON COLUMN main_cost_data.assignee IS '담당자';
    COMMENT ON COLUMN main_cost_data.status IS '상태';
    COMMENT ON COLUMN main_cost_data.start_date IS '시작일';
    COMMENT ON COLUMN main_cost_data.completion_date IS '완료일';
    COMMENT ON COLUMN main_cost_data.attachments IS '첨부파일 정보 (JSON)';
    COMMENT ON COLUMN main_cost_data.is_active IS '활성화 상태';
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (error) {
      console.error('❌ 테이블 생성 실패:', error);

      // SQL을 직접 실행해보기
      console.log('📝 SQL 직접 실행 시도...');
      console.log(createTableSQL);
      console.log('\n위 SQL을 Supabase SQL Editor에서 직접 실행하세요.');
      return;
    }

    console.log('✅ main_cost_data 테이블 생성 완료!');

    // 테이블 확인
    const { data: tableData, error: selectError } = await supabase
      .from('main_cost_data')
      .select('*')
      .limit(1);

    if (selectError) {
      console.error('❌ 테이블 확인 실패:', selectError);
    } else {
      console.log('✅ 테이블 접근 가능');
    }

  } catch (err) {
    console.error('❌ 오류 발생:', err);
    console.log('\n📝 아래 SQL을 Supabase SQL Editor에서 직접 실행하세요:');
    console.log('=====================================');
    console.log(createTableSQL);
    console.log('=====================================');
  }
}

// 샘플 데이터 삽입
async function insertSampleData() {
  console.log('\n📊 샘플 데이터 삽입 시작...');

  const sampleData = [
    {
      no: 1,
      registration_date: '2025-09-28',
      code: 'COST-25-001',
      cost_type: '솔루션',
      title: 'ERP 시스템 라이선스',
      content: 'SAP ERP 시스템 연간 라이선스 구매',
      amount: 150000000,
      team: 'IT팀',
      assignee: '김철수',
      status: '완료',
      start_date: '2025-09-01',
      completion_date: '2025-09-28',
      attachments: JSON.stringify([]),
      is_active: true
    },
    {
      no: 2,
      registration_date: '2025-09-25',
      code: 'COST-25-002',
      cost_type: '하드웨어',
      title: '서버 구매',
      content: 'Dell PowerEdge R740 서버 3대',
      amount: 84000000,
      team: 'IT팀',
      assignee: '이민수',
      status: '진행',
      start_date: '2025-09-20',
      completion_date: null,
      attachments: JSON.stringify([]),
      is_active: true
    },
    {
      no: 3,
      registration_date: '2025-09-20',
      code: 'COST-25-003',
      cost_type: '출장경비',
      title: '해외 컨퍼런스 참가',
      content: 'AWS re:Invent 2025 참가 경비',
      amount: 8500000,
      team: 'IT팀',
      assignee: '송민호',
      status: '대기',
      start_date: '2025-12-01',
      completion_date: null,
      attachments: JSON.stringify([]),
      is_active: true
    }
  ];

  try {
    const { data, error } = await supabase
      .from('main_cost_data')
      .insert(sampleData)
      .select();

    if (error) {
      console.error('❌ 샘플 데이터 삽입 실패:', error);
      return;
    }

    console.log('✅ 샘플 데이터 삽입 완료:', data.length, '개');
  } catch (err) {
    console.error('❌ 오류 발생:', err);
  }
}

async function main() {
  await createCostDataTable();

  // 샘플 데이터 삽입 여부 확인
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('\n샘플 데이터를 삽입하시겠습니까? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y') {
      await insertSampleData();
    }
    readline.close();
    process.exit(0);
  });
}

main();
