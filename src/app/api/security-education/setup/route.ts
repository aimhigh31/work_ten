import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    console.log('📚 보안교육관리 테이블 생성 시작...');

    // 1. 메인 보안교육 데이터 테이블 생성
    console.log('📋 1. security_education_data 테이블 생성...');

    const createMainTableSQL = `
      CREATE TABLE IF NOT EXISTS security_education_data (
        id SERIAL PRIMARY KEY,

        -- 개요탭 기본 정보
        education_name VARCHAR(255) NOT NULL,
        description TEXT,
        education_type VARCHAR(100),
        assignee VARCHAR(100),
        execution_date DATE,
        location VARCHAR(255),
        status VARCHAR(50) DEFAULT '계획',
        participant_count INTEGER DEFAULT 0,
        registration_date DATE DEFAULT CURRENT_DATE,
        code VARCHAR(100) UNIQUE,

        -- 교육실적보고 정보 (단순하게 같은 테이블에 포함)
        achievements TEXT,
        feedback TEXT,
        improvement_points TEXT,
        effectiveness_score INTEGER,
        completion_rate DECIMAL(5,2),
        satisfaction_score DECIMAL(3,2),

        -- 공통 메타데이터
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'user',
        updated_by VARCHAR(100) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        metadata JSONB
      );
    `;

    const { error: mainTableError } = await supabase.rpc('exec', { sql: createMainTableSQL });
    if (mainTableError) {
      console.error('❌ security_education_data 테이블 생성 실패:', mainTableError);
      return NextResponse.json(
        {
          success: false,
          error: `메인 테이블 생성 실패: ${mainTableError.message}`
        },
        { status: 500 }
      );
    }
    console.log('✅ security_education_data 테이블 생성 완료');

    // 2. 커리큘럼 테이블 생성
    console.log('📋 2. security_education_curriculum 테이블 생성...');

    const createCurriculumTableSQL = `
      CREATE TABLE IF NOT EXISTS security_education_curriculum (
        id SERIAL PRIMARY KEY,
        education_id INTEGER NOT NULL REFERENCES security_education_data(id) ON DELETE CASCADE,

        -- 커리큘럼 항목 정보
        session_order INTEGER NOT NULL,
        session_title VARCHAR(255) NOT NULL,
        session_description TEXT,
        duration_minutes INTEGER,
        instructor VARCHAR(100),
        session_type VARCHAR(50),
        materials TEXT,
        objectives TEXT,

        -- 공통 메타데이터
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'user',
        updated_by VARCHAR(100) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,

        -- 정렬을 위한 복합 인덱스
        UNIQUE(education_id, session_order)
      );
    `;

    const { error: curriculumError } = await supabase.rpc('exec', { sql: createCurriculumTableSQL });
    if (curriculumError) {
      console.error('❌ security_education_curriculum 테이블 생성 실패:', curriculumError);
      return NextResponse.json(
        {
          success: false,
          error: `커리큘럼 테이블 생성 실패: ${curriculumError.message}`
        },
        { status: 500 }
      );
    }
    console.log('✅ security_education_curriculum 테이블 생성 완료');

    // 3. 참석자 테이블 생성
    console.log('📋 3. security_education_attendee 테이블 생성...');

    const createAttendeeTableSQL = `
      CREATE TABLE IF NOT EXISTS security_education_attendee (
        id SERIAL PRIMARY KEY,
        education_id INTEGER NOT NULL REFERENCES security_education_data(id) ON DELETE CASCADE,

        -- 참석자 정보
        user_id INTEGER,
        user_name VARCHAR(100) NOT NULL,
        user_code VARCHAR(50),
        department VARCHAR(100),
        position VARCHAR(50),
        email VARCHAR(255),
        phone VARCHAR(50),

        -- 참석 관련 정보
        attendance_status VARCHAR(50) DEFAULT '등록',
        attendance_date DATE,
        completion_status VARCHAR(50) DEFAULT '미완료',
        score DECIMAL(5,2),
        certificate_issued BOOLEAN DEFAULT false,
        notes TEXT,

        -- 공통 메타데이터
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'user',
        updated_by VARCHAR(100) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,

        -- 중복 참석자 방지
        UNIQUE(education_id, user_name, user_code)
      );
    `;

    const { error: attendeeError } = await supabase.rpc('exec', { sql: createAttendeeTableSQL });
    if (attendeeError) {
      console.error('❌ security_education_attendee 테이블 생성 실패:', attendeeError);
      return NextResponse.json(
        {
          success: false,
          error: `참석자 테이블 생성 실패: ${attendeeError.message}`
        },
        { status: 500 }
      );
    }
    console.log('✅ security_education_attendee 테이블 생성 완료');

    // 4. 샘플 데이터 생성
    console.log('📝 샘플 데이터 생성...');

    // 메인 교육 데이터 샘플
    const sampleEducations = [
      {
        education_name: '정보보안 기초 교육',
        description: '전 직원 대상 정보보안 기초 교육 과정',
        education_type: '온라인',
        assignee: '김개발자',
        execution_date: '2025-01-30',
        location: '온라인 플랫폼',
        status: '계획',
        participant_count: 0,
        code: 'SEC-EDU-001',
        achievements: '',
        feedback: '',
        improvement_points: '',
        effectiveness_score: null,
        completion_rate: null,
        satisfaction_score: null
      },
      {
        education_name: '개인정보보호 법령 교육',
        description: '개인정보보호법 개정사항 및 준수사항 교육',
        education_type: '오프라인',
        assignee: '이기획자',
        execution_date: '2025-02-15',
        location: '본사 대회의실',
        status: '진행중',
        participant_count: 25,
        code: 'SEC-EDU-002',
        achievements: '법령 이해도 향상',
        feedback: '실무 사례 중심 교육이 도움됨',
        improvement_points: '더 많은 실습 시간 필요',
        effectiveness_score: 85,
        completion_rate: 92.5,
        satisfaction_score: 4.2
      }
    ];

    for (const education of sampleEducations) {
      const { data, error } = await supabase.from('security_education_data').insert([education]).select();

      if (error) {
        console.error('❌ 샘플 교육 데이터 생성 실패:', error);
        continue;
      }

      console.log(`✅ 샘플 교육 생성: ${education.education_name} (ID: ${data[0].id})`);

      // 첫 번째 교육의 커리큘럼 및 참석자 샘플 데이터 생성
      if (education.code === 'SEC-EDU-001') {
        await createSampleCurriculum(data[0].id);
        await createSampleAttendees(data[0].id);
      }
    }

    console.log('\n✅ 보안교육관리 테이블 생성 완료!');
    console.log('\n🔗 테이블 관계:');
    console.log('  📋 security_education_data (메인 - 개요탭 + 교육실적보고)');
    console.log('    ├── 📚 security_education_curriculum (커리큘럼탭)');
    console.log('    └── 👥 security_education_attendee (참석자탭)');

    return NextResponse.json({
      success: true,
      message: '보안교육관리 테이블이 성공적으로 생성되었습니다.'
    });
  } catch (error) {
    console.error('❌ 테이블 생성 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}

// 커리큘럼 샘플 데이터 생성 함수
async function createSampleCurriculum(educationId: number) {
  const curriculumItems = [
    {
      education_id: educationId,
      session_order: 1,
      session_title: '정보보안 개요',
      session_description: '정보보안의 기본 개념과 중요성',
      duration_minutes: 60,
      instructor: '보안팀 팀장',
      session_type: '강의',
      materials: 'PPT 자료, 동영상',
      objectives: '정보보안 기본 개념 이해'
    },
    {
      education_id: educationId,
      session_order: 2,
      session_title: '비밀번호 보안',
      session_description: '안전한 비밀번호 생성 및 관리 방법',
      duration_minutes: 45,
      instructor: '보안 전문가',
      session_type: '실습',
      materials: '실습 도구, 가이드북',
      objectives: '강력한 비밀번호 설정 방법 습득'
    },
    {
      education_id: educationId,
      session_order: 3,
      session_title: '피싱 메일 대응',
      session_description: '피싱 메일 식별 및 대응 방법',
      duration_minutes: 30,
      instructor: '사이버보안팀',
      session_type: '토론',
      materials: '사례 연구 자료',
      objectives: '피싱 공격 대응 능력 향상'
    }
  ];

  for (const item of curriculumItems) {
    const { error } = await supabase.from('security_education_curriculum').insert([item]);

    if (error) {
      console.error('❌ 커리큘럼 샘플 데이터 생성 실패:', error);
    } else {
      console.log(`  📚 커리큘럼 생성: ${item.session_title}`);
    }
  }
}

// 참석자 샘플 데이터 생성 함수
async function createSampleAttendees(educationId: number) {
  const attendees = [
    {
      education_id: educationId,
      user_name: '박디자이너',
      user_code: 'USER001',
      department: 'IT팀',
      position: '사원',
      email: 'park@company.com',
      phone: '010-1234-5678',
      attendance_status: '등록',
      completion_status: '미완료'
    },
    {
      education_id: educationId,
      user_name: '최마케터',
      user_code: 'USER002',
      department: '마케팅팀',
      position: '대리',
      email: 'choi@company.com',
      phone: '010-2345-6789',
      attendance_status: '등록',
      completion_status: '미완료'
    },
    {
      education_id: educationId,
      user_name: '안재식',
      user_code: 'USER003',
      department: '기획팀',
      position: '과장',
      email: 'ahn@company.com',
      phone: '010-3456-7890',
      attendance_status: '등록',
      completion_status: '미완료'
    }
  ];

  for (const attendee of attendees) {
    const { error } = await supabase.from('security_education_attendee').insert([attendee]);

    if (error) {
      console.error('❌ 참석자 샘플 데이터 생성 실패:', error);
    } else {
      console.log(`  👥 참석자 생성: ${attendee.user_name}`);
    }
  }
}
