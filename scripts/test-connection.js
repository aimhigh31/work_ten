#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '설정됨' : '없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔗 Supabase 연결 테스트...');
  
  try {
    // 1. 기본 연결 테스트
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('❌ 연결 실패:', error.message);
      return;
    }
    
    console.log('✅ Supabase 연결 성공!');
    
    // 2. 테이블 존재 확인
    console.log('\n📋 테이블 존재 확인...');
    
    const tables = [
      'user_profiles',
      'cost_records', 
      'cost_amount_details',
      'cost_comments',
      'cost_attachments',
      'task_records',
      'education_records'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count(*)')
          .limit(1);
          
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: 존재함`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
    
    // 3. 함수 존재 확인
    console.log('\n🔧 함수 존재 확인...');
    
    try {
      const { data, error } = await supabase.rpc('generate_cost_code');
      if (error) {
        console.log(`❌ generate_cost_code: ${error.message}`);
      } else {
        console.log(`✅ generate_cost_code: ${data}`);
      }
    } catch (err) {
      console.log(`❌ generate_cost_code: ${err.message}`);
    }
    
    console.log('\n🎉 연결 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 예기치 못한 오류:', error);
  }
}

testConnection();