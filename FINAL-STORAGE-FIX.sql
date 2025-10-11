-- 최종 Storage RLS 해결 방법
-- Supabase Dashboard → SQL Editor에서 실행하세요

-- 모든 기존 정책 삭제
DROP POLICY IF EXISTS "Allow all uploads to profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all updates to profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all deletes to profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Enable all operations for profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all for profile-images" ON storage.objects;

-- 가장 간단한 정책 하나만 생성
CREATE POLICY "profile_images_all_access" ON storage.objects
  FOR ALL USING (bucket_id = 'profile-images')
  WITH CHECK (bucket_id = 'profile-images');

-- 또는 RLS를 아예 비활성화 (개발용)
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;