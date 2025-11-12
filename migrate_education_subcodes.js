/**
 * 보안교육 데이터 서브코드 → 서브코드명 마이그레이션 스크립트
 *
 * 목적: DB에 저장된 서브코드(GROUP008-SUB004)를 서브코드명(세미나, 워크샵 등)으로 변경
 * 테이블: security_education_data
 * 대상 컬럼: education_type, status
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '설정됨' : '없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateEducationSubcodes() {
  console.log('🚀 보안교육 데이터 서브코드 마이그레이션 시작\n');

  try {
    // 1. 모든 교육 데이터 가져오기
    console.log('📥 1단계: security_education_data 테이블 조회...');
    const { data: educations, error: educationError } = await supabase
      .from('security_education_data')
      .select('id, education_name, education_type, status');

    if (educationError) {
      console.error('❌ 교육 데이터 조회 실패:', educationError);
      return;
    }

    console.log(`✅ 총 ${educations.length}개 교육 데이터 조회 완료\n`);

    // 2. 마스터코드 데이터 가져오기 (GROUP008: 교육유형, GROUP002: 상태)
    console.log('📥 2단계: 마스터코드 데이터 조회...');
    const { data: masterCodes, error: masterError } = await supabase
      .from('admin_mastercode_data')
      .select('group_code, subcode, subcode_name')
      .in('group_code', ['GROUP008', 'GROUP002'])
      .eq('codetype', 'subcode')
      .eq('is_active', true);

    if (masterError) {
      console.error('❌ 마스터코드 조회 실패:', masterError);
      return;
    }

    console.log(`✅ 총 ${masterCodes.length}개 마스터코드 조회 완료`);

    // 그룹별로 구분
    const educationTypeMap = new Map();
    const statusMap = new Map();

    masterCodes.forEach(code => {
      if (code.group_code === 'GROUP008') {
        educationTypeMap.set(code.subcode, code.subcode_name);
      } else if (code.group_code === 'GROUP002') {
        statusMap.set(code.subcode, code.subcode_name);
      }
    });

    console.log(`  - 교육유형(GROUP008): ${educationTypeMap.size}개`);
    console.log(`  - 상태(GROUP002): ${statusMap.size}개\n`);

    // 3. 각 교육 데이터 확인 및 업데이트
    console.log('🔄 3단계: 서브코드 → 서브코드명 변환 시작...\n');

    let updatedCount = 0;
    let skippedCount = 0;

    for (const education of educations) {
      const updates = {};
      let needsUpdate = false;

      // education_type 확인 및 변환
      if (education.education_type && education.education_type.startsWith('GROUP')) {
        const subcodeName = educationTypeMap.get(education.education_type);
        if (subcodeName) {
          updates.education_type = subcodeName;
          needsUpdate = true;
          console.log(`  📝 [ID: ${education.id}] education_type: "${education.education_type}" → "${subcodeName}"`);
        } else {
          console.log(`  ⚠️  [ID: ${education.id}] education_type "${education.education_type}" 매칭 실패`);
        }
      }

      // status 확인 및 변환
      if (education.status && education.status.startsWith('GROUP')) {
        const subcodeName = statusMap.get(education.status);
        if (subcodeName) {
          updates.status = subcodeName;
          needsUpdate = true;
          console.log(`  📝 [ID: ${education.id}] status: "${education.status}" → "${subcodeName}"`);
        } else {
          console.log(`  ⚠️  [ID: ${education.id}] status "${education.status}" 매칭 실패`);
        }
      }

      // 업데이트 실행
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('security_education_data')
          .update(updates)
          .eq('id', education.id);

        if (updateError) {
          console.error(`  ❌ [ID: ${education.id}] 업데이트 실패:`, updateError.message);
        } else {
          console.log(`  ✅ [ID: ${education.id}] "${education.education_name}" 업데이트 완료`);
          updatedCount++;
        }
      } else {
        skippedCount++;
      }
    }

    // 4. 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 마이그레이션 완료');
    console.log('='.repeat(60));
    console.log(`✅ 업데이트된 레코드: ${updatedCount}개`);
    console.log(`⏭️  스킵된 레코드: ${skippedCount}개 (이미 서브코드명 형식)`);
    console.log(`📋 전체 레코드: ${educations.length}개`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
migrateEducationSubcodes()
  .then(() => {
    console.log('\n✅ 마이그레이션 스크립트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 마이그레이션 실패:', error);
    process.exit(1);
  });
