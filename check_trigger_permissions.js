const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL이 설정되지 않았습니다.');
  process.exit(1);
}

async function checkTriggerPermissions() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('PostgreSQL 연결 성공\n');

    // 1. 트리거 함수 존재 확인
    console.log('=== 1. 트리거 함수 확인 ===');
    const { rows: functions } = await client.query(`
      SELECT
        n.nspname as schema,
        p.proname as function_name,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'handle_new_auth_user';
    `);

    if (functions.length > 0) {
      console.log('✅ 트리거 함수 발견:', functions[0].schema + '.' + functions[0].function_name);
    } else {
      console.log('❌ 트리거 함수 없음');
    }

    // 2. 트리거 존재 확인
    console.log('\n=== 2. 트리거 확인 ===');
    const { rows: triggers } = await client.query(`
      SELECT
        trigger_name,
        event_manipulation,
        event_object_schema,
        event_object_table,
        action_statement
      FROM information_schema.triggers
      WHERE trigger_name = 'on_auth_user_created';
    `);

    if (triggers.length > 0) {
      console.log('✅ 트리거 발견:', triggers[0].trigger_name);
      console.log('   대상 테이블:', triggers[0].event_object_schema + '.' + triggers[0].event_object_table);
    } else {
      console.log('❌ 트리거 없음');
    }

    // 3. admin_users_userprofiles 테이블 권한 확인
    console.log('\n=== 3. 테이블 권한 확인 ===');
    const { rows: tablePerms } = await client.query(`
      SELECT
        grantee,
        privilege_type
      FROM information_schema.table_privileges
      WHERE table_name = 'admin_users_userprofiles'
      AND table_schema = 'public';
    `);

    console.log('admin_users_userprofiles 권한:');
    tablePerms.forEach(perm => {
      console.log(`  - ${perm.grantee}: ${perm.privilege_type}`);
    });

    // 4. 테스트 실행 - 트리거 없이 직접 삽입 시도
    console.log('\n=== 4. 직접 삽입 테스트 ===');
    try {
      await client.query(`
        INSERT INTO admin_users_userprofiles (
          user_code,
          no,
          user_name,
          email,
          department,
          position,
          role,
          status,
          is_active
        ) VALUES (
          'TEST-99-999',
          9999,
          'Test User',
          'test@test.com',
          'Test Dept',
          'Test Position',
          'Test Role',
          'active',
          true
        ) RETURNING id;
      `);
      console.log('✅ 직접 삽입 성공 (테이블 쓰기 권한 OK)');

      // 테스트 데이터 삭제
      await client.query(`DELETE FROM admin_users_userprofiles WHERE user_code = 'TEST-99-999';`);
      console.log('✅ 테스트 데이터 삭제 완료');
    } catch (err) {
      console.log('❌ 직접 삽입 실패:', err.message);
    }

  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await client.end();
  }
}

checkTriggerPermissions();
