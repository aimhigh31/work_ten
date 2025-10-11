-- OPL 이미지 버킷에 대한 RLS 정책 설정

-- 1. 모든 사용자가 파일 업로드 가능
CREATE POLICY "Anyone can upload OPL images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'opl-images');

-- 2. 모든 사용자가 파일 조회 가능
CREATE POLICY "Anyone can view OPL images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'opl-images');

-- 3. 모든 사용자가 파일 업데이트 가능
CREATE POLICY "Anyone can update OPL images"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'opl-images');

-- 4. 모든 사용자가 파일 삭제 가능
CREATE POLICY "Anyone can delete OPL images"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'opl-images');
