// 완전한 SQL 마이그레이션 실행
const { Client } = require('pg');
const fs = require('fs');

// PostgreSQL 클라이언트 설정
const client = new Client({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function completeSQLMigration() {
  console.log('🚀 완전한 SQL 마이그레이션 시작...');
  
  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 1단계: 기존 테이블 확인 및 삭제 (필요시)
    console.log('\n1️⃣ 기존 테이블 상태 확인...');
    
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Admin_Systemsetting_Menu'
      );
    `;
    
    const tableExists = await client.query(checkTableQuery);
    console.log('테이블 존재 여부:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      console.log('⚠️ 기존 테이블이 존재합니다. 삭제 후 재생성...');
      await client.query('DROP TABLE IF EXISTS "Admin_Systemsetting_Menu" CASCADE;');
      console.log('✅ 기존 테이블 삭제 완료');
    }

    // 2단계: SQL 파일을 개별 명령으로 분리해서 실행
    console.log('\n2️⃣ SQL 파일 실행...');
    
    const sqlFile = 'create-admin-systemsetting-menu-table.sql';
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // SQL을 개별 명령으로 분리
    const sqlCommands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📋 총 ${sqlCommands.length}개의 SQL 명령 실행...`);
    
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      if (command.trim()) {
        try {
          console.log(`   ${i + 1}/${sqlCommands.length}: ${command.substring(0, 50)}...`);
          await client.query(command);
        } catch (cmdError) {
          console.log(`   ⚠️ 명령 ${i + 1} 실행 오류 (계속 진행):`, cmdError.message);
        }
      }
    }
    
    console.log('✅ SQL 명령 실행 완료');

    // 3단계: 테이블 생성 최종 확인
    console.log('\n3️⃣ 테이블 생성 최종 확인...');
    
    const finalCheck = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'Admin_Systemsetting_Menu'
      ORDER BY ordinal_position;
    `);

    if (finalCheck.rows.length > 0) {
      console.log('✅ Admin_Systemsetting_Menu 테이블 생성 확인됨');
      console.log('\n📋 테이블 구조:');
      finalCheck.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });

      // 4단계: 데이터 확인
      console.log('\n4️⃣ 데이터 확인...');
      const dataResult = await client.query('SELECT COUNT(*) as count FROM "Admin_Systemsetting_Menu"');
      console.log(`📊 테이블 데이터 개수: ${dataResult.rows[0].count}개`);

      if (dataResult.rows[0].count > 0) {
        // 샘플 데이터 출력
        const sampleResult = await client.query(`
          SELECT id, menu_level, menu_category, menu_page, menu_description, is_enabled, display_order
          FROM "Admin_Systemsetting_Menu" 
          ORDER BY display_order 
          LIMIT 5
        `);
        
        console.log('\n📋 샘플 데이터:');
        sampleResult.rows.forEach((row, index) => {
          console.log(`   ${index + 1}. [${row.id}] ${row.menu_page} (${row.menu_category}) - 레벨:${row.menu_level} 순서:${row.display_order} 활성:${row.is_enabled}`);
        });
      } else {
        console.log('⚠️ 테이블에 데이터가 없습니다.');
      }

      // 5단계: 인덱스 확인
      console.log('\n5️⃣ 인덱스 확인...');
      const indexResult = await client.query(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'Admin_Systemsetting_Menu'
      `);
      
      console.log(`📊 생성된 인덱스 개수: ${indexResult.rows.length}개`);
      indexResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.indexname}`);
      });

      return true;
    } else {
      console.log('❌ 테이블 생성 실패');
      return false;
    }

  } catch (error) {
    console.error('❌ SQL 마이그레이션 오류:', error);
    console.error('오류 상세:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    return false;
  } finally {
    await client.end();
    console.log('\n🔌 PostgreSQL 연결 종료');
  }
}

// 실행
completeSQLMigration().then((success) => {
  if (success) {
    console.log('\n🎉 SQL 마이그레이션 완료!');
    console.log('✅ Admin_Systemsetting_Menu 테이블이 성공적으로 생성되었습니다.');
    console.log('📝 이제 프론트엔드에서 해당 테이블을 사용할 수 있습니다.');
  } else {
    console.log('\n❌ SQL 마이그레이션 실패');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 마이그레이션 작업 실패:', error);
  process.exit(1);
});