const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createItEducationCurriculumTable() {
  console.log('🔄 it_education_curriculum 테이블 생성 시작...');

  try {
    // 1. it_education_curriculum 테이블 생성
    console.log('📋 it_education_curriculum 테이블 생성 중...');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS it_education_curriculum (
        id SERIAL PRIMARY KEY,                    -- 커리큘럼 항목 ID
        education_id INTEGER NOT NULL,           -- 외래키: it_education_data.id
        session_order INTEGER NOT NULL,         -- 세션 순서
        session_title VARCHAR NOT NULL,         -- 세션 제목
        session_description TEXT,              -- 세션 설명
        duration_minutes INTEGER,             -- 소요 시간(분)
        instructor VARCHAR,                   -- 강사명
        session_type VARCHAR,                -- 세션 유형
        materials TEXT,                     -- 교육 자료
        objectives TEXT,                   -- 교육 목표
        created_at TIMESTAMP DEFAULT NOW(), -- 생성 시간
        updated_at TIMESTAMP DEFAULT NOW(), -- 수정 시간
        created_by VARCHAR DEFAULT 'user', -- 생성자
        updated_by VARCHAR DEFAULT 'user', -- 수정자
        is_active BOOLEAN DEFAULT true,    -- 활성 상태

        -- 외래키 제약 조건
        CONSTRAINT it_education_curriculum_education_id_fkey
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

    console.log('✅ it_education_curriculum 테이블 생성 완료');

    // 2. 인덱스 생성
    console.log('📈 인덱스 생성 중...');

    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_it_education_curriculum_education_id
      ON it_education_curriculum(education_id);

      CREATE INDEX IF NOT EXISTS idx_it_education_curriculum_session_order
      ON it_education_curriculum(education_id, session_order);
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

      // 이미 커리큘럼 데이터가 있는지 확인
      const { data: existingCurriculum } = await supabase
        .from('it_education_curriculum')
        .select('id')
        .eq('education_id', testEducationId)
        .limit(1);

      if (!existingCurriculum || existingCurriculum.length === 0) {
        // 샘플 커리큘럼 데이터 삽입
        const sampleCurriculumData = [
          {
            education_id: testEducationId,
            session_order: 1,
            session_title: '교육 개요 및 목표',
            session_description: 'IT교육의 전반적인 개요와 학습 목표를 소개합니다.',
            duration_minutes: 30,
            instructor: '박지훈',
            session_type: '강의',
            materials: 'PPT 자료, 참고서',
            objectives: '교육 목표 이해 및 학습 방향 설정'
          },
          {
            education_id: testEducationId,
            session_order: 2,
            session_title: '실습 및 토론',
            session_description: '실제 사례를 통한 실습과 토론을 진행합니다.',
            duration_minutes: 60,
            instructor: '이소연',
            session_type: '실습',
            materials: '실습 가이드, 샘플 코드',
            objectives: '실무 능력 향상 및 문제 해결 능력 배양'
          },
          {
            education_id: testEducationId,
            session_order: 3,
            session_title: '평가 및 마무리',
            session_description: '학습 내용 평가 및 질의응답 시간입니다.',
            duration_minutes: 30,
            instructor: '박지훈',
            session_type: '평가',
            materials: '평가지, 피드백 양식',
            objectives: '학습 성과 확인 및 추후 학습 계획 수립'
          }
        ];

        const { error: insertError } = await supabase
          .from('it_education_curriculum')
          .insert(sampleCurriculumData);

        if (insertError) {
          console.error('❌ 샘플 데이터 삽입 실패:', insertError);
        } else {
          console.log('✅ 샘플 커리큘럼 데이터 삽입 완료');
          console.log(`📝 ${sampleCurriculumData.length}개의 커리큘럼 세션이 추가되었습니다.`);
        }
      } else {
        console.log('ℹ️ 해당 교육의 커리큘럼 데이터가 이미 존재합니다.');
      }
    } else {
      console.log('ℹ️ 기존 교육 데이터가 없어 샘플 커리큘럼 데이터를 생성하지 않습니다.');
    }

    // 4. 테이블 구조 확인
    console.log('\n🔍 생성된 테이블 구조 확인:');
    const { data: tableInfo, error: infoError } = await supabase
      .from('it_education_curriculum')
      .select('*')
      .limit(3);

    if (infoError) {
      console.error('❌ 테이블 구조 확인 실패:', infoError);
    } else {
      console.log('📋 it_education_curriculum 테이블 샘플 데이터:');
      tableInfo.forEach((row, index) => {
        console.log(`  ${index + 1}. [${row.session_order}] ${row.session_title} (${row.duration_minutes}분)`);
        console.log(`     강사: ${row.instructor}, 유형: ${row.session_type}`);
      });
    }

    console.log('\n🎉 it_education_curriculum 테이블 설정 완료!');
    console.log('📌 다음 단계:');
    console.log('  1. useSupabaseItEducationCurriculum 훅 작성');
    console.log('  2. CurriculumTab 컴포넌트 Supabase 연동');
    console.log('  3. 데이터 관계 연결 (it_education_data.id ↔ it_education_curriculum.education_id)');

  } catch (err) {
    console.error('❌ it_education_curriculum 테이블 생성 중 오류:', err);
  }
}

createItEducationCurriculumTable();