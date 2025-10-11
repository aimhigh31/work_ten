// 메뉴 테이블 구조 확인 스크립트
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkMenuTableStructure() {
  console.log('🔄 메뉴 테이블 구조 확인 시작...');
  
  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 1단계: 테이블 구조 확인
    console.log('\n1️⃣ admin_systemsetting_menu 테이블 구조 확인...');
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'admin_systemsetting_menu' 
      ORDER BY ordinal_position
    `);
    
    console.log('테이블 컬럼 구조:');
    tableStructure.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 2단계: 샘플 데이터 확인
    console.log('\n2️⃣ 샘플 데이터 확인...');
    const sampleData = await client.query(`
      SELECT * FROM admin_systemsetting_menu 
      ORDER BY display_order 
      LIMIT 10
    `);
    
    console.log('샘플 데이터:');
    sampleData.rows.forEach(row => {
      console.log('   Row:', JSON.stringify(row, null, 2));
    });

    // 3단계: 관리자메뉴 관련 데이터만 확인
    console.log('\n3️⃣ 관리자메뉴 관련 데이터 확인...');
    const adminMenus = await client.query(`
      SELECT * FROM admin_systemsetting_menu 
      WHERE category LIKE '%관리자%' OR category LIKE '%admin%'
      ORDER BY display_order
    `);
    
    console.log('관리자메뉴 데이터:');
    adminMenus.rows.forEach(row => {
      console.log(`   ID: ${row.id}, Order: ${row.display_order}, Category: ${row.category}, Page: ${row.page}`);
    });

    return true;
  } catch (error) {
    console.error('❌ 테이블 구조 확인 오류:', error);
    return false;
  } finally {
    await client.end();
    console.log('\n🔌 PostgreSQL 연결 종료');
  }
}

checkMenuTableStructure().then((success) => {
  if (success) {
    console.log('\n🎉 테이블 구조 확인 완료!');
  } else {
    console.log('\n❌ 테이블 구조 확인 실패');
  }
  process.exit(success ? 0 : 1);
});