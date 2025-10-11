const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function createKpiTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 기존 테이블 삭제 (있다면)
    await client.query(`DROP TABLE IF EXISTS main_kpi_data CASCADE;`);
    console.log('🗑️  기존 테이블 삭제 완료');

    // 테이블 생성
    const createTableQuery = `
      CREATE TABLE main_kpi_data (
        id BIGSERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        work_content TEXT NOT NULL,
        description TEXT,
        management_category VARCHAR(100),
        target_kpi VARCHAR(255),
        current_kpi VARCHAR(255),
        department VARCHAR(100),
        progress INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT '대기',
        start_date DATE,
        completed_date DATE,
        team VARCHAR(100),
        assignee VARCHAR(100),
        registration_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await client.query(createTableQuery);
    console.log('✅ main_kpi_data 테이블 생성 완료');

    // 인덱스 생성
    await client.query(`
      CREATE INDEX idx_kpi_code ON main_kpi_data(code);
      CREATE INDEX idx_kpi_status ON main_kpi_data(status);
      CREATE INDEX idx_kpi_department ON main_kpi_data(department);
      CREATE INDEX idx_kpi_team ON main_kpi_data(team);
      CREATE INDEX idx_kpi_assignee ON main_kpi_data(assignee);
      CREATE INDEX idx_kpi_registration_date ON main_kpi_data(registration_date);
    `);
    console.log('✅ 인덱스 생성 완료');

    // RLS 비활성화
    await client.query(`ALTER TABLE main_kpi_data DISABLE ROW LEVEL SECURITY;`);
    console.log('✅ RLS 비활성화 완료');

    // 샘플 데이터 삽입
    const sampleDataQuery = `
      INSERT INTO main_kpi_data (
        code, work_content, description, management_category, target_kpi, current_kpi,
        department, progress, status, start_date, completed_date, team, assignee, registration_date
      ) VALUES
      (
        'MAIN-KPI-25-001',
        '웹사이트 성능 개선',
        '페이지 로딩 속도 최적화 및 사용자 경험 개선',
        '시스템 개선',
        '로딩 시간 3초 이내',
        '로딩 시간 5초',
        'IT',
        60,
        '진행',
        '2025-01-10',
        '2025-03-31',
        'IT팀',
        '김철수',
        '2025-01-10'
      ),
      (
        'MAIN-KPI-25-002',
        '고객 만족도 조사',
        '분기별 고객 만족도 설문조사 실시',
        '품질 관리',
        '만족도 90% 이상',
        '만족도 85%',
        '기획',
        40,
        '진행',
        '2025-02-01',
        '2025-04-30',
        '기획팀',
        '이영희',
        '2025-02-01'
      ),
      (
        'MAIN-KPI-25-003',
        '매출 목표 달성',
        '2025년 1분기 매출 목표 달성',
        '매출 관리',
        '10억원',
        '7억원',
        '마케팅',
        70,
        '진행',
        '2025-01-01',
        '2025-03-31',
        '마케팅팀',
        '박민수',
        '2025-01-01'
      );
    `;

    await client.query(sampleDataQuery);
    console.log('✅ 샘플 데이터 삽입 완료');

    // 테이블 확인
    const result = await client.query('SELECT * FROM main_kpi_data ORDER BY id DESC;');
    console.log('\n📊 생성된 데이터:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n✅ 연결 종료');
  }
}

createKpiTable();
