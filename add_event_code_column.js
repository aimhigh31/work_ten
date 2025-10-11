const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL이 설정되지 않았습니다.');
  process.exit(1);
}

async function addEventCodeColumn() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('PostgreSQL 연결 성공');

    // event_code 컬럼 추가
    const addColumnQuery = `
      ALTER TABLE main_calendar_data
      ADD COLUMN IF NOT EXISTS event_code VARCHAR(50);
    `;

    await client.query(addColumnQuery);
    console.log('✅ event_code 컬럼이 추가되었습니다.');

    // 기존 데이터에 대한 코드 생성 - CTE 사용
    const updateExistingQuery = `
      WITH numbered_events AS (
        SELECT
          id,
          'MAIN-CALENDAR-' || TO_CHAR(created_at, 'YY') || '-' ||
          LPAD(ROW_NUMBER() OVER (PARTITION BY TO_CHAR(created_at, 'YY') ORDER BY created_at)::TEXT, 3, '0') as new_code
        FROM main_calendar_data
        WHERE event_code IS NULL
      )
      UPDATE main_calendar_data
      SET event_code = numbered_events.new_code
      FROM numbered_events
      WHERE main_calendar_data.id = numbered_events.id;
    `;

    await client.query(updateExistingQuery);
    console.log('✅ 기존 데이터에 코드가 생성되었습니다.');

  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await client.end();
    console.log('PostgreSQL 연결 종료');
  }
}

addEventCodeColumn();
