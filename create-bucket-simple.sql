-- 간단한 버킷 생성 및 정책 설정
-- Supabase Dashboard -> SQL Editor에서 실행

-- 1단계: 버킷 생성 (수동으로 먼저 생성하거나 이 쿼리로 생성)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2단계: 인증된 사용자가 업로드할 수 있도록 정책 생성
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.role() = 'authenticated'
);

-- 3단계: 모든 사람이 읽을 수 있도록 정책 생성
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

-- 4단계: 자신의 파일만 업데이트/삭제 가능하도록 정책 생성
CREATE POLICY "Allow user to update own files" ON storage.objects
FOR UPDATE WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow user to delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);