#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔌 Supabase 연결 테스트...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('📍 URL:', supabaseUrl);
  console.log('🔑 Service Key:', supabaseServiceKey ? '✅ 설정됨' : '❌ 누락');

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // 1. 기본 연결 테스트
    console.log('\n1️⃣ 기본 연결 테스트...');
    const { data, error } = await supabase
      .from('dummy_table_that_does_not_exist')
      .select('*')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      console.log('✅ Supabase 연결 성공 (테이블이 없어서 정상적인 에러)');
    } else if (error) {
      console.log('❌ 연결 실패:', error.message);
      return;
    }

    // 2. 확장 설치 테스트
    console.log('\n2️⃣ UUID 확장 설치...');
    const { error: extError } = await supabase.rpc('sql', {
      query: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
    });

    if (extError && extError.code === '42501') {
      console.log('⚠️  확장 설치 권한 없음 - RPC 접근 제한');
    } else if (extError) {
      console.log('❌ 확장 설치 실패:', extError.message);
    } else {
      console.log('✅ UUID 확장 설치 성공');
    }

    // 3. 직접 SQL 실행 테스트
    console.log('\n3️⃣ SQL 직접 실행 테스트...');
    const { data: sqlData, error: sqlError } = await supabase.rpc('sql', {
      query: `
        SELECT 
          table_name,
          table_type
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
        LIMIT 10;
      `
    });

    if (sqlError) {
      console.log('❌ SQL 실행 실패:', sqlError.message);
    } else {
      console.log('✅ SQL 실행 성공');
      console.log('📋 현재 테이블 목록:', sqlData);
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류:', error.message);
  }
}

testConnection();