const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function insertSampleData() {
  console.log('📝 샘플 소프트웨어 데이터 삽입 시작...');

  const sampleData = [
    {
      no: 1,
      code: 'SW001',
      team: '개발팀',
      department: 'IT',
      work_content: 'Visual Studio Code',
      software_name: 'Visual Studio Code',
      description: '코드 편집기 및 개발 환경',
      software_category: '개발도구',
      spec: 'Windows 10/11, 최소 4GB RAM',
      status: '사용중',
      assignee: '김개발',
      current_users: '개발팀 전체',
      solution_provider: 'Microsoft',
      user_count: 15,
      license_type: '무료',
      start_date: '2024-01-01'
    },
    {
      no: 2,
      code: 'SW002',
      team: '디자인팀',
      department: 'IT',
      work_content: 'Adobe Creative Suite',
      software_name: 'Adobe Creative Suite',
      description: '디자인 및 창작 도구 모음',
      software_category: '디자인도구',
      spec: 'Windows 10/11, 16GB RAM, GPU 필수',
      status: '사용중',
      assignee: '박디자인',
      current_users: '디자인팀 전체',
      solution_provider: 'Adobe',
      user_count: 8,
      license_type: '구독',
      license_key: 'ADOBE-2024-CREATIVE-SUITE',
      start_date: '2024-01-15'
    },
    {
      no: 3,
      code: 'SW003',
      team: '기획팀',
      department: '기획',
      work_content: 'Microsoft Office 365',
      software_name: 'Microsoft Office 365',
      description: '문서 작성 및 협업 도구',
      software_category: '사무용도구',
      spec: 'Windows 10/11, 4GB RAM',
      status: '사용중',
      assignee: '이기획',
      current_users: '전 직원',
      solution_provider: 'Microsoft',
      user_count: 50,
      license_type: '구독',
      license_key: 'MS365-BUSINESS-2024',
      start_date: '2024-01-01'
    }
  ];

  try {
    console.log('💾 데이터 삽입 중...');

    const { data, error } = await supabase
      .from('it_software_data')
      .insert(sampleData)
      .select();

    if (error) {
      console.error('❌ 데이터 삽입 실패:', error);
      return;
    }

    console.log('✅ 샘플 데이터 삽입 성공!');
    console.log(`📊 삽입된 데이터: ${data?.length}개`);

    data?.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.software_name} (ID: ${item.id})`);
    });

  } catch (err) {
    console.error('❌ 삽입 중 오류:', err);
  }
}

insertSampleData();