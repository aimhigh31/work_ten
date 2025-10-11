// USER_LEVEL 마스터코드 그룹과 서브코드들을 생성하는 스크립트

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUserLevelMasterCode() {
  try {
    console.log('🚀 USER_LEVEL 마스터코드 생성 시작...');

    // 1. 먼저 USER_LEVEL 그룹이 이미 존재하는지 확인
    const { data: existingMasterCode, error: checkError } = await supabase
      .from('admin_mastercode_data')
      .select('*')
      .eq('code_group', 'USER_LEVEL')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    let masterCodeId;

    if (existingMasterCode) {
      console.log('✅ USER_LEVEL 마스터코드 그룹이 이미 존재합니다:', existingMasterCode);
      masterCodeId = existingMasterCode.id;
    } else {
      // 2. USER_LEVEL 마스터코드 그룹 생성
      const { data: newMasterCode, error: masterCodeError } = await supabase
        .from('admin_mastercode_data')
        .insert([
          {
            code_group: 'USER_LEVEL',
            group_name: '직급',
            group_description: '사용자 직급 분류',
            is_active: true,
            is_system: false,
            created_by: '시스템',
            updated_by: '시스템'
          }
        ])
        .select()
        .single();

      if (masterCodeError) {
        throw masterCodeError;
      }

      console.log('✅ USER_LEVEL 마스터코드 그룹 생성 완료:', newMasterCode);
      masterCodeId = newMasterCode.id;
    }

    // 3. 기존 서브코드들 확인
    const { data: existingSubCodes, error: subCodeCheckError } = await supabase
      .from('admin_mastercode_subcode')
      .select('*')
      .eq('mastercode_id', masterCodeId);

    if (subCodeCheckError) {
      throw subCodeCheckError;
    }

    if (existingSubCodes && existingSubCodes.length > 0) {
      console.log('✅ 서브코드들이 이미 존재합니다:', existingSubCodes.length, '개');
      existingSubCodes.forEach(subCode => {
        console.log(`  - ${subCode.code_value}: ${subCode.code_name}`);
      });
      return;
    }

    // 4. 직급 서브코드들 생성
    const userLevelSubCodes = [
      {
        mastercode_id: masterCodeId,
        code_value: 'E1',
        code_name: '사원',
        code_description: '일반 사원',
        display_order: 1,
        is_active: true,
        created_by: '시스템',
        updated_by: '시스템'
      },
      {
        mastercode_id: masterCodeId,
        code_value: 'E2',
        code_name: '주임',
        code_description: '주임급',
        display_order: 2,
        is_active: true,
        created_by: '시스템',
        updated_by: '시스템'
      },
      {
        mastercode_id: masterCodeId,
        code_value: 'E3',
        code_name: '대리',
        code_description: '대리급',
        display_order: 3,
        is_active: true,
        created_by: '시스템',
        updated_by: '시스템'
      },
      {
        mastercode_id: masterCodeId,
        code_value: 'E4',
        code_name: '과장',
        code_description: '과장급',
        display_order: 4,
        is_active: true,
        created_by: '시스템',
        updated_by: '시스템'
      },
      {
        mastercode_id: masterCodeId,
        code_value: 'E5',
        code_name: '차장',
        code_description: '차장급',
        display_order: 5,
        is_active: true,
        created_by: '시스템',
        updated_by: '시스템'
      },
      {
        mastercode_id: masterCodeId,
        code_value: 'E6',
        code_name: '부장',
        code_description: '부장급',
        display_order: 6,
        is_active: true,
        created_by: '시스템',
        updated_by: '시스템'
      }
    ];

    const { data: newSubCodes, error: subCodeError } = await supabase
      .from('admin_mastercode_subcode')
      .insert(userLevelSubCodes)
      .select();

    if (subCodeError) {
      throw subCodeError;
    }

    console.log('✅ 직급 서브코드 생성 완료:', newSubCodes.length, '개');
    newSubCodes.forEach(subCode => {
      console.log(`  - ${subCode.code_value}: ${subCode.code_name}`);
    });

    console.log('🎉 USER_LEVEL 마스터코드 설정 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 스크립트 실행
createUserLevelMasterCode();