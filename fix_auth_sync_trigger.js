const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL이 설정되지 않았습니다.');
  process.exit(1);
}

async function fixAuthSyncTrigger() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('PostgreSQL 연결 성공');

    // 기존 트리거 삭제
    console.log('기존 트리거 삭제 중...');
    await client.query(`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      DROP FUNCTION IF EXISTS public.handle_new_auth_user();
    `);
    console.log('✅ 기존 트리거 삭제 완료');

    // 수정된 트리거 함수 생성
    console.log('새 트리거 함수 생성 중...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
      RETURNS TRIGGER
      SECURITY DEFINER
      SET search_path = public
      LANGUAGE plpgsql
      AS $$
      DECLARE
        next_code TEXT;
        next_no INTEGER;
        current_year TEXT;
      BEGIN
        -- 현재 연도 (YY 형식)
        current_year := TO_CHAR(NOW(), 'YY');

        -- 다음 사용자 코드 생성 (USER-25-XXX 형식)
        SELECT COALESCE(
          MAX(CAST(SUBSTRING(user_code FROM 10) AS INTEGER)),
          0
        ) + 1
        INTO next_no
        FROM admin_users_userprofiles
        WHERE user_code LIKE 'USER-' || current_year || '-%';

        next_code := 'USER-' || current_year || '-' || LPAD(next_no::TEXT, 3, '0');

        -- 다음 no 값 생성
        SELECT COALESCE(MAX(no), 0) + 1
        INTO next_no
        FROM admin_users_userprofiles;

        -- admin_users_userprofiles에 기본 프로필 생성
        INSERT INTO admin_users_userprofiles (
          auth_user_id,
          user_code,
          no,
          user_name,
          email,
          department,
          position,
          role,
          status,
          is_active,
          created_at,
          updated_at
        ) VALUES (
          NEW.id,
          next_code,
          next_no,
          COALESCE(NEW.raw_user_meta_data->>'user_name', SPLIT_PART(NEW.email, '@', 1)),
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'department', '미지정'),
          COALESCE(NEW.raw_user_meta_data->>'position', '미지정'),
          COALESCE(NEW.raw_user_meta_data->>'role', '일반'),
          'active',
          true,
          NOW(),
          NOW()
        );

        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Error in handle_new_auth_user: %', SQLERRM;
          RAISE;
      END;
      $$;
    `);
    console.log('✅ 트리거 함수 생성 완료');

    // 트리거 생성
    console.log('트리거 생성 중...');
    await client.query(`
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_auth_user();
    `);
    console.log('✅ 트리거 생성 완료');

    console.log('\n=== Auth 동기화 트리거 수정 완료 ===');
  } catch (error) {
    console.error('오류 발생:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixAuthSyncTrigger();
