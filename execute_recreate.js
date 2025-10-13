const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://exxumujwufzqnovhzvif.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

async function recreate() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log('🔨 테이블 재생성 시작...\n');

    const queries = [
      { name: '백업 테이블 생성', sql: 'CREATE TABLE IF NOT EXISTS common_log_data_backup AS SELECT * FROM common_log_data' },
      { name: '기존 테이블 삭제', sql: 'DROP TABLE IF EXISTS common_log_data CASCADE' },
      {
        name: '새 테이블 생성',
        sql: `CREATE TABLE common_log_data (
          id BIGSERIAL PRIMARY KEY,
          page TEXT NOT NULL,
          record_id TEXT NOT NULL,
          action_type TEXT NOT NULL,
          description TEXT,
          before_value TEXT,
          after_value TEXT,
          changed_field TEXT,
          user_id TEXT,
          user_name TEXT NOT NULL,
          team TEXT,
          user_department TEXT,
          user_position TEXT,
          user_profile_image TEXT,
          metadata JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`
      },
      { name: '인덱스 1 생성', sql: 'CREATE INDEX idx_common_log_data_page_created ON common_log_data(page, created_at DESC)' },
      { name: '인덱스 2 생성', sql: 'CREATE INDEX idx_common_log_data_record_id ON common_log_data(record_id)' },
      { name: 'RLS 비활성화', sql: 'ALTER TABLE common_log_data DISABLE ROW LEVEL SECURITY' },
      {
        name: '데이터 복원',
        sql: `INSERT INTO common_log_data (
          page, record_id, action_type, description, before_value, after_value, changed_field,
          user_name, team, user_department, created_at
        )
        SELECT
          page, record_id, action_type, description, before_value, after_value, changed_field,
          user_name, team, user_department, created_at
        FROM common_log_data_backup
        WHERE page = 'security_education'
        ORDER BY created_at DESC
        LIMIT 50`
      },
      { name: '통계 업데이트', sql: 'ANALYZE common_log_data' }
    ];

    for (let i = 0; i < queries.length; i++) {
      const { name, sql } = queries[i];
      console.log(`${i + 1}. ${name}...`);

      const { error } = await supabase.rpc('exec', { sql });

      if (error) {
        console.error(`   ❌ 실패:`, error);
        if (i <= 2) { // 초기 단계에서 실패하면 중단
          console.error('\n❌ 치명적 오류 - 중단합니다.');
          return;
        }
      } else {
        console.log(`   ✅ 완료`);
      }
    }

    console.log('\n✅ 테이블 재생성 완료!');
    console.log('\n📊 성능 테스트 중...');

    const start = Date.now();
    const { data, error: testError } = await supabase
      .from('common_log_data')
      .select('id, page, record_id, action_type, description, before_value, after_value, changed_field, user_name, team, user_department, created_at')
      .eq('page', 'security_education')
      .order('created_at', { ascending: false })
      .limit(100);
    const end = Date.now();

    if (testError) {
      console.error('❌ 테스트 실패:', testError);
    } else {
      console.log(`✅ 테스트 성공: ${data.length}개 조회`);
      console.log(`⏱️ 소요 시간: ${end - start}ms`);

      if (end - start < 500) {
        console.log('🎉 목표 달성! (500ms 이내)');
      } else if (end - start < 1000) {
        console.log('✅ 성능 양호 (1초 이내)');
      } else {
        console.log('⚠️ 성능 개선 필요');
      }
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세:', error);
  }
}

recreate();
