require('dotenv').config({ path: '.env.local' });

// MCP 클라이언트를 직접 구현해서 테스트
async function testMCPConnection() {
  console.log('🔧 환경변수 확인...');
  console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '미설정');

  // 대신 직접 supabase-js로 테이블 생성 시도
  const { createClient } = require('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  console.log('🚀 Supabase 클라이언트로 직접 테이블 생성 시도...');

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

  try {
    console.log('📝 SQL 실행 중...');
    const { data, error } = await supabase.rpc('exec', { sql: createTableSQL });

    if (error) {
      console.log('❌ RPC 실행 실패:', error.message);

      // 대안: 간단한 테이블 존재 확인으로 테스트
      console.log('🔍 테이블 존재 여부 확인...');
      const { data: testData, error: testError } = await supabase
        .from('admin_checklist_editor')
        .select('id')
        .limit(1);

      if (testError) {
        if (testError.message.includes('does not exist') || testError.message.includes('Could not find the table')) {
          console.log('📋 테이블이 존재하지 않습니다. 수동 생성이 필요합니다.');
          showManualSQL();
        } else {
          console.log('❌ 테이블 확인 실패:', testError.message);
        }
      } else {
        console.log('✅ 테이블이 이미 존재합니다!');
        await insertSampleData(supabase);
      }
    } else {
      console.log('✅ SQL 실행 성공!', data);
      await insertSampleData(supabase);
    }

  } catch (err) {
    console.log('💥 전체 실행 실패:', err.message);
    showManualSQL();
  }
}

async function insertSampleData(supabase) {
  console.log('📋 샘플 데이터 삽입 시도...');

  const { data, error } = await supabase
    .from('admin_checklist_editor')
    .insert([
      {
        checklist_id: 1,
        no: 1,
        major_category: '보안',
        sub_category: '접근통제',
        title: '시스템 권한 점검',
        description: '시스템 사용자 권한이 적절히 설정되어 있는지 확인',
        evaluation: '대기',
        score: 0
      },
      {
        checklist_id: 1,
        no: 2,
        major_category: '보안',
        sub_category: '패스워드',
        title: '패스워드 정책 점검',
        description: '패스워드 복잡성 및 변경 주기 확인',
        evaluation: '대기',
        score: 0
      },
      {
        checklist_id: 1,
        no: 3,
        major_category: '시스템',
        sub_category: '백업',
        title: '데이터 백업 상태',
        description: '정기적인 백업 수행 여부 확인',
        evaluation: '대기',
        score: 0
      }
    ]);

  if (error) {
    console.log('⚠️ 샘플 데이터 삽입 실패:', error.message);
  } else {
    console.log('✅ 샘플 데이터 삽입 성공:', data?.length || 0, '개');
  }
}

function showManualSQL() {
  console.log('\n📋 수동으로 Supabase Dashboard에서 실행할 SQL:');
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

testMCPConnection();