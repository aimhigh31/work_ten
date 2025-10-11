const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleCurriculums = [
  {
    curriculum_name: '정보보안 기초 교육',
    description: '조직의 모든 구성원을 대상으로 하는 기본적인 정보보안 인식 교육',
    duration_hours: 2,
    target_audience: '전체 직원',
    prerequisites: '없음',
    learning_objectives: '기본적인 정보보안 개념 이해, 보안 위협 인식, 안전한 업무 환경 조성',
    content_outline: '1. 정보보안 개요\n2. 패스워드 보안\n3. 이메일 보안\n4. 웹 브라우징 보안\n5. 물리적 보안',
    assessment_method: '온라인 퀴즈',
    certification: false,
    status: 'active'
  },
  {
    curriculum_name: '개인정보보호 교육',
    description: '개인정보 처리자를 위한 개인정보보호법 및 실무 교육',
    duration_hours: 4,
    target_audience: '개인정보 처리자',
    prerequisites: '정보보안 기초 교육 이수',
    learning_objectives: '개인정보보호법 이해, 개인정보 안전성 확보조치 적용, 개인정보 침해사고 대응',
    content_outline: '1. 개인정보보호법 개요\n2. 개인정보 수집/이용/제공\n3. 안전성 확보조치\n4. 침해사고 대응\n5. 실무사례 분석',
    assessment_method: '실습 과제 + 평가',
    certification: true,
    status: 'active'
  },
  {
    curriculum_name: '보안 관리자 전문 교육',
    description: '보안 관리자를 위한 고급 보안 기술 및 관리 체계 교육',
    duration_hours: 8,
    target_audience: '보안 관리자',
    prerequisites: '정보보안 기초 교육, 개인정보보호 교육 이수',
    learning_objectives: '보안 관리체계 구축, 보안 사고 대응, 보안 감사 수행, 보안 정책 수립',
    content_outline: '1. 정보보안 관리체계(ISMS)\n2. 위험 분석 및 평가\n3. 보안 정책 수립\n4. 침해사고 대응\n5. 보안 감사\n6. 최신 보안 위협 동향',
    assessment_method: '사례 연구 발표 + 실무 평가',
    certification: true,
    status: 'active'
  },
  {
    curriculum_name: '클라우드 보안 교육',
    description: '클라우드 환경에서의 보안 위협과 대응 방안 교육',
    duration_hours: 6,
    target_audience: '개발자, 시스템 관리자',
    prerequisites: '정보보안 기초 교육 이수',
    learning_objectives: '클라우드 보안 모델 이해, 클라우드 보안 위협 인식, 안전한 클라우드 서비스 이용',
    content_outline: '1. 클라우드 보안 모델\n2. 클라우드 서비스별 보안 고려사항\n3. 데이터 암호화\n4. 접근 제어 및 인증\n5. 클라우드 보안 모니터링',
    assessment_method: '실습 프로젝트',
    certification: false,
    status: 'active'
  },
  {
    curriculum_name: '소셜 엔지니어링 대응 교육',
    description: '사회공학적 공격 기법과 대응 방안에 대한 교육',
    duration_hours: 3,
    target_audience: '전체 직원',
    prerequisites: '정보보안 기초 교육 이수',
    learning_objectives: '소셜 엔지니어링 공격 기법 이해, 의심스러운 상황 인식, 적절한 대응 방법 습득',
    content_outline: '1. 소셜 엔지니어링 개요\n2. 공격 기법 분석\n3. 피싱 이메일 식별\n4. 전화 사기 대응\n5. 대응 절차 및 신고 방법',
    assessment_method: '시나리오 기반 시뮬레이션',
    certification: false,
    status: 'active'
  }
];

async function insertSampleData() {
  try {
    console.log('샘플 커리큘럼 데이터를 삽입합니다...');

    for (const curriculum of sampleCurriculums) {
      const { data, error } = await supabase
        .from('security_education_curriculum')
        .insert([curriculum])
        .select();

      if (error) {
        console.error('데이터 삽입 실패:', error);
        continue;
      }

      console.log(`✅ "${curriculum.curriculum_name}" 삽입 완료`);
    }

    console.log('\n✅ 모든 샘플 데이터 삽입이 완료되었습니다.');

    // 최종 확인
    const { data: allData, error: fetchError } = await supabase
      .from('security_education_curriculum')
      .select('*')
      .order('id', { ascending: true });

    if (fetchError) {
      console.error('데이터 조회 실패:', fetchError);
      return;
    }

    console.log(`\n📊 총 ${allData.length}개의 커리큘럼이 등록되어 있습니다:`);
    allData.forEach((item, index) => {
      console.log(`${index + 1}. ${item.curriculum_name} (${item.duration_hours}시간)`);
    });

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

insertSampleData();