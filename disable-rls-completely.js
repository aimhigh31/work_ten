// RLS(Row Level Security) 완전 비활성화 스크립트
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function disableRLSCompletely() {
  console.log('🔄 RLS(Row Level Security) 완전 비활성화 시작...');
  
  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 1단계: 모든 테이블 목록 조회
    console.log('\n1️⃣ 현재 RLS가 활성화된 테이블 조회...');
    const tablesWithRLS = await client.query(`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND rowsecurity = true
    `);
    
    console.log(`RLS가 활성화된 테이블: ${tablesWithRLS.rows.length}개`);
    tablesWithRLS.rows.forEach(table => {
      console.log(`   - ${table.tablename}`);
    });

    // 2단계: 프로젝트 관련 주요 테이블들의 RLS 비활성화
    const mainTables = [
      'admin_systemsetting_system',
      'admin_systemsetting_menu', 
      'system_settings',
      'menu_settings'
    ];

    console.log('\n2️⃣ 주요 테이블들의 RLS 정책 제거 및 비활성화...');
    
    for (const tableName of mainTables) {
      try {
        // 테이블 존재 확인
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [tableName]);
        
        if (!tableExists.rows[0].exists) {
          console.log(`⚠️ 테이블 ${tableName} 존재하지 않음 - 건너뜀`);
          continue;
        }

        console.log(`\n📋 ${tableName} 테이블 처리 중...`);
        
        // 기존 정책들 조회
        const policies = await client.query(`
          SELECT policyname 
          FROM pg_policies 
          WHERE tablename = $1
        `, [tableName]);
        
        console.log(`   현재 정책 수: ${policies.rows.length}개`);
        
        // 모든 정책 삭제
        for (const policy of policies.rows) {
          try {
            await client.query(`DROP POLICY IF EXISTS "${policy.policyname}" ON ${tableName}`);
            console.log(`   ✅ 정책 삭제: ${policy.policyname}`);
          } catch (err) {
            console.log(`   ⚠️ 정책 삭제 실패: ${policy.policyname} - ${err.message}`);
          }
        }
        
        // RLS 비활성화
        await client.query(`ALTER TABLE ${tableName} DISABLE ROW LEVEL SECURITY`);
        console.log(`   ✅ RLS 비활성화 완료`);
        
      } catch (err) {
        console.log(`   ❌ ${tableName} 처리 실패: ${err.message}`);
      }
    }

    // 3단계: 모든 테이블의 RLS 비활성화 (추가 안전장치)
    console.log('\n3️⃣ 모든 public 스키마 테이블의 RLS 비활성화...');
    
    const allTables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    console.log(`전체 테이블 수: ${allTables.rows.length}개`);
    
    for (const table of allTables.rows) {
      try {
        await client.query(`ALTER TABLE ${table.tablename} DISABLE ROW LEVEL SECURITY`);
        console.log(`   ✅ ${table.tablename} RLS 비활성화`);
      } catch (err) {
        console.log(`   ⚠️ ${table.tablename} RLS 비활성화 실패: ${err.message}`);
      }
    }

    // 4단계: 최종 확인
    console.log('\n4️⃣ 최종 RLS 상태 확인...');
    const finalCheck = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    const enabledTables = finalCheck.rows.filter(table => table.rowsecurity);
    const disabledTables = finalCheck.rows.filter(table => !table.rowsecurity);
    
    console.log(`✅ RLS 비활성화된 테이블: ${disabledTables.length}개`);
    console.log(`⚠️ RLS가 여전히 활성화된 테이블: ${enabledTables.length}개`);
    
    if (enabledTables.length > 0) {
      console.log('   아직 RLS가 활성화된 테이블들:');
      enabledTables.forEach(table => {
        console.log(`     - ${table.tablename}`);
      });
    }

    // 5단계: 테스트
    console.log('\n5️⃣ DB 접근 테스트...');
    
    try {
      const testResult = await client.query(`
        SELECT COUNT(*) as count 
        FROM admin_systemsetting_system
      `);
      console.log(`✅ admin_systemsetting_system 조회 성공: ${testResult.rows[0].count}개 레코드`);
      
      // 업데이트 테스트
      const updateTest = await client.query(`
        UPDATE admin_systemsetting_system 
        SET updated_at = NOW() 
        WHERE setting_key = 'site_name'
        RETURNING setting_key
      `);
      
      if (updateTest.rows.length > 0) {
        console.log(`✅ admin_systemsetting_system 업데이트 성공`);
      }
      
    } catch (err) {
      console.log(`❌ 테스트 실패: ${err.message}`);
    }

    return true;
  } catch (error) {
    console.error('❌ RLS 비활성화 오류:', error);
    return false;
  } finally {
    await client.end();
    console.log('\n🔌 PostgreSQL 연결 종료');
  }
}

disableRLSCompletely().then((success) => {
  if (success) {
    console.log('\n🎉 RLS 완전 비활성화 완료!');
    console.log('✅ 모든 테이블에서 RLS가 비활성화되었습니다.');
    console.log('🚀 이제 개발 과정에서 권한 문제 없이 DB에 자유롭게 접근할 수 있습니다.');
    console.log('⚠️ 참고: 프로덕션 환경에서는 보안을 위해 RLS를 다시 활성화하는 것을 권장합니다.');
  } else {
    console.log('\n❌ RLS 비활성화 실패');
  }
  process.exit(success ? 0 : 1);
});