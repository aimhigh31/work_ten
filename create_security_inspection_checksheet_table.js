const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createChecksheetTable() {
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

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: createTableSQL });

    if (error) {
      console.error('❌ 테이블 생성 실패:', error);
      console.error('상세 오류:', JSON.stringify(error, null, 2));

      // RPC 함수가 없는 경우 직접 SQL 실행
      console.log('\n⚠️ RPC 함수를 사용할 수 없습니다. Supabase Dashboard에서 직접 실행하세요:');
      console.log('\n--- SQL 스크립트 ---');
      console.log(createTableSQL);
      console.log('--- SQL 스크립트 끝 ---\n');

      return;
    }

    console.log('✅ security_inspection_checksheet 테이블 생성 완료!');
    console.log('📊 결과:', data);
  } catch (err) {
    console.error('💥 예외 발생:', err);
    console.log('\n📋 Supabase Dashboard에서 다음 SQL을 실행하세요:');
    console.log('\n--- SQL 스크립트 ---');
    console.log(createTableSQL);
    console.log('--- SQL 스크립트 끝 ---\n');
  }
}

// 실행
createChecksheetTable()
  .then(() => {
    console.log('\n🎉 모든 작업 완료!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ 실행 중 오류:', err);
    process.exit(1);
  });
