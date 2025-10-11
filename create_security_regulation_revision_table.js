const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTable() {
  try {
    console.log('🚀 security_regulation_revision 테이블 생성 시작...');

    // 테이블 생성 SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- security_regulation_revision 테이블 생성
        CREATE TABLE IF NOT EXISTS security_regulation_revision (
          id SERIAL PRIMARY KEY,
          security_regulation_id INTEGER NOT NULL REFERENCES security_regulation_data(id) ON DELETE CASCADE,
          file_name VARCHAR(255) NOT NULL,
          file_size VARCHAR(50),
          file_description TEXT,
          file_path TEXT,
          revision VARCHAR(20) NOT NULL,
          upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(100) NOT NULL,
          updated_by VARCHAR(100) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          UNIQUE(security_regulation_id, revision)
        );

        -- 인덱스 생성
        CREATE INDEX IF NOT EXISTS idx_security_regulation_revision_regulation_id
        ON security_regulation_revision(security_regulation_id);

        CREATE INDEX IF NOT EXISTS idx_security_regulation_revision_is_active
        ON security_regulation_revision(is_active);

        -- 코멘트 추가
        COMMENT ON TABLE security_regulation_revision IS '보안규정 파일 리비전 관리';
        COMMENT ON COLUMN security_regulation_revision.security_regulation_id IS '보안규정 데이터 ID (security_regulation_data 참조)';
        COMMENT ON COLUMN security_regulation_revision.file_name IS '파일명';
        COMMENT ON COLUMN security_regulation_revision.file_size IS '파일 크기';
        COMMENT ON COLUMN security_regulation_revision.file_description IS '파일 설명';
        COMMENT ON COLUMN security_regulation_revision.file_path IS 'Supabase Storage 파일 경로';
        COMMENT ON COLUMN security_regulation_revision.revision IS '리비전 번호 (R1, R2, ...)';
        COMMENT ON COLUMN security_regulation_revision.upload_date IS '업로드 날짜';
      `
    });

    if (error) {
      console.error('❌ 테이블 생성 실패:', error);

      // exec_sql RPC가 없는 경우, 직접 SQL 실행
      console.log('📝 직접 SQL 실행 시도...');
      const { Pool } = require('pg');

      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });

      await pool.query(`
        -- security_regulation_revision 테이블 생성
        CREATE TABLE IF NOT EXISTS security_regulation_revision (
          id SERIAL PRIMARY KEY,
          security_regulation_id INTEGER NOT NULL REFERENCES security_regulation_data(id) ON DELETE CASCADE,
          file_name VARCHAR(255) NOT NULL,
          file_size VARCHAR(50),
          file_description TEXT,
          file_path TEXT,
          revision VARCHAR(20) NOT NULL,
          upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(100) NOT NULL,
          updated_by VARCHAR(100) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          UNIQUE(security_regulation_id, revision)
        );

        -- 인덱스 생성
        CREATE INDEX IF NOT EXISTS idx_security_regulation_revision_regulation_id
        ON security_regulation_revision(security_regulation_id);

        CREATE INDEX IF NOT EXISTS idx_security_regulation_revision_is_active
        ON security_regulation_revision(is_active);

        -- 코멘트 추가
        COMMENT ON TABLE security_regulation_revision IS '보안규정 파일 리비전 관리';
        COMMENT ON COLUMN security_regulation_revision.security_regulation_id IS '보안규정 데이터 ID (security_regulation_data 참조)';
        COMMENT ON COLUMN security_regulation_revision.file_name IS '파일명';
        COMMENT ON COLUMN security_regulation_revision.file_size IS '파일 크기';
        COMMENT ON COLUMN security_regulation_revision.file_description IS '파일 설명';
        COMMENT ON COLUMN security_regulation_revision.file_path IS 'Supabase Storage 파일 경로';
        COMMENT ON COLUMN security_regulation_revision.revision IS '리비전 번호 (R1, R2, ...)';
        COMMENT ON COLUMN security_regulation_revision.upload_date IS '업로드 날짜';
      `);

      await pool.end();
      console.log('✅ 테이블 생성 성공 (직접 연결)');
    } else {
      console.log('✅ 테이블 생성 성공:', data);
    }

    // 테이블 확인
    const { data: tables, error: tableError } = await supabase
      .from('security_regulation_revision')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ 테이블 확인 실패:', tableError);
    } else {
      console.log('✅ 테이블 확인 성공');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

createTable();
