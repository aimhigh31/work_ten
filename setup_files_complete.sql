-- ========================================
-- 보안교육관리 자료탭 DB 설정
-- common_files_data 테이블 + Storage 버킷 생성
-- ========================================

-- ===================
-- Step 1: 테이블 생성
-- ===================

-- common_files_data 테이블 생성
CREATE TABLE IF NOT EXISTS common_files_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL,
  record_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  user_id UUID,
  user_name TEXT,
  team TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_files_page ON common_files_data(page);
CREATE INDEX IF NOT EXISTS idx_files_record_id ON common_files_data(record_id);
CREATE INDEX IF NOT EXISTS idx_files_page_record ON common_files_data(page, record_id);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON common_files_data(created_at DESC);

-- RLS 활성화
ALTER TABLE common_files_data ENABLE ROW LEVEL SECURITY;

-- 정책 생성 (개발 환경: 모든 권한 허용)
DROP POLICY IF EXISTS "Allow read access to all users" ON common_files_data;
CREATE POLICY "Allow read access to all users"
  ON common_files_data FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow insert access to all users" ON common_files_data;
CREATE POLICY "Allow insert access to all users"
  ON common_files_data FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access to all users" ON common_files_data;
CREATE POLICY "Allow update access to all users"
  ON common_files_data FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow delete access to all users" ON common_files_data;
CREATE POLICY "Allow delete access to all users"
  ON common_files_data FOR DELETE
  USING (true);

-- ========================
-- Step 2: Storage 버킷 생성
-- ========================

-- Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('common-files', 'common-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS 정책 설정 (개발 환경: 모든 권한 허용)

-- 모든 사용자가 파일 읽기 가능
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
CREATE POLICY "Allow public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'common-files');

-- 모든 사용자가 파일 업로드 가능
DROP POLICY IF EXISTS "Allow all users to upload" ON storage.objects;
CREATE POLICY "Allow all users to upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'common-files');

-- 모든 사용자가 파일 수정 가능
DROP POLICY IF EXISTS "Allow all users to update" ON storage.objects;
CREATE POLICY "Allow all users to update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'common-files');

-- 모든 사용자가 파일 삭제 가능
DROP POLICY IF EXISTS "Allow all users to delete" ON storage.objects;
CREATE POLICY "Allow all users to delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'common-files');

-- ========================
-- 결과 확인
-- ========================

-- 테이블 확인
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'common_files_data'
ORDER BY ordinal_position;

-- Storage 버킷 확인
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'common-files';

-- Storage 정책 확인
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND policyname LIKE '%common-files%'
ORDER BY policyname;

SELECT '✅ 자료탭 DB 설정 완료!' AS message;
