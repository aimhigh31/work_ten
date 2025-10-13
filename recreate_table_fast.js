const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://exxumujwufzqnovhzvif.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

async function recreateFast() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log('🔨 테이블 빠른 재생성 시작...\n');

    // 1. 기존 테이블 삭제
    console.log('1. 기존 테이블 삭제...');
    const { error: dropError } = await supabase.rpc('exec', {
      sql: 'DROP TABLE IF EXISTS common_log_data CASCADE'
    });
    if (dropError) {
      console.error('   ❌ 실패:', dropError);
    } else {
      console.log('   ✅ 완료');
    }

    // 2. 새 테이블 생성
    console.log('\n2. 새 테이블 생성...');
    const createTableSQL = `
      CREATE TABLE common_log_data (
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
      )
    `;
    const { error: createError } = await supabase.rpc('exec', { sql: createTableSQL });
    if (createError) {
      console.error('   ❌ 실패:', createError);
      return;
    } else {
      console.log('   ✅ 완료');
    }

    // 3. 인덱스 생성
    console.log('\n3. 인덱스 생성...');
    const { error: index1Error } = await supabase.rpc('exec', {
      sql: 'CREATE INDEX idx_common_log_data_page_created ON common_log_data(page, created_at DESC)'
    });
    if (!index1Error) console.log('   ✅ idx_common_log_data_page_created 완료');

    const { error: index2Error } = await supabase.rpc('exec', {
      sql: 'CREATE INDEX idx_common_log_data_record_id ON common_log_data(record_id)'
    });
    if (!index2Error) console.log('   ✅ idx_common_log_data_record_id 완료');

    // 4. RLS 비활성화
    console.log('\n4. RLS 비활성화...');
    const { error: rlsError } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE common_log_data DISABLE ROW LEVEL SECURITY'
    });
    if (!rlsError) console.log('   ✅ 완료');

    // 5. 샘플 데이터 추가
    console.log('\n5. 샘플 데이터 추가...');
    const sampleData = {
      page: 'security_education',
      record_id: 'SEC-25-048',
      action_type: '수정',
      description: '테이블 재생성 후 테스트 데이터',
      before_value: null,
      after_value: null,
      changed_field: '-',
      user_name: '시스템',
      team: '보안팀',
      user_department: '보안팀',
      created_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('common_log_data')
      .insert([sampleData]);

    if (insertError) {
      console.error('   ❌ 실패:', insertError);
    } else {
      console.log('   ✅ 완료');
    }

    // 6. 성능 테스트
    console.log('\n6. 성능 테스트...');
    const start = Date.now();
    const { data, error: testError } = await supabase
      .from('common_log_data')
      .select('id, page, record_id, action_type, description, before_value, after_value, changed_field, user_name, team, user_department, created_at')
      .eq('page', 'security_education')
      .order('created_at', { ascending: false })
      .limit(100);
    const end = Date.now();

    if (testError) {
      console.error('   ❌ 테스트 실패:', testError);
    } else {
      console.log(`   ✅ 테스트 성공: ${data.length}개 조회`);
      console.log(`   ⏱️ 소요 시간: ${end - start}ms`);

      if (end - start < 500) {
        console.log('   🎉 목표 달성! (500ms 이내)');
      } else if (end - start < 1000) {
        console.log('   ✅ 성능 양호 (1초 이내)');
      } else {
        console.log('   ⚠️ 성능 개선 필요');
      }
    }

    console.log('\n✅ 테이블 재생성 완료!');
    console.log('📌 이제 브라우저를 새로고침하면 변경로그가 빠르게 로드됩니다.');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

recreateFast();
