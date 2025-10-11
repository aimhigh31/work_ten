const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function createSecurityInspectionTable() {
  console.log('🔄 security_inspection_data 테이블 생성 중...\n');

  // PostgreSQL 직접 연결 설정
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS security_inspection_data (
        id SERIAL PRIMARY KEY,
        no INTEGER NOT NULL DEFAULT nextval('security_inspection_data_id_seq'),

        -- 기본 정보
        registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
        code VARCHAR(50) UNIQUE NOT NULL,
        inspection_type VARCHAR(50) NOT NULL CHECK (inspection_type IN ('보안점검', '취약점점검', '침투테스트', '컴플라이언스점검')),
        inspection_target VARCHAR(50) NOT NULL CHECK (inspection_target IN ('고객사', '내부', '파트너사')),
        inspection_content TEXT NOT NULL,
        inspection_date DATE,

        -- 담당 및 상태
        team VARCHAR(50) NOT NULL DEFAULT '보안팀',
        assignee VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT '대기' CHECK (status IN ('대기', '진행', '완료', '홀딩')),
        progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),

        -- 첨부파일 (JSON 배열로 저장)
        attachments JSONB DEFAULT '[]'::jsonb,

        -- 메타데이터
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'system',
        updated_by VARCHAR(100) DEFAULT 'system'
      );
    `;

    const result = await client.query(createTableQuery);
    console.log('✅ 테이블 생성 성공');

    // 인덱스 생성
    const createIndexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_security_inspection_status ON security_inspection_data(status);`,
      `CREATE INDEX IF NOT EXISTS idx_security_inspection_assignee ON security_inspection_data(assignee);`,
      `CREATE INDEX IF NOT EXISTS idx_security_inspection_date ON security_inspection_data(inspection_date);`,
      `CREATE INDEX IF NOT EXISTS idx_security_inspection_type ON security_inspection_data(inspection_type);`,
      `CREATE INDEX IF NOT EXISTS idx_security_inspection_team ON security_inspection_data(team);`
    ];

    for (const indexQuery of createIndexQueries) {
      await client.query(indexQuery);
    }
    console.log('✅ 인덱스 생성 완료');

    // 테이블 생성 확인
    const checkTableQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'security_inspection_data';
    `;

    const checkResult = await client.query(checkTableQuery);
    if (checkResult.rows.length > 0) {
      console.log('✅ security_inspection_data 테이블이 성공적으로 생성되었습니다.');

      // 테이블 구조 확인
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'security_inspection_data'
        ORDER BY ordinal_position;
      `;

      const columnsResult = await client.query(columnsQuery);
      console.log('📋 테이블 구조:');
      columnsResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });

      // 샘플 데이터 삽입
      console.log('\n📝 샘플 데이터 삽입 중...');
      const sampleData = [
        {
          code: 'SEC-INS-001',
          inspection_type: '보안점검',
          inspection_target: '내부',
          inspection_content: '웹 애플리케이션 보안점검',
          inspection_date: '2025-10-15',
          team: '보안팀',
          assignee: '김보안',
          status: '진행',
          progress: 45
        },
        {
          code: 'SEC-INS-002',
          inspection_type: '취약점점검',
          inspection_target: '고객사',
          inspection_content: '네트워크 인프라 취약점 점검',
          inspection_date: '2025-10-20',
          team: '보안팀',
          assignee: '이취약',
          status: '대기',
          progress: 0
        },
        {
          code: 'SEC-INS-003',
          inspection_type: '침투테스트',
          inspection_target: '파트너사',
          inspection_content: '모의 해킹을 통한 보안 취약점 테스트',
          inspection_date: '2025-11-01',
          team: '보안팀',
          assignee: '박침투',
          status: '완료',
          progress: 100
        }
      ];

      for (const data of sampleData) {
        const insertQuery = `
          INSERT INTO security_inspection_data (
            code, inspection_type, inspection_target, inspection_content,
            inspection_date, team, assignee, status, progress
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (code) DO NOTHING;
        `;

        await client.query(insertQuery, [
          data.code, data.inspection_type, data.inspection_target, data.inspection_content,
          data.inspection_date, data.team, data.assignee, data.status, data.progress
        ]);
      }

      console.log('✅ 샘플 데이터 삽입 완료');

      // 데이터 확인
      const selectQuery = `SELECT * FROM security_inspection_data ORDER BY id;`;
      const selectResult = await client.query(selectQuery);
      console.log('\n📊 생성된 데이터:');
      selectResult.rows.forEach(row => {
        console.log(`  - ID: ${row.id}, Code: ${row.code}, Type: ${row.inspection_type}, Status: ${row.status}`);
      });

    } else {
      console.log('❌ 테이블 생성 실패');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세 오류:', error);
  } finally {
    await client.end();
  }
}

createSecurityInspectionTable();