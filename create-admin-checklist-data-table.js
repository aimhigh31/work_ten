// PostgreSQL 직접 연결로 admin_checklist_data 테이블 생성
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createChecklistDataTable() {
  try {
    console.log('🔗 PostgreSQL 연결 중...');
    await client.connect();

    console.log('📋 admin_checklist_data 테이블 생성 중...');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS admin_checklist_data (
        id SERIAL PRIMARY KEY,
        no INTEGER NOT NULL,
        registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
        code VARCHAR(50) NOT NULL UNIQUE,
        department VARCHAR(50) NOT NULL,  -- 체크리스트 분류 서브코드
        work_content TEXT NOT NULL,       -- 제목
        description TEXT,                 -- 설명
        status VARCHAR(20) NOT NULL DEFAULT '대기',
        team VARCHAR(50) NOT NULL,
        assignee VARCHAR(50) NOT NULL,    -- 사용자 코드
        completed_date DATE NULL,
        progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        attachments JSONB NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by VARCHAR(50) NOT NULL DEFAULT 'system',
        updated_by VARCHAR(50) NOT NULL DEFAULT 'system',
        is_active BOOLEAN DEFAULT true
      );

      -- 컬럼 주석 추가
      COMMENT ON COLUMN admin_checklist_data.department IS '체크리스트 분류 서브코드';
      COMMENT ON COLUMN admin_checklist_data.work_content IS '제목';
      COMMENT ON COLUMN admin_checklist_data.description IS '설명';
      COMMENT ON COLUMN admin_checklist_data.assignee IS '사용자 코드';
      COMMENT ON COLUMN admin_checklist_data.progress IS '진행률 (0-100%)';
      COMMENT ON COLUMN admin_checklist_data.attachments IS '첨부파일 정보 (JSON 형태)';

      -- 테이블 주석 추가
      COMMENT ON TABLE admin_checklist_data IS '관리자 체크리스트 데이터 테이블';

      -- 인덱스 생성
      CREATE INDEX IF NOT EXISTS idx_admin_checklist_data_no ON admin_checklist_data(no);
      CREATE INDEX IF NOT EXISTS idx_admin_checklist_data_code ON admin_checklist_data(code);
      CREATE INDEX IF NOT EXISTS idx_admin_checklist_data_department ON admin_checklist_data(department);
      CREATE INDEX IF NOT EXISTS idx_admin_checklist_data_status ON admin_checklist_data(status);
      CREATE INDEX IF NOT EXISTS idx_admin_checklist_data_team ON admin_checklist_data(team);
      CREATE INDEX IF NOT EXISTS idx_admin_checklist_data_assignee ON admin_checklist_data(assignee);
      CREATE INDEX IF NOT EXISTS idx_admin_checklist_data_registration_date ON admin_checklist_data(registration_date);
      CREATE INDEX IF NOT EXISTS idx_admin_checklist_data_is_active ON admin_checklist_data(is_active);

      -- 상태 체크 제약조건
      ALTER TABLE admin_checklist_data
      ADD CONSTRAINT chk_status CHECK (status IN ('대기', '진행', '완료', '홀딩'));

      -- 팀 체크 제약조건
      ALTER TABLE admin_checklist_data
      ADD CONSTRAINT chk_team CHECK (team IN ('개발팀', '디자인팀', '기획팀', '마케팅팀'));

      -- updated_at 자동 업데이트 트리거 함수 생성
      CREATE OR REPLACE FUNCTION update_admin_checklist_data_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- 트리거 생성
      DROP TRIGGER IF EXISTS trigger_update_admin_checklist_data_updated_at ON admin_checklist_data;
      CREATE TRIGGER trigger_update_admin_checklist_data_updated_at
        BEFORE UPDATE ON admin_checklist_data
        FOR EACH ROW
        EXECUTE FUNCTION update_admin_checklist_data_updated_at();

      -- RLS 정책 설정
      ALTER TABLE admin_checklist_data ENABLE ROW LEVEL SECURITY;

      -- 기존 정책 삭제 후 재생성
      DROP POLICY IF EXISTS "Allow read access for all users" ON admin_checklist_data;
      DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON admin_checklist_data;

      CREATE POLICY "Allow read access for all users" ON admin_checklist_data FOR SELECT USING (true);
      CREATE POLICY "Allow all operations for authenticated users" ON admin_checklist_data FOR ALL USING (true);
    `;

    await client.query(createTableSQL);
    console.log('✅ admin_checklist_data 테이블 생성 완료');

    // 테이블 존재 확인
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'admin_checklist_data'
      );
    `);

    console.log('📊 테이블 존재 확인:', checkResult.rows[0].exists);

    // 테이블 구조 확인
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'admin_checklist_data'
      ORDER BY ordinal_position;
    `);

    console.log('📋 테이블 구조:');
    structureResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

  } catch (error) {
    console.error('❌ 테이블 생성 중 오류:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// 스크립트 실행
createChecklistDataTable();