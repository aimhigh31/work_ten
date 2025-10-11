-- ========================================
-- Supabase Storage 버킷 생성 및 설정
-- ========================================

-- 1. Storage 버킷 생성 (SQL로는 직접 생성 불가, Dashboard에서 수동 생성 필요)
-- Supabase Dashboard > Storage > New Bucket
-- 버킷명: system-assets
-- Public bucket: Yes (체크)

-- 2. Storage 정책 설정 (버킷 생성 후 실행)
-- 모든 사용자가 읽기 가능
INSERT INTO storage.policies (bucket_id, name, definition, operation)
VALUES (
  'system-assets',
  'Public Access',
  '{"public": true}'::jsonb,
  'SELECT'
)
ON CONFLICT (bucket_id, name, operation) DO NOTHING;

-- 인증된 사용자만 업로드/수정/삭제 가능
INSERT INTO storage.policies (bucket_id, name, definition, operation)
VALUES (
  'system-assets',
  'Authenticated users can upload',
  '{"authenticated": true}'::jsonb,
  'INSERT'
)
ON CONFLICT (bucket_id, name, operation) DO NOTHING;

INSERT INTO storage.policies (bucket_id, name, definition, operation)
VALUES (
  'system-assets',
  'Authenticated users can update',
  '{"authenticated": true}'::jsonb,
  'UPDATE'
)
ON CONFLICT (bucket_id, name, operation) DO NOTHING;

INSERT INTO storage.policies (bucket_id, name, definition, operation)
VALUES (
  'system-assets',
  'Authenticated users can delete',
  '{"authenticated": true}'::jsonb,
  'DELETE'
)
ON CONFLICT (bucket_id, name, operation) DO NOTHING;

-- 3. 개발 환경용 - 모든 작업 허용 (선택사항)
-- 주의: 프로덕션에서는 사용하지 마세요!

-- 확인 쿼리
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'system-assets';

SELECT * FROM storage.policies WHERE bucket_id = 'system-assets';

-- ========================================
-- 수동 작업 필요!
-- ========================================
-- 1. Supabase Dashboard 접속
-- 2. Storage 탭 클릭
-- 3. "New Bucket" 버튼 클릭
-- 4. 다음 설정으로 생성:
--    - Bucket name: system-assets
--    - Public bucket: ✅ 체크
--    - File size limit: 5MB (5000000)
--    - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
-- 5. "Create Bucket" 클릭
-- ========================================