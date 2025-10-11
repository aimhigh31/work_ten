-- Supabase Storage 버킷 생성
-- 이 스크립트는 Supabase Dashboard의 SQL Editor에서 실행해야 합니다

-- 프로필 이미지용 버킷 생성 (이미 존재하면 무시)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,  -- 공개 버킷으로 설정 (프로필 사진은 일반적으로 공개)
  5242880,  -- 5MB 제한
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 버킷 정책 설정 (인증된 사용자만 업로드 가능)
CREATE POLICY "Allow authenticated users to upload profile images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images'
  AND auth.role() = 'authenticated'
);

-- 모든 사용자가 읽기 가능 (공개 프로필)
CREATE POLICY "Allow public to read profile images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-images');

-- 자신의 이미지만 수정/삭제 가능
CREATE POLICY "Users can update own profile images"
ON storage.objects
FOR UPDATE
WITH CHECK (
  bucket_id = 'profile-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own profile images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profile-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);