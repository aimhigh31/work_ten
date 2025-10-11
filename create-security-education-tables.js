const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSecurityEducationTables() {
  console.log('📚 보안교육관리 테이블 생성 중...');

  const { Client } = require('pg');
  const connectionString = `postgresql://postgres.njbwafbxifebclvkkzke:Coding74!@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`;

  const client = new Client({ connectionString });
  await client.connect();

  try {
    // 1. 메인 보안교육 데이터 테이블 (개요탭 + 교육실적보고)
    console.log('📋 1. security_education_data 테이블 생성...');
    const createMainTableSQL = `
      CREATE TABLE IF NOT EXISTS security_education_data (
        id SERIAL PRIMARY KEY,

        -- 개요탭 기본 정보
        education_name VARCHAR(255) NOT NULL,
        description TEXT,
        education_type VARCHAR(100),
        assignee VARCHAR(100),
        execution_date DATE,
        location VARCHAR(255),
        status VARCHAR(50) DEFAULT '계획',
        participant_count INTEGER DEFAULT 0,
        registration_date DATE DEFAULT CURRENT_DATE,
        code VARCHAR(100) UNIQUE,

        -- 교육실적보고 정보 (단순하게 같은 테이블에 포함)
        achievements TEXT,
        feedback TEXT,
        improvement_points TEXT,
        effectiveness_score INTEGER,
        completion_rate DECIMAL(5,2),
        satisfaction_score DECIMAL(3,2),

        -- 공통 메타데이터
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'user',
        updated_by VARCHAR(100) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        metadata JSONB
      );
    `;
    await client.query(createMainTableSQL);
    console.log('✅ security_education_data 테이블 생성 완료');

    // 2. 커리큘럼 테이블
    console.log('📋 2. security_education_curriculum 테이블 생성...');
    const createCurriculumTableSQL = `
      CREATE TABLE IF NOT EXISTS security_education_curriculum (
        id SERIAL PRIMARY KEY,
        education_id INTEGER NOT NULL REFERENCES security_education_data(id) ON DELETE CASCADE,

        -- 커리큘럼 항목 정보
        session_order INTEGER NOT NULL,
        session_title VARCHAR(255) NOT NULL,
        session_description TEXT,
        duration_minutes INTEGER,
        instructor VARCHAR(100),
        session_type VARCHAR(50), -- 강의, 실습, 토론 등
        materials TEXT, -- 교육자료 정보
        objectives TEXT, -- 학습목표

        -- 공통 메타데이터
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'user',
        updated_by VARCHAR(100) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,

        -- 정렬을 위한 복합 인덱스
        UNIQUE(education_id, session_order)
      );
    `;
    await client.query(createCurriculumTableSQL);
    console.log('✅ security_education_curriculum 테이블 생성 완료');

    // 3. 참석자 테이블
    console.log('📋 3. security_education_attendee 테이블 생성...');
    const createAttendeeTableSQL = `
      CREATE TABLE IF NOT EXISTS security_education_attendee (
        id SERIAL PRIMARY KEY,
        education_id INTEGER NOT NULL REFERENCES security_education_data(id) ON DELETE CASCADE,

        -- 참석자 정보
        user_id INTEGER, -- 사용자 테이블과 연결 (옵션)
        user_name VARCHAR(100) NOT NULL,
        user_code VARCHAR(50),
        department VARCHAR(100),
        position VARCHAR(50),
        email VARCHAR(255),
        phone VARCHAR(50),

        -- 참석 관련 정보
        attendance_status VARCHAR(50) DEFAULT '등록', -- 등록, 참석, 불참, 지각 등
        attendance_date DATE,
        completion_status VARCHAR(50) DEFAULT '미완료', -- 완료, 미완료, 부분완료
        score DECIMAL(5,2), -- 평가점수
        certificate_issued BOOLEAN DEFAULT false, -- 수료증 발급 여부
        notes TEXT, -- 특이사항

        -- 공통 메타데이터
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'user',
        updated_by VARCHAR(100) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,

        -- 중복 참석자 방지
        UNIQUE(education_id, user_name, user_code)
      );
    `;
    await client.query(createAttendeeTableSQL);
    console.log('✅ security_education_attendee 테이블 생성 완료');

    // 4. 인덱스 생성
    console.log('📋 4. 인덱스 생성...');

    // 메인 테이블 인덱스
    await client.query('CREATE INDEX IF NOT EXISTS idx_security_education_data_status ON security_education_data(status);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_security_education_data_assignee ON security_education_data(assignee);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_security_education_data_execution_date ON security_education_data(execution_date);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_security_education_data_is_active ON security_education_data(is_active);');

    // 커리큘럼 테이블 인덱스
    await client.query('CREATE INDEX IF NOT EXISTS idx_security_education_curriculum_education_id ON security_education_curriculum(education_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_security_education_curriculum_order ON security_education_curriculum(education_id, session_order);');

    // 참석자 테이블 인덱스
    await client.query('CREATE INDEX IF NOT EXISTS idx_security_education_attendee_education_id ON security_education_attendee(education_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_security_education_attendee_user ON security_education_attendee(user_name, user_code);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_security_education_attendee_status ON security_education_attendee(attendance_status);');

    console.log('✅ 인덱스 생성 완료');

    // 5. updated_at 자동 업데이트 트리거 생성
    console.log('📋 5. 트리거 생성...');

    const createTriggerFunction = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;
    await client.query(createTriggerFunction);

    // 각 테이블에 트리거 적용
    const tables = ['security_education_data', 'security_education_curriculum', 'security_education_attendee'];
    for (const table of tables) {
      const triggerSQL = `
        CREATE TRIGGER update_${table}_updated_at
        BEFORE UPDATE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `;
      await client.query(triggerSQL);
    }

    console.log('✅ 트리거 생성 완료');

    // 6. 테이블 정보 확인
    console.log('\\n📊 생성된 테이블 정보:');

    const tableInfoQueries = [
      { name: 'security_education_data', query: "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'security_education_data' ORDER BY ordinal_position;" },
      { name: 'security_education_curriculum', query: "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'security_education_curriculum' ORDER BY ordinal_position;" },
      { name: 'security_education_attendee', query: "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'security_education_attendee' ORDER BY ordinal_position;" }
    ];

    for (const { name, query } of tableInfoQueries) {
      console.log(`\\n📋 ${name} 테이블 구조:`);
      const result = await client.query(query);
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
    }

    console.log('\\n✅ 보안교육관리 테이블 생성 완료!');
    console.log('\\n🔗 테이블 관계:');
    console.log('  📋 security_education_data (메인 - 개요탭 + 교육실적보고)');
    console.log('    ├── 📚 security_education_curriculum (커리큘럼탭)');
    console.log('    └── 👥 security_education_attendee (참석자탭)');

  } catch (error) {
    console.error('❌ 테이블 생성 실패:', error);
  } finally {
    await client.end();
    console.log('✅ 데이터베이스 연결 종료');
  }
}

createSecurityEducationTables();