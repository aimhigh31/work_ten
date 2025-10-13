-- title 컬럼 추가 (VOC 관리 등에서 제목 표시용)
ALTER TABLE common_log_data
ADD COLUMN IF NOT EXISTS title TEXT;

-- 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_common_log_title ON common_log_data(title);

-- 코멘트 추가
COMMENT ON COLUMN common_log_data.title IS '변경 로그 제목 (예: VOC 요청내용, 작업명 등)';
