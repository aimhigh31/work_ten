#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const { costData } = require('../src/data/cost');
const { taskData } = require('../src/data/task');
const { educationData } = require('../src/data/education');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경변수가 누락되었습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

// Service Role Key로 관리자 권한 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 더미 사용자 프로필 데이터
const dummyUsers = [
  { id: '11111111-1111-1111-1111-111111111111', email: 'kim@nexwork.com', name: '김철수' },
  { id: '22222222-2222-2222-2222-222222222222', email: 'park@nexwork.com', name: '박영희' },
  { id: '33333333-3333-3333-3333-333333333333', email: 'lee@nexwork.com', name: '이민수' },
  { id: '44444444-4444-4444-4444-444444444444', email: 'choi@nexwork.com', name: '최윤정' },
  { id: '55555555-5555-5555-5555-555555555555', email: 'jung@nexwork.com', name: '정상현' },
  { id: '66666666-6666-6666-6666-666666666666', email: 'kimhj@nexwork.com', name: '김혜진' },
  { id: '77777777-7777-7777-7777-777777777777', email: 'song@nexwork.com', name: '송민호' },
  { id: '88888888-8888-8888-8888-888888888888', email: 'noh@nexwork.com', name: '노수진' },
  { id: '99999999-9999-9999-9999-999999999999', email: 'admin@nexwork.com', name: '관리자', role: 'admin' }
];

// 이름과 UUID 매핑
const nameToUuidMap = {
  '김철수': '11111111-1111-1111-1111-111111111111',
  '박영희': '22222222-2222-2222-2222-222222222222',
  '이민수': '33333333-3333-3333-3333-333333333333',
  '최윤정': '44444444-4444-4444-4444-444444444444',
  '정상현': '55555555-5555-5555-5555-555555555555',
  '김혜진': '66666666-6666-6666-6666-666666666666',
  '송민호': '77777777-7777-7777-7777-777777777777',
  '노수진': '88888888-8888-8888-8888-888888888888',
  '김민수': '11111111-1111-1111-1111-111111111111',
  '이영희': '22222222-2222-2222-2222-222222222222',
  '박지훈': '33333333-3333-3333-3333-333333333333',
  '최수진': '44444444-4444-4444-4444-444444444444',
  '정우진': '55555555-5555-5555-5555-555555555555',
  '한나라': '66666666-6666-6666-6666-666666666666',
  '신동욱': '77777777-7777-7777-7777-777777777777',
  '오세영': '88888888-8888-8888-8888-888888888888',
  '김인사': '99999999-9999-9999-9999-999999999999',
  '이기술': '11111111-1111-1111-1111-111111111111',
  '최리더': '22222222-2222-2222-2222-222222222222'
};

async function migrateUserProfiles() {
  console.log('👥 사용자 프로필 마이그레이션 시작...');
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(dummyUsers.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'user',
        department: user.name.includes('김') ? 'IT' : '기획',
        position: user.role === 'admin' ? '관리자' : '사원'
      })));

    if (error) {
      console.error('❌ 사용자 프로필 마이그레이션 실패:', error);
      return false;
    }

    console.log('✅ 사용자 프로필 마이그레이션 완료:', dummyUsers.length, '건');
    return true;
  } catch (error) {
    console.error('❌ 사용자 프로필 마이그레이션 중 오류:', error);
    return false;
  }
}

async function migrateCostRecords() {
  console.log('💰 비용 기록 마이그레이션 시작...');
  
  try {
    const transformedCostData = costData.map(record => ({
      id: `cost-${record.id.toString().padStart(8, '0')}-${Date.now()}`,
      registration_date: record.registrationDate,
      start_date: record.startDate,
      code: record.code,
      team: record.team,
      assignee_id: nameToUuidMap[record.assignee] || null,
      cost_type: record.costType,
      content: record.content,
      quantity: record.quantity,
      unit_price: record.unitPrice,
      amount: record.amount,
      status: record.status,
      completion_date: record.completionDate || null,
      created_by: nameToUuidMap['관리자']
    }));

    const { data, error } = await supabase
      .from('cost_records')
      .upsert(transformedCostData);

    if (error) {
      console.error('❌ 비용 기록 마이그레이션 실패:', error);
      return false;
    }

    console.log('✅ 비용 기록 마이그레이션 완료:', transformedCostData.length, '건');
    return transformedCostData;
  } catch (error) {
    console.error('❌ 비용 기록 마이그레이션 중 오류:', error);
    return false;
  }
}

async function migrateTaskRecords() {
  console.log('📋 업무 기록 마이그레이션 시작...');
  
  try {
    const transformedTaskData = taskData.map(record => ({
      id: `task-${record.id.toString().padStart(8, '0')}-${Date.now()}`,
      no: record.no,
      registration_date: record.registrationDate,
      code: record.code,
      team: record.team,
      department: record.department,
      work_content: record.workContent,
      status: record.status,
      assignee_id: nameToUuidMap[record.assignee] || null,
      start_date: record.startDate || null,
      completed_date: record.completedDate || null,
      created_by: nameToUuidMap['관리자']
    }));

    const { data, error } = await supabase
      .from('task_records')
      .upsert(transformedTaskData);

    if (error) {
      console.error('❌ 업무 기록 마이그레이션 실패:', error);
      return false;
    }

    console.log('✅ 업무 기록 마이그레이션 완료:', transformedTaskData.length, '건');
    return transformedTaskData;
  } catch (error) {
    console.error('❌ 업무 기록 마이그레이션 중 오류:', error);
    return false;
  }
}

