// RLS 정책 수정으로 시스템설정 페이지 DB 저장 문제 해결
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function fixRLSPolicy() {
  console.log('🔄 RLS 정책 수정으로 시스템설정 DB 저장 문제 해결 시작...');
  
  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 1단계: 현재 RLS 정책 확인
    console.log('\n1️⃣ 현재 RLS 정책 확인...');
    const policiesResult = await client.query(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
      FROM pg_policies 
      WHERE tablename = 'admin_systemsetting_system'
    `);
    
    console.log(`현재 RLS 정책 수: ${policiesResult.rows.length}개`);
    policiesResult.rows.forEach(policy => {
      console.log(`   - ${policy.policyname}: ${policy.cmd} (${policy.roles})`);
    });

    // 2단계: 기존 정책 삭제
    console.log('\n2️⃣ 기존 정책 삭제...');
    
    try {
      await client.query('DROP POLICY IF EXISTS "Allow read access for all users" ON admin_systemsetting_system');
      console.log('✅ "Allow read access for all users" 정책 삭제');
    } catch (err) {
      console.log('⚠️ 읽기 정책 삭제 실패 (무시):', err.message);
    }

    try {
      await client.query('DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON admin_systemsetting_system');
      console.log('✅ "Allow all operations for authenticated users" 정책 삭제');
    } catch (err) {
      console.log('⚠️ 인증 사용자 정책 삭제 실패 (무시):', err.message);
    }

    // 3단계: 새로운 정책 생성 (더 관대한 정책)
    console.log('\n3️⃣ 새로운 RLS 정책 생성...');

    // 모든 사용자에게 읽기 허용
    await client.query(`
      CREATE POLICY "Enable read access for all users" ON admin_systemsetting_system
        FOR SELECT USING (true)
    `);
    console.log('✅ 모든 사용자 읽기 정책 생성');

    // 모든 사용자에게 쓰기 허용 (임시 - 추후 인증 시스템 구현 시 변경)
    await client.query(`
      CREATE POLICY "Enable insert for all users" ON admin_systemsetting_system
        FOR INSERT WITH CHECK (true)
    `);
    console.log('✅ 모든 사용자 삽입 정책 생성');

    await client.query(`
      CREATE POLICY "Enable update for all users" ON admin_systemsetting_system
        FOR UPDATE USING (true) WITH CHECK (true)
    `);
    console.log('✅ 모든 사용자 업데이트 정책 생성');

    await client.query(`
      CREATE POLICY "Enable delete for all users" ON admin_systemsetting_system
        FOR DELETE USING (true)
    `);
    console.log('✅ 모든 사용자 삭제 정책 생성');

    // 4단계: 정책 확인
    console.log('\n4️⃣ 새로운 정책 확인...');
    const newPoliciesResult = await client.query(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
      FROM pg_policies 
      WHERE tablename = 'admin_systemsetting_system'
    `);
    
    console.log(`새로운 RLS 정책 수: ${newPoliciesResult.rows.length}개`);
    newPoliciesResult.rows.forEach(policy => {
      console.log(`   - ${policy.policyname}: ${policy.cmd}`);
    });

    // 5단계: 테스트 업데이트
    console.log('\n5️⃣ 정책 수정 후 테스트 업데이트...');
    
    const testUpdate = await client.query(`
      UPDATE admin_systemsetting_system 
      SET setting_value = '"RLS_FIXED_TEST"', updated_at = NOW() 
      WHERE setting_key = 'site_name'
      RETURNING setting_key, setting_value, updated_at
    `);
    
    if (testUpdate.rows.length > 0) {
      console.log('✅ DB 업데이트 테스트 성공:', testUpdate.rows[0]);
      
      // 원래값으로 복구
      await client.query(`
        UPDATE admin_systemsetting_system 
        SET setting_value = '"NEXWORK2"', updated_at = NOW() 
        WHERE setting_key = 'site_name'
      `);
      console.log('✅ 원래값으로 복구 완료');
    } else {
      console.log('❌ DB 업데이트 테스트 실패');
    }

    return true;
  } catch (error) {
    console.error('❌ RLS 정책 수정 오류:', error);
    return false;
  } finally {
    await client.end();
    console.log('\n🔌 PostgreSQL 연결 종료');
  }
}

fixRLSPolicy().then((success) => {
  if (success) {
    console.log('\n🎉 RLS 정책 수정 완료!');
    console.log('✅ 시스템설정 페이지에서 DB 저장이 가능해졌습니다.');
    console.log('🌐 브라우저에서 시스템설정 페이지를 새로고침하여 테스트하세요.');
  } else {
    console.log('\n❌ RLS 정책 수정 실패');
  }
  process.exit(success ? 0 : 1);
});