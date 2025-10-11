const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createChecklistEditorTable() {
  try {
    console.log('🔄 admin_checklist_editor 테이블 생성 시작...');

    // 1. 테이블 생성
    const { error: createTableError } = await supabase.rpc('create_checklist_editor_table', {});

    if (createTableError) {
      // RPC가 없으므로 직접 SQL 실행 시도
      console.log('📝 직접 SQL로 테이블 생성...');

      // Supabase REST API를 통한 테이블 생성은 제한적이므로
      // 테스트 데이터 삽입으로 테이블 구조 확인
      const testData = {
        checklist_id: 1,
        no: 1,
        major_category: '보안',
        sub_category: '접근통제',
        title: '시스템 권한 점검',
        description: '시스템 사용자 권한이 적절히 설정되어 있는지 확인',
        evaluation: '대기',
        score: 0,
        created_by: 'system',
        updated_by: 'system',
        is_active: true
      };

      const { data: insertData, error: insertError } = await supabase
        .from('admin_checklist_editor')
        .insert([testData])
        .select();

      if (insertError) {
        console.error('❌ 테이블이 존재하지 않습니다. SQL로 생성 필요:', insertError.message);

        // 수동으로 실행해야 하는 SQL 스크립트 출력
        console.log(`
📋 다음 SQL을 Supabase Dashboard에서 실행하세요:

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

-- RLS (Row Level Security) 활성화
ALTER TABLE admin_checklist_editor ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (모든 작업 허용)
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
        return;
      } else {
        console.log('✅ 테스트 데이터 삽입 성공:', insertData);

        // 테스트 데이터 삭제
        await supabase
          .from('admin_checklist_editor')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🗑️ 테스트 데이터 삭제 완료');
      }
    }

    // 2. 테이블 구조 확인
    const { data: tableData, error: selectError } = await supabase
      .from('admin_checklist_editor')
      .select('*')
      .limit(1);

    if (selectError) {
      console.error('❌ 테이블 조회 실패:', selectError.message);
    } else {
      console.log('✅ admin_checklist_editor 테이블 확인 완료');
      console.log('📊 테이블 구조 확인됨');
    }

  } catch (error) {
    console.error('💥 오류 발생:', error.message);
  }
}

createChecklistEditorTable();