const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Supabase DATABASE_URL에서 연결 정보 파싱
const dbUrl = process.env.DATABASE_URL;
console.log('🔗 DATABASE_URL:', dbUrl ? '설정됨' : '없음');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function createSolutionTable() {
  const client = await pool.connect();

  try {
    console.log('🚀 it_solution_data 테이블 생성 시작...');

    // 1. 기존 테이블 삭제 (있는 경우)
    await client.query('DROP TABLE IF EXISTS it_solution_data CASCADE;');
    console.log('✅ 기존 테이블 삭제 완료');

    // 2. 새 테이블 생성
    const createTableQuery = `
      CREATE TABLE it_solution_data (
        id SERIAL PRIMARY KEY,
        no INTEGER NOT NULL,
        registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
        start_date DATE,
        code VARCHAR(50) UNIQUE NOT NULL,
        solution_type VARCHAR(20) NOT NULL CHECK (solution_type IN ('웹개발', '모바일앱', '시스템통합', '데이터분석', '보안강화', '인프라구축')),
        development_type VARCHAR(20) NOT NULL CHECK (development_type IN ('신규개발', '기능개선', '유지보수', '마이그레이션', '최적화')),
        detail_content TEXT NOT NULL,
        team VARCHAR(20) NOT NULL CHECK (team IN ('개발팀', '디자인팀', '기획팀', '마케팅팀')),
        assignee VARCHAR(100) NOT NULL,
        status VARCHAR(10) NOT NULL CHECK (status IN ('대기', '진행', '완료', '홀딩')) DEFAULT '대기',
        completed_date DATE,
        attachments TEXT[], -- 첨부파일 URL 배열
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'system',
        updated_by VARCHAR(100) DEFAULT 'system',
        is_active BOOLEAN DEFAULT TRUE
      );
    `;

    await client.query(createTableQuery);
    console.log('✅ it_solution_data 테이블 생성 완료');

    // 3. 인덱스 생성
    await client.query('CREATE INDEX idx_it_solution_data_code ON it_solution_data(code);');
    await client.query('CREATE INDEX idx_it_solution_data_status ON it_solution_data(status);');
    await client.query('CREATE INDEX idx_it_solution_data_team ON it_solution_data(team);');
    await client.query('CREATE INDEX idx_it_solution_data_assignee ON it_solution_data(assignee);');
    await client.query('CREATE INDEX idx_it_solution_data_active ON it_solution_data(is_active);');
    console.log('✅ 인덱스 생성 완료');

    // 4. 업데이트 트리거 생성
    const createTriggerQuery = `
      CREATE OR REPLACE FUNCTION update_it_solution_data_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      CREATE TRIGGER trigger_it_solution_data_updated_at
        BEFORE UPDATE ON it_solution_data
        FOR EACH ROW
        EXECUTE FUNCTION update_it_solution_data_updated_at();
    `;

    await client.query(createTriggerQuery);
    console.log('✅ 업데이트 트리거 생성 완료');

    // 5. 샘플 데이터 삽입
    const sampleData = [
      {
        no: 1,
        registration_date: '2024-01-15',
        start_date: '2024-01-20',
        code: 'SOL-2024-001',
        solution_type: '웹개발',
        development_type: '신규개발',
        detail_content: '고객 포털 사이트 신규 구축',
        team: '개발팀',
        assignee: '김개발',
        status: '진행',
        completed_date: null,
        attachments: ['https://example.com/spec1.pdf', 'https://example.com/design1.png']
      },
      {
        no: 2,
        registration_date: '2024-02-01',
        start_date: '2024-02-05',
        code: 'SOL-2024-002',
        solution_type: '모바일앱',
        development_type: '기능개선',
        detail_content: '모바일 앱 푸시알림 기능 개선',
        team: '개발팀',
        assignee: '이모바일',
        status: '완료',
        completed_date: '2024-02-28',
        attachments: []
      },
      {
        no: 3,
        registration_date: '2024-03-10',
        start_date: '2024-03-15',
        code: 'SOL-2024-003',
        solution_type: '시스템통합',
        development_type: '마이그레이션',
        detail_content: '레거시 시스템 클라우드 마이그레이션',
        team: '기획팀',
        assignee: '박시스템',
        status: '대기',
        completed_date: null,
        attachments: ['https://example.com/migration_plan.docx']
      },
      {
        no: 4,
        registration_date: '2024-04-05',
        start_date: '2024-04-10',
        code: 'SOL-2024-004',
        solution_type: '데이터분석',
        development_type: '신규개발',
        detail_content: 'BI 대시보드 구축 및 데이터 시각화',
        team: '개발팀',
        assignee: '최데이터',
        status: '진행',
        completed_date: null,
        attachments: []
      },
      {
        no: 5,
        registration_date: '2024-05-12',
        start_date: '2024-05-20',
        code: 'SOL-2024-005',
        solution_type: '보안강화',
        development_type: '최적화',
        detail_content: '웹사이트 보안 취약점 점검 및 개선',
        team: '개발팀',
        assignee: '정보안',
        status: '홀딩',
        completed_date: null,
        attachments: ['https://example.com/security_report.pdf']
      }
    ];

    for (const data of sampleData) {
      const insertQuery = `
        INSERT INTO it_solution_data (
          no, registration_date, start_date, code, solution_type, development_type,
          detail_content, team, assignee, status, completed_date, attachments
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `;

      await client.query(insertQuery, [
        data.no, data.registration_date, data.start_date, data.code,
        data.solution_type, data.development_type, data.detail_content,
        data.team, data.assignee, data.status, data.completed_date, data.attachments
      ]);
    }

    console.log('✅ 샘플 데이터 삽입 완료');

    // 6. 결과 확인
    const result = await client.query('SELECT COUNT(*) as count FROM it_solution_data WHERE is_active = true');
    console.log(`📊 총 ${result.rows[0].count}개의 솔루션 데이터가 생성되었습니다.`);

    // 7. 테이블 구조 확인
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'it_solution_data'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 테이블 구조:');
    tableInfo.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    console.log('\n🎉 it_solution_data 테이블 생성 및 설정 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await createSolutionTable();
  } catch (error) {
    console.error('❌ 실행 실패:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}