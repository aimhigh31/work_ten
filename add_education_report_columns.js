const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addEducationReportColumns() {
  console.log('🔄 it_education_data 테이블에 교육실적보고 컬럼 추가 시작...');

  try {
    // it_education_data 테이블에 교육실적보고 관련 컬럼 추가
    console.log('📋 교육실적보고 컬럼 추가 중...');

    const addColumnsSQL = `
      ALTER TABLE it_education_data
      ADD COLUMN IF NOT EXISTS achievements TEXT,           -- 성과
      ADD COLUMN IF NOT EXISTS improvements TEXT,          -- 개선사항
      ADD COLUMN IF NOT EXISTS education_feedback TEXT,    -- 교육소감
      ADD COLUMN IF NOT EXISTS report_notes TEXT;          -- 비고
    `;

    const { error: addError } = await supabase.rpc('exec', {
      sql: addColumnsSQL
    });

    if (addError) {
      console.error('❌ 컬럼 추가 실패:', addError);
      return;
    }

    console.log('✅ 교육실적보고 컬럼 추가 완료');

    // 기존 데이터에 샘플 데이터 업데이트 (테스트용)
    console.log('🧪 샘플 교육실적보고 데이터 추가 중...');

    const { data: existingEducations, error: selectError } = await supabase
      .from('it_education_data')
      .select('id, education_name')
      .eq('is_active', true)
      .limit(3);

    if (selectError) {
      console.error('❌ 기존 교육 데이터 조회 실패:', selectError);
    } else if (existingEducations && existingEducations.length > 0) {
      console.log(`📚 ${existingEducations.length}개 교육 데이터에 샘플 실적보고 추가`);

      const sampleReportData = [
        {
          achievements: '참석자 95%가 교육 목표를 달성했으며, 실무 적용 능력이 크게 향상되었습니다.',
          improvements: '실습 시간을 늘리고, 더 다양한 예제를 제공할 필요가 있습니다.',
          education_feedback: '매우 유익한 교육이었으며, 업무에 바로 적용할 수 있는 내용들로 구성되어 있어 만족도가 높았습니다.',
          report_notes: '다음 교육에서는 고급 과정도 개설을 검토해보겠습니다.'
        },
        {
          achievements: '신규 기술 스택에 대한 이해도가 향상되었고, 팀 내 지식 공유가 활발해졌습니다.',
          improvements: '온라인 교육의 집중도를 높이기 위한 방안이 필요합니다.',
          education_feedback: '최신 기술 트렌드를 배울 수 있어서 좋았고, 강사의 설명이 명확해서 이해하기 쉬웠습니다.',
          report_notes: '후속 워크샵 진행을 계획 중입니다.'
        },
        {
          achievements: '업무 효율성이 20% 향상되었으며, 오류 발생률이 현저히 감소했습니다.',
          improvements: '개인별 맞춤형 피드백 시간을 늘릴 필요가 있습니다.',
          education_feedback: '실무와 직결된 내용으로 구성되어 있어 바로 적용할 수 있었습니다.',
          report_notes: '정기적인 후속 교육이 필요할 것으로 판단됩니다.'
        }
      ];

      // 각 교육 데이터에 샘플 실적보고 업데이트
      for (let i = 0; i < existingEducations.length; i++) {
        const education = existingEducations[i];
        const reportData = sampleReportData[i] || sampleReportData[0];

        const { error: updateError } = await supabase
          .from('it_education_data')
          .update({
            ...reportData,
            updated_at: new Date().toISOString()
          })
          .eq('id', education.id);

        if (updateError) {
          console.error(`❌ 교육 ID ${education.id} 실적보고 업데이트 실패:`, updateError);
        } else {
          console.log(`✅ "${education.education_name}" 실적보고 데이터 추가 완료`);
        }
      }
    } else {
      console.log('ℹ️ 기존 교육 데이터가 없어 샘플 실적보고를 추가하지 않습니다.');
    }

    // 테이블 구조 확인
    console.log('\n🔍 수정된 테이블 구조 확인:');
    const { data: tableData, error: infoError } = await supabase
      .from('it_education_data')
      .select('id, education_name, achievements, improvements, education_feedback, report_notes')
      .eq('is_active', true)
      .limit(2);

    if (infoError) {
      console.error('❌ 테이블 구조 확인 실패:', infoError);
    } else {
      console.log('📊 it_education_data 교육실적보고 샘플 데이터:');
      tableData.forEach((row, index) => {
        console.log(`  ${index + 1}. "${row.education_name}"`);
        console.log(`     성과: ${row.achievements ? row.achievements.substring(0, 50) + '...' : '없음'}`);
        console.log(`     개선사항: ${row.improvements ? row.improvements.substring(0, 50) + '...' : '없음'}`);
        console.log(`     교육소감: ${row.education_feedback ? row.education_feedback.substring(0, 50) + '...' : '없음'}`);
        console.log(`     비고: ${row.report_notes ? row.report_notes.substring(0, 50) + '...' : '없음'}`);
      });
    }

    console.log('\n🎉 it_education_data 교육실적보고 컬럼 추가 완료!');
    console.log('📌 다음 단계:');
    console.log('  1. useSupabaseItEducation 훅에 실적보고 필드 추가');
    console.log('  2. ITEducationEditDialog 교육실적보고탭 데이터 연동');
    console.log('  3. 성과, 개선사항, 교육소감, 비고 필드 바인딩');

  } catch (err) {
    console.error('❌ 교육실적보고 컬럼 추가 중 오류:', err);
  }
}

addEducationReportColumns();