-- 사용자 테이블에 프로필 이미지 URL 컬럼 추가
-- 이 스크립트는 Supabase Dashboard의 SQL Editor에서 실행해야 합니다

-- user_profiles 테이블에 profile_image_url 컬럼 추가 (이미 존재하면 무시)
DO $$
BEGIN
    -- 컬럼이 존재하지 않는 경우에만 추가
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'profile_image_url'
    ) THEN
        ALTER TABLE user_profiles
        ADD COLUMN profile_image_url TEXT;

        RAISE NOTICE '✅ profile_image_url 컬럼이 user_profiles 테이블에 추가되었습니다.';
    ELSE
        RAISE NOTICE '⚠️  profile_image_url 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- 만약 avatar_url 컬럼을 사용하고 있다면, 해당 컬럼의 용도를 명확히 하기 위한 주석 추가
COMMENT ON COLUMN user_profiles.profile_image_url IS '프로필 이미지 URL (Supabase Storage에 저장된 이미지의 공개 URL)';
COMMENT ON COLUMN user_profiles.avatar_url IS 'Avatar URL (기존 아바타 이미지 URL, profile_image_url과 병행 사용 가능)';

-- 인덱스 추가 (성능 향상용, 선택사항)
CREATE INDEX IF NOT EXISTS idx_user_profiles_profile_image_url
ON user_profiles(profile_image_url)
WHERE profile_image_url IS NOT NULL;

RAISE NOTICE '🎯 사용자 프로필 이미지 URL 필드 설정이 완료되었습니다.';