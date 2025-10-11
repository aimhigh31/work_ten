const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateGroup024() {
  console.log("🔍 GROUP024 확인 및 우선순위 설정...");

  try {
    // GROUP024 그룹 확인
    const { data: group024, error: groupError } = await supabase
      .from('admin_mastercode_data')
      .select('*')
      .eq('group_code', 'GROUP024')
      .eq('codetype', 'group');

    if (groupError) {
      console.log("❌ 그룹 조회 오류:", groupError);
      return;
    }

    if (!group024 || group024.length === 0) {
      console.log("📝 GROUP024 그룹이 없습니다. 생성합니다...");

      // GROUP024 그룹 생성
      const { data: newGroup, error: createGroupError } = await supabase
        .from('admin_mastercode_data')
        .insert([{
          codetype: 'group',
          group_code: 'GROUP024',
          group_code_name: '우선순위',
          group_code_description: 'VOC 관리 시스템에서 사용하는 우선순위 분류',
          group_code_status: 'active',
          group_code_order: 24,
          subcode: '',
          subcode_name: '',
          subcode_description: '',
          subcode_status: 'active',
          subcode_remark: '',
          subcode_order: 0,
          is_active: true,
          created_by: 'system',
          updated_by: 'system'
        }])
        .select();

      if (createGroupError) {
        console.log("❌ 그룹 생성 오류:", createGroupError);
        return;
      }

      console.log("✅ GROUP024 그룹 생성 완료:", newGroup);
    } else {
      console.log("✅ GROUP024 그룹이 이미 존재합니다:", group024[0]);
    }

    // GROUP024의 서브코드 확인
    const { data: subCodes, error: subCodeError } = await supabase
      .from('admin_mastercode_data')
      .select('*')
      .eq('group_code', 'GROUP024')
      .eq('codetype', 'subcode')
      .order('subcode_order', { ascending: true });

    if (subCodeError) {
      console.log("❌ 서브코드 조회 오류:", subCodeError);
      return;
    }

    console.log(`📊 GROUP024 서브코드 ${subCodes?.length || 0}개 발견`);

    if (!subCodes || subCodes.length === 0) {
      console.log("📝 GROUP024 서브코드가 없습니다. 우선순위를 생성합니다...");

      // 우선순위 서브코드들 생성
      const priorities = [
        { name: '긴급', description: '즉시 처리가 필요한 중요한 사안', order: 1 },
        { name: '높음', description: '우선적으로 처리가 필요한 사안', order: 2 },
        { name: '보통', description: '일반적인 처리 우선순위', order: 3 },
        { name: '낮음', description: '시간 여유를 두고 처리 가능한 사안', order: 4 }
      ];

      for (const priority of priorities) {
        const subCodeData = {
          codetype: 'subcode',
          group_code: 'GROUP024',
          group_code_name: '우선순위',
          group_code_description: 'VOC 관리 시스템에서 사용하는 우선순위 분류',
          group_code_status: 'active',
          group_code_order: 24,
          subcode: `GROUP024-SUB${priority.order.toString().padStart(3, '0')}`,
          subcode_name: priority.name,
          subcode_description: priority.description,
          subcode_status: 'active',
          subcode_remark: '',
          subcode_order: priority.order,
          is_active: true,
          created_by: 'system',
          updated_by: 'system'
        };

        const { data: newSubCode, error: createSubCodeError } = await supabase
          .from('admin_mastercode_data')
          .insert([subCodeData])
          .select();

        if (createSubCodeError) {
          console.log(`❌ ${priority.name} 서브코드 생성 오류:`, createSubCodeError);
        } else {
          console.log(`✅ ${priority.name} 서브코드 생성 완료`);
        }
      }
    } else {
      console.log("📋 기존 GROUP024 서브코드 목록:");
      subCodes.forEach((subCode, index) => {
        console.log(`  ${index + 1}. ${subCode.subcode_name} (${subCode.subcode}) - ${subCode.subcode_description}`);
      });
    }

    // 최종 확인
    const { data: finalSubCodes, error: finalError } = await supabase
      .from('admin_mastercode_data')
      .select('*')
      .eq('group_code', 'GROUP024')
      .eq('codetype', 'subcode')
      .order('subcode_order', { ascending: true });

    if (finalError) {
      console.log("❌ 최종 확인 오류:", finalError);
    } else {
      console.log(`🎉 GROUP024 우선순위 설정 완료! 총 ${finalSubCodes?.length || 0}개 우선순위:`);
      finalSubCodes?.forEach((subCode, index) => {
        console.log(`  ${index + 1}. ${subCode.subcode_name}: ${subCode.subcode_description}`);
      });
    }

  } catch (err) {
    console.error("❌ 오류 발생:", err);
  }
}

checkAndCreateGroup024();