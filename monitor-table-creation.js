const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function monitorTableCreation() {
  console.log('🔍 admin_checklist_editor 테이블 생성 모니터링 시작...');
  console.log('');

  let checkCount = 0;
  const maxChecks = 60; // 최대 5분 동안 체크 (5초 간격)

  const checkInterval = setInterval(async () => {
    checkCount++;

    try {
      console.log(`📋 체크 ${checkCount}/${maxChecks}: admin_checklist_editor 테이블 확인 중...`);

      // 테이블 존재 여부 확인
      const { data, error } = await supabase
        .from('admin_checklist_editor')
        .select('id')
        .limit(1);

      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('Could not find the table')) {
          console.log(`❌ 테이블이 아직 생성되지 않음 (${checkCount}/${maxChecks})`);

          if (checkCount === 1) {
            console.log('');
            console.log('📋 Supabase Dashboard에서 다음 SQL을 실행해주세요:');
            console.log('');
            console.log('-- admin_checklist_editor 테이블 생성');
            console.log(`CREATE TABLE admin_checklist_editor (
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
(1, 3, '시스템', '백업', '데이터 백업 상태', '정기적인 백업 수행 여부 확인', '대기', 0);`);
            console.log('');
            console.log('⏳ SQL 실행 후 자동으로 테이블을 감지합니다...');
            console.log('');
          }

          if (checkCount >= maxChecks) {
            console.log('');
            console.log('⏰ 타임아웃: 테이블이 생성되지 않았습니다.');
            console.log('💡 Supabase Dashboard에서 SQL을 수동으로 실행해주세요.');
            clearInterval(checkInterval);
          }
        } else {
          console.log('❌ 테이블 확인 중 오류:', error.message);
        }
        return;
      }

      // 테이블이 생성되었으면
      console.log('');
      console.log('🎉 admin_checklist_editor 테이블 생성 확인!');
      clearInterval(checkInterval);

      // 테이블 데이터 확인
      const { data: tableData, error: dataError } = await supabase
        .from('admin_checklist_editor')
        .select('*')
        .limit(5);

      if (dataError) {
        console.log('❌ 데이터 조회 실패:', dataError.message);
      } else {
        console.log('✅ 테이블 데이터:', tableData?.length || 0, '개');
        if (tableData && tableData.length > 0) {
          console.log('📄 첫 번째 데이터:', tableData[0]);
        }
      }

      // API 테스트
      console.log('');
      console.log('🧪 API 엔드포인트 테스트 중...');

      try {
        const response = await fetch('http://localhost:3200/api/checklist-editor?checklist_id=1');
        const apiResult = await response.json();

        if (apiResult.success) {
          console.log('✅ API 테스트 성공:', apiResult.data?.length || 0, '개 항목');
          console.log('📄 API 응답 데이터:', apiResult.data?.slice(0, 2));
        } else {
          console.log('❌ API 테스트 실패:', apiResult.error);
        }
      } catch (apiError) {
        console.log('⚠️ API 테스트 실패:', apiError.message);
      }

      console.log('');
      console.log('🚀 체크리스트 관리 페이지의 에디터탭을 확인해보세요!');
      console.log('💡 이제 체크리스트 편집 팝업 → 에디터탭에서 데이터를 볼 수 있습니다.');

    } catch (error) {
      console.log('❌ 모니터링 오류:', error.message);
    }
  }, 5000); // 5초마다 체크

  console.log('🔄 5초마다 테이블 생성 여부를 확인합니다...');
}

monitorTableCreation();