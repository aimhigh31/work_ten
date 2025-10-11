// PostgreSQL 직접 연결을 통한 SQL 실행
const { Client } = require('pg');
const fs = require('fs');

// PostgreSQL 클라이언트 설정
const client = new Client({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function executeSQLFile() {
  console.log('🔌 PostgreSQL 직접 연결 중...');
  
  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // SQL 파일 읽기
    const sqlFile = 'create-admin-systemsetting-menu-table.sql';
    console.log(`📖 ${sqlFile} 읽는 중...`);
    
    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log('✅ SQL 파일 로드 완료');

    // SQL 실행
    console.log('⚡ SQL 실행 중...');
    const result = await client.query(sql);
    
    console.log('✅ SQL 실행 성공');
    console.log('실행 결과:', result.command || 'Multiple commands executed');

    // 테이블 생성 확인
    console.log('🔍 테이블 생성 확인 중...');
    const checkResult = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Admin_Systemsetting_Menu'
      ORDER BY ordinal_position;
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ Admin_Systemsetting_Menu 테이블 생성 확인됨');
      console.log('테이블 구조:');
      checkResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });

      // 데이터 확인
      const dataResult = await client.query('SELECT COUNT(*) as count FROM "Admin_Systemsetting_Menu"');
      console.log(`📊 테이블 데이터 개수: ${dataResult.rows[0].count}개`);

      // 샘플 데이터 출력
      const sampleResult = await client.query('SELECT * FROM "Admin_Systemsetting_Menu" LIMIT 3');
      console.log('📋 샘플 데이터:');
      sampleResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.menu_page} (${row.menu_category})`);
      });
    } else {
      console.log('❌ 테이블 생성 확인 실패');
    }

  } catch (error) {
    console.error('❌ SQL 실행 오류:', error);
    console.error('오류 상세:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      position: error.position
    });
  } finally {
    await client.end();
    console.log('🔌 PostgreSQL 연결 종료');
  }
}

// 실행
executeSQLFile().then(() => {
  console.log('🎉 SQL 실행 작업 완료');
  process.exit(0);
}).catch(error => {
  console.error('💥 작업 실패:', error);
  process.exit(1);
});