async function migrateEducationRecords() {
  console.log('🎓 교육 기록 마이그레이션 시작...');
  
  try {
    const transformedEducationData = educationData.map(record => ({
      id: `edu-${record.id.toString().padStart(8, '0')}-${Date.now()}`,
      registration_date: record.registrationDate,
      start_date: record.startDate,
      code: record.code,
      education_type: record.educationType,
      content: record.content,
      participants: record.participants,
      location: record.location,
      status: record.status,
      completion_date: record.completionDate || null,
      assignee_id: nameToUuidMap[record.assignee] || null,
      created_by: nameToUuidMap['관리자']
    }));

    const { data, error } = await supabase
      .from('education_records')
      .upsert(transformedEducationData);

    if (error) {
      console.error('❌ 교육 기록 마이그레이션 실패:', error);
      return false;
    }

    console.log('✅ 교육 기록 마이그레이션 완료:', transformedEducationData.length, '건');
    return transformedEducationData;
  } catch (error) {
    console.error('❌ 교육 기록 마이그레이션 중 오류:', error);
    return false;
  }
}

async function migrateEducationCurriculum() {
  console.log('📚 커리큘럼 마이그레이션 시작...');
  
  try {
    let curriculumCount = 0;
    
    for (const education of educationData) {
      if (education.curriculum && education.curriculum.length > 0) {
        const educationId = `edu-${education.id.toString().padStart(8, '0')}-${Date.now()}`;
        
        const transformedCurriculum = education.curriculum.map((item, index) => ({
          id: `cur-${education.id}-${item.id}-${Date.now()}`,
          education_record_id: educationId,
          time_slot: item.time,
          subject: item.subject,
          instructor: item.instructor,
          content: item.content,
          attachment_path: item.attachment || null,
          sort_order: index + 1
        }));

        const { error } = await supabase
          .from('education_curriculum')
          .upsert(transformedCurriculum);

        if (error) {
          console.error('❌ 커리큘럼 마이그레이션 실패 (교육 ID:', education.id, '):', error);
        } else {
          curriculumCount += transformedCurriculum.length;
        }
      }
    }

    console.log('✅ 커리큘럼 마이그레이션 완료:', curriculumCount, '건');
    return true;
  } catch (error) {
    console.error('❌ 커리큘럼 마이그레이션 중 오류:', error);
    return false;
  }
}

async function migrateEducationParticipants() {
  console.log('👨‍🎓 참석자 마이그레이션 시작...');
  
  try {
    let participantCount = 0;
    
    for (const education of educationData) {
      if (education.participantList && education.participantList.length > 0) {
        const educationId = `edu-${education.id.toString().padStart(8, '0')}-${Date.now()}`;
        
        const transformedParticipants = education.participantList.map((participant) => ({
          id: `part-${education.id}-${participant.id}-${Date.now()}`,
          education_record_id: educationId,
          participant_id: nameToUuidMap[participant.name] || nameToUuidMap['관리자'],
          department: participant.department,
          attendance_status: participant.attendance === '참석' ? '참석' : 
                            participant.attendance === '불참' ? '불참' : '예정',
          completion_status: participant.attendance === '참석' ? '완료' : '미완료'
        }));

        const { error } = await supabase
          .from('education_participants')
          .upsert(transformedParticipants);

        if (error) {
          console.error('❌ 참석자 마이그레이션 실패 (교육 ID:', education.id, '):', error);
        } else {
          participantCount += transformedParticipants.length;
        }
      }
    }

    console.log('✅ 참석자 마이그레이션 완료:', participantCount, '건');
    return true;
  } catch (error) {
    console.error('❌ 참석자 마이그레이션 중 오류:', error);
    return false;
  }
}

async function runMigration() {
  console.log('🚀 Nexwork 데이터 마이그레이션 시작...');
  console.log('📊 마이그레이션 대상 데이터:');
  console.log(`  - 비용 기록: ${costData.length}건`);
  console.log(`  - 업무 기록: ${taskData.length}건`);
  console.log(`  - 교육 기록: ${educationData.length}건`);
  console.log('');

  try {
    // 1. 사용자 프로필 마이그레이션
    const userSuccess = await migrateUserProfiles();
    if (!userSuccess) {
      console.error('❌ 사용자 프로필 마이그레이션 실패로 중단됩니다.');
      return;
    }

    // 잠시 대기 (FK 제약조건 안정성을 위해)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. 비용 기록 마이그레이션
    const costSuccess = await migrateCostRecords();
    if (!costSuccess) {
      console.error('❌ 비용 기록 마이그레이션 실패');
    }

    // 3. 업무 기록 마이그레이션
    const taskSuccess = await migrateTaskRecords();
    if (!taskSuccess) {
      console.error('❌ 업무 기록 마이그레이션 실패');
    }

    // 4. 교육 기록 마이그레이션
    const educationSuccess = await migrateEducationRecords();
    if (!educationSuccess) {
      console.error('❌ 교육 기록 마이그레이션 실패');
    }

    // 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 5. 커리큘럼 마이그레이션
    const curriculumSuccess = await migrateEducationCurriculum();
    if (!curriculumSuccess) {
      console.error('❌ 커리큘럼 마이그레이션 실패');
    }

    // 6. 참석자 마이그레이션
    const participantSuccess = await migrateEducationParticipants();
    if (!participantSuccess) {
      console.error('❌ 참석자 마이그레이션 실패');
    }

    console.log('\n🎉 데이터 마이그레이션 완료!');
    console.log('📝 다음 단계:');
    console.log('  1. Supabase Dashboard에서 데이터 확인');
    console.log('  2. RLS 정책 테스트');
    console.log('  3. Frontend API 연동 테스트');

  } catch (error) {
    console.error('❌ 마이그레이션 중 전체 오류:', error);
  }
}

runMigration();