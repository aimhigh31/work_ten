// 마스터코드 테이블 생성 실행 스크립트
const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function createMastercodeTable() {
  console.log('🔄 마스터코드 테이블 생성 시작...');
  
  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // SQL 파일 읽기
    const sqlScript = fs.readFileSync('create-mastercode-tables.sql', 'utf8');
    
    console.log('\n1️⃣ 마스터코드 테이블 생성 실행...');
    
    // SQL 실행
    const result = await client.query(sqlScript);
    
    console.log('✅ 마스터코드 테이블 생성 완료');

    // 테이블 생성 확인
    console.log('\n2️⃣ 생성된 테이블 확인...');
    
    const tableCheck = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_name IN ('admin_mastercode_data', 'admin_mastercode_subcode')
      AND table_schema = 'public'
    `);
    
    console.log('생성된 테이블:');
    tableCheck.rows.forEach(table => {
      console.log(`   ✅ ${table.table_name} (${table.table_type})`);
    });

    // 데이터 확인
    console.log('\n3️⃣ 샘플 데이터 확인...');
    
    const mastercodeCount = await client.query('SELECT COUNT(*) as count FROM admin_mastercode_data');
    const subcodeCount = await client.query('SELECT COUNT(*) as count FROM admin_mastercode_subcode');
    
    console.log(`✅ admin_mastercode_data: ${mastercodeCount.rows[0].count}개 레코드`);
    console.log(`✅ admin_mastercode_subcode: ${subcodeCount.rows[0].count}개 레코드`);

    // 샘플 데이터 조회
    console.log('\n4️⃣ 마스터코드 그룹 목록:');
    const mastercodeList = await client.query(`
      SELECT code_group, code_group_name, code_group_description, is_system 
      FROM admin_mastercode_data 
      ORDER BY display_order
    `);
    
    mastercodeList.rows.forEach(item => {
      const systemBadge = item.is_system ? '[시스템]' : '';
      console.log(`   ${systemBadge} ${item.code_group}: ${item.code_group_name}`);
    });

    // 서브코드 샘플 조회
    console.log('\n5️⃣ 사용자 상태 서브코드 예시:');
    const subcodeList = await client.query(`
      SELECT sc.sub_code, sc.sub_code_name, sc.sub_code_description, sc.code_value1
      FROM admin_mastercode_subcode sc
      JOIN admin_mastercode_data md ON sc.mastercode_id = md.id
      WHERE md.code_group = 'USER_STATUS'
      ORDER BY sc.display_order
    `);
    
    subcodeList.rows.forEach(item => {
      console.log(`   ${item.sub_code}: ${item.sub_code_name} (색상: ${item.code_value1})`);
    });

    return true;
  } catch (error) {
    console.error('❌ 마스터코드 테이블 생성 오류:', error);
    return false;
  } finally {
    await client.end();
    console.log('\n🔌 PostgreSQL 연결 종료');
  }
}

createMastercodeTable().then((success) => {
  if (success) {
    console.log('\n🎉 마스터코드 테이블 생성 및 데이터 초기화 완료!');
    console.log('✅ admin_mastercode_data 테이블: 마스터코드 그룹 관리');
    console.log('✅ admin_mastercode_subcode 테이블: 서브코드 관리');
    console.log('📝 샘플 데이터가 삽입되어 바로 테스트 가능합니다.');
  } else {
    console.log('\n❌ 마스터코드 테이블 생성 실패');
  }
  process.exit(success ? 0 : 1);
});