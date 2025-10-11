-- Supabase Storage RLS 정책 설정
-- Supabase Dashboard → SQL Editor에서 실행하세요

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Allow all uploads to profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all updates to profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all deletes to profile-images" ON storage.objects;

-- 1. 모든 사용자가 profile-images 버킷에 업로드 가능 (임시로 느슨한 정책)
CREATE POLICY "Allow all uploads to profile-images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'profile-images');

-- 2. 모든 사용자가 profile-images 버킷의 파일을 읽기 가능
CREATE POLICY "Allow public access to profile-images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-images');

-- 3. 모든 사용자가 profile-images 버킷의 파일을 업데이트 가능 (임시)
CREATE POLICY "Allow all updates to profile-images"
ON storage.objects
FOR UPDATE
WITH CHECK (bucket_id = 'profile-images');

-- 4. 모든 사용자가 profile-images 버킷의 파일을 삭제 가능 (임시)
CREATE POLICY "Allow all deletes to profile-images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'profile-images');

-- 정책 적용 확인
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%profile-images%';

RAISE NOTICE '✅ Storage RLS 정책이 설정되었습니다.';