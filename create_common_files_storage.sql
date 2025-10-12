-- ========================================
-- Supabase Storage 버킷 생성
-- 공통 파일 저장소 (common-files)
-- ========================================

-- 1. Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('common-files', 'common-files', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS 정책 설정 (개발 환경: 모든 권한 허용)

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

-- ========================================
-- 결과 확인
-- ========================================

-- 버킷 목록 조회
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'common-files';

-- Storage 정책 조회
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

SELECT 'Storage bucket "common-files" has been created with public access policies!' AS message;

-- ========================================
-- 주의사항:
-- 1. 이 스크립트는 개발 환경에서만 사용하세요
-- 2. 프로덕션 환경에서는 적절한 보안 정책을 설정해야 합니다
-- 3. 파일 크기 제한, 파일 타입 검증 등 추가 보안 설정 권장
-- ========================================
