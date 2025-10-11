const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createSoftwareUserTable() {
  console.log('🔧 it_software_user 테이블 생성 중...');

  // 사용자이력 테이블 SQL (data_relation.md 참고)
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS it_software_user (
      id SERIAL PRIMARY KEY,                    -- 사용자이력 항목 ID
      software_id INTEGER NOT NULL,            -- 외래키: it_software_data.id
      user_id INTEGER,                          -- 사용자 ID (옵셔널)
      user_name VARCHAR NOT NULL,               -- 사용자명
      user_code VARCHAR,                        -- 사용자 코드
      department VARCHAR,                       -- 부서/팀
      position VARCHAR,                         -- 직책
      email VARCHAR,                            -- 이메일
      phone VARCHAR,                            -- 전화번호
      exclusive_id VARCHAR,                     -- 전용아이디
      reason TEXT,                              -- 사유
      usage_status VARCHAR DEFAULT '사용중',     -- 사용상태 (사용중/중지/반납)
      start_date DATE,                          -- 시작일
      end_date DATE,                            -- 종료일
      registration_date DATE DEFAULT CURRENT_DATE, -- 등록일
      notes TEXT,                               -- 비고
      created_at TIMESTAMP DEFAULT NOW(),       -- 생성 시간
      updated_at TIMESTAMP DEFAULT NOW(),       -- 수정 시간
      created_by VARCHAR DEFAULT 'user',        -- 생성자
      updated_by VARCHAR DEFAULT 'user',        -- 수정자
      is_active BOOLEAN DEFAULT true,           -- 활성 상태

      -- 외래키 제약 조건
      CONSTRAINT it_software_user_software_id_fkey
        FOREIGN KEY (software_id) REFERENCES it_software_data(id) ON DELETE CASCADE
    );

    -- 인덱스 생성
    CREATE INDEX IF NOT EXISTS idx_it_software_user_software_id ON it_software_user(software_id);
    CREATE INDEX IF NOT EXISTS idx_it_software_user_user_name ON it_software_user(user_name);
    CREATE INDEX IF NOT EXISTS idx_it_software_user_is_active ON it_software_user(is_active);
  `;

  try {
    // PostgreSQL 직접 연결을 통한 테이블 생성
    const { Pool } = require('pg');

    const pool = new Pool({
      connectionString: process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', 'postgresql://postgres:') + process.env.DATABASE_PASSWORD + '@' + process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '').replace('.supabase.co', '.supabase.co:5432/postgres')
    });

    console.log('🔗 직접 PostgreSQL 연결 시도...');

    // 환경변수에서 직접 연결 정보 구성
    const dbUrl = `postgresql://postgres.${process.env.NEXT_PUBLIC_SUPABASE_URL.split('//')[1].split('.')[0]}:${process.env.DATABASE_PASSWORD || '[DB_PASSWORD]'}@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`;

    console.log('📝 DB URL 패턴 (패스워드 제외):', dbUrl.replace(/:[^:@]+@/, ':****@'));
    console.log('⚠️  DATABASE_PASSWORD 환경변수가 필요합니다.');
    console.log('💡 대신 Supabase SQL Editor를 사용하여 수동으로 테이블을 생성하세요:');
    console.log('\n📋 다음 SQL을 Supabase SQL Editor에 복사하여 실행하세요:\n');
    console.log('=' .repeat(80));
    console.log(createTableSQL);
    console.log('=' .repeat(80));

  } catch (err) {
    console.error('❌ 실행 중 오류:', err);
    console.log('\n💡 Supabase SQL Editor를 사용하여 다음 SQL을 실행하세요:\n');
    console.log('=' .repeat(80));
    console.log(createTableSQL);
    console.log('=' .repeat(80));
  }
}

createSoftwareUserTable();