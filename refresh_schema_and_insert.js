const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function refreshAndInsert() {
  console.log('🔄 스키마 새로고침 및 데이터 삽입...');

  try {
    // 테이블 존재 확인
    const { data: tableExists, error: checkError } = await supabase.rpc('exec', {
      sql: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'it_software_data'
        );
      `
    });

    if (checkError) {
      console.error('❌ 테이블 확인 실패:', checkError);
      return;
    }

    console.log('✅ 테이블 존재 확인됨');

    // 직접 SQL로 샘플 데이터 삽입
    console.log('📝 SQL로 샘플 데이터 삽입 중...');

    const { data, error } = await supabase.rpc('exec', {
      sql: `
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
         'MS365-BUSINESS-2024', '2024-01-01T00:00:00Z')

        ON CONFLICT (code) DO NOTHING;
      `
    });

    if (error) {
      console.error('❌ SQL 삽입 실패:', error);
      return;
    }

    console.log('✅ 샘플 데이터 삽입 완료');

    // 잠시 대기 후 데이터 확인
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 데이터 직접 조회로 확인
    const { data: checkData, error: checkError2 } = await supabase.rpc('exec', {
      sql: `SELECT id, software_name, status FROM it_software_data ORDER BY id LIMIT 5;`
    });

    if (checkError2) {
      console.error('❌ 데이터 확인 실패:', checkError2);
    } else {
      console.log('✅ 삽입된 데이터 확인됨:', checkData);
    }

  } catch (err) {
    console.error('❌ 작업 중 오류:', err);
  }
}

refreshAndInsert();