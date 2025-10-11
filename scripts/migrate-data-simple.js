#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경변수가 누락되었습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 샘플 비용 데이터
const costData = [
  {
    registrationDate: '2024-12-01',
    startDate: '2024-01-15',
    code: 'COST-24-001',
    team: 'IT팀',
    assignee: '김철수',
    costType: '솔루션',
    content: '프로젝트 관리 소프트웨어 라이선스',
    quantity: 10,
    unitPrice: 150000,
    amount: 1500000,
    status: '완료',
    completionDate: '2024-12-05'
  },
  {
    registrationDate: '2024-12-03',
    startDate: '2024-02-20',
    code: 'COST-24-002',
    team: '마케팅팀',
    assignee: '박영희',
    costType: '행사경비',
    content: '신제품 론칭 이벤트 비용',
    quantity: 1,
    unitPrice: 5000000,
    amount: 5000000,
    status: '진행',
    completionDate: '2024-12-20'
  },
  {
    registrationDate: '2024-12-05',
    startDate: '2024-03-10',
    code: 'COST-24-003',
    team: 'IT팀',
    assignee: '이민수',
    costType: '하드웨어',
    content: '서버 장비 구매',
    quantity: 2,
    unitPrice: 3000000,
    amount: 6000000,
    status: '대기',
    completionDate: '2024-12-25'
  },
  {
    registrationDate: '2024-12-07',
    startDate: '2024-04-25',
    code: 'COST-24-004',
    team: '영업팀',
    assignee: '최윤정',
    costType: '출장경비',
    content: '해외 거래처 방문 출장비',
    quantity: 3,
    unitPrice: 800000,
    amount: 2400000,
    status: '완료',
    completionDate: '2024-12-10'
  },
  {
    registrationDate: '2024-12-09',
    startDate: '2024-05-08',
    code: 'COST-24-005',
    team: '기획팀',
    assignee: '정상현',
    costType: '사무경비',
    content: '사무용품 및 소모품 구매',
    quantity: 1,
    unitPrice: 500000,
    amount: 500000,
    status: '진행',
    completionDate: '2024-12-15'
  }
];

// 샘플 업무 데이터
const taskData = [
  {
    no: 15,
    registrationDate: '2025-01-15',
    code: 'TASK-25-001',
    team: '개발팀',
    department: 'IT',
    workContent: 'AI 챗봇 시스템 개발',
    status: '대기',
    assignee: '김민수',
    startDate: '2025-02-01',
    completedDate: null
  },
  {
    no: 14,
    registrationDate: '2025-01-10',
    code: 'TASK-25-002',
    team: '디자인팀',
    department: '기획',
    workContent: '모바일 앱 UI/UX 개선',
    status: '진행',
    assignee: '이영희',
    startDate: '2025-01-20',
    completedDate: null
  },
  {
    no: 13,
    registrationDate: '2025-01-08',
    code: 'TASK-25-003',
    team: '기획팀',
    department: '기획',
    workContent: '프로젝트 관리 시스템 기획',
    status: '진행',
    assignee: '최수진',
    startDate: '2025-01-15',
    completedDate: null
  },
  {
    no: 12,
    registrationDate: '2024-12-20',
    code: 'TASK-24-001',
    team: '개발팀',
    department: 'IT',
    workContent: '마이크로서비스 API 개발',
    status: '완료',
    assignee: '박지훈',
    startDate: '2024-11-01',
    completedDate: '2024-12-15'
  },
  {
    no: 11,
    registrationDate: '2024-12-18',
    code: 'TASK-24-002',
    team: '마케팅팀',
    department: '기획',
    workContent: '연말 프로모션 웹사이트 제작',
    status: '완료',
    assignee: '한나라',
    startDate: '2024-11-15',
    completedDate: '2024-12-31'
  }
];

// 샘플 교육 데이터
const educationData = [
  {
    registrationDate: '2024-12-01',
    startDate: '2024-01-10',
    code: 'EDU-I-24-001',
    educationType: '신입교육',
    content: '신입사원 기초 교육과정',
    participants: 15,
    location: '대회의실',
    status: '완료',
    completionDate: '2024-12-15',
    assignee: '김인사'
  },
  {
    registrationDate: '2024-12-05',
    startDate: '2024-02-15',
    code: 'EDU-S-24-001',
    educationType: '담당자교육',
    content: '업무 전문성 향상 교육',
    participants: 12,
    location: '소회의실A',
    status: '진행',
    completionDate: '2024-12-20',
    assignee: '이기술'
  },
  {
    registrationDate: '2024-12-10',
    startDate: '2024-03-20',
    code: 'EDU-M-24-001',
    educationType: '관리자교육',
    content: '리더십 및 팀 관리 교육',
    participants: 8,
    location: '임원회의실',
    status: '예정',
    completionDate: '2024-12-25',
    assignee: '최리더'
  }
];

