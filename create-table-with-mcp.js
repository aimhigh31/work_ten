const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function createTableWithMCP() {
  try {
    console.log('🚀 Supabase MCP를 사용한 테이블 생성 시작...');

    // MCP 서버 실행
    const mcpServer = spawn('npx', ['@supabase/mcp-server-supabase'], {
      env: {
        ...process.env,
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      stdio: 'pipe'
    });

    console.log('📡 MCP 서버 시작됨...');

    // SQL 실행을 위한 스크립트
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

    // MCP 통신을 위한 JSON-RPC 메시지
    const sqlMessage = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "supabase_execute_sql",
        arguments: {
          sql: createTableSQL
        }
      }
    };

    console.log('🔧 SQL 실행 명령 전송...');
    mcpServer.stdin.write(JSON.stringify(sqlMessage) + '\n');

    let responseData = '';

    mcpServer.stdout.on('data', (data) => {
      responseData += data.toString();
      console.log('📦 MCP 응답:', data.toString());
    });

    mcpServer.stderr.on('data', (data) => {
      console.log('⚠️ MCP 오류:', data.toString());
    });

    mcpServer.on('close', (code) => {
      console.log(`🔚 MCP 서버 종료됨 (코드: ${code})`);

      if (responseData) {
        try {
          const response = JSON.parse(responseData);
          if (response.result) {
            console.log('✅ 테이블 생성 성공!');

            // 샘플 데이터 삽입
            insertSampleData();
          } else {
            console.log('❌ 테이블 생성 실패:', response.error);
          }
        } catch (e) {
          console.log('📋 응답 파싱 실패. 수동으로 확인이 필요합니다.');
        }
      }
    });

    // 5초 후 서버 종료
    setTimeout(() => {
      mcpServer.kill();
    }, 5000);

  } catch (error) {
    console.error('💥 MCP 테이블 생성 실패:', error.message);
    console.log('\n📋 대안: Supabase Dashboard에서 다음 SQL을 실행하세요:');
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

async function insertSampleData() {
  console.log('📋 샘플 데이터 삽입 시도...');

  const sampleDataSQL = `
INSERT INTO admin_checklist_editor (checklist_id, no, major_category, sub_category, title, description, evaluation, score) VALUES
(1, 1, '보안', '접근통제', '시스템 권한 점검', '시스템 사용자 권한이 적절히 설정되어 있는지 확인', '대기', 0),
(1, 2, '보안', '패스워드', '패스워드 정책 점검', '패스워드 복잡성 및 변경 주기 확인', '대기', 0),
(1, 3, '시스템', '백업', '데이터 백업 상태', '정기적인 백업 수행 여부 확인', '대기', 0);
  `;

  // 간단한 fetch 방식으로 시도
  try {
    const { createClient } = require('@supabase/supabase-js');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

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
  } catch (err) {
    console.log('❌ 샘플 데이터 삽입 오류:', err.message);
  }
}

createTableWithMCP();