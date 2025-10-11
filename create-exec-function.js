require('dotenv').config({ path: '.env.local' });

async function createExecFunction() {
  console.log('🔧 PostgreSQL exec 함수 생성 시도...');

  // PostgreSQL 직접 연결을 시도
  try {
    const { Client } = require('pg');

    // DATABASE_URL 파싱
    const databaseUrl = process.env.DATABASE_URL;
    console.log('📡 DATABASE_URL:', databaseUrl ? '설정됨' : '미설정');

    if (!databaseUrl) {
      throw new Error('DATABASE_URL이 설정되지 않았습니다.');
    }

    const client = new Client({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('🔌 PostgreSQL 연결 중...');
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공!');

    // exec 함수 생성
    const createFunctionSQL = `
CREATE OR REPLACE FUNCTION public.exec(sql TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE sql;
    RETURN 'SUCCESS';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERROR: ' || SQLERRM;
END;
$$;
    `;

    console.log('🛠️ exec 함수 생성 중...');
    await client.query(createFunctionSQL);
    console.log('✅ exec 함수 생성 성공!');

    // 이제 테이블 생성 SQL 실행
    const createTableSQL = `
CREATE TABLE IF NOT EXISTS admin_checklist_editor (
    id BIGSERIAL PRIMARY KEY,
    checklist_id BIGINT NOT NULL,
    no INTEGER NOT NULL,
    major_category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    evaluation VARCHAR(50) DEFAULT '대기',
    score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100) DEFAULT 'system',
    updated_by VARCHAR(100) DEFAULT 'system',
    is_active BOOLEAN DEFAULT true,

    CONSTRAINT fk_checklist_editor_checklist
        FOREIGN KEY (checklist_id)
        REFERENCES admin_checklist_data(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_evaluation
        CHECK (evaluation IN ('대기', '진행', '완료', '보류', '불가')),

    CONSTRAINT chk_score
        CHECK (score >= 0 AND score <= 100)
);

CREATE INDEX IF NOT EXISTS idx_checklist_editor_checklist_id ON admin_checklist_editor(checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_editor_no ON admin_checklist_editor(checklist_id, no);
ALTER TABLE admin_checklist_editor ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on admin_checklist_editor" ON admin_checklist_editor;
CREATE POLICY "Allow all operations on admin_checklist_editor" ON admin_checklist_editor FOR ALL USING (true) WITH CHECK (true);
    `;

    console.log('📋 admin_checklist_editor 테이블 생성 중...');
    await client.query(createTableSQL);
    console.log('✅ 테이블 생성 성공!');

    // 샘플 데이터 삽입
    console.log('📄 샘플 데이터 삽입 중...');
    const insertSQL = `
INSERT INTO admin_checklist_editor (checklist_id, no, major_category, sub_category, title, description, evaluation, score) VALUES
(1, 1, '보안', '접근통제', '시스템 권한 점검', '시스템 사용자 권한이 적절히 설정되어 있는지 확인', '대기', 0),
(1, 2, '보안', '패스워드', '패스워드 정책 점검', '패스워드 복잡성 및 변경 주기 확인', '대기', 0),
(1, 3, '시스템', '백업', '데이터 백업 상태', '정기적인 백업 수행 여부 확인', '대기', 0)
ON CONFLICT (checklist_id, no) DO NOTHING;
    `;

    await client.query(insertSQL);
    console.log('✅ 샘플 데이터 삽입 성공!');

    // 테이블 확인
    const checkResult = await client.query('SELECT COUNT(*) FROM admin_checklist_editor');
    console.log('📊 테이블 데이터 개수:', checkResult.rows[0].count);

    await client.end();
    console.log('🎉 모든 작업 완료!');

    // API 테스트
    console.log('\n🧪 API 테스트 실행...');
    await testAPI();

  } catch (error) {
    console.error('💥 PostgreSQL 연결 실패:', error.message);

    if (error.message.includes('password authentication failed')) {
      console.log('🔑 인증 실패: DATABASE_URL의 비밀번호를 확인해주세요.');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('🌐 DNS 오류: 인터넷 연결을 확인해주세요.');
    }

    console.log('\n📋 대안: Supabase Dashboard에서 수동 실행:');
    showManualSQL();
  }
}

async function testAPI() {
  try {
    const fetch = require('node-fetch');

    const response = await fetch('http://localhost:3200/api/checklist-editor?checklist_id=1');
    const result = await response.json();

    if (result.success) {
      console.log('✅ API 테스트 성공:', result.data?.length || 0, '개 항목');
      console.log('📄 첫 번째 항목:', result.data?.[0]);
    } else {
      console.log('❌ API 테스트 실패:', result.error);
    }
  } catch (err) {
    console.log('⚠️ API 테스트 스킵:', err.message);
  }
}

function showManualSQL() {
  console.log(`
-- admin_checklist_editor 테이블 생성
CREATE TABLE admin_checklist_editor (
    id BIGSERIAL PRIMARY KEY,
    checklist_id BIGINT NOT NULL,
    no INTEGER NOT NULL,
    major_category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    evaluation VARCHAR(50) DEFAULT '대기',
    score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100) DEFAULT 'system',
    updated_by VARCHAR(100) DEFAULT 'system',
    is_active BOOLEAN DEFAULT true,

    CONSTRAINT fk_checklist_editor_checklist
        FOREIGN KEY (checklist_id)
        REFERENCES admin_checklist_data(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_evaluation
        CHECK (evaluation IN ('대기', '진행', '완료', '보류', '불가')),

    CONSTRAINT chk_score
        CHECK (score >= 0 AND score <= 100)
);

CREATE INDEX idx_checklist_editor_checklist_id ON admin_checklist_editor(checklist_id);
CREATE INDEX idx_checklist_editor_no ON admin_checklist_editor(checklist_id, no);
ALTER TABLE admin_checklist_editor ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on admin_checklist_editor" ON admin_checklist_editor FOR ALL USING (true) WITH CHECK (true);

-- 샘플 데이터
INSERT INTO admin_checklist_editor (checklist_id, no, major_category, sub_category, title, description, evaluation, score) VALUES
(1, 1, '보안', '접근통제', '시스템 권한 점검', '시스템 사용자 권한이 적절히 설정되어 있는지 확인', '대기', 0),
(1, 2, '보안', '패스워드', '패스워드 정책 점검', '패스워드 복잡성 및 변경 주기 확인', '대기', 0),
(1, 3, '시스템', '백업', '데이터 백업 상태', '정기적인 백업 수행 여부 확인', '대기', 0);
  `);
}

createExecFunction();