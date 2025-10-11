-- ================================================
-- 하드웨어 이미지 Storage 정책 설정
-- ================================================

-- 1. 공개 읽기 허용 (누구나 이미지 조회 가능)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'hardware-images' );

-- 2. 인증된 사용자 업로드 허용
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'hardware-images' );

-- 3. 인증된 사용자 삭제 허용
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'hardware-images' );

-- 4. 인증된 사용자 업데이트 허용
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'hardware-images' );

-- ================================================
-- 정책 확인
-- ================================================
-- 다음 쿼리로 정책이 잘 생성되었는지 확인하세요:
-- SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
