const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createSecurityInspectionOplTable() {
  console.log('🔄 security_inspection_opl 테이블 생성 시작...');

  // 기존 테이블 삭제
  console.log('기존 테이블 삭제 중...');
  try {
    await supabase.rpc('exec', { sql: 'DROP TABLE IF EXISTS security_inspection_opl;' });
    console.log('✅ 기존 테이블 삭제 완료');
  } catch (error) {
    console.log('ℹ️ 기존 테이블이 없거나 삭제 실패:', error.message);
  }

  // 현재 OPL 탭 구조에 맞는 새 테이블 생성
  const createTableSql = `
    CREATE TABLE security_inspection_opl (
      id SERIAL PRIMARY KEY,
      inspection_id INTEGER,
      registration_date DATE DEFAULT CURRENT_DATE,
      code VARCHAR(100),
      before TEXT,
      before_image TEXT,
      after TEXT,
      after_image TEXT,
      completion_date DATE,
      assignee VARCHAR(100),
      status VARCHAR(50) DEFAULT '대기',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  try {
    // 테이블 생성
    const { data, error } = await supabase.rpc('exec', { sql: createTableSql });

    if (error) {
      console.error('❌ 테이블 생성 실패:', error);
      return;
    }

    console.log('✅ security_inspection_opl 테이블 생성 완료');

    // 인덱스 생성
    const createIndexSql = `
      CREATE INDEX IF NOT EXISTS idx_security_inspection_opl_inspection_id
      ON security_inspection_opl(inspection_id);
    `;

    const { error: indexError } = await supabase.rpc('exec', { sql: createIndexSql });

    if (indexError) {
      console.error('❌ 인덱스 생성 실패:', indexError);
    } else {
      console.log('✅ 인덱스 생성 완료');
    }

    // 샘플 데이터 삽입
    await insertSampleOplData();

    console.log('🎉 security_inspection_opl 테이블 설정 완료!');

  } catch (err) {
    console.error('❌ 테이블 생성 중 오류:', err);
  }
}

async function insertSampleOplData() {
  console.log('📝 샘플 OPL 데이터 삽입...');

  try {
    // 기존 보안점검 데이터 조회 (어떤 테이블이든 첫 번째 ID 사용)
    const { data: inspections, error: fetchError } = await supabase
      .from('security_inspections')
      .select('id, code')
      .limit(1);

    let inspectionId = 1; // 기본값
    if (inspections && inspections.length > 0) {
      inspectionId = inspections[0].id;
      console.log('🔗 연결 대상 보안점검 ID:', inspectionId, '코드:', inspections[0].code);
    } else {
      console.log('ℹ️ 보안점검 데이터가 없어 기본 ID(1) 사용');
    }

    const sampleOplData = [
      {
        inspection_id: inspectionId,
        registration_date: '2025-09-24',
        code: 'OPL-25-001',
        before: '작업자가 헬멧을 착용하지 않고 작업하는 모습',
        before_image: null,
        after: '작업자가 안전헬멧을 착용하고 안전하게 작업하는 모습',
        after_image: null,
        assignee: '김철수',
        status: '완료',
        completion_date: '2025-09-24'
      },
      {
        inspection_id: inspectionId,
        registration_date: '2025-09-24',
        code: 'OPL-25-002',
        before: '화재 대피로가 물건으로 막혀있음',
        before_image: null,
        after: '화재 대피로를 정리하여 비상시 원활한 대피 가능',
        after_image: null,
        assignee: '이영희',
        status: '진행중',
        completion_date: null
      },
      {
        inspection_id: inspectionId,
        registration_date: '2025-09-24',
        code: 'OPL-25-003',
        before: '전선이 바닥에 노출되어 있어 안전사고 위험',
        before_image: null,
        after: '전선을 정리하고 안전 덮개를 설치',
        after_image: null,
        assignee: '박민수',
        status: '대기',
        completion_date: null
      }
    ];

    const { data, error } = await supabase
      .from('security_inspection_opl')
      .insert(sampleOplData)
      .select();

    if (error) {
      console.error('❌ 샘플 데이터 삽입 실패:', error);
      return;
    }

    console.log('✅ 샘플 OPL 데이터 삽입 완료:', data?.length, '개 항목');

  } catch (err) {
    console.error('❌ 샘플 데이터 삽입 중 오류:', err);
  }
}

// 스크립트 실행
createSecurityInspectionOplTable();