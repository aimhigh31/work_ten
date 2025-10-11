const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  try {
    // 테이블 존재 확인
    const { data, error } = await supabase
      .from('security_education_curriculum')
      .select('*')
      .limit(1);

    if (error) {
      console.log('테이블이 존재하지 않거나 접근할 수 없습니다:', error.message);

      // 테이블 생성 스크립트 제안
      console.log('\n테이블 생성이 필요합니다. 다음 SQL을 실행하세요:');
      console.log(`
CREATE TABLE security_education_curriculum (
  id SERIAL PRIMARY KEY,
  curriculum_name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_hours INTEGER,
  target_audience VARCHAR(255),
  prerequisites TEXT,
  learning_objectives TEXT,
  content_outline TEXT,
  assessment_method VARCHAR(255),
  certification BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
      `);
      return;
    }

    console.log('security_education_curriculum 테이블이 존재합니다.');
    console.log('데이터 개수:', data ? data.length : 0);

    // 샘플 데이터가 있으면 출력
    if (data && data.length > 0) {
      console.log('샘플 데이터:', JSON.stringify(data[0], null, 2));
    }

  } catch (error) {
    console.log('오류:', error.message);
  }
}

checkTable();