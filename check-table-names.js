// 실제 테이블 이름 확인
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkTableNames() {
  console.log('🔍 실제 테이블 이름 확인...');
  
  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // public 스키마의 모든 테이블 조회
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 public 스키마의 모든 테이블:');
    tablesResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });

    // Admin_Systemsetting_Menu와 유사한 이름 찾기
    const similarTables = tablesResult.rows.filter(row => 
      row.table_name.toLowerCase().includes('admin') || 
      row.table_name.toLowerCase().includes('menu') ||
      row.table_name.toLowerCase().includes('system')
    );
    
    if (similarTables.length > 0) {
      console.log('\n🎯 관련 테이블들:');
      similarTables.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }

    // 정확한 테이블명으로 데이터 확인
    for (const table of similarTables) {
      try {
        const dataCheck = await client.query(`SELECT COUNT(*) as count FROM "${table.table_name}"`);
        console.log(`   ${table.table_name}: ${dataCheck.rows[0].count}개 데이터`);
      } catch (err) {
        console.log(`   ${table.table_name}: 접근 불가 (${err.message})`);
      }
    }

    return true;
  } catch (error) {
    console.error('❌ 테이블 확인 오류:', error);
    return false;
  } finally {
    await client.end();
    console.log('\n🔌 PostgreSQL 연결 종료');
  }
}

checkTableNames().then(() => {
  console.log('🎯 테이블 확인 완료');
  process.exit(0);
});