// 이름과 UUID 매핑
const nameToUuidMap = {
  '김철수': '11111111-1111-1111-1111-111111111111',
  '박영희': '22222222-2222-2222-2222-222222222222',
  '이민수': '33333333-3333-3333-3333-333333333333',
  '최윤정': '44444444-4444-4444-4444-444444444444',
  '정상현': '55555555-5555-5555-5555-555555555555',
  '김민수': '66666666-6666-6666-6666-666666666666',
  '이영희': '77777777-7777-7777-7777-777777777777',
  '최수진': '88888888-8888-8888-8888-888888888888',
  '박지훈': '99999999-9999-9999-9999-999999999999',
  '한나라': 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '김인사': 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '이기술': 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '최리더': 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '관리자': 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
};

// 더미 사용자 생성
const dummyUsers = [
  { id: '11111111-1111-1111-1111-111111111111', email: 'kim.cs@nexwork.com', name: '김철수', role: 'user', department: 'IT', position: '대리' },
  { id: '22222222-2222-2222-2222-222222222222', email: 'park.yh@nexwork.com', name: '박영희', role: 'user', department: '마케팅', position: '과장' },
  { id: '33333333-3333-3333-3333-333333333333', email: 'lee.ms@nexwork.com', name: '이민수', role: 'user', department: 'IT', position: '사원' },
  { id: '44444444-4444-4444-4444-444444444444', email: 'choi.yj@nexwork.com', name: '최윤정', role: 'user', department: '영업', position: '대리' },
  { id: '55555555-5555-5555-5555-555555555555', email: 'jung.sh@nexwork.com', name: '정상현', role: 'user', department: '기획', position: '과장' },
  { id: '66666666-6666-6666-6666-666666666666', email: 'kim.ms@nexwork.com', name: '김민수', role: 'user', department: 'IT', position: '사원' },
  { id: '77777777-7777-7777-7777-777777777777', email: 'lee.yh@nexwork.com', name: '이영희', role: 'user', department: '디자인', position: '대리' },
  { id: '88888888-8888-8888-8888-888888888888', email: 'choi.sj@nexwork.com', name: '최수진', role: 'user', department: '기획', position: '과장' },
  { id: '99999999-9999-9999-9999-999999999999', email: 'park.jh@nexwork.com', name: '박지훈', role: 'user', department: 'IT', position: '대리' },
  { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', email: 'han.nr@nexwork.com', name: '한나라', role: 'user', department: '마케팅', position: '사원' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', email: 'kim.hr@nexwork.com', name: '김인사', role: 'manager', department: '인사', position: '팀장' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', email: 'lee.tech@nexwork.com', name: '이기술', role: 'manager', department: 'IT', position: '팀장' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', email: 'choi.lead@nexwork.com', name: '최리더', role: 'manager', department: '경영', position: '부장' },
  { id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', email: 'admin@nexwork.com', name: '관리자', role: 'admin', department: 'IT', position: '관리자' }
];

async function createTestUsers() {
  console.log('👥 테스트 사용자 생성...');
  
  // auth.users는 직접 생성할 수 없으므로, user_profiles만 생성
  console.log('⚠️  주의: auth.users 없이 user_profiles만 생성하면 외래키 제약조건 위반');
  console.log('📝 해결 방법: Supabase Dashboard에서 사용자를 먼저 생성하거나');
  console.log('    RLS 정책을 일시적으로 비활성화해야 합니다.');
  
  return false;
}

async function migrateCostRecords() {
  console.log('💰 비용 기록 마이그레이션...');
  
  try {
    const transformedData = costData.map(record => ({
      registration_date: record.registrationDate,
      start_date: record.startDate,
      code: record.code,
      team: record.team,
      assignee_id: null, // 외래키 제약조건 때문에 일단 null
      cost_type: record.costType,
      content: record.content,
      quantity: record.quantity,
      unit_price: record.unitPrice,
      amount: record.amount,
      status: record.status,
      completion_date: record.completionDate || null,
      created_by: null // 외래키 제약조건 때문에 일단 null
    }));

    const { data, error } = await supabase
      .from('cost_records')
      .upsert(transformedData)
      .select();

    if (error) {
      console.error('❌ 비용 기록 마이그레이션 실패:', error.message);
      return false;
    }

    console.log('✅ 비용 기록 마이그레이션 완료:', data.length, '건');
    return true;
  } catch (error) {
    console.error('❌ 비용 기록 마이그레이션 중 오류:', error);
    return false;
  }
}

async function migrateTaskRecords() {
  console.log('📋 업무 기록 마이그레이션...');
  
  try {
    const transformedData = taskData.map(record => ({
      no: record.no,
      registration_date: record.registrationDate,
      code: record.code,
      team: record.team,
      department: record.department,
      work_content: record.workContent,
      status: record.status,
      assignee_id: null, // 외래키 제약조건 때문에 일단 null
      start_date: record.startDate || null,
      completed_date: record.completedDate || null,
      created_by: null // 외래키 제약조건 때문에 일단 null
    }));

    const { data, error } = await supabase
      .from('task_records')
      .upsert(transformedData)
      .select();

    if (error) {
      console.error('❌ 업무 기록 마이그레이션 실패:', error.message);
      return false;
    }

    console.log('✅ 업무 기록 마이그레이션 완료:', data.length, '건');
    return true;
  } catch (error) {
    console.error('❌ 업무 기록 마이그레이션 중 오류:', error);
    return false;
  }
}

async function migrateEducationRecords() {
  console.log('🎓 교육 기록 마이그레이션...');
  
  try {
    const transformedData = educationData.map(record => ({
      registration_date: record.registrationDate,
      start_date: record.startDate,
      code: record.code,
      education_type: record.educationType,
      content: record.content,
      participants: record.participants,
      location: record.location,
      status: record.status,
      completion_date: record.completionDate || null,
      assignee_id: null, // 외래키 제약조건 때문에 일단 null
      created_by: null // 외래키 제약조건 때문에 일단 null
    }));

    const { data, error } = await supabase
      .from('education_records')
      .upsert(transformedData)
      .select();

    if (error) {
      console.error('❌ 교육 기록 마이그레이션 실패:', error.message);
      return false;
    }

    console.log('✅ 교육 기록 마이그레이션 완료:', data.length, '건');
    return true;
  } catch (error) {
    console.error('❌ 교육 기록 마이그레이션 중 오류:', error);
    return false;
  }
}

async function runMigration() {
  console.log('🚀 Nexwork 데이터 마이그레이션 시작...\n');

  try {
    // 외래키 제약조건 때문에 user_profiles가 필요하지만,
    // auth.users 없이는 생성할 수 없음
    console.log('⚠️  외래키 제약조건 문제 발견');
    console.log('📝 해결 방법:');
    console.log('1. Supabase Dashboard에서 RLS 정책 일시 비활성화');
    console.log('2. 또는 외래키 제약조건 제거 후 데이터 마이그레이션');
    console.log('3. 또는 auth.users에 사용자 먼저 생성\n');

    // 외래키 제약조건을 무시하고 시도
    console.log('🔄 외래키 제약조건 없이 시도...\n');

    // 비용 기록 마이그레이션 (assignee_id를 null로)
    const costSuccess = await migrateCostRecords();
    
    // 업무 기록 마이그레이션 (assignee_id를 null로)
    const taskSuccess = await migrateTaskRecords();
    
    // 교육 기록 마이그레이션 (assignee_id를 null로)
    const educationSuccess = await migrateEducationRecords();

    console.log('\n📊 마이그레이션 결과:');
    console.log(`비용 기록: ${costSuccess ? '✅' : '❌'}`);
    console.log(`업무 기록: ${taskSuccess ? '✅' : '❌'}`);
    console.log(`교육 기록: ${educationSuccess ? '✅' : '❌'}`);

    if (costSuccess || taskSuccess || educationSuccess) {
      console.log('\n🎉 일부 데이터 마이그레이션 성공!');
      console.log('📝 다음 단계: Frontend API 연동');
    } else {
      console.log('\n❌ 모든 마이그레이션 실패');
      console.log('외래키 제약조건 문제로 인해 실패했을 가능성이 높습니다.');
    }

  } catch (error) {
    console.error('❌ 마이그레이션 중 전체 오류:', error);
  }
}

runMigration();