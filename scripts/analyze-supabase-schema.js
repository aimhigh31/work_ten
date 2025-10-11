#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function analyzeSchema() {
  console.log('🔍 Supabase 데이터베이스 구조 분석 시작...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // 1. 모든 public 테이블 조회
    console.log('📋 1. PUBLIC 스키마 테이블 목록\n');
    console.log('=' .repeat(80));

    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.log('⚠️  information_schema 접근 불가, RPC 방식 시도...\n');

      // RPC로 테이블 목록 가져오기
      const { data: rpcTables, error: rpcError } = await supabase.rpc('exec_sql', {
        query: `
          SELECT table_name, table_type
          FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY table_name;
        `
      });

      if (rpcError) {
        console.log('❌ RPC 실패, 직접 테이블 메타데이터 방식으로 시도...\n');

        // 알려진 테이블들 확인
        const knownTables = [
          'admin_users_userprofiles',
          'admin_systemsetting_menu',
          'admin_department_management',
          'admin_mastercode2_main',
          'admin_mastercode2_sub',
          'admin_role_management',
          'main_task_management',
          'main_plan_management'
        ];

        console.log('📊 알려진 테이블 상태 확인:\n');

        for (const tableName of knownTables) {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          if (!error) {
            const { count } = await supabase
              .from(tableName)
              .select('*', { count: 'exact', head: true });

            console.log(`✅ ${tableName.padEnd(40)} | 데이터: ${count}개`);
          } else {
            console.log(`❌ ${tableName.padEnd(40)} | 에러: ${error.message}`);
          }
        }
      } else {
        console.log(`발견된 테이블: ${rpcTables.length}개\n`);
        rpcTables.forEach((table, index) => {
          console.log(`${(index + 1).toString().padStart(3)}. ${table.table_name} (${table.table_type})`);
        });
      }
    } else {
      console.log(`발견된 테이블: ${tables.length}개\n`);
      tables.forEach((table, index) => {
        console.log(`${(index + 1).toString().padStart(3)}. ${table.table_name} (${table.table_type})`);
      });
    }

    // 2. 주요 테이블 상세 분석
    console.log('\n\n📊 2. 주요 테이블 상세 분석\n');
    console.log('=' .repeat(80));

    const mainTables = [
      { name: 'admin_users_userprofiles', desc: '사용자 프로필' },
      { name: 'admin_systemsetting_menu', desc: '시스템 메뉴 설정' },
      { name: 'admin_department_management', desc: '부서 관리' },
      { name: 'admin_mastercode2_main', desc: '마스터코드 메인' },
      { name: 'admin_mastercode2_sub', desc: '마스터코드 서브' },
      { name: 'admin_role_management', desc: '역할 관리' }
    ];

    for (const table of mainTables) {
      console.log(`\n▶ ${table.name} (${table.desc})`);
      console.log('-'.repeat(80));

      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`  ❌ 에러: ${error.message}`);
        continue;
      }

      const { count } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });

      console.log(`  📈 총 레코드 수: ${count}개`);

      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log(`  📋 컬럼 수: ${columns.length}개`);
        console.log(`  📝 컬럼 목록:`);

        columns.forEach((col, index) => {
          const value = data[0][col];
          const type = typeof value;
          const preview = value !== null && value !== undefined
            ? (type === 'object' ? JSON.stringify(value).substring(0, 30) : String(value).substring(0, 30))
            : 'null';

          console.log(`      ${(index + 1).toString().padStart(2)}. ${col.padEnd(25)} | 타입: ${type.padEnd(10)} | 예시: ${preview}`);
        });
      }

      // 샘플 데이터 표시
      const { data: samples } = await supabase
        .from(table.name)
        .select('*')
        .limit(3);

      if (samples && samples.length > 0) {
        console.log(`\n  🔍 샘플 데이터 (최대 3개):`);
        samples.forEach((row, idx) => {
          console.log(`\n      [${idx + 1}번째 데이터]`);
          const mainFields = Object.keys(row).slice(0, 5);
          mainFields.forEach(field => {
            const value = row[field];
            const displayValue = value !== null && value !== undefined
              ? (typeof value === 'object' ? JSON.stringify(value).substring(0, 50) : String(value).substring(0, 50))
              : 'null';
            console.log(`        - ${field}: ${displayValue}`);
          });
        });
      }
    }

    // 3. Auth 스키마 확인
    console.log('\n\n🔐 3. AUTH 스키마 분석\n');
    console.log('=' .repeat(80));

    const { count: authUserCount } = await supabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true });

    console.log(`\n✅ auth.users 테이블: ${authUserCount}명의 사용자`);

    // 4. 관계 분석
    console.log('\n\n🔗 4. 테이블 관계 분석\n');
    console.log('=' .repeat(80));

    console.log(`
주요 관계:

  📌 사용자 관리:
     auth.users (Supabase Auth)
        ↓ (auth_user_id)
     admin_users_userprofiles
        ↓ (department)
     admin_department_management

  📌 마스터코드 시스템:
     admin_mastercode2_main (메인 코드)
        ↓ (mastercode_id)
     admin_mastercode2_sub (서브 코드)

  📌 권한 관리:
     admin_role_management (역할 정의)
        ↓ (assigned_roles)
     admin_users_userprofiles

  📌 시스템 설정:
     admin_systemsetting_menu (메뉴 설정)
    `);

  } catch (error) {
    console.error('\n❌ 분석 중 오류 발생:', error.message);
    console.error('상세:', error);
  }

  console.log('\n\n✅ 분석 완료!\n');
}

analyzeSchema();
