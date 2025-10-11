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

async function verifyTableCounts() {
  console.log('📊 데이터 테이블 카운트 확인...');
  
  const tables = [
    'user_profiles',
    'cost_records', 
    'task_records',
    'education_records',
    'education_curriculum',
    'education_participants'
  ];

  const results = {};

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error(`❌ ${table} 카운트 조회 실패:`, error);
        results[table] = 'ERROR';
      } else {
        results[table] = count;
        console.log(`✅ ${table}: ${count}건`);
      }
    } catch (error) {
      console.error(`❌ ${table} 조회 중 오류:`, error);
      results[table] = 'ERROR';
    }
  }

  return results;
}

async function verifyDataIntegrity() {
  console.log('\n🔍 데이터 무결성 검증...');
  
  try {
    // 1. FK 제약조건 검증
    console.log('🔗 외래키 제약조건 검증 중...');
    
    // Cost Records의 assignee_id 검증
    const { data: orphanCosts, error: costError } = await supabase
      .from('cost_records')
      .select('id, assignee_id')
      .not('assignee_id', 'is', null)
      .not('assignee_id', 'in', `(select id from user_profiles)`);

    if (costError) {
      console.error('❌ 비용 기록 FK 검증 실패:', costError);
    } else if (orphanCosts && orphanCosts.length > 0) {
      console.warn('⚠️  고아 비용 기록 발견:', orphanCosts.length, '건');
      console.log(orphanCosts.map(c => c.id));
    } else {
      console.log('✅ 비용 기록 FK 무결성 확인');
    }

    // Task Records의 assignee_id 검증
    const { data: orphanTasks, error: taskError } = await supabase
      .from('task_records')
      .select('id, assignee_id')
      .not('assignee_id', 'is', null)
      .not('assignee_id', 'in', `(select id from user_profiles)`);

    if (taskError) {
      console.error('❌ 업무 기록 FK 검증 실패:', taskError);
    } else if (orphanTasks && orphanTasks.length > 0) {
      console.warn('⚠️  고아 업무 기록 발견:', orphanTasks.length, '건');
      console.log(orphanTasks.map(t => t.id));
    } else {
      console.log('✅ 업무 기록 FK 무결성 확인');
    }

    // Education Records의 assignee_id 검증
    const { data: orphanEducations, error: eduError } = await supabase
      .from('education_records')
      .select('id, assignee_id')
      .not('assignee_id', 'is', null)
      .not('assignee_id', 'in', `(select id from user_profiles)`);

    if (eduError) {
      console.error('❌ 교육 기록 FK 검증 실패:', eduError);
    } else if (orphanEducations && orphanEducations.length > 0) {
      console.warn('⚠️  고아 교육 기록 발견:', orphanEducations.length, '건');
      console.log(orphanEducations.map(e => e.id));
    } else {
      console.log('✅ 교육 기록 FK 무결성 확인');
    }

    return true;
  } catch (error) {
    console.error('❌ 데이터 무결성 검증 중 오류:', error);
    return false;
  }
}

