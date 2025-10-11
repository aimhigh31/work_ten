const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL이 설정되지 않았습니다.');
  process.exit(1);
}

async function createAuthSyncTrigger() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('PostgreSQL 연결 성공');

    // 1. 트리거 함수 생성 - auth.users에 사용자가 생성되면 admin_users_userprofiles에도 프로필 생성
    console.log('트리거 함수 생성 중...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
      RETURNS TRIGGER AS $$
      DECLARE
        next_code TEXT;
        next_no INTEGER;
      BEGIN
        -- 다음 사용자 코드 생성 (USER-25-XXX 형식)
        SELECT 'USER-' || TO_CHAR(NOW(), 'YY') || '-' ||
               LPAD(COALESCE(MAX(CAST(SUBSTRING(user_code FROM 10) AS INTEGER)), 0) + 1::TEXT, 3, '0')
        INTO next_code
        FROM admin_users_userprofiles
        WHERE user_code LIKE 'USER-' || TO_CHAR(NOW(), 'YY') || '-%';

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
          NEW.id,  -- auth.users의 id
          next_code,
          next_no,
          COALESCE(NEW.raw_user_meta_data->>'user_name', SPLIT_PART(NEW.email, '@', 1)),  -- 메타데이터에서 user_name 가져오기, 없으면 이메일 앞부분
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
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    console.log('✅ 트리거 함수가 생성되었습니다.');

    // 2. 트리거 생성
    console.log('트리거 생성 중...');
    await client.query(`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_auth_user();
    `);
    console.log('✅ 트리거가 생성되었습니다.');

    console.log('\n=== Auth 동기화 트리거 생성 완료 ===');
    console.log('이제 auth.users에 사용자가 생성되면 자동으로 admin_users_userprofiles에도 프로필이 생성됩니다.');
  } catch (error) {
    console.error('오류 발생:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createAuthSyncTrigger();
