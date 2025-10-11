const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function createMainEducationDataTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // main_education_data 테이블 생성
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS main_education_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        registration_date DATE NOT NULL,
        start_date DATE,
        completion_date DATE,
        education_category VARCHAR(100),
        title VARCHAR(500),
        description TEXT,
        education_type VARCHAR(100),
        team VARCHAR(100),
        assignee_id UUID,
        assignee_name VARCHAR(100),
        status VARCHAR(50) DEFAULT '예정',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await client.query(createTableQuery);
    console.log('✅ main_education_data 테이블 생성 완료');

    // 인덱스 생성
    await client.query('CREATE INDEX IF NOT EXISTS idx_education_code ON main_education_data(code);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_education_registration_date ON main_education_data(registration_date DESC);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_education_is_active ON main_education_data(is_active);');
    console.log('✅ 인덱스 생성 완료');

    // updated_at 자동 업데이트 트리거 함수 생성
    const createTriggerFunctionQuery = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    await client.query(createTriggerFunctionQuery);
    console.log('✅ 트리거 함수 생성 완료');

    // 트리거 생성
    const createTriggerQuery = `
      DROP TRIGGER IF EXISTS update_main_education_data_updated_at ON main_education_data;
      CREATE TRIGGER update_main_education_data_updated_at
        BEFORE UPDATE ON main_education_data
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;

    await client.query(createTriggerQuery);
    console.log('✅ 트리거 생성 완료');

    // RLS 비활성화
    await client.query('ALTER TABLE main_education_data DISABLE ROW LEVEL SECURITY;');
    console.log('✅ RLS 비활성화 완료');

    // 테스트 데이터 삽입
    const insertTestDataQuery = `
      INSERT INTO main_education_data (
        code, registration_date, start_date, completion_date,
        education_category, title, description, education_type,
        team, assignee_name, status
      ) VALUES
      (
        'MAIN-EDU-25-001',
        '2025-01-10',
        '2025-01-15',
        '2025-02-15',
        '기술교육',
        'React 고급 과정',
        'React Hooks와 성능 최적화를 다루는 고급 과정입니다.',
        '온라인',
        '개발팀',
        '김민수',
        '진행중'
      ),
      (
        'MAIN-EDU-25-002',
        '2025-01-18',
        '2025-02-01',
        '2025-02-20',
        '역량교육',
        '형상관리 스킬 향상',
        'Git 고급 사용법과 협업 전략을 배웁니다.',
        '오프라인',
        '기획팀',
        '이영희',
        '예정'
      ),
      (
        'MAIN-EDU-25-003',
        '2025-02-05',
        '2025-03-01',
        '2025-03-15',
        '리더십',
        '팀 리딩의 이해',
        '효과적인 팀 관리와 리더십 스킬을 향상시킵니다.',
        '혼합',
        '디자인팀',
        '박지훈',
        '예정'
      ),
      (
        'MAIN-EDU-25-004',
        '2025-02-12',
        '2025-02-15',
        '2025-04-15',
        '외국어',
        'Business English',
        '비즈니스 영어 회화 및 이메일 작성법을 배웁니다.',
        '온라인',
        '마케팅팀',
        '최수인',
        '진행중'
      ),
      (
        'MAIN-EDU-25-005',
        '2025-02-20',
        '2025-03-01',
        '2025-03-31',
        '기술교육',
        'AI/ML 기초',
        '인공지능과 머신러닝의 기본 개념을 학습합니다.',
        '온라인',
        '개발팀',
        '정우진',
        '예정'
      )
      ON CONFLICT (code) DO NOTHING;
    `;

    await client.query(insertTestDataQuery);
    console.log('✅ 테스트 데이터 삽입 완료');

    // 데이터 확인
    const result = await client.query('SELECT * FROM main_education_data ORDER BY registration_date DESC;');
    console.log('\n📊 생성된 데이터:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await client.end();
    console.log('✅ 연결 종료');
  }
}

createMainEducationDataTable();