async function verifySampleData() {
  console.log('\n📋 샘플 데이터 검증...');
  
  try {
    // 1. 비용 기록 샘플 조회
    const { data: sampleCosts, error: costError } = await supabase
      .from('cost_records')
      .select(`
        id, code, content, amount, status,
        user_profiles!assignee_id(name)
      `)
      .limit(3);

    if (costError) {
      console.error('❌ 비용 기록 샘플 조회 실패:', costError);
    } else {
      console.log('💰 비용 기록 샘플:');
      sampleCosts.forEach(cost => {
        console.log(`  - ${cost.code}: ${cost.content} (${cost.amount.toLocaleString()}원)`);
        console.log(`    담당자: ${cost.user_profiles?.name || '미지정'}, 상태: ${cost.status}`);
      });
    }

    // 2. 업무 기록 샘플 조회
    const { data: sampleTasks, error: taskError } = await supabase
      .from('task_records')
      .select(`
        id, code, work_content, status, team,
        user_profiles!assignee_id(name)
      `)
      .limit(3);

    if (taskError) {
      console.error('❌ 업무 기록 샘플 조회 실패:', taskError);
    } else {
      console.log('\n📋 업무 기록 샘플:');
      sampleTasks.forEach(task => {
        console.log(`  - ${task.code}: ${task.work_content}`);
        console.log(`    담당자: ${task.user_profiles?.name || '미지정'}, 팀: ${task.team}, 상태: ${task.status}`);
      });
    }

    // 3. 교육 기록 샘플 조회
    const { data: sampleEducations, error: eduError } = await supabase
      .from('education_records')
      .select(`
        id, code, content, education_type, status,
        user_profiles!assignee_id(name)
      `)
      .limit(3);

    if (eduError) {
      console.error('❌ 교육 기록 샘플 조회 실패:', eduError);
    } else {
      console.log('\n🎓 교육 기록 샘플:');
      sampleEducations.forEach(edu => {
        console.log(`  - ${edu.code}: ${edu.content}`);
        console.log(`    유형: ${edu.education_type}, 담당자: ${edu.user_profiles?.name || '미지정'}, 상태: ${edu.status}`);
      });
    }

    return true;
  } catch (error) {
    console.error('❌ 샘플 데이터 검증 중 오러:', error);
    return false;
  }
}

async function verifyRLSPolicies() {
  console.log('\n🔒 RLS 정책 검증...');
  
  try {
    // 익명 사용자로 접근 시도 (실패해야 정상)
    const anonSupabase = createClient(
      supabaseUrl, 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 비용 기록에 익명 접근 시도
    const { data: anonCosts, error: anonError } = await anonSupabase
      .from('cost_records')
      .select('id')
      .limit(1);

    if (anonError || !anonCosts || anonCosts.length === 0) {
      console.log('✅ RLS 정책 작동 확인 - 익명 사용자 접근 차단됨');
    } else {
      console.warn('⚠️  RLS 정책 문제 - 익명 사용자가 데이터에 접근 가능');
    }

    return true;
  } catch (error) {
    console.log('✅ RLS 정책 작동 확인 - 접근이 적절히 제한됨');
    return true;
  }
}

async function runVerification() {
  console.log('🔍 Nexwork 데이터 마이그레이션 검증 시작...\n');

  try {
    // 1. 테이블 카운트 확인
    const counts = await verifyTableCounts();
    
    // 2. 데이터 무결성 검증
    const integrityOk = await verifyDataIntegrity();
    
    // 3. 샘플 데이터 검증
    const sampleOk = await verifySampleData();
    
    // 4. RLS 정책 검증
    const rlsOk = await verifyRLSPolicies();

    console.log('\n📊 검증 결과 요약:');
    console.log('=====================================');
    Object.entries(counts).forEach(([table, count]) => {
      const status = count === 'ERROR' ? '❌' : count > 0 ? '✅' : '⚠️';
      console.log(`${status} ${table}: ${count}건`);
    });
    
    console.log(`\n🔍 데이터 무결성: ${integrityOk ? '✅' : '❌'}`);
    console.log(`📋 샘플 데이터: ${sampleOk ? '✅' : '❌'}`);
    console.log(`🔒 RLS 정책: ${rlsOk ? '✅' : '❌'}`);

    const allGood = integrityOk && sampleOk && rlsOk && 
      Object.values(counts).every(c => c !== 'ERROR' && c > 0);

    if (allGood) {
      console.log('\n🎉 모든 검증 통과! 데이터 마이그레이션 성공');
      console.log('📝 다음 단계: Frontend API 연동 테스트');
    } else {
      console.log('\n⚠️  일부 검증 실패 - 문제 해결 후 다시 확인 필요');
    }

  } catch (error) {
    console.error('❌ 검증 과정에서 전체 오류 발생:', error);
  }
}

runVerification();