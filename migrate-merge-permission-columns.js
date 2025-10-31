/**
 * DB 권한 컬럼 통합 마이그레이션
 *
 * can_create_data와 can_edit_own을 can_manage_own으로 통합
 *
 * 작업 순서:
 * 1. can_manage_own 컬럼 추가
 * 2. 기존 데이터 마이그레이션 (can_create_data OR can_edit_own = can_manage_own)
 * 3. can_create_data, can_edit_own 컬럼 제거
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL 또는 SUPABASE_DB_URL 환경 변수가 설정되지 않았습니다.');
  console.log('💡 .env.local 파일에 다음 중 하나를 추가하세요:');
  console.log('   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres');
  console.log('   또는');
  console.log('   SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres');
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    await client.connect();
    console.log('✅ DB 연결 성공');

    // 1. 현재 컬럼 확인
    console.log('\n📊 현재 테이블 구조 확인...');
    const { rows: columns } = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'admin_users_rules_permissions'
      AND column_name IN ('can_create_data', 'can_edit_own', 'can_manage_own')
      ORDER BY column_name;
    `);

    console.log('현재 컬럼:', columns);

    // 2. can_manage_own 컬럼이 이미 있는지 확인
    const hasManageOwn = columns.some(col => col.column_name === 'can_manage_own');

    if (hasManageOwn) {
      console.log('⚠️  can_manage_own 컬럼이 이미 존재합니다.');
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        readline.question('계속 진행하시겠습니까? (yes/no): ', resolve);
      });
      readline.close();

      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ 마이그레이션 취소');
        await client.end();
        return;
      }
    } else {
      // 3. can_manage_own 컬럼 추가
      console.log('\n➕ can_manage_own 컬럼 추가...');
      await client.query(`
        ALTER TABLE admin_users_rules_permissions
        ADD COLUMN IF NOT EXISTS can_manage_own BOOLEAN DEFAULT false;
      `);
      console.log('✅ can_manage_own 컬럼 추가 완료');
    }

    // 4. 기존 데이터 마이그레이션 전 데이터 확인
    console.log('\n📊 마이그레이션 전 데이터 확인...');
    const { rows: beforeData } = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN can_create_data = true THEN 1 END) as create_count,
        COUNT(CASE WHEN can_edit_own = true THEN 1 END) as edit_own_count,
        COUNT(CASE WHEN can_create_data = true OR can_edit_own = true THEN 1 END) as will_migrate
      FROM admin_users_rules_permissions;
    `);

    console.log('마이그레이션 대상:', beforeData[0]);
    console.log(`- 전체 레코드: ${beforeData[0].total}`);
    console.log(`- can_create_data = true: ${beforeData[0].create_count}`);
    console.log(`- can_edit_own = true: ${beforeData[0].edit_own_count}`);
    console.log(`- can_manage_own으로 통합될 레코드: ${beforeData[0].will_migrate}`);

    // 5. 데이터 마이그레이션
    console.log('\n🔄 데이터 마이그레이션 시작...');
    const { rowCount } = await client.query(`
      UPDATE admin_users_rules_permissions
      SET can_manage_own = (can_create_data OR can_edit_own)
      WHERE can_create_data = true OR can_edit_own = true;
    `);
    console.log(`✅ ${rowCount}개 레코드 마이그레이션 완료`);

    // 6. 마이그레이션 후 데이터 확인
    console.log('\n📊 마이그레이션 후 데이터 확인...');
    const { rows: afterData } = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN can_manage_own = true THEN 1 END) as manage_own_count
      FROM admin_users_rules_permissions;
    `);

    console.log('마이그레이션 결과:', afterData[0]);
    console.log(`- can_manage_own = true: ${afterData[0].manage_own_count}`);

    // 7. 샘플 데이터 출력
    console.log('\n📋 샘플 데이터 (처음 5개):');
    const { rows: sampleData } = await client.query(`
      SELECT
        role_id,
        menu_id,
        can_create_data,
        can_edit_own,
        can_manage_own,
        can_edit_others
      FROM admin_users_rules_permissions
      ORDER BY role_id, menu_id
      LIMIT 5;
    `);
    console.table(sampleData);

    // 8. 기존 컬럼 제거 확인
    console.log('\n❓ can_create_data와 can_edit_own 컬럼을 제거하시겠습니까?');
    console.log('⚠️  주의: 이 작업은 되돌릴 수 없습니다.');

    const readline2 = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer2 = await new Promise(resolve => {
      readline2.question('제거하시겠습니까? (yes/no): ', resolve);
    });
    readline2.close();

    if (answer2.toLowerCase() === 'yes') {
      console.log('\n🗑️  기존 컬럼 제거 시작...');

      await client.query(`
        ALTER TABLE admin_users_rules_permissions
        DROP COLUMN IF EXISTS can_create_data;
      `);
      console.log('✅ can_create_data 컬럼 제거 완료');

      await client.query(`
        ALTER TABLE admin_users_rules_permissions
        DROP COLUMN IF EXISTS can_edit_own;
      `);
      console.log('✅ can_edit_own 컬럼 제거 완료');

      // 최종 컬럼 확인
      console.log('\n📊 최종 테이블 구조:');
      const { rows: finalColumns } = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'admin_users_rules_permissions'
        AND column_name LIKE 'can_%'
        ORDER BY column_name;
      `);
      console.table(finalColumns);

      console.log('\n✅ 마이그레이션 완료!');
    } else {
      console.log('\n⏭️  컬럼 제거를 건너뜁니다.');
      console.log('💡 can_create_data와 can_edit_own 컬럼은 유지되었습니다.');
      console.log('💡 나중에 코드 변경 후 수동으로 제거할 수 있습니다.');
    }

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 DB 연결 종료');
  }
}

migrate();
