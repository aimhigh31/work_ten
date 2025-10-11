require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addSampleData() {
  try {
    console.log('🔍 admin_checklist_data에 샘플 데이터 추가 중...\n');

    // 샘플 데이터 - no 포함, snake_case 사용
    const sampleData = [
      {
        no: 1,
        registration_date: new Date().toISOString().split('T')[0],
        code: 'CKL001',
        work_content: '시스템 보안 점검',
        description: '전체 시스템의 보안 취약점 점검 및 개선',
        status: '진행',
        team: '',
        assignee: 'U001',
        department: 'SEC001'
      },
      {
        no: 2,
        registration_date: new Date().toISOString().split('T')[0],
        code: 'CKL002',
        work_content: '백업 시스템 구축',
        description: '데이터베이스 및 파일 시스템 백업 프로세스 구축',
        status: '대기',
        team: '',
        assignee: 'U002',
        department: 'IT001'
      },
      {
        no: 3,
        registration_date: new Date().toISOString().split('T')[0],
        code: 'CKL003',
        work_content: '성능 모니터링 대시보드',
        description: '시스템 성능 지표를 실시간으로 모니터링하는 대시보드 구축',
        status: '완료',
        team: '',
        assignee: 'U003',
        department: 'DEV001'
      },
      {
        no: 4,
        registration_date: new Date().toISOString().split('T')[0],
        code: 'CKL004',
        work_content: '사용자 권한 관리 시스템',
        description: '역할 기반 접근 제어(RBAC) 시스템 구현',
        status: '진행',
        team: '',
        assignee: 'U004',
        department: 'SEC001'
      },
      {
        no: 5,
        registration_date: new Date().toISOString().split('T')[0],
        code: 'CKL005',
        work_content: 'API 문서화 작업',
        description: 'REST API 엔드포인트 문서화 및 Swagger 구축',
        status: '대기',
        team: '',
        assignee: 'U005',
        department: 'DEV001'
      }
    ];

    console.log('➕ 샘플 데이터 추가 시도...');
    const { data, error } = await supabase
      .from('admin_checklist_data')
      .insert(sampleData)
      .select();

    if (error) {
      console.error('❌ 샘플 데이터 추가 실패:', error.message);
      console.error('상세 오류:', error);
    } else {
      console.log('✅ 샘플 데이터 추가 완료!\n');
      console.log('📋 추가된 체크리스트:');
      data.forEach(item => {
        console.log(`   ID: ${item.id} - ${item.work_content} (${item.status})`);
      });

      // 전체 데이터 개수 확인
      const { count } = await supabase
        .from('admin_checklist_data')
        .select('*', { count: 'exact', head: true });

      console.log(`\n📊 총 ${count}개의 체크리스트가 있습니다.`);
    }

  } catch (error) {
    console.error('💥 오류:', error.message);
  }
}

addSampleData();