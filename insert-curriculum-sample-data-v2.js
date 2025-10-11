const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleSessions = [
  {
    education_id: 6,
    session_order: 1,
    session_title: '정보보안 개요',
    session_description: '조직 정보보안의 기본 개념과 중요성에 대한 전반적인 이해',
    duration_minutes: 60,
    instructor: '김보안',
    session_type: '강의',
    materials: 'PPT, 실습자료',
    objectives: '정보보안의 기본 개념 이해, 보안 위협 인식'
  },
  {
    education_id: 6,
    session_order: 2,
    session_title: '패스워드 보안',
    session_description: '안전한 패스워드 작성법과 관리 방법',
    duration_minutes: 45,
    instructor: '김보안',
    session_type: '실습',
    materials: '실습 도구, 체크리스트',
    objectives: '강력한 패스워드 생성 능력, 패스워드 관리 도구 활용'
  },
  {
    education_id: 7,
    session_order: 1,
    session_title: '이메일 보안',
    session_description: '피싱 메일 식별과 안전한 이메일 사용법',
    duration_minutes: 50,
    instructor: '박메일',
    session_type: '강의+실습',
    materials: '피싱 메일 샘플, 분석 도구',
    objectives: '피싱 메일 식별 능력, 안전한 이메일 사용 습관'
  },
  {
    education_id: 8,
    session_order: 1,
    session_title: '개인정보보호법 개요',
    session_description: '개인정보보호법의 주요 내용과 처리자 의무',
    duration_minutes: 90,
    instructor: '이법률',
    session_type: '강의',
    materials: '법령집, 사례집',
    objectives: '개인정보보호법 이해, 처리자 의무사항 숙지'
  },
  {
    education_id: 9,
    session_order: 1,
    session_title: '개인정보 안전성 확보조치',
    session_description: '기술적, 관리적, 물리적 보호조치 실무',
    duration_minutes: 120,
    instructor: '이법률',
    session_type: '실습',
    materials: '체크리스트, 실습 환경',
    objectives: '안전성 확보조치 적용, 점검 능력 향상'
  },
  {
    education_id: 10,
    session_order: 1,
    session_title: '클라우드 보안 모델',
    session_description: '클라우드 서비스별 보안 책임 모델 이해',
    duration_minutes: 75,
    instructor: '최클라우드',
    session_type: '강의',
    materials: '클라우드 아키텍처 다이어그램',
    objectives: '클라우드 보안 모델 이해, 책임 분담 모델 숙지'
  },
  {
    education_id: 11,
    session_order: 1,
    session_title: '클라우드 데이터 암호화',
    session_description: '클라우드 환경에서의 데이터 암호화 실습',
    duration_minutes: 90,
    instructor: '최클라우드',
    session_type: '실습',
    materials: '암호화 도구, 실습 데이터',
    objectives: '데이터 암호화 기술 습득, 키 관리 방법 이해'
  }
];

async function insertSampleData() {
  try {
    console.log('샘플 교육 세션 데이터를 삽입합니다...');

    for (const session of sampleSessions) {
      const { data, error } = await supabase
        .from('security_education_curriculum')
        .insert([session])
        .select();

      if (error) {
        console.error('데이터 삽입 실패:', error);
        continue;
      }

      console.log(`✅ "${session.session_title}" 삽입 완료`);
    }

    console.log('\n✅ 모든 샘플 데이터 삽입이 완료되었습니다.');

    // 최종 확인
    const { data: allData, error: fetchError } = await supabase
      .from('security_education_curriculum')
      .select('*')
      .order('education_id, session_order', { ascending: true });

    if (fetchError) {
      console.error('데이터 조회 실패:', fetchError);
      return;
    }

    console.log(`\n📊 총 ${allData.length}개의 교육 세션이 등록되어 있습니다:`);
    allData.forEach((item, index) => {
      console.log(`${index + 1}. [교육${item.education_id}-${item.session_order}] ${item.session_title} (${item.duration_minutes}분, ${item.instructor})`);
    });

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

insertSampleData();