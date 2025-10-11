const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupChecklistEditorTable() {
  try {
    console.log('🚀 Supabase admin_checklist_editor 테이블 설정 시작...');

    // 1. 기존 체크리스트 데이터 확인
    console.log('📋 기존 admin_checklist_data 확인...');
    const { data: checklistData, error: checklistError } = await supabase
      .from('admin_checklist_data')
      .select('id, code, work_content')
      .eq('is_active', true)
      .limit(5);

    if (checklistError) {
      console.error('❌ admin_checklist_data 조회 실패:', checklistError.message);
      return;
    }

    console.log('✅ 기존 체크리스트 데이터:', checklistData?.length || 0, '개');
    if (checklistData && checklistData.length > 0) {
      console.log('📄 첫 번째 체크리스트:', checklistData[0]);
    }

    // 2. 테이블 생성을 위한 SQL 실행 (REST API 방식)
    console.log('\n🔧 admin_checklist_editor 테이블 생성 시도...');

    // 테스트 데이터로 테이블 존재 확인
    const { data: testData, error: testError } = await supabase
      .from('admin_checklist_editor')
      .select('id')
      .limit(1);

    if (testError && testError.message.includes('does not exist')) {
      console.log('❌ admin_checklist_editor 테이블이 존재하지 않습니다.');
      console.log('📋 다음 SQL을 Supabase Dashboard에서 실행해주세요:\n');

      const createTableSQL = `
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
CREATE INDEX idx_checklist_editor_checklist_id ON admin_checklist_editor(checklist_id);
CREATE INDEX idx_checklist_editor_no ON admin_checklist_editor(checklist_id, no);

-- RLS 활성화
ALTER TABLE admin_checklist_editor ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
CREATE POLICY "Allow all operations on admin_checklist_editor"
    ON admin_checklist_editor FOR ALL
    USING (true)
    WITH CHECK (true);
      `;

      console.log(createTableSQL);

      // 자동으로 샘플 데이터 준비
      if (checklistData && checklistData.length > 0) {
        console.log('\n-- 샘플 데이터 삽입');
        console.log('INSERT INTO admin_checklist_editor (checklist_id, no, major_category, sub_category, title, description, evaluation, score) VALUES');

        const sampleInserts = checklistData.slice(0, 3).map((item, index) => {
          const categories = [
            ['보안', '접근통제', '시스템 권한 점검', '시스템 사용자 권한이 적절히 설정되어 있는지 확인'],
            ['보안', '패스워드', '패스워드 정책 점검', '패스워드 복잡성 및 변경 주기 확인'],
            ['시스템', '백업', '데이터 백업 상태', '정기적인 백업 수행 여부 확인']
          ];

          const [major, sub, title, desc] = categories[index] || categories[0];
          return `(${item.id}, ${index + 1}, '${major}', '${sub}', '${title}', '${desc}', '대기', 0)`;
        });

        console.log(sampleInserts.join(',\n') + ';');
      }

      return;
    }

    if (testError) {
      console.error('❌ 테이블 접근 오류:', testError.message);
      return;
    }

    console.log('✅ admin_checklist_editor 테이블이 이미 존재합니다.');

    // 3. 기존 데이터 확인
    const { data: editorData, error: editorError } = await supabase
      .from('admin_checklist_editor')
      .select('*')
      .limit(5);

    if (editorError) {
      console.error('❌ 에디터 데이터 조회 실패:', editorError.message);
    } else {
      console.log('📋 기존 에디터 데이터:', editorData?.length || 0, '개');
      if (editorData && editorData.length > 0) {
        console.log('📄 첫 번째 에디터 데이터:', editorData[0]);
      }
    }

    // 4. 샘플 데이터가 없으면 생성
    if (!editorData || editorData.length === 0) {
      console.log('\n🔧 샘플 데이터 생성 중...');

      if (checklistData && checklistData.length > 0) {
        const sampleData = [
          {
            checklist_id: checklistData[0].id,
            no: 1,
            major_category: '보안',
            sub_category: '접근통제',
            title: '시스템 권한 점검',
            description: '시스템 사용자 권한이 적절히 설정되어 있는지 확인',
            evaluation: '대기',
            score: 0
          },
          {
            checklist_id: checklistData[0].id,
            no: 2,
            major_category: '보안',
            sub_category: '패스워드',
            title: '패스워드 정책 점검',
            description: '패스워드 복잡성 및 변경 주기 확인',
            evaluation: '대기',
            score: 0
          },
          {
            checklist_id: checklistData[0].id,
            no: 3,
            major_category: '시스템',
            sub_category: '백업',
            title: '데이터 백업 상태',
            description: '정기적인 백업 수행 여부 확인',
            evaluation: '대기',
            score: 0
          }
        ];

        const { data: insertResult, error: insertError } = await supabase
          .from('admin_checklist_editor')
          .insert(sampleData)
          .select();

        if (insertError) {
          console.error('❌ 샘플 데이터 삽입 실패:', insertError.message);
        } else {
          console.log('✅ 샘플 데이터 삽입 완료:', insertResult?.length || 0, '개');
        }
      }
    }

    // 5. API 테스트
    console.log('\n🧪 API 엔드포인트 테스트...');
    if (checklistData && checklistData.length > 0) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3200'}/api/checklist-editor?checklist_id=${checklistData[0].id}`);
        const apiResult = await response.json();

        if (apiResult.success) {
          console.log('✅ API 테스트 성공:', apiResult.data?.length || 0, '개 항목');
        } else {
          console.log('❌ API 테스트 실패:', apiResult.error);
        }
      } catch (apiError) {
        console.log('⚠️ API 테스트 스킵 (개발 서버 확인 필요)');
      }
    }

    console.log('\n🎉 admin_checklist_editor 설정 완료!');
    console.log('💡 이제 체크리스트 편집 팝업의 에디터탭에서 데이터를 확인할 수 있습니다.');

  } catch (error) {
    console.error('💥 오류 발생:', error.message);
  }
}

setupChecklistEditorTable();