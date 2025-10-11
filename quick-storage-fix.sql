-- 빠른 Storage 정책 수정
-- Supabase Dashboard → SQL Editor에서 실행

-- 모든 사용자 업로드 허용 (가장 간단한 정책)
CREATE POLICY "Enable all operations for profile-images"
ON storage.objects
FOR ALL
USING (bucket_id = 'profile-images')
WITH CHECK (bucket_id = 'profile-images');