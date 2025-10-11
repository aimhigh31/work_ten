const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createItEducationDataTable() {
  console.log('🔄 it_education_data 테이블 생성 시작...');

  // 기존 테이블 삭제
  console.log('기존 테이블 삭제 중...');
  try {
    await supabase.rpc('exec', { sql: 'DROP TABLE IF EXISTS it_education_data;' });
    console.log('✅ 기존 테이블 삭제 완료');
  } catch (error) {
    console.log('ℹ️ 기존 테이블이 없거나 삭제 실패:', error.message);
  }

  // IT교육 개요탭 구조에 맞는 새 테이블 생성
  const createTableSql = `
    CREATE TABLE it_education_data (
      id SERIAL PRIMARY KEY,
      registration_date DATE DEFAULT CURRENT_DATE,
      code VARCHAR(100),
      education_type VARCHAR(50) DEFAULT '온라인',
      education_name TEXT NOT NULL,
      description TEXT,
      location TEXT,
      participant_count INTEGER DEFAULT 0,
      execution_date DATE,
      status VARCHAR(50) DEFAULT '계획',
      assignee VARCHAR(100),
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

    console.log('✅ it_education_data 테이블 생성 완료');

    // 인덱스 생성
    const createIndexSql = `
      CREATE INDEX IF NOT EXISTS idx_it_education_data_code
      ON it_education_data(code);

      CREATE INDEX IF NOT EXISTS idx_it_education_data_status
      ON it_education_data(status);

      CREATE INDEX IF NOT EXISTS idx_it_education_data_assignee
      ON it_education_data(assignee);
    `;

    const { error: indexError } = await supabase.rpc('exec', { sql: createIndexSql });

    if (indexError) {
      console.error('❌ 인덱스 생성 실패:', indexError);
    } else {
      console.log('✅ 인덱스 생성 완료');
    }

    // 샘플 데이터 삽입
    await insertSampleData();

    console.log('🎉 it_education_data 테이블 설정 완료!');

  } catch (err) {
    console.error('❌ 테이블 생성 중 오류:', err);
  }
}

async function insertSampleData() {
  console.log('📝 샘플 IT교육 데이터 삽입...');

  try {
    const sampleData = [
      {
        registration_date: '2025-09-20',
        code: 'IT-EDU-25-001',
        education_type: '온라인',
        education_name: 'React 심화 과정',
        description: 'React Hooks, 상태관리, 성능 최적화 등 실무에 필요한 고급 React 개발 기법을 배우는 과정',
        location: '온라인 (Zoom)',
        participant_count: 25,
        execution_date: '2025-09-25',
        status: '계획',
        assignee: '김철수'
      },
      {
        registration_date: '2025-09-21',
        code: 'IT-EDU-25-002',
        education_type: '오프라인',
        education_name: 'DevOps 워크샵',
        description: 'Docker, Kubernetes, CI/CD 파이프라인 구축 실습을 통한 DevOps 핵심 개념 학습',
        location: '본사 3층 세미나실',
        participant_count: 15,
        execution_date: '2025-09-28',
        status: '진행중',
        assignee: '이영희'
      },
      {
        registration_date: '2025-09-22',
        code: 'IT-EDU-25-003',
        education_type: '혼합',
        education_name: 'AI/ML 기초 과정',
        description: '머신러닝 기본 개념과 TensorFlow를 이용한 모델 구축 실습',
        location: '온라인 + 본사 4층 랩실',
        participant_count: 20,
        execution_date: '2025-10-05',
        status: '계획',
        assignee: '박민수'
      },
      {
        registration_date: '2025-09-23',
        code: 'IT-EDU-25-004',
        education_type: '세미나',
        education_name: '클라우드 보안 세미나',
        description: 'AWS, Azure 클라우드 환경에서의 보안 모범 사례와 위협 대응 전략',
        location: '본사 2층 강당',
        participant_count: 30,
        execution_date: '2025-10-10',
        status: '완료',
        assignee: '정수연'
      }
    ];

    const { data, error } = await supabase
      .from('it_education_data')
      .insert(sampleData)
      .select();

    if (error) {
      console.error('❌ 샘플 데이터 삽입 실패:', error);
      return;
    }

    console.log('✅ 샘플 IT교육 데이터 삽입 완료:', data?.length, '개 항목');

  } catch (err) {
    console.error('❌ 샘플 데이터 삽입 중 오류:', err);
  }
}

// 스크립트 실행
createItEducationDataTable();