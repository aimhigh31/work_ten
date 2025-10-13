-- =====================================================
-- common_log_data 테이블 생성
-- 용도: 전체 시스템의 변경 이력 추적 (Audit Trail)
-- =====================================================

CREATE TABLE IF NOT EXISTS common_log_data (
  id SERIAL PRIMARY KEY,

  -- 페이지 식별
  page TEXT NOT NULL,                    -- 페이지 식별자 (예: 'security_education')
  record_id TEXT NOT NULL,               -- 레코드 ID

  -- 변경 정보
  action_type TEXT NOT NULL,             -- 액션 타입 (예: '커리큘럼추가', '참석자삭제', '상태변경')
  description TEXT NOT NULL,             -- 변경 내용 설명

  -- 변경 전/후 값
  before_value TEXT,                     -- 변경 전 값 (JSON 문자열 또는 텍스트)
  after_value TEXT,                      -- 변경 후 값 (JSON 문자열 또는 텍스트)

  -- 사용자 정보
  user_id TEXT,                          -- 사용자 ID
  user_name TEXT NOT NULL,               -- 사용자명
  team TEXT,                             -- 팀
  user_department TEXT,                  -- 부서명
  user_position TEXT,                    -- 직급
  user_profile_image TEXT,               -- 프로필 이미지 URL

  -- 추가 메타데이터
  metadata JSONB,                        -- 추가 정보 (targetId, targetName, changeType 등)

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW()   -- 생성 일시
);

-- =====================================================
-- 인덱스 생성 (성능 최적화)
-- =====================================================

-- page와 record_id로 특정 레코드의 변경 이력 조회 시 사용
CREATE INDEX idx_common_log_page_record ON common_log_data(page, record_id);

-- page로 특정 페이지의 모든 변경 이력 조회 시 사용
CREATE INDEX idx_common_log_page ON common_log_data(page);

-- 시간순 정렬을 위한 인덱스
CREATE INDEX idx_common_log_created_at ON common_log_data(created_at DESC);

-- action_type으로 특정 타입의 변경만 필터링할 때 사용
CREATE INDEX idx_common_log_action_type ON common_log_data(action_type);

-- =====================================================
-- RLS (Row Level Security) 설정
-- =====================================================

-- RLS 활성화
ALTER TABLE common_log_data ENABLE ROW LEVEL SECURITY;

-- 모든 사용자 읽기 허용 (로그인한 사용자)
CREATE POLICY "Anyone can read logs" ON common_log_data
  FOR SELECT USING (true);

-- 인증된 사용자만 삽입 허용
CREATE POLICY "Authenticated users can insert logs" ON common_log_data
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 업데이트/삭제 금지 (감사 로그는 불변)
-- 로그 데이터는 한 번 생성되면 수정/삭제 불가

-- =====================================================
-- 코멘트 추가
-- =====================================================

COMMENT ON TABLE common_log_data IS '전체 시스템의 변경 이력을 추적하는 감사 로그 테이블';
COMMENT ON COLUMN common_log_data.page IS '페이지 식별자 (예: security_education, it_education, hardware 등)';
COMMENT ON COLUMN common_log_data.record_id IS '변경된 레코드의 ID (TEXT 타입)';
COMMENT ON COLUMN common_log_data.action_type IS '변경 액션 타입 (예: 커리큘럼추가, 참석자삭제, 상태변경 등)';
COMMENT ON COLUMN common_log_data.description IS '변경 내용을 자연어로 설명 (예: "김철수님이 커리큘럼 항목 보안 기초교육을 추가했습니다")';
COMMENT ON COLUMN common_log_data.before_value IS '변경 전 값 (단순 값 또는 JSON 문자열)';
COMMENT ON COLUMN common_log_data.after_value IS '변경 후 값 (단순 값 또는 JSON 문자열)';
COMMENT ON COLUMN common_log_data.metadata IS '추가 메타데이터 (targetId, targetName, changeType, fieldName 등을 JSON으로 저장)';

-- =====================================================
-- 완료
-- =====================================================
-- 이 SQL을 Supabase SQL Editor에서 실행하세요.
