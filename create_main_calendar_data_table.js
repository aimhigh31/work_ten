const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL이 설정되지 않았습니다.');
  process.exit(1);
}

async function createCalendarTable() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('PostgreSQL 연결 성공');
    console.log('main_calendar_data 테이블 생성 시작...');

    // 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS main_calendar_data (
        id SERIAL PRIMARY KEY,
        event_id VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        team VARCHAR(100),
        assignee VARCHAR(100),
        attendees TEXT,
        color VARCHAR(50),
        text_color VARCHAR(50),
        all_day BOOLEAN DEFAULT false,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        end_date TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✓ main_calendar_data 테이블 생성 완료');

    // 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_calendar_event_id ON main_calendar_data(event_id);
      CREATE INDEX IF NOT EXISTS idx_calendar_start_date ON main_calendar_data(start_date);
      CREATE INDEX IF NOT EXISTS idx_calendar_team ON main_calendar_data(team);
    `);
    console.log('✓ 인덱스 생성 완료');

    // RLS 비활성화
    await client.query(`
      ALTER TABLE main_calendar_data DISABLE ROW LEVEL SECURITY;
    `);
    console.log('✓ RLS 비활성화 완료');

    // 테이블 코멘트
    await client.query(`
      COMMENT ON TABLE main_calendar_data IS '일정관리 데이터';
    `);

    // 샘플 데이터 삽입
    const sampleData = [
      {
        event_id: 'event_' + Date.now() + '_1',
        title: '프로젝트 킥오프 미팅',
        description: '새 프로젝트 시작을 위한 킥오프 미팅',
        team: '개발팀',
        assignee: '홍길동',
        attendees: '김철수,박영희,이민수',
        color: '#2563EB',
        text_color: '#000000',
        all_day: false,
        start_date: new Date('2025-10-05T10:00:00'),
        end_date: new Date('2025-10-05T11:00:00')
      },
      {
        event_id: 'event_' + Date.now() + '_2',
        title: '디자인 리뷰',
        description: 'UI/UX 디자인 검토',
        team: '디자인팀',
        assignee: '김철수',
        attendees: '홍길동,정수진',
        color: '#7C3AED',
        text_color: '#000000',
        all_day: false,
        start_date: new Date('2025-10-07T14:00:00'),
        end_date: new Date('2025-10-07T15:00:00')
      },
      {
        event_id: 'event_' + Date.now() + '_3',
        title: '마케팅 전략 회의',
        description: '2025년 4분기 마케팅 전략 수립',
        team: '마케팅팀',
        assignee: '박영희',
        attendees: '이민수,정수진',
        color: '#DC2626',
        text_color: '#000000',
        all_day: true,
        start_date: new Date('2025-10-10'),
        end_date: new Date('2025-10-10')
      }
    ];

    for (const data of sampleData) {
      await client.query(`
        INSERT INTO main_calendar_data (
          event_id, title, description, team, assignee, attendees,
          color, text_color, all_day, start_date, end_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        data.event_id, data.title, data.description, data.team, data.assignee,
        data.attendees, data.color, data.text_color, data.all_day,
        data.start_date, data.end_date
      ]);
    }
    console.log('✓ 샘플 데이터 3개 삽입 완료');

    console.log('\n=== 테이블 생성 및 데이터 삽입 완료 ===');
  } catch (error) {
    console.error('오류 발생:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createCalendarTable();
