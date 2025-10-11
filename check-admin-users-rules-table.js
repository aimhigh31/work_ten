const { Client } = require('pg');

// 환경변수에서 데이터베이스 연결 정보 가져오기
const DATABASE_URL = "postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres";

async function checkAdminUsersRulesTable() {
  const client = new Client({
    connectionString: DATABASE_URL
  });

  try {
    console.log('📡 Supabase 데이터베이스 연결 중...');
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');

    // 테이블 구조 확인
    console.log('\n📋 admin_users_rules 테이블 구조 확인:');
    const structureQuery = `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'admin_users_rules'
      ORDER BY ordinal_position;
    `;

    const structureResult = await client.query(structureQuery);

    if (structureResult.rows.length > 0) {
      console.log('✅ admin_users_rules 테이블이 존재합니다.');
      console.log('📊 테이블 구조:');
      structureResult.rows.forEach(row => {
        console.log(`  ${row.column_name} | ${row.data_type} | ${row.is_nullable} | ${row.column_default || 'NULL'}`);
      });
    } else {
      console.log('❌ admin_users_rules 테이블이 존재하지 않습니다.');
    }

    // 데이터 확인
    console.log('\n📋 현재 데이터 확인:');
    try {
      const dataResult = await client.query('SELECT * FROM admin_users_rules LIMIT 5');
      if (dataResult.rows.length > 0) {
        console.log(`✅ ${dataResult.rows.length}개 데이터 발견:`);
        dataResult.rows.forEach(row => {
          console.log(`  ID: ${row.id} | Name: ${row.role_name || row.name || '이름없음'}`);
        });
      } else {
        console.log('⚠️ 테이블이 존재하지만 데이터가 없습니다.');
      }
    } catch (dataError) {
      console.log('❌ 데이터 조회 중 오류:', dataError.message);
    }

    // 모든 테이블 목록 확인
    console.log('\n📋 모든 테이블 목록:');
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const tablesResult = await client.query(tablesQuery);
    console.log('📊 public 스키마의 테이블들:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await client.end();
    console.log('🔌 데이터베이스 연결 종료');
  }
}

// 스크립트 실행
checkAdminUsersRulesTable();