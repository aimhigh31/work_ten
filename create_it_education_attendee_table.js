const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createItEducationAttendeeTable() {
  console.log('🔄 it_education_attendee 테이블 생성 시작...');

  try {
    // 1. it_education_attendee 테이블 생성
    console.log('📋 it_education_attendee 테이블 생성 중...');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS it_education_attendee (
        id SERIAL PRIMARY KEY,                    -- 참석자 항목 ID
        education_id INTEGER NOT NULL,           -- 외래키: it_education_data.id
        user_id INTEGER,                         -- 사용자 ID (옵셔널)
        user_name VARCHAR NOT NULL,              -- 사용자명
        user_code VARCHAR,                       -- 사용자 코드
        department VARCHAR,                      -- 부서
        position VARCHAR,                        -- 직책
        email VARCHAR,                           -- 이메일
        phone VARCHAR,                           -- 전화번호
        attendance_status VARCHAR DEFAULT '예정', -- 출석 상태 (예정/참석/불참)
        attendance_date TIMESTAMP,              -- 출석 시간
        completion_status VARCHAR DEFAULT '미완료', -- 완료 상태 (완료/미완료)
        score INTEGER,                           -- 점수
        certificate_issued BOOLEAN DEFAULT false, -- 수료증 발급 여부
        notes TEXT,                             -- 비고
        created_at TIMESTAMP DEFAULT NOW(),     -- 생성 시간
        updated_at TIMESTAMP DEFAULT NOW(),     -- 수정 시간
        created_by VARCHAR DEFAULT 'user',      -- 생성자
        updated_by VARCHAR DEFAULT 'user',      -- 수정자
        is_active BOOLEAN DEFAULT true,         -- 활성 상태

        -- 외래키 제약 조건
        CONSTRAINT it_education_attendee_education_id_fkey
          FOREIGN KEY (education_id) REFERENCES it_education_data(id)
          ON DELETE CASCADE
      );
    `;

    const { error: createError } = await supabase.rpc('exec', {
      sql: createTableSQL
    });

    if (createError) {
      console.error('❌ 테이블 생성 실패:', createError);
      return;
    }

    console.log('✅ it_education_attendee 테이블 생성 완료');

    // 2. 인덱스 생성
    console.log('📈 인덱스 생성 중...');

    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_it_education_attendee_education_id
      ON it_education_attendee(education_id);

      CREATE INDEX IF NOT EXISTS idx_it_education_attendee_user_name
      ON it_education_attendee(education_id, user_name);

      CREATE INDEX IF NOT EXISTS idx_it_education_attendee_attendance_status
      ON it_education_attendee(education_id, attendance_status);
    `;

    const { error: indexError } = await supabase.rpc('exec', {
      sql: createIndexSQL
    });

    if (indexError) {
      console.error('❌ 인덱스 생성 실패:', indexError);
    } else {
      console.log('✅ 인덱스 생성 완료');
    }

    // 3. 테스트 데이터 삽입 (기존 it_education_data가 있는 경우)
    console.log('🧪 테스트 데이터 확인 중...');

    const { data: educationData, error: selectError } = await supabase
      .from('it_education_data')
      .select('id, education_name')
      .eq('is_active', true)
      .limit(1);

    if (selectError) {
      console.error('❌ 기존 교육 데이터 조회 실패:', selectError);
    } else if (educationData && educationData.length > 0) {
      const testEducationId = educationData[0].id;
      console.log(`📚 테스트 교육 ID: ${testEducationId} (${educationData[0].education_name})`);

      // 이미 참석자 데이터가 있는지 확인
      const { data: existingAttendees } = await supabase
        .from('it_education_attendee')
        .select('id')
        .eq('education_id', testEducationId)
        .limit(1);

      if (!existingAttendees || existingAttendees.length === 0) {
        // 샘플 참석자 데이터 삽입
        const sampleAttendeeData = [
          {
            education_id: testEducationId,
            user_name: '김철수',
            user_code: 'USER-25-001',
            department: '개발팀',
            position: '대리',
            email: 'kim.cs@company.com',
            phone: '010-1234-5678',
            attendance_status: '예정',
            completion_status: '미완료',
            score: null,
            certificate_issued: false,
            notes: 'IT교육 참석 예정자'
          },
          {
            education_id: testEducationId,
            user_name: '이영희',
            user_code: 'USER-25-002',
            department: '디자인팀',
            position: '주임',
            email: 'lee.yh@company.com',
            phone: '010-2345-6789',
            attendance_status: '참석',
            completion_status: '완료',
            score: 85,
            certificate_issued: true,
            notes: '우수한 참여도'
          },
          {
            education_id: testEducationId,
            user_name: '박민수',
            user_code: 'USER-25-003',
            department: '기획팀',
            position: '과장',
            email: 'park.ms@company.com',
            phone: '010-3456-7890',
            attendance_status: '참석',
            completion_status: '완료',
            score: 92,
            certificate_issued: true,
            notes: '적극적인 질문과 토론 참여'
          },
          {
            education_id: testEducationId,
            user_name: '정수영',
            user_code: 'USER-25-004',
            department: '개발팀',
            position: '사원',
            email: 'jung.sy@company.com',
            phone: '010-4567-8901',
            attendance_status: '불참',
            completion_status: '미완료',
            score: null,
            certificate_issued: false,
            notes: '개인사정으로 불참'
          },
          {
            education_id: testEducationId,
            user_name: '최지혜',
            user_code: 'USER-25-005',
            department: '마케팅팀',
            position: '대리',
            email: 'choi.jh@company.com',
            phone: '010-5678-9012',
            attendance_status: '예정',
            completion_status: '미완료',
            score: null,
            certificate_issued: false,
            notes: '보충 교육 필요'
          }
        ];

        const { error: insertError } = await supabase
          .from('it_education_attendee')
          .insert(sampleAttendeeData);

        if (insertError) {
          console.error('❌ 샘플 데이터 삽입 실패:', insertError);
        } else {
          console.log('✅ 샘플 참석자 데이터 삽입 완료');
          console.log(`👥 ${sampleAttendeeData.length}명의 참석자가 추가되었습니다.`);
        }
      } else {
        console.log('ℹ️ 해당 교육의 참석자 데이터가 이미 존재합니다.');
      }
    } else {
      console.log('ℹ️ 기존 교육 데이터가 없어 샘플 참석자 데이터를 생성하지 않습니다.');
    }

    // 4. 테이블 구조 확인
    console.log('\n🔍 생성된 테이블 구조 확인:');
    const { data: tableInfo, error: infoError } = await supabase
      .from('it_education_attendee')
      .select('*')
      .limit(3);

    if (infoError) {
      console.error('❌ 테이블 구조 확인 실패:', infoError);
    } else {
      console.log('👥 it_education_attendee 테이블 샘플 데이터:');
      tableInfo.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.user_name} (${row.department}/${row.position})`);
        console.log(`     출석상태: ${row.attendance_status}, 완료상태: ${row.completion_status}`);
        if (row.score) console.log(`     점수: ${row.score}점`);
      });
    }

    console.log('\n🎉 it_education_attendee 테이블 설정 완료!');
    console.log('📌 다음 단계:');
    console.log('  1. useSupabaseItEducationAttendee 훅 작성');
    console.log('  2. ParticipantsTab 컴포넌트 Supabase 연동');
    console.log('  3. 데이터 관계 연결 (it_education_data.id ↔ it_education_attendee.education_id)');

  } catch (err) {
    console.error('❌ it_education_attendee 테이블 생성 중 오류:', err);
  }
}

createItEducationAttendeeTable();