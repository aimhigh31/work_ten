const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSoftwareTableSimple() {
  console.log('🚀 it_software_data 테이블 생성 (단순 방식)...');

  try {
    // 테이블 삭제 후 재생성
    const dropSql = `DROP TABLE IF EXISTS it_software_data CASCADE;`;
    const createSql = `
      CREATE TABLE it_software_data (
        id SERIAL PRIMARY KEY,
        no INTEGER,
        registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        code VARCHAR(255) UNIQUE,
        team VARCHAR(50),
        department VARCHAR(50),
        work_content TEXT,
        status VARCHAR(50) DEFAULT '사용중',
        assignee VARCHAR(100),
        start_date TIMESTAMP WITH TIME ZONE,
        completed_date TIMESTAMP WITH TIME ZONE,
        attachments TEXT[],

        software_name VARCHAR(255),
        description TEXT,
        software_category VARCHAR(100),
        spec TEXT,
        current_user VARCHAR(100),
        solution_provider VARCHAR(100),
        user_count INTEGER DEFAULT 0,
        license_type VARCHAR(100),
        license_key TEXT,

        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const insertSql = `
      INSERT INTO it_software_data (
        no, code, team, department, work_content, software_name,
        description, software_category, spec, status, assignee,
        current_user, solution_provider, user_count, license_type,
        license_key, start_date
      ) VALUES
      (1, 'SW001', '개발팀', 'IT', 'Visual Studio Code', 'Visual Studio Code',
       '코드 편집기 및 개발 환경', '개발도구', 'Windows 10/11, 최소 4GB RAM',
       '사용중', '김개발', '개발팀 전체', 'Microsoft', 15, '무료',
       NULL, '2024-01-01T00:00:00Z'),

      (2, 'SW002', '디자인팀', 'IT', 'Adobe Creative Suite', 'Adobe Creative Suite',
       '디자인 및 창작 도구 모음', '디자인도구', 'Windows 10/11, 16GB RAM, GPU 필수',
       '사용중', '박디자인', '디자인팀 전체', 'Adobe', 8, '구독',
       'ADOBE-2024-CREATIVE-SUITE', '2024-01-15T00:00:00Z'),

      (3, 'SW003', '기획팀', '기획', 'Microsoft Office 365', 'Microsoft Office 365',
       '문서 작성 및 협업 도구', '사무용도구', 'Windows 10/11, 4GB RAM',
       '사용중', '이기획', '전 직원', 'Microsoft', 50, '구독',
       'MS365-BUSINESS-2024', '2024-01-01T00:00:00Z');
    `;

    // 1. 테이블 삭제
    console.log('🗑️ 기존 테이블 삭제...');
    const { error: dropError } = await supabase.rpc('exec', { sql: dropSql });
    if (dropError) {
      console.log('⚠️ 테이블 삭제 (존재하지 않음):', dropError.message);
    }

    // 2. 테이블 생성
    console.log('🔨 새 테이블 생성...');
    const { error: createError } = await supabase.rpc('exec', { sql: createSql });
    if (createError) {
      console.error('❌ 테이블 생성 실패:', createError);
      return;
    }

    console.log('✅ 테이블 생성 완료');

    // 3. 데이터 삽입
    console.log('📝 샘플 데이터 삽입...');
    const { error: insertError } = await supabase.rpc('exec', { sql: insertSql });
    if (insertError) {
      console.error('❌ 데이터 삽입 실패:', insertError);
      return;
    }

    console.log('✅ 샘플 데이터 삽입 완료');

    // 4. 확인
    console.log('🔍 데이터 확인...');
    const { data: result, error: selectError } = await supabase.rpc('exec', {
      sql: 'SELECT id, software_name, status, team FROM it_software_data ORDER BY id;'
    });

    if (selectError) {
      console.error('❌ 데이터 확인 실패:', selectError);
    } else {
      console.log('✅ 생성된 데이터:', result);
    }

  } catch (err) {
    console.error('❌ 작업 중 오류:', err);
  }
}

createSoftwareTableSimple();