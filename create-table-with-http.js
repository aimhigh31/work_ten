const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createTableWithHTTP() {
  try {
    console.log('🚀 HTTP API를 통한 테이블 생성 시작...');

    // SQL 실행을 위한 REST API 호출
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

    // Supabase REST API SQL 실행 시도
    console.log('🔧 SQL 실행 시도...');

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql: createTableSQL })
    });

    if (!response.ok) {
      console.log('❌ REST API SQL 실행 실패');
      console.log('📋 수동으로 Supabase Dashboard에서 실행할 SQL:\n');
      console.log(createTableSQL);

      // 샘플 데이터 SQL도 출력
      console.log('\n-- 샘플 데이터 삽입');
      console.log(`INSERT INTO admin_checklist_editor (checklist_id, no, major_category, sub_category, title, description, evaluation, score) VALUES
(1, 1, '보안', '접근통제', '시스템 권한 점검', '시스템 사용자 권한이 적절히 설정되어 있는지 확인', '대기', 0),
(1, 2, '보안', '패스워드', '패스워드 정책 점검', '패스워드 복잡성 및 변경 주기 확인', '대기', 0),
(1, 3, '시스템', '백업', '데이터 백업 상태', '정기적인 백업 수행 여부 확인', '대기', 0),
(2, 1, '네트워크', '방화벽', '방화벽 설정 검토', '불필요한 포트 및 서비스 차단 확인', '대기', 0),
(2, 2, '네트워크', '모니터링', '트래픽 모니터링', '네트워크 트래픽 이상 여부 모니터링', '대기', 0),
(4, 1, '보안', '라이선스', '라이선스 점검', '소프트웨어 라이선스 만료일 확인', '대기', 0),
(4, 2, '보안', '정책', '보안 정책 준수', '회사 보안 정책 준수 여부 확인', '대기', 0);`);

      return;
    }

    const result = await response.json();
    console.log('✅ SQL 실행 결과:', result);

    // 테이블 생성 확인
    console.log('\n🔍 테이블 생성 확인...');
    const checkResponse = await fetch(`${supabaseUrl}/rest/v1/admin_checklist_editor?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });

    if (checkResponse.ok) {
      console.log('✅ admin_checklist_editor 테이블 생성 성공!');

      // 샘플 데이터 삽입
      console.log('🔧 샘플 데이터 삽입...');
      const sampleData = [
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
      ];

      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/admin_checklist_editor`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(sampleData)
      });

      if (insertResponse.ok) {
        const insertResult = await insertResponse.json();
        console.log('✅ 샘플 데이터 삽입 성공:', insertResult.length, '개');
      } else {
        console.log('⚠️ 샘플 데이터 삽입 실패:', insertResponse.status);
      }

    } else {
      console.log('❌ 테이블 생성 확인 실패:', checkResponse.status);
    }

    console.log('\n🎉 설정 완료!');

  } catch (error) {
    console.error('💥 오류 발생:', error.message);

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
}

createTableWithHTTP();