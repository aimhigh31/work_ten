const { Pool } = require('pg');

// PostgreSQL 연결 설정
const pool = new Pool({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
});

async function createItHardwareUserTable() {
  console.log('🏗️  it_hardware_user 테이블 생성 시작...');

  try {
    // 테이블 생성 SQL
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS it_hardware_user (
        id SERIAL PRIMARY KEY,
        hardware_id INTEGER NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        department VARCHAR(100),
        start_date DATE,
        end_date DATE,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'active',
        registration_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by VARCHAR(100) DEFAULT 'system',
        updated_by VARCHAR(100) DEFAULT 'system',
        is_active BOOLEAN DEFAULT true,

        -- 외래 키 제약 조건 (나중에 it_hardware_data 테이블과 연결)
        -- FOREIGN KEY (hardware_id) REFERENCES it_hardware_data(id),

        -- 인덱스
        UNIQUE(hardware_id, user_name, start_date)
      );
    `;

    await pool.query(createTableQuery);
    console.log('✅ it_hardware_user 테이블 생성 완료');

    // 컬럼에 주석 추가
    const addCommentsQuery = `
      COMMENT ON TABLE it_hardware_user IS 'IT 하드웨어 사용자 이력 관리';
      COMMENT ON COLUMN it_hardware_user.id IS '고유 ID';
      COMMENT ON COLUMN it_hardware_user.hardware_id IS '하드웨어 ID (it_hardware_data 테이블 참조)';
      COMMENT ON COLUMN it_hardware_user.user_name IS '사용자명';
      COMMENT ON COLUMN it_hardware_user.department IS '부서명';
      COMMENT ON COLUMN it_hardware_user.start_date IS '사용 시작일';
      COMMENT ON COLUMN it_hardware_user.end_date IS '사용 종료일';
      COMMENT ON COLUMN it_hardware_user.reason IS '변경 사유';
      COMMENT ON COLUMN it_hardware_user.status IS '상태 (active: 사용중, inactive: 종료)';
      COMMENT ON COLUMN it_hardware_user.registration_date IS '등록일';
    `;

    await pool.query(addCommentsQuery);
    console.log('✅ 테이블 주석 추가 완료');

    // 샘플 데이터 삽입
    const sampleData = [
      {
        hardware_id: 1,
        user_name: '김개발자',
        department: '개발팀',
        start_date: '2024-01-15',
        end_date: '2024-06-30',
        reason: '부서 이동',
        status: 'inactive'
      },
      {
        hardware_id: 1,
        user_name: '이기획자',
        department: '기획팀',
        start_date: '2024-07-01',
        end_date: null,
        reason: '신규 배정',
        status: 'active'
      },
      {
        hardware_id: 2,
        user_name: '박디자이너',
        department: '디자인팀',
        start_date: '2024-03-01',
        end_date: null,
        reason: '신규 입사',
        status: 'active'
      }
    ];

    for (const data of sampleData) {
      const insertQuery = `
        INSERT INTO it_hardware_user (
          hardware_id, user_name, department, start_date, end_date, reason, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      await pool.query(insertQuery, [
        data.hardware_id,
        data.user_name,
        data.department,
        data.start_date,
        data.end_date,
        data.reason,
        data.status
      ]);
    }

    console.log('✅ 샘플 데이터 삽입 완료');

    // 데이터 확인
    const checkQuery = 'SELECT * FROM it_hardware_user ORDER BY id';
    const result = await pool.query(checkQuery);

    console.log('📊 생성된 데이터:');
    result.rows.forEach(row => {
      console.log(`- ID: ${row.id}, 하드웨어ID: ${row.hardware_id}, 사용자: ${row.user_name} (${row.department}), 상태: ${row.status}`);
    });

    console.log(`🎉 it_hardware_user 테이블 생성 및 초기화 완료! (총 ${result.rows.length}개 레코드)`);

  } catch (error) {
    console.error('❌ 테이블 생성 실패:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// 실행
createItHardwareUserTable().catch(console.error);