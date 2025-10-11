const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  try {
    console.log('🔨 it_software_user 테이블 생성 중...');

    // 테이블 생성 SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.it_software_user (
        id SERIAL PRIMARY KEY,
        software_id INTEGER NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        department VARCHAR(100),
        exclusive_id VARCHAR(100),
        reason TEXT,
        usage_status VARCHAR(50) DEFAULT '사용중',
        start_date DATE,
        end_date DATE,
        registration_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'system',
        updated_by VARCHAR(100) DEFAULT 'system',
        is_active BOOLEAN DEFAULT true
      );

      -- 인덱스 생성
      CREATE INDEX IF NOT EXISTS idx_it_software_user_software_id
      ON public.it_software_user(software_id);

      CREATE INDEX IF NOT EXISTS idx_it_software_user_active
      ON public.it_software_user(is_active);

      CREATE INDEX IF NOT EXISTS idx_it_software_user_composite
      ON public.it_software_user(software_id, is_active);

      -- 권한 설정
      GRANT ALL ON public.it_software_user TO anon, authenticated;
      GRANT USAGE, SELECT ON SEQUENCE public.it_software_user_id_seq TO anon, authenticated;
    `;

    // Supabase Admin API를 통해 SQL 실행
    const { data, error } = await supabase.rpc('exec', { sql: createTableSQL });

    if (error) {
      // 테이블이 이미 존재하는 경우
      if (error.message?.includes('already exists')) {
        console.log('✅ 테이블이 이미 존재합니다.');
      } else {
        console.error('❌ 테이블 생성 실패:', error);
        return;
      }
    } else {
      console.log('✅ it_software_user 테이블 생성 완료');
    }

    // 테이블 확인
    console.log('\n📊 테이블 확인 중...');
    const { data: testData, error: testError } = await supabase
      .from('it_software_user')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ 테이블 확인 실패:', testError);
    } else {
      console.log('✅ 테이블 접근 가능');

      // 데이터 개수 확인
      const { count } = await supabase
        .from('it_software_user')
        .select('*', { count: 'exact', head: true });

      console.log(`📈 현재 데이터: ${count || 0}개`);
    }

    // 샘플 데이터 삽입 (선택사항)
    if (testData && testData.length === 0) {
      console.log('\n📝 샘플 데이터 삽입 중...');

      const sampleData = [
        {
          software_id: 1,
          user_name: '테스트 사용자1',
          department: '개발팀',
          exclusive_id: 'TEST001',
          reason: '개발 업무용',
          usage_status: '사용중',
          start_date: '2024-01-15',
          registration_date: '2024-01-15',
          created_by: 'system',
          updated_by: 'system',
          is_active: true
        }
      ];

      const { error: insertError } = await supabase
        .from('it_software_user')
        .insert(sampleData);

      if (insertError) {
        console.log('⚠️ 샘플 데이터 삽입 건너뜀:', insertError.message);
      } else {
        console.log('✅ 샘플 데이터 삽입 완료');
      }
    }

    console.log('\n🎉 it_software_user 테이블 설정 완료!');
    console.log('   이제 소프트웨어관리 페이지에서 사용자이력을 저장할 수 있습니다.');

  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error);
  }
}

// 스크립트 실행
createTable();