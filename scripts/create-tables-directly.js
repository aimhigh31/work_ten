#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경변수가 누락되었습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTables() {
  console.log('📊 기존 테이블 확인...');
  
  const tables = [
    'user_profiles',
    'migration_log',
    'code_sequences',
    'cost_records',
    'cost_amount_details',
    'cost_comments',
    'cost_attachments',
    'task_records',
    'task_attachments',
    'education_records',
    'education_curriculum',
    'education_participants'
  ];

  const existingTables = [];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0);

      if (!error || error.code === 'PGRST116') {
        existingTables.push(table);
        console.log(`✅ ${table} 테이블 존재`);
      } else if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
        console.log(`❌ ${table} 테이블 없음`);
      }
    } catch (err) {
      console.log(`❌ ${table} 확인 실패:`, err.message);
    }
  }

  return existingTables;
}

async function testInsert() {
  console.log('\n🧪 테이블 생성 테스트...');
  
  // 1. user_profiles 테스트
  console.log('1️⃣ user_profiles 테이블 테스트...');
  
  const testUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'test@nexwork.com',
    name: '테스트 사용자',
    role: 'user',
    department: 'IT',
    position: '사원'
  };

  const { data: userData, error: userError } = await supabase
    .from('user_profiles')
    .upsert(testUser)
    .select();

  if (userError) {
    console.log('❌ user_profiles 테이블 없음 또는 권한 문제:', userError.message);
    return false;
  } else {
    console.log('✅ user_profiles 테이블 작동 확인');
    
    // 테스트 데이터 삭제
    await supabase
      .from('user_profiles')
      .delete()
      .eq('id', testUser.id);
    
    return true;
  }
}

async function runChecks() {
  console.log('🔍 Nexwork 데이터베이스 상태 확인...\n');
  
  try {
    // 1. 테이블 확인
    const existingTables = await checkTables();
    
    if (existingTables.length === 0) {
      console.log('\n⚠️  테이블이 하나도 없습니다!');
      console.log('📝 해결 방법:');
      console.log('1. Supabase Dashboard > SQL Editor 접속');
      console.log('2. sql-for-dashboard/ 폴더의 SQL 파일을 순서대로 실행:');
      console.log('   - 01-extensions-and-basic-tables.sql');
      console.log('   - 02-cost-management-tables.sql');
      console.log('   - 03-task-education-tables.sql');
      return;
    }
    
    // 2. 테이블 작동 테스트
    const tableWorks = await testInsert();
    
    if (tableWorks) {
      console.log('\n✅ 데이터베이스 준비 완료!');
      console.log('📝 다음 단계: npm run supabase:migrate-data');
    } else {
      console.log('\n⚠️  테이블은 있지만 작동하지 않습니다.');
      console.log('권한 문제일 수 있습니다.');
    }
    
    // 3. 요약
    console.log('\n📊 테이블 생성 상태:');
    console.log(`✅ 생성된 테이블: ${existingTables.length}개`);
    console.log(`❌ 누락된 테이블: ${12 - existingTables.length}개`);
    
    if (existingTables.length < 12) {
      console.log('\n📋 누락된 테이블 목록:');
      const allTables = [
        'user_profiles',
        'migration_log',
        'code_sequences',
        'cost_records',
        'cost_amount_details',
        'cost_comments',
        'cost_attachments',
        'task_records',
        'task_attachments',
        'education_records',
        'education_curriculum',
        'education_participants'
      ];
      
      const missingTables = allTables.filter(t => !existingTables.includes(t));
      missingTables.forEach(t => console.log(`  - ${t}`));
    }
    
  } catch (error) {
    console.error('❌ 확인 중 오류:', error);
  }
}

runChecks();