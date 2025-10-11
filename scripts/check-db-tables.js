#!/usr/bin/env node
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkTables() {
  console.log('🔍 데이터베이스 테이블 확인...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // 1. 모든 테이블 목록 조회
    console.log('1️⃣ 전체 테이블 목록 조회...');
    const tablesQuery = `
      SELECT
        table_schema,
        table_name,
        table_type
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name;
    `;

    const tablesResult = await pool.query(tablesQuery);
    console.log(`\n📋 발견된 테이블 수: ${tablesResult.rows.length}\n`);

    tablesResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. [${row.table_schema}] ${row.table_name} (${row.table_type})`);
    });

    // 2. admin_users_userprofiles 테이블 존재 여부 확인
    console.log('\n\n2️⃣ admin_users_userprofiles 테이블 확인...');
    const userTableCheck = tablesResult.rows.find(
      row => row.table_name === 'admin_users_userprofiles'
    );

    if (userTableCheck) {
      console.log('✅ admin_users_userprofiles 테이블 존재함');

      // 테이블 구조 확인
      const structureQuery = `
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = 'admin_users_userprofiles'
        ORDER BY ordinal_position;
      `;

      const structureResult = await pool.query(structureQuery);
      console.log('\n📊 테이블 구조:');
      structureResult.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(필수)' : ''}`);
      });

      // 데이터 개수 확인
      const countQuery = 'SELECT COUNT(*) as count FROM admin_users_userprofiles';
      const countResult = await pool.query(countQuery);
      console.log(`\n📈 저장된 데이터 수: ${countResult.rows[0].count}개`);

      // 샘플 데이터 확인
      if (countResult.rows[0].count > 0) {
        const sampleQuery = 'SELECT * FROM admin_users_userprofiles LIMIT 3';
        const sampleResult = await pool.query(sampleQuery);
        console.log('\n📝 샘플 데이터:');
        sampleResult.rows.forEach((row, index) => {
          console.log(`\n${index + 1}번째 사용자:`);
          console.log(`  - ID: ${row.id}`);
          console.log(`  - 이름: ${row.user_name}`);
          console.log(`  - 이메일: ${row.email}`);
          console.log(`  - 부서: ${row.department || '미지정'}`);
          console.log(`  - 직급: ${row.position || '미지정'}`);
          console.log(`  - 상태: ${row.status}`);
        });
      }
    } else {
      console.log('❌ admin_users_userprofiles 테이블이 존재하지 않습니다!');
      console.log('\n💡 해결 방법:');
      console.log('   1. npm run supabase:setup 명령어를 실행하여 테이블을 생성하세요.');
      console.log('   2. 또는 scripts/create-schema-direct.js 파일을 실행하세요.');
    }

    // 3. auth.users 테이블 확인
    console.log('\n\n3️⃣ auth.users 테이블 확인...');
    const authQuery = 'SELECT COUNT(*) as count FROM auth.users';
    const authResult = await pool.query(authQuery);
    console.log(`✅ auth.users 테이블 데이터 수: ${authResult.rows[0].count}개`);

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error('상세 정보:', error);
  } finally {
    await pool.end();
  }
}

checkTables();
