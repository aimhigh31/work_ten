const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://exxumujwufzqnovhzvif.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

async function optimize() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log('🔗 Supabase 연결 중...');

    // 1. 기존 인덱스 확인
    console.log('\n📊 1단계: 기존 인덱스 확인...');
    const { data: indexes, error: indexError } = await supabase
      .rpc('exec', {
        sql: `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'common_log_data'`
      });

    if (!indexError) {
      console.log('✅ 기존 인덱스:', indexes);
    }

    // 2. 기존 인덱스 삭제
    console.log('\n🗑️ 2단계: 기존 인덱스 삭제...');
    const dropQueries = [
      'DROP INDEX IF EXISTS idx_common_log_data_page',
      'DROP INDEX IF EXISTS idx_common_log_data_created_at',
      'DROP INDEX IF EXISTS idx_common_log_data_page_created_at'
    ];

    for (const query of dropQueries) {
      const { error } = await supabase.rpc('exec', { sql: query });
      if (error) {
        console.error(`❌ 실패: ${query}`, error);
      } else {
        console.log(`✅ 완료: ${query}`);
      }
    }

    // 3. 최적화된 복합 인덱스 생성
    console.log('\n🔧 3단계: 최적화된 복합 인덱스 생성...');
    const createIndexQuery = 'CREATE INDEX idx_common_log_data_optimized ON common_log_data(page, created_at DESC)';
    const { error: createError } = await supabase.rpc('exec', { sql: createIndexQuery });

    if (createError) {
      console.error('❌ 인덱스 생성 실패:', createError);
    } else {
      console.log('✅ 인덱스 생성 완료: idx_common_log_data_optimized');
    }

    // 4. 테이블 통계 업데이트 (ANALYZE)
    console.log('\n📈 4단계: 통계 정보 업데이트 (ANALYZE)...');
    const { error: analyzeError } = await supabase.rpc('exec', {
      sql: 'ANALYZE common_log_data'
    });

    if (analyzeError) {
      console.error('❌ ANALYZE 실패:', analyzeError);
    } else {
      console.log('✅ ANALYZE 완료');
    }

    // 5. 쿼리 성능 테스트
    console.log('\n⚡ 5단계: 쿼리 성능 테스트...');
    const startTime = Date.now();

    const { data, error, count } = await supabase
      .from('common_log_data')
      .select('*', { count: 'exact' })
      .eq('page', 'security_education')
      .order('created_at', { ascending: false })
      .limit(100);

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (error) {
      console.error('❌ 쿼리 테스트 실패:', error);
    } else {
      console.log(`✅ 쿼리 테스트 성공!`);
      console.log(`⏱️ 소요 시간: ${duration}ms`);
      console.log(`📊 조회된 데이터: ${data.length}개 / 전체: ${count}개`);

      if (duration < 1000) {
        console.log('🎉 성능 목표 달성! (1초 이내)');
      } else if (duration < 2000) {
        console.log('✅ 성능 양호 (2초 이내)');
      } else {
        console.log('⚠️ 성능 개선 필요 (2초 이상)');
      }
    }

    console.log('\n✅ 최적화 작업 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세:', error);
  }
}

optimize();
