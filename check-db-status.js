const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkDBStatus() {
  console.log('🔄 현재 admin_systemsetting_system 테이블 상태 확인...');
  
  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 현재 설정 확인
    const result = await client.query(`
      SELECT setting_key, setting_value, setting_type, updated_at 
      FROM admin_systemsetting_system 
      ORDER BY setting_key
    `);
    
    console.log('\n📊 현재 설정값들:');
    result.rows.forEach(row => {
      console.log(`  ${row.setting_key}: ${row.setting_value} (${row.setting_type})`);
      console.log(`    마지막 업데이트: ${row.updated_at}`);
    });

    // 테스트용 설정 업데이트 시도
    console.log('\n🧪 테스트용 설정 업데이트 시도...');
    
    // site_name 업데이트 테스트
    const testUpdate = await client.query(`
      UPDATE admin_systemsetting_system 
      SET setting_value = '"TEST_SITE_NAME"', updated_at = NOW() 
      WHERE setting_key = 'site_name'
      RETURNING setting_key, setting_value, updated_at
    `);
    
    if (testUpdate.rows.length > 0) {
      console.log('✅ DB 업데이트 성공:', testUpdate.rows[0]);
    } else {
      console.log('❌ DB 업데이트 실패: 해당 설정이 존재하지 않음');
    }

    // 다시 원래값으로 복구
    await client.query(`
      UPDATE admin_systemsetting_system 
      SET setting_value = '"NEXWORK2"', updated_at = NOW() 
      WHERE setting_key = 'site_name'
    `);

  } catch (error) {
    console.error('❌ DB 확인 오류:', error);
  } finally {
    await client.end();
    console.log('\n🔌 PostgreSQL 연결 종료');
  }
}

checkDBStatus();