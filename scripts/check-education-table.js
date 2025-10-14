const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Supabase 연결 정보:');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? '설정됨' : '없음');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateTable() {
  try {
    console.log('\n📊 1. main_education_data 테이블 확인 중...');

    // 테이블 존재 확인
    const { data: existingData, error: selectError } = await supabase
      .from('main_education_data')
      .select('*')
      .limit(1);

    if (selectError) {
      console.log('❌ 테이블 조회 실패:', selectError.message);
      console.log('상세:', selectError);

      if (selectError.code === '42P01' || selectError.message.includes('does not exist')) {
        console.log('\n🔨 테이블이 없습니다. 생성합니다...');

        // 테이블 생성 SQL
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS main_education_data (
            id SERIAL PRIMARY KEY,
            no INTEGER NOT NULL,
            registration_date DATE NOT NULL,
            reception_date DATE,
            customer_name TEXT,
            company_name TEXT,
            education_type TEXT,
            channel TEXT,
            title TEXT NOT NULL,
            content TEXT,
            team TEXT,
            assignee TEXT,
            status TEXT DEFAULT '진행',
            priority TEXT DEFAULT '보통',
            response_content TEXT,
            resolution_date DATE,
            satisfaction_score INTEGER,
            attachments JSONB DEFAULT '[]'::jsonb,
            created_by TEXT DEFAULT 'system',
            updated_by TEXT DEFAULT 'system',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- 인덱스 생성
          CREATE INDEX IF NOT EXISTS idx_main_education_data_no ON main_education_data(no);
          CREATE INDEX IF NOT EXISTS idx_main_education_data_status ON main_education_data(status);
          CREATE INDEX IF NOT EXISTS idx_main_education_data_assignee ON main_education_data(assignee);
          CREATE INDEX IF NOT EXISTS idx_main_education_data_is_active ON main_education_data(is_active);
          CREATE INDEX IF NOT EXISTS idx_main_education_data_created_at ON main_education_data(created_at);
        `;

        // SQL 실행 (rpc 또는 직접 실행)
        const { data: createData, error: createError } = await supabase.rpc('exec_sql', {
          sql: createTableSQL
        });

        if (createError) {
          console.log('❌ rpc로 테이블 생성 실패, 수동으로 생성해야 합니다.');
          console.log('다음 SQL을 Supabase SQL Editor에서 실행하세요:\n');
          console.log(createTableSQL);
          return;
        }

        console.log('✅ 테이블 생성 완료!');
      }
    } else {
      console.log('✅ 테이블이 존재합니다!');
      console.log('데이터 개수:', existingData?.length || 0);
    }

    // 테이블 구조 확인
    console.log('\n📋 2. 테이블 구조 확인 중...');
    const { data: columns, error: columnsError } = await supabase
      .from('main_education_data')
      .select('*')
      .limit(0);

    if (columnsError) {
      console.log('❌ 구조 확인 실패:', columnsError.message);
    } else {
      console.log('✅ 테이블 구조 확인 완료');
    }

    // RLS 확인
    console.log('\n🔒 3. RLS (Row Level Security) 확인 중...');
    console.log('RLS가 활성화되어 있다면 정책을 추가해야 합니다.');
    console.log('\nSupabase Dashboard > Authentication > Policies 에서:');
    console.log('1. Enable RLS를 해제하거나');
    console.log('2. 모든 작업 허용 정책을 추가하세요.\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 테이블 생성 SQL 출력 (수동 실행용)
console.log('\n' + '='.repeat(80));
console.log('📝 Supabase SQL Editor에서 다음 SQL을 실행하세요:');
console.log('='.repeat(80) + '\n');

const createTableSQL = `
-- main_education_data 테이블 생성
CREATE TABLE IF NOT EXISTS main_education_data (
  id SERIAL PRIMARY KEY,
  no INTEGER NOT NULL,
  registration_date DATE NOT NULL,
  reception_date DATE,
  customer_name TEXT,
  company_name TEXT,
  education_type TEXT,
  channel TEXT,
  title TEXT NOT NULL,
  content TEXT,
  team TEXT,
  assignee TEXT,
  status TEXT DEFAULT '진행',
  priority TEXT DEFAULT '보통',
  response_content TEXT,
  resolution_date DATE,
  satisfaction_score INTEGER,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_by TEXT DEFAULT 'system',
  updated_by TEXT DEFAULT 'system',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_main_education_data_no ON main_education_data(no);
CREATE INDEX IF NOT EXISTS idx_main_education_data_status ON main_education_data(status);
CREATE INDEX IF NOT EXISTS idx_main_education_data_assignee ON main_education_data(assignee);
CREATE INDEX IF NOT EXISTS idx_main_education_data_is_active ON main_education_data(is_active);
CREATE INDEX IF NOT EXISTS idx_main_education_data_created_at ON main_education_data(created_at);

-- RLS 비활성화 (개발용)
ALTER TABLE main_education_data DISABLE ROW LEVEL SECURITY;

-- 또는 RLS 정책 추가 (프로덕션용)
-- ALTER TABLE main_education_data ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable all access for authenticated users" ON main_education_data FOR ALL USING (true);
`;

console.log(createTableSQL);
console.log('\n' + '='.repeat(80) + '\n');

checkAndCreateTable();
