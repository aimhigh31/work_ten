const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Supabase URL에서 PostgreSQL 연결 정보 추출
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !databaseUrl) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('DATABASE_URL:', databaseUrl ? '✅' : '❌');
  process.exit(1);
}

// DATABASE_URL에서 비밀번호 추출
// postgresql://postgres:password@host:port/database
const passwordMatch = databaseUrl.match(/postgres:([^@]+)@/);
if (!passwordMatch) {
  console.error('❌ DATABASE_URL에서 비밀번호를 추출할 수 없습니다.');
  process.exit(1);
}
const supabasePassword = decodeURIComponent(passwordMatch[1]);

// Supabase URL에서 project ref 추출
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)[1];

const client = new Client({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: supabasePassword,
  ssl: { rejectUnauthorized: false }
});

async function createTable() {
  try {
    console.log('🔌 PostgreSQL 연결 중...\n');
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공!\n');

    console.log('🚀 security_inspection_checksheet 테이블 생성 시작...\n');

    const createTableSQL = `
      -- security_inspection_checksheet 테이블 생성
      CREATE TABLE IF NOT EXISTS security_inspection_checksheet (
        id BIGSERIAL PRIMARY KEY,
        inspection_id BIGINT NOT NULL,
        checklist_id BIGINT,
        major_category TEXT NOT NULL DEFAULT '',
        minor_category TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL DEFAULT '',
        description TEXT DEFAULT '',
        evaluation TEXT DEFAULT '',
        score INTEGER DEFAULT 0,
        attachments JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by TEXT DEFAULT 'system',
        updated_by TEXT DEFAULT 'system',
        is_active BOOLEAN DEFAULT TRUE
      );

      -- 인덱스 생성
      CREATE INDEX IF NOT EXISTS idx_checksheet_inspection_id ON security_inspection_checksheet(inspection_id);
      CREATE INDEX IF NOT EXISTS idx_checksheet_checklist_id ON security_inspection_checksheet(checklist_id);
      CREATE INDEX IF NOT EXISTS idx_checksheet_is_active ON security_inspection_checksheet(is_active);

      -- 코멘트 추가
      COMMENT ON TABLE security_inspection_checksheet IS '보안점검 체크시트 데이터';
      COMMENT ON COLUMN security_inspection_checksheet.id IS '고유 ID';
      COMMENT ON COLUMN security_inspection_checksheet.inspection_id IS '점검 ID (FK)';
      COMMENT ON COLUMN security_inspection_checksheet.checklist_id IS '체크리스트 ID (참조용)';
      COMMENT ON COLUMN security_inspection_checksheet.major_category IS '대분류';
      COMMENT ON COLUMN security_inspection_checksheet.minor_category IS '소분류';
      COMMENT ON COLUMN security_inspection_checksheet.title IS '점검항목';
      COMMENT ON COLUMN security_inspection_checksheet.description IS '세부설명';
      COMMENT ON COLUMN security_inspection_checksheet.evaluation IS '평가내용';
      COMMENT ON COLUMN security_inspection_checksheet.score IS '점수';
      COMMENT ON COLUMN security_inspection_checksheet.attachments IS '첨부파일 (JSONB)';
      COMMENT ON COLUMN security_inspection_checksheet.created_at IS '생성일시';
      COMMENT ON COLUMN security_inspection_checksheet.updated_at IS '수정일시';
      COMMENT ON COLUMN security_inspection_checksheet.created_by IS '생성자';
      COMMENT ON COLUMN security_inspection_checksheet.updated_by IS '수정자';
      COMMENT ON COLUMN security_inspection_checksheet.is_active IS '활성 상태';
    `;

    await client.query(createTableSQL);
    console.log('✅ security_inspection_checksheet 테이블 생성 완료!');

    // 테이블 확인
    const checkResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'security_inspection_checksheet'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 테이블 구조:');
    console.table(checkResult.rows);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await client.end();
    console.log('\n🔌 PostgreSQL 연결 종료');
  }
}

createTable()
  .then(() => {
    console.log('\n🎉 모든 작업 완료!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ 실행 중 오류:', err);
    process.exit(1);
  });
