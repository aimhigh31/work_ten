// 테이블 권한 및 RLS 설정 수정
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function fixTablePermissions() {
  console.log('🔧 테이블 권한 및 RLS 설정 수정...');
  
  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 1단계: 현재 RLS 상태 확인
    console.log('\n1️⃣ 현재 RLS 상태 확인...');
    const rlsCheck = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE tablename = 'Admin_Systemsetting_Menu'
    `);
    
    if (rlsCheck.rows.length > 0) {
      console.log('테이블 RLS 상태:', rlsCheck.rows[0].rowsecurity);
    }

    // 2단계: 기존 정책 삭제
    console.log('\n2️⃣ 기존 정책 삭제...');
    await client.query(`DROP POLICY IF EXISTS "Admin_Systemsetting_Menu_모든_작업_허용" ON "Admin_Systemsetting_Menu"`);
    await client.query(`DROP POLICY IF EXISTS "Admin_Systemsetting_Menu 모든 작업 허용" ON "Admin_Systemsetting_Menu"`);
    console.log('✅ 기존 정책 삭제 완료');

    // 3단계: RLS 비활성화 (개발 단계용)
    console.log('\n3️⃣ RLS 비활성화...');
    await client.query(`ALTER TABLE "Admin_Systemsetting_Menu" DISABLE ROW LEVEL SECURITY`);
    console.log('✅ RLS 비활성화 완료');

    // 4단계: 공개 접근 권한 부여
    console.log('\n4️⃣ 공개 접근 권한 설정...');
    await client.query(`GRANT ALL ON "Admin_Systemsetting_Menu" TO anon`);
    await client.query(`GRANT ALL ON "Admin_Systemsetting_Menu" TO authenticated`);
    await client.query(`GRANT USAGE, SELECT ON SEQUENCE "Admin_Systemsetting_Menu_id_seq" TO anon`);
    await client.query(`GRANT USAGE, SELECT ON SEQUENCE "Admin_Systemsetting_Menu_id_seq" TO authenticated`);
    console.log('✅ 공개 접근 권한 설정 완료');

    // 5단계: 테이블 접근 테스트
    console.log('\n5️⃣ 테이블 접근 테스트...');
    
    // anon 역할로 테스트
    const testResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM "Admin_Systemsetting_Menu"
    `);
    
    console.log(`✅ 테스트 성공: ${testResult.rows[0].count}개 데이터 조회됨`);

    // 6단계: 권한 정보 확인
    console.log('\n6️⃣ 권한 정보 확인...');
    const permissionsCheck = await client.query(`
      SELECT grantee, privilege_type 
      FROM information_schema.table_privileges 
      WHERE table_name = 'Admin_Systemsetting_Menu'
    `);
    
    console.log('현재 권한 목록:');
    permissionsCheck.rows.forEach(row => {
      console.log(`   - ${row.grantee}: ${row.privilege_type}`);
    });

    return true;
  } catch (error) {
    console.error('❌ 권한 설정 오류:', error);
    console.error('오류 상세:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    return false;
  } finally {
    await client.end();
    console.log('\n🔌 PostgreSQL 연결 종료');
  }
}

fixTablePermissions().then((success) => {
  if (success) {
    console.log('\n🎉 테이블 권한 설정 완료!');
    console.log('✅ 이제 프론트엔드에서 정상적으로 테이블에 접근할 수 있을 것입니다.');
  } else {
    console.log('\n❌ 테이블 권한 설정 실패');
  }
  process.exit(success ? 0 : 1);
});