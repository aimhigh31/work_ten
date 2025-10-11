const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createEditorTableAPI() {
  try {
    console.log('🔄 Supabase API를 통한 테이블 생성 시도...');

    // 1. SQL 함수로 테이블 생성 시도
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

      CREATE INDEX IF NOT EXISTS idx_checklist_editor_checklist_id
          ON admin_checklist_editor(checklist_id);
      CREATE INDEX IF NOT EXISTS idx_checklist_editor_no
          ON admin_checklist_editor(checklist_id, no);

      ALTER TABLE admin_checklist_editor ENABLE ROW LEVEL SECURITY;

      CREATE POLICY "Allow all operations on admin_checklist_editor"
          ON admin_checklist_editor FOR ALL
          USING (true)
          WITH CHECK (true);
    `;

    // Supabase SQL 실행 시도
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (error) {
      console.log('❌ SQL 실행 실패:', error.message);
      console.log('💡 Supabase Dashboard > SQL Editor에서 다음 SQL을 실행해주세요:');
      console.log('');
      console.log(createTableSQL);
      console.log('');

      // 테스트용으로 기존 체크리스트 데이터 확인
      console.log('🔍 기존 admin_checklist_data 테이블 확인...');
      const { data: checklistData, error: checklistError } = await supabase
        .from('admin_checklist_data')
        .select('id, code, work_content')
        .limit(3);

      if (checklistError) {
        console.log('❌ admin_checklist_data 조회 실패:', checklistError.message);
      } else {
        console.log('✅ 기존 체크리스트 데이터:', checklistData?.length || 0, '개');
        if (checklistData && checklistData.length > 0) {
          console.log('첫 번째 체크리스트:', checklistData[0]);
        }
      }

      return;
    }

    console.log('✅ 테이블 생성 성공:', data);

    // 2. 샘플 데이터 삽입
    console.log('🔧 샘플 데이터 삽입 중...');
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

    const { data: insertData, error: insertError } = await supabase
      .from('admin_checklist_editor')
      .insert(sampleData)
      .select();

    if (insertError) {
      console.log('❌ 샘플 데이터 삽입 실패:', insertError.message);
    } else {
      console.log('✅ 샘플 데이터 삽입 완료:', insertData?.length || 0, '개');
    }

    // 3. 테이블 데이터 확인
    const { data: testData, error: testError } = await supabase
      .from('admin_checklist_editor')
      .select('*')
      .limit(3);

    if (testError) {
      console.log('❌ 테이블 조회 실패:', testError.message);
    } else {
      console.log('✅ 테이블 조회 성공:', testData?.length || 0, '개 데이터');
      if (testData && testData.length > 0) {
        console.log('첫 번째 데이터:', testData[0]);
      }
    }

    console.log('🎉 admin_checklist_editor 테이블 설정 완료!');

  } catch (error) {
    console.error('💥 오류 발생:', error.message);

    console.log('');
    console.log('📋 수동으로 Supabase Dashboard에서 실행할 SQL:');
    console.log('');
    console.log(`
-- admin_checklist_editor 테이블 생성
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

    -- 외래키 제약조건
    CONSTRAINT fk_checklist_editor_checklist
        FOREIGN KEY (checklist_id)
        REFERENCES admin_checklist_data(id)
        ON DELETE CASCADE,

    -- 체크 제약조건
    CONSTRAINT chk_evaluation
        CHECK (evaluation IN ('대기', '진행', '완료', '보류', '불가')),

    CONSTRAINT chk_score
        CHECK (score >= 0 AND score <= 100)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_checklist_editor_checklist_id
    ON admin_checklist_editor(checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_editor_no
    ON admin_checklist_editor(checklist_id, no);

-- RLS 활성화
ALTER TABLE admin_checklist_editor ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
CREATE POLICY "Allow all operations on admin_checklist_editor"
    ON admin_checklist_editor FOR ALL
    USING (true)
    WITH CHECK (true);

-- 샘플 데이터 삽입
INSERT INTO admin_checklist_editor (checklist_id, no, major_category, sub_category, title, description, evaluation, score) VALUES
(1, 1, '보안', '접근통제', '시스템 권한 점검', '시스템 사용자 권한이 적절히 설정되어 있는지 확인', '대기', 0),
(1, 2, '보안', '패스워드', '패스워드 정책 점검', '패스워드 복잡성 및 변경 주기 확인', '대기', 0),
(1, 3, '시스템', '백업', '데이터 백업 상태', '정기적인 백업 수행 여부 확인', '대기', 0),
(2, 1, '네트워크', '방화벽', '방화벽 설정 검토', '불필요한 포트 및 서비스 차단 확인', '대기', 0),
(2, 2, '네트워크', '모니터링', '트래픽 모니터링', '네트워크 트래픽 이상 여부 모니터링', '대기', 0);
    `);
  }
}

createEditorTableAPI();