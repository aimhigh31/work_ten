const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSoftwareTable() {
  console.log('🚀 it_software_data 테이블 생성 중...');

  try {
    // 테이블 생성 SQL
    const { data, error } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS it_software_data (
          id SERIAL PRIMARY KEY,
          no INTEGER,
          registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          code VARCHAR(255),
          team VARCHAR(50),
          department VARCHAR(50),
          work_content TEXT,
          status VARCHAR(50) DEFAULT '사용중',
          assignee VARCHAR(100),
          start_date TIMESTAMP WITH TIME ZONE,
          completed_date TIMESTAMP WITH TIME ZONE,
          attachments TEXT[],

          -- 소프트웨어 특화 필드
          software_name VARCHAR(255),
          description TEXT,
          software_category VARCHAR(100),
          spec TEXT,
          current_user VARCHAR(100),
          solution_provider VARCHAR(100),
          user_count INTEGER DEFAULT 0,
          license_type VARCHAR(100),
          license_key TEXT,

          -- 메타데이터
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- 인덱스 생성
        CREATE INDEX IF NOT EXISTS idx_software_status ON it_software_data(status);
        CREATE INDEX IF NOT EXISTS idx_software_team ON it_software_data(team);
        CREATE INDEX IF NOT EXISTS idx_software_department ON it_software_data(department);
        CREATE INDEX IF NOT EXISTS idx_software_active ON it_software_data(is_active);
        CREATE INDEX IF NOT EXISTS idx_software_created_at ON it_software_data(created_at);

        -- updated_at 자동 업데이트 트리거
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_software_updated_at ON it_software_data;
        CREATE TRIGGER update_software_updated_at
          BEFORE UPDATE ON it_software_data
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `
    });

    if (error) {
      console.error('❌ 테이블 생성 실패:', error);
      return false;
    }

    console.log('✅ it_software_data 테이블 생성 완료');

    // 샘플 데이터 삽입
    console.log('📝 샘플 데이터 삽입 중...');

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
        current_user: '개발팀 전체',
        solution_provider: 'Microsoft',
        user_count: 15,
        license_type: '무료',
        start_date: '2024-01-01T00:00:00Z'
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
        current_user: '디자인팀 전체',
        solution_provider: 'Adobe',
        user_count: 8,
        license_type: '구독',
        license_key: 'ADOBE-2024-CREATIVE-SUITE',
        start_date: '2024-01-15T00:00:00Z'
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
        current_user: '전 직원',
        solution_provider: 'Microsoft',
        user_count: 50,
        license_type: '구독',
        license_key: 'MS365-BUSINESS-2024',
        start_date: '2024-01-01T00:00:00Z'
      }
    ];

    const { error: insertError } = await supabase
      .from('it_software_data')
      .insert(sampleData);

    if (insertError) {
      console.error('❌ 샘플 데이터 삽입 실패:', insertError);
    } else {
      console.log('✅ 샘플 데이터 삽입 완료');
    }

    // 생성된 데이터 확인
    const { data: checkData, error: checkError } = await supabase
      .from('it_software_data')
      .select('*')
      .limit(5);

    if (checkError) {
      console.error('❌ 데이터 확인 실패:', checkError);
    } else {
      console.log(`✅ 총 ${checkData?.length}개 소프트웨어 데이터 확인됨`);
      checkData?.forEach(item => {
        console.log(`  - ${item.software_name} (${item.status})`);
      });
    }

  } catch (err) {
    console.error('❌ 테이블 생성 중 오류:', err);
  }
}

createSoftwareTable();