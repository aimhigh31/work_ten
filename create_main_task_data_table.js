const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
});

async function createMainTaskDataTable() {
  const client = await pool.connect();

  try {
    console.log('🚀 main_task_data 테이블 생성 시작...');

    // 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS main_task_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        registration_date DATE NOT NULL,
        start_date DATE,
        completed_date DATE,
        department VARCHAR(100),
        work_content VARCHAR(500),
        team VARCHAR(100),
        assignee_id UUID,
        assignee_name VARCHAR(100),
        progress INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT '대기',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log('✅ main_task_data 테이블 생성 완료');

    // 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_main_task_data_code ON main_task_data(code);
      CREATE INDEX IF NOT EXISTS idx_main_task_data_status ON main_task_data(status);
      CREATE INDEX IF NOT EXISTS idx_main_task_data_team ON main_task_data(team);
      CREATE INDEX IF NOT EXISTS idx_main_task_data_assignee_name ON main_task_data(assignee_name);
      CREATE INDEX IF NOT EXISTS idx_main_task_data_created_at ON main_task_data(created_at DESC);
    `);

    console.log('✅ 인덱스 생성 완료');

    // 샘플 데이터 삽입
    const sampleData = [
      {
        code: 'MAIN-TASK-25-001',
        registration_date: '2025-01-15',
        start_date: '2025-02-01',
        completed_date: null,
        department: 'IT',
        work_content: 'AI 챗봇 시스템 개발',
        team: '개발팀',
        assignee_name: '김민수',
        progress: 0,
        status: '대기'
      },
      {
        code: 'MAIN-TASK-25-002',
        registration_date: '2025-01-10',
        start_date: '2025-01-20',
        completed_date: null,
        department: '기획',
        work_content: '모바일 앱 UI/UX 개선',
        team: '디자인팀',
        assignee_name: '이영희',
        progress: 45,
        status: '진행'
      },
      {
        code: 'MAIN-TASK-25-003',
        registration_date: '2025-01-05',
        start_date: '2025-01-15',
        completed_date: '2025-01-30',
        department: '마케팅',
        work_content: '신규 캠페인 기획 및 실행',
        team: '마케팅팀',
        assignee_name: '박지훈',
        progress: 100,
        status: '완료'
      },
      {
        code: 'MAIN-TASK-25-004',
        registration_date: '2025-01-20',
        start_date: '2025-02-05',
        completed_date: null,
        department: 'IT',
        work_content: '데이터베이스 성능 최적화',
        team: '개발팀',
        assignee_name: '최수진',
        progress: 30,
        status: '진행'
      },
      {
        code: 'MAIN-TASK-25-005',
        registration_date: '2025-01-12',
        start_date: '2025-01-25',
        completed_date: null,
        department: '운영',
        work_content: '고객 지원 시스템 개선',
        team: '운영팀',
        assignee_name: '정우진',
        progress: 0,
        status: '홀딩'
      }
    ];

    for (const data of sampleData) {
      await client.query(`
        INSERT INTO main_task_data (
          code, registration_date, start_date, completed_date, department,
          work_content, team, assignee_name, progress, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (code) DO NOTHING
      `, [
        data.code,
        data.registration_date,
        data.start_date,
        data.completed_date,
        data.department,
        data.work_content,
        data.team,
        data.assignee_name,
        data.progress,
        data.status
      ]);
    }

    console.log('✅ 샘플 데이터 삽입 완료');

    // 데이터 확인
    const result = await client.query('SELECT * FROM main_task_data ORDER BY created_at DESC');
    console.log(`\n📊 총 ${result.rows.length}개의 업무 데이터가 있습니다.`);
    console.log('\n샘플 데이터:');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.code} - ${row.work_content} (${row.status})`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createMainTaskDataTable()
  .then(() => {
    console.log('\n✅ 모든 작업이 완료되었습니다.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 작업 실패:', error);
    process.exit(1);
  